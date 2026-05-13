/**
 * Application-staging orphan reaper.
 *
 * The wizard pre-uploads picked files and recorded audio into
 * `applicationStaging/<uid>/<program>/...` so a draft can carry its
 * uploads across devices. Most lifecycle endpoints clean this up:
 *   - On submit, finalizeApplicationFiles copies the bytes out and
 *     deletes each entry it processed.
 *   - On discard, deleteDraft fire-and-forget deletes the known
 *     paths before tombstoning the doc.
 *
 * What still falls through the cracks:
 *   - Stragglers from a partial-failure finalize (copy succeeded,
 *     staging delete didn't, or vice versa).
 *   - Files attached to a draft the applicant never finished or
 *     discarded — they just walked away. Without a sweep these can
 *     accumulate up to ~25 MB per kind per draft, indefinitely.
 *   - Renames + replaces during editing: the per-pick handler
 *     fire-and-forgets the previous staged path; a network blip can
 *     leave that file in the bucket forever.
 *
 * Strategy: iterate `applicationDrafts` once per day. For each draft:
 *   - List Storage objects under `applicationStaging/<uid>/<program>/`.
 *   - If the draft is tombstoned (__deleted=true), delete everything
 *     under that prefix — the applicant has confirmed they're done
 *     with this draft, so nothing under it is load-bearing anymore.
 *   - Otherwise, delete files older than REAP_AGE_DAYS (default 30)
 *     so abandoned drafts don't leak indefinitely. Fresh staged paths
 *     that the active applicant is still relying on stay put.
 *
 * Concurrency capped to 5 drafts in parallel so the function doesn't
 * blow its memory ceiling on a large backlog. One structured log line
 * per run summarising what was touched, so the cron's silence is
 * observable in Cloud Logging — a 0-files-reaped streak for 7+ days
 * is the smoke signal that something silently broke.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

const STAGING_PREFIX = 'applicationStaging'
const REAP_AGE_DAYS = 30
const CONCURRENCY = 5

interface DraftLike {
  userId?: string
  program?: string
  __deleted?: boolean
}

export const reapApplicationStagedFiles = onSchedule(
  {
    schedule: 'every day 04:00',
    timeZone: 'Africa/Lagos',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const db = admin.firestore()
    const bucket = admin.storage().bucket()
    const cutoffMs = Date.now() - REAP_AGE_DAYS * 24 * 60 * 60 * 1000

    const snap = await db.collection('applicationDrafts').get()
    const drafts = snap.docs

    let draftsScanned = 0
    let filesReaped = 0
    let bytesReclaimed = 0
    let errors = 0

    // Simple bounded-parallelism worker pool. Each promise pulls the
    // next draft off the front of the array until empty. Avoids the
    // dependency overhead of p-limit / async-pool for one call site.
    const queue = [...drafts]
    async function worker() {
      while (queue.length > 0) {
        const d = queue.shift()
        if (!d) return
        draftsScanned += 1
        const data = d.data() as DraftLike
        const uid = data.userId
        const program = data.program
        if (!uid || !program) continue
        const prefix = `${STAGING_PREFIX}/${uid}/${program}/`
        try {
          const [files] = await bucket.getFiles({ prefix })
          if (files.length === 0) continue
          const tombstoned = data.__deleted === true
          for (const file of files) {
            const created = file.metadata?.timeCreated
              ? new Date(file.metadata.timeCreated).getTime()
              : 0
            const shouldDelete = tombstoned || (created > 0 && created < cutoffMs)
            if (!shouldDelete) continue
            try {
              const size = Number(file.metadata?.size ?? 0)
              await file.delete()
              filesReaped += 1
              bytesReclaimed += size
            } catch (err) {
              errors += 1
              console.warn(
                `[reapApplicationStagedFiles] delete ${file.name} failed:`,
                err instanceof Error ? err.message : String(err),
              )
            }
          }
        } catch (err) {
          errors += 1
          console.warn(
            `[reapApplicationStagedFiles] list ${prefix} failed:`,
            err instanceof Error ? err.message : String(err),
          )
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

    console.log(
      `[reapApplicationStagedFiles] scanned ${draftsScanned} drafts, ` +
        `reaped ${filesReaped} files (${bytesReclaimed} bytes), errors: ${errors}`,
    )
  },
)
