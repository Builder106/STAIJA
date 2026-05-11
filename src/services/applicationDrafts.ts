/**
 * Application drafts — Firestore mirror of the in-progress wizard state.
 *
 * Why a separate collection (not `applications/{id}` with status='draft'):
 *   - One stable doc per (user, program) keyed at `${uid}_${program}` so
 *     repeated saves upsert in place and don't litter the apps collection
 *     with half-finished records.
 *   - Submission flow creates the *real* `applications/{auto-id}` doc with
 *     the full validated payload; the draft is deleted at that point.
 *
 * Local-first writes still happen in localStorage via useAutoSave (cheap,
 * offline-safe, no quota burn). This service mirrors the same payload to
 * Firestore on the same debounce so the draft follows the *account* across
 * devices and browsers — the half-truth in "Draft · on this device" goes
 * away once a sync round-trip lands.
 *
 * Rules (firestore.rules): owner-only read/write on the doc; deletes also
 * allowed by staff/admin for cleanup.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../config/firebase'

export type DraftProgramSlug = 'stepup-scholars' | 'dynamerge'

/** Shape stored in Firestore. `payload` is opaque — matches what Apply.vue
 *  hands to useAutoSave so the same restore code path works for both. */
export interface ApplicationDraftDoc {
  userId: string
  program: DraftProgramSlug
  /** Wizard form state. Intentionally untyped at the service layer — the
   *  consumer (Apply.vue) owns the shape and stays the source of truth. */
  payload: Record<string, unknown>
  /** Client-side ms epoch. Used to compare against the local-storage
   *  draft's `savedAt` on mount and pick the newer one. We store this in
   *  addition to `updatedAt` so the comparison doesn't have to wait for
   *  the server timestamp to materialise on first write. */
  savedAt: number
  updatedAt?: unknown // serverTimestamp
}

function draftId(userId: string, program: DraftProgramSlug): string {
  return `${userId}_${program}`
}

export async function getDraft(
  userId: string,
  program: DraftProgramSlug,
): Promise<ApplicationDraftDoc | null> {
  try {
    const ref = doc(db, 'applicationDrafts', draftId(userId, program))
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as ApplicationDraftDoc
  } catch (err) {
    // Don't let a transient Firestore hiccup break the form — localStorage
    // is still the primary write target; cloud is a best-effort mirror.
    console.warn('[applicationDrafts] getDraft failed', err)
    return null
  }
}

export async function saveDraft(
  userId: string,
  program: DraftProgramSlug,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const ref = doc(db, 'applicationDrafts', draftId(userId, program))
    await setDoc(
      ref,
      {
        userId,
        program,
        payload,
        savedAt: Date.now(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    console.warn('[applicationDrafts] saveDraft failed', err)
  }
}

export async function deleteDraft(
  userId: string,
  program: DraftProgramSlug,
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'applicationDrafts', draftId(userId, program)))
  } catch (err) {
    console.warn('[applicationDrafts] deleteDraft failed', err)
  }
}

/** List every cloud draft the current user has — used by the applicant
 *  dashboard's "Drafts in progress" surface so the card shows up on a
 *  freshly-installed device even before the user touches the wizard. */
export async function listUserDrafts(userId: string): Promise<ApplicationDraftDoc[]> {
  try {
    const q = query(
      collection(db, 'applicationDrafts'),
      where('userId', '==', userId),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as ApplicationDraftDoc)
  } catch (err) {
    console.warn('[applicationDrafts] listUserDrafts failed', err)
    return []
  }
}
