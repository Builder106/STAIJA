/**
 * respondToOffer — applicant-initiated callable for the three-way
 * handshake after staff has accepted the application: accept the
 * offered spot, decline it, or defer to the next cycle.
 *
 * Why a server callable instead of a direct Firestore write. The
 * applicant is the only party who can flip this field, but they have
 * no other write-access to a status='accepted' application doc (the
 * Firestore rule lets staff/admin write the review fields; the
 * applicant's own write paths are gated on status='draft' /
 * 'submitted'). Adding a fourth rule path just for this confirmation
 * would be load-bearing security surface for a single enum. Routing
 * through admin SDK avoids that, and gives us a natural hook for
 * future side-effects (notify staff, fire next-cycle reminder,
 * analytics) without revisiting the rule layer.
 *
 * Changes are allowed. An applicant who accepts then realises they
 * can't make it can flip to 'declined' or 'deferred' without
 * emailing staff to undo the previous response — the latest write
 * wins. Staff's queue surface reflects the current state in real
 * time via the existing watcher pattern, so a flip from accepted
 * back to deferred shows up before the next refresh.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

type SpotResponse = 'accepted' | 'declined' | 'deferred'

interface RespondInput {
  applicationId: string
  response: SpotResponse
  /** Optional free-text reason the applicant leaves when declining
   *  or deferring. Capped at 1000 chars server-side so a runaway
   *  paste can't bloat the doc. Blank for accept. */
  note?: string
}

interface RespondResult {
  ok: true
  response: SpotResponse
  /** Ms epoch the server wrote — handy for the client to display
   *  without a roundtrip back to Firestore. */
  spotRespondedAt: number
}

const VALID_RESPONSES: ReadonlySet<SpotResponse> = new Set(['accepted', 'declined', 'deferred'])
const MAX_NOTE_LENGTH = 1000

export const respondToOffer = onCall<RespondInput>(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
  },
  async (req): Promise<RespondResult> => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const input = req.data ?? ({} as RespondInput)
    if (!input.applicationId || typeof input.applicationId !== 'string') {
      throw new HttpsError('invalid-argument', 'applicationId required.')
    }
    if (!VALID_RESPONSES.has(input.response)) {
      throw new HttpsError(
        'invalid-argument',
        `response must be one of: ${Array.from(VALID_RESPONSES).join(', ')}.`,
      )
    }
    const trimmedNote =
      typeof input.note === 'string' ? input.note.trim().slice(0, MAX_NOTE_LENGTH) : ''

    const db = admin.firestore()
    const ref = db.collection('applications').doc(input.applicationId)
    const snap = await ref.get()
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Application not found.')
    }
    const data = snap.data() as { userId?: string; status?: string }
    if (data.userId !== req.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        "You can only respond to your own application's offer.",
      )
    }
    if (data.status !== 'accepted') {
      throw new HttpsError(
        'failed-precondition',
        'Only accepted applications can be responded to.',
      )
    }

    const spotRespondedAt = Date.now()
    // Build the patch explicitly so we control which fields land —
    // an empty note shouldn't clobber a previously-stored one (a
    // declining applicant who first hit decline with a note, then
    // accidentally re-fired accept without a note, would otherwise
    // lose the declining context). Skip the note field when blank.
    const patch: Record<string, unknown> = {
      spotResponse: input.response,
      spotRespondedAt,
      updatedAt: new Date(),
    }
    if (trimmedNote) {
      patch.spotResponseNote = trimmedNote
    } else if (input.response === 'accepted') {
      // Accept is one-click — clear any stale note from a previous
      // decline / defer so the staff queue doesn't show a misleading
      // "they had a reason last time" note next to a fresh accept.
      patch.spotResponseNote = admin.firestore.FieldValue.delete()
    }

    await ref.update(patch)
    return { ok: true, response: input.response, spotRespondedAt }
  },
)
