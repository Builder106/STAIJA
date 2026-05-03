/**
 * Live session callables: schedule sessions, RSVP to them.
 *
 * In Phase 1 the meeting URL is pasted manually by the mentor — the
 * Zoom / Google Meet API integration that auto-creates URLs is Phase 3.
 * Reminder emails (sendSessionReminders cron) are Phase 2.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

interface ScheduleSessionInput {
  cohortId: string
  title: string
  description?: string
  startsAt: string // ISO
  endsAt: string // ISO
  meetingUrl: string
  meetingProvider: 'zoom' | 'meet' | 'other'
}

export const scheduleSession = onCall<ScheduleSessionInput>(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const db = admin.firestore()
    const callerSnap = await db.collection('users').doc(request.auth.uid).get()
    const callerRole = callerSnap.data()?.role as string | undefined
    if (callerRole !== 'mentor' && callerRole !== 'staff' && callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Mentor, staff, or admin role required.')
    }

    const { cohortId, title, description, startsAt, endsAt, meetingUrl, meetingProvider } =
      request.data ?? {}
    if (!cohortId || !title || !startsAt || !endsAt || !meetingUrl || !meetingProvider) {
      throw new HttpsError(
        'invalid-argument',
        'cohortId, title, startsAt, endsAt, meetingUrl, and meetingProvider are required.',
      )
    }
    const startMs = Date.parse(startsAt)
    const endMs = Date.parse(endsAt)
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new HttpsError('invalid-argument', 'startsAt and endsAt must be ISO datetimes.')
    }
    if (endMs <= startMs) {
      throw new HttpsError('invalid-argument', 'endsAt must be after startsAt.')
    }

    const cohortSnap = await db.collection('cohorts').doc(cohortId).get()
    if (!cohortSnap.exists) {
      throw new HttpsError('not-found', 'Cohort not found.')
    }
    const cohort = cohortSnap.data() as { courseSlug: string; mentorPool?: string[] }

    // Mentors can only schedule for cohorts they're in. Staff/admin
    // can schedule for any cohort.
    if (callerRole === 'mentor' && !(cohort.mentorPool ?? []).includes(request.auth.uid)) {
      throw new HttpsError('permission-denied', "You aren't a mentor on this cohort.")
    }

    const ref = await db.collection('live_sessions').add({
      cohortId,
      courseSlug: cohort.courseSlug,
      title,
      description: description ?? '',
      startsAt: admin.firestore.Timestamp.fromMillis(startMs),
      endsAt: admin.firestore.Timestamp.fromMillis(endMs),
      meetingUrl,
      meetingProvider,
      hostUid: request.auth.uid,
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    })

    // Notify enrolled students. Best-effort; reminders/emails are
    // handled in Phase 2 by the sendSessionReminders cron.
    try {
      const enrollments = await db
        .collection('enrollments')
        .where('cohortId', '==', cohortId)
        .where('status', '==', 'active')
        .get()
      const batch = db.batch()
      for (const e of enrollments.docs) {
        const data = e.data() as { studentId: string }
        const notifRef = db.collection('notifications').doc()
        batch.set(notifRef, {
          uid: data.studentId,
          type: 'general',
          title: `New session scheduled: ${title}`,
          message: `Your cohort just got a new live session.`,
          data: { sessionId: ref.id, cohortId },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
      if (!enrollments.empty) await batch.commit()
    } catch (err) {
      console.error('[scheduleSession] notify failed', err)
    }

    return { ok: true, sessionId: ref.id }
  },
)

interface RsvpSessionInput {
  sessionId: string
  rsvped: 'yes' | 'no' | 'maybe'
}

export const rsvpSession = onCall<RsvpSessionInput>(
  {
    region: 'us-central1',
    memory: '128MiB',
    timeoutSeconds: 15,
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const { sessionId, rsvped } = request.data ?? {}
    if (!sessionId || !rsvped) {
      throw new HttpsError('invalid-argument', 'sessionId and rsvped are required.')
    }
    if (rsvped !== 'yes' && rsvped !== 'no' && rsvped !== 'maybe') {
      throw new HttpsError('invalid-argument', 'rsvped must be yes / no / maybe.')
    }

    const db = admin.firestore()
    const sessionSnap = await db.collection('live_sessions').doc(sessionId).get()
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.')
    }
    const cohortId = (sessionSnap.data() as { cohortId: string }).cohortId

    // Verify the caller is actually enrolled in the session's cohort.
    const enrollmentId = `${request.auth.uid}_${cohortId}`
    const enrollmentSnap = await db.collection('enrollments').doc(enrollmentId).get()
    if (!enrollmentSnap.exists) {
      throw new HttpsError('permission-denied', "You aren't enrolled in this cohort.")
    }

    const rsvpId = `${sessionId}_${request.auth.uid}`
    await db.collection('session_rsvps').doc(rsvpId).set(
      {
        sessionId,
        studentId: request.auth.uid,
        rsvped,
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return { ok: true }
  },
)
