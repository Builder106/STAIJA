/**
 * Application-drafts tombstone reaper.
 *
 * Runs daily. Hard-deletes any `applicationDrafts/{id}` doc whose
 * `__deleted` tombstone has been in place for >= 30 days. The
 * tombstones exist so cross-device deletes don't silently resurrect
 * via the dashboard's auto-sync — once enough time has passed that
 * every device that touched the draft has had a chance to observe
 * the deletion, the marker is no longer load-bearing and we can
 * reclaim the storage.
 *
 * Idempotent: a second run a day later just finds the next batch of
 * docs that crossed the 30-day line. Errors per-doc don't halt the
 * batch — we log and continue, the next run picks up what we missed.
 *
 * Tuning knobs:
 * - REAP_AGE_DAYS: how long after a soft-delete a tombstone gets
 *   hard-deleted. 30 days is conservative; tighten if storage matters,
 *   loosen if cross-device sync windows might exceed 30 days.
 * - BATCH_SIZE: Firestore batch writes are capped at 500 operations.
 *   We stay well under that to leave room for other concurrent writes.
 *
 * No secrets needed — admin SDK reads/writes Firestore directly.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

const REAP_AGE_DAYS = 30
const BATCH_SIZE = 300

export const reapApplicationDraftTombstones = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'Africa/Lagos',
  },
  async () => {
    const db = admin.firestore()
    const cutoffMs = Date.now() - REAP_AGE_DAYS * 24 * 60 * 60 * 1000

    // deletedAt is a client-side ms epoch (see services/applicationDrafts.ts).
    // Indexed-by-default on this collection at our scale (low thousands
    // of docs at most), so a single query covers everything.
    const snap = await db
      .collection('applicationDrafts')
      .where('__deleted', '==', true)
      .where('deletedAt', '<=', cutoffMs)
      .get()

    if (snap.empty) {
      console.log('[reapApplicationDraftTombstones] no tombstones past the reap window')
      return
    }

    console.log(`[reapApplicationDraftTombstones] found ${snap.size} tombstones to reap`)

    let reaped = 0
    let failed = 0
    // Page through in batches so a giant accumulated backlog (first run
    // after deploying this cron, for instance) doesn't hit the 500-op
    // batch cap.
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const slice = snap.docs.slice(i, i + BATCH_SIZE)
      const batch = db.batch()
      for (const d of slice) batch.delete(d.ref)
      try {
        await batch.commit()
        reaped += slice.length
      } catch (err) {
        failed += slice.length
        console.warn(
          `[reapApplicationDraftTombstones] batch commit failed (${slice.length} docs): ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }

    console.log(
      `[reapApplicationDraftTombstones] reaped ${reaped} tombstones (failed: ${failed}, age threshold: ${REAP_AGE_DAYS}d)`,
    )
  },
)
