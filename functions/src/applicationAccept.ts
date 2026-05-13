/**
 * acceptOffer — applicant-initiated callable that records the moment
 * the applicant confirms they want to take the offered spot.
 *
 * Why a server callable instead of a direct Firestore write. The
 * applicant is the only party who can flip this flag, but they have
 * no other write-access to a status='accepted' application doc (the
 * Firestore rule lets staff/admin write the review fields; the
 * applicant's own write paths are gated on status='draft' /
 * 'submitted'). Adding a fourth rule path just for this one
 * confirmation flag would be load-bearing security surface for a
 * single boolean. Routing through admin SDK avoids that, and gives us
 * a natural hook for future side-effects (notify staff,
 * notifications doc, analytics) without revisiting the rule layer.
 *
 * Idempotent: a second call is a no-op (the flag is already true).
 * Read-after-write isn't strictly needed — the client refetches the
 * application anyway to re-render the Decision card's confirmed state.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

interface AcceptOfferInput {
  applicationId: string
}

interface AcceptOfferResult {
  ok: true
  /** Ms epoch the server wrote — handy for the client to display
   *  without a roundtrip back to Firestore. */
  spotAcceptedAt: number
}

export const acceptOffer = onCall<AcceptOfferInput>(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
  },
  async (req): Promise<AcceptOfferResult> => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const { applicationId } = req.data ?? ({} as AcceptOfferInput)
    if (!applicationId || typeof applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'applicationId required.')
    }

    const db = admin.firestore()
    const ref = db.collection('applications').doc(applicationId)
    const snap = await ref.get()
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Application not found.')
    }
    const data = snap.data() as { userId?: string; status?: string }
    if (data.userId !== req.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        "You can only accept your own application's offer.",
      )
    }
    if (data.status !== 'accepted') {
      throw new HttpsError(
        'failed-precondition',
        'Only accepted applications can be confirmed.',
      )
    }

    const spotAcceptedAt = Date.now()
    await ref.update({
      spotAccepted: true,
      spotAcceptedAt,
      updatedAt: new Date(),
    })

    // Future-proofing notes (intentionally unimplemented for the
    // minimum-viable handshake):
    //   - Drop a notifications/* doc for the staff queue so the
    //     "ready to enroll" indicator updates without staff polling.
    //   - Fire a Mailgun "thanks for confirming, your cohort starts
    //     on X" email when cohort dates are wired up.
    //   - Update analytics: time-to-acceptance is a useful metric.

    return { ok: true, spotAcceptedAt }
  },
)
