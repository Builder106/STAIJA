/**
 * graduateCohort — staff-triggered cohort completion + alumni transition.
 *
 * The README's mermaid promises an automatic `student → alumni`
 * transition at graduation, but until this function landed there was
 * no path to it: cohorts could be marked `completed` manually in the
 * Cohorts admin but neither enrollments nor user roles updated, so
 * graduated students kept role='student' indefinitely and the alumni
 * directory was empty.
 *
 * Idempotent + retry-safe. Re-running on an already-completed cohort
 * sweeps stragglers (enrollments that failed to update on the
 * previous run) instead of erroring — staff can click "Graduate"
 * again after a flaky commit without breaking anything.
 *
 * Multi-cohort students stay students. A student enrolled in cohorts
 * A AND B who graduates from A keeps role='student' because B is
 * still active. Only when ALL their active enrollments complete does
 * the role flip — checked by re-reading the student's enrollments
 * list and confirming no other rows with status='active' remain
 * after we mark this cohort's enrollments complete.
 *
 * Scope cap. Single batch commit covers ~250 ops per cohort
 * (enrollment update + role flip + per-student other-cohort lookup),
 * well within Firestore's 500-op batch limit. For cohorts > ~150
 * students we'd need to chunk; flag if that ever becomes a real
 * shape, but typical STAIJA cohorts are dozens.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

interface GraduateInput {
  cohortId: string
}

interface GraduateResult {
  ok: true
  cohortId: string
  /** Enrollments marked completed by this call. Doesn't include rows
   *  that were already 'completed' on entry — retries report zero
   *  when nothing's left to sweep. */
  enrollmentsCompleted: number
  /** Students whose role flipped student → alumni. Always ≤
   *  enrollmentsCompleted; the gap is multi-cohort students kept as
   *  'student' because they have another active enrollment, plus any
   *  whose role wasn't 'student' to begin with (staff who happened
   *  to be enrolled, etc.). */
  rolesFlipped: number
}

async function callerRole(uid: string): Promise<string | null> {
  const snap = await admin.firestore().collection('users').doc(uid).get()
  return (snap.data()?.role as string | undefined) ?? null
}

export const graduateCohort = onCall<GraduateInput>(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 120,
    enforceAppCheck: true,
  },
  async (req): Promise<GraduateResult> => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'You must be signed in.')
    const role = await callerRole(req.auth.uid)
    if (role !== 'staff' && role !== 'admin') {
      throw new HttpsError('permission-denied', 'Staff or admin role required.')
    }

    const { cohortId } = req.data ?? ({} as GraduateInput)
    if (!cohortId || typeof cohortId !== 'string') {
      throw new HttpsError('invalid-argument', 'cohortId required.')
    }

    const db = admin.firestore()
    const cohortRef = db.collection('cohorts').doc(cohortId)
    const cohortSnap = await cohortRef.get()
    if (!cohortSnap.exists) {
      throw new HttpsError('not-found', `Cohort ${cohortId} not found.`)
    }
    const cohort = cohortSnap.data() as { status?: string }

    // Find active enrollments in this cohort. An already-completed
    // cohort with stragglers returns rows here — that's the
    // retry-after-failure path.
    const activeEnrollSnap = await db
      .collection('enrollments')
      .where('cohortId', '==', cohortId)
      .where('status', '==', 'active')
      .get()

    const activeEnrollments = activeEnrollSnap.docs
    const studentIds = Array.from(
      new Set(activeEnrollments.map((d) => (d.data() as { studentId?: string }).studentId).filter(Boolean) as string[]),
    )

    // Per-student: do they have any OTHER active enrollment besides
    // this cohort? If so, they stay 'student' — alumni status only
    // applies once they've finished every program they're in.
    // Read in parallel to keep the wall-clock down on big cohorts.
    const otherActiveByStudent = new Map<string, boolean>()
    await Promise.all(
      studentIds.map(async (sid) => {
        const snap = await db
          .collection('enrollments')
          .where('studentId', '==', sid)
          .where('status', '==', 'active')
          .get()
        const hasOther = snap.docs.some(
          (d) => (d.data() as { cohortId?: string }).cohortId !== cohortId,
        )
        otherActiveByStudent.set(sid, hasOther)
      }),
    )

    // Read current roles for the candidates so we only flip those
    // currently at 'student'. A mentor who happens to be enrolled
    // (rare but legal) keeps role='mentor' on graduation.
    const studentSnaps = await Promise.all(
      studentIds.map((sid) => db.collection('users').doc(sid).get()),
    )
    const roleByStudent = new Map<string, string | null>(
      studentSnaps.map((s) => [s.id, ((s.data()?.role as string | undefined) ?? null)]),
    )

    const now = admin.firestore.FieldValue.serverTimestamp()
    const batch = db.batch()

    // Complete the enrollment rows.
    for (const doc of activeEnrollments) {
      batch.update(doc.ref, {
        status: 'completed',
        completedAt: now,
      })
    }

    // Role transitions — student → alumni for students with no other
    // active cohort. Mentors-who-are-enrolled, already-alumni rows,
    // and applicant-still leftovers all skip.
    let rolesFlipped = 0
    for (const sid of studentIds) {
      if (otherActiveByStudent.get(sid) === true) continue
      if (roleByStudent.get(sid) !== 'student') continue
      batch.update(db.collection('users').doc(sid), {
        role: 'alumni',
        updatedAt: now,
      })
      rolesFlipped += 1
    }

    // Mark cohort completed if it isn't already. The straggler-sweep
    // case (cohort already completed) skips this update — no point
    // bumping the doc for a no-op.
    if (cohort.status !== 'completed') {
      batch.update(cohortRef, { status: 'completed' })
    }

    await batch.commit()

    return {
      ok: true,
      cohortId,
      enrollmentsCompleted: activeEnrollments.length,
      rolesFlipped,
    }
  },
)
