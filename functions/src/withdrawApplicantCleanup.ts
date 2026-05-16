/**
 * withdrawApplicantCleanup — TEMPORARY ONE-OFF callable.
 *
 * Cleans up the pre-guards-shipped broken state where staff enrolled
 * an applicant into a wrong-program cohort and the applicant
 * subsequently declined: enrollment stayed active, mentor assignment
 * stayed paired, and role stayed 'student'. The new
 * respondToOffer rollback handles this prospectively, but
 * pre-existing rows need a manual sweep.
 *
 *   1. Find every active enrollment for the given studentId
 *      (regardless of program — the whole point is the program might
 *      be wrong).
 *   2. Flip enrollment.status → 'withdrawn',
 *      withdrawnReason='applicant_declined', set withdrawnAt.
 *   3. Mirror the matching mentor_assignments doc to
 *      status='ended', set endedAt.
 *   4. If the user has zero remaining active enrollments and
 *      currently holds role='student', revert role to 'applicant'.
 *
 * Admin-only. App Check enforced. dryRun flag returns what WOULD
 * change without writing.
 *
 * DELETE THIS FILE + the index.ts export immediately after the
 * cleanup run lands cleanly — the prospective path in
 * respondToOffer covers every new decline going forward, this
 * callable exists only for the existing-broken-row case.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

interface CleanupInput {
  studentId: string
  /** When true, return what would change without writing. Useful for
   *  a sanity-check round before firing the real cleanup. */
  dryRun?: boolean
}

interface CleanupResult {
  ok: true
  dryRun: boolean
  /** Enrollment ids that got (or would get) status='withdrawn'. */
  withdrawnEnrollmentIds: string[]
  /** Mentor-assignment ids that got (or would get) status='ended'. */
  endedAssignmentIds: string[]
  /** Whether the user's role got (or would get) reverted to 'applicant'. */
  roleReverted: boolean
  /** Role observed on the user doc before the call (useful for audit
   *  when chasing whether this row was the intended target). */
  previousRole: string | null
}

async function callerRole(uid: string): Promise<string | null> {
  const snap = await admin.firestore().collection('users').doc(uid).get()
  return (snap.data()?.role as string | undefined) ?? null
}

export const withdrawApplicantCleanup = onCall<CleanupInput>(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    enforceAppCheck: true,
  },
  async (request): Promise<CleanupResult> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const role = await callerRole(request.auth.uid)
    if (role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin role required.')
    }

    const { studentId, dryRun } = request.data ?? ({} as CleanupInput)
    if (!studentId || typeof studentId !== 'string') {
      throw new HttpsError('invalid-argument', 'studentId required.')
    }

    const db = admin.firestore()

    const userRef = db.collection('users').doc(studentId)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      throw new HttpsError('not-found', `User ${studentId} not found.`)
    }
    const previousRole = (userSnap.data() as { role?: string }).role ?? null

    // Pull every active enrollment for this student — we intentionally
    // don't filter by program because the bug's exact shape is a
    // wrong-program enrollment that wouldn't match a program-scoped
    // query.
    const enrollSnap = await db
      .collection('enrollments')
      .where('studentId', '==', studentId)
      .where('status', '==', 'active')
      .get()

    const withdrawnEnrollmentIds: string[] = enrollSnap.docs.map((d) => d.id)
    const endedAssignmentIds: string[] = []
    const now = new Date()

    if (!dryRun) {
      for (const doc of enrollSnap.docs) {
        await doc.ref.update({
          status: 'withdrawn',
          withdrawnAt: now,
          withdrawnReason: 'applicant_declined',
          updatedAt: now,
        })
        const assignmentRef = db.collection('mentor_assignments').doc(doc.id)
        const assignmentSnap = await assignmentRef.get()
        if (assignmentSnap.exists) {
          await assignmentRef.update({
            status: 'ended',
            endedAt: now,
            notes: 'Auto-withdrawn via withdrawApplicantCleanup.',
          })
          endedAssignmentIds.push(doc.id)
        }
      }
    } else {
      // Dry-run still reports which mentor_assignments rows would
      // flip — same existence check, no writes.
      for (const doc of enrollSnap.docs) {
        const assignmentSnap = await db
          .collection('mentor_assignments')
          .doc(doc.id)
          .get()
        if (assignmentSnap.exists) endedAssignmentIds.push(doc.id)
      }
    }

    // Role revert only when zero enrollments remain (count post-write)
    // AND the user actually holds role='student' right now. Skip when
    // the user is already applicant or holds a different role.
    let roleReverted = false
    if (previousRole === 'student') {
      // Post-write count — if we just withdrew everything, this is 0.
      // For dry-run we approximate: assume the writes would have
      // succeeded and the same set would be withdrawn.
      const remainingCount = dryRun
        ? 0 // every active enrollment was just included in withdrawnEnrollmentIds
        : (await db
            .collection('enrollments')
            .where('studentId', '==', studentId)
            .where('status', '==', 'active')
            .limit(1)
            .get()).size
      if (remainingCount === 0) {
        roleReverted = true
        if (!dryRun) {
          await userRef.update({
            role: 'applicant',
            updatedAt: now,
          })
        }
      }
    }

    return {
      ok: true,
      dryRun: dryRun === true,
      withdrawnEnrollmentIds,
      endedAssignmentIds,
      roleReverted,
      previousRole,
    }
  },
)
