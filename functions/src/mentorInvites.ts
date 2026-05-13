/**
 * Mentor-invite handshake — single-use tokens that promote their
 * consumer to role='mentor'.
 *
 * Why invite links instead of a public mentor-application form:
 *   - STAIJA picks mentors by direct outreach. There's no real
 *     queue of public mentor applications to triage; the bottleneck
 *     is "we found someone good, get them an account fast." A link
 *     fits that shape; an admin review queue doesn't.
 *   - The invite layer is staff/admin only. No public surface to
 *     defend, no application form to maintain, no spam.
 *
 * Two callables:
 *   - createMentorInvite: staff/admin only. Mints a token, writes
 *     mentorInvites/{token}, returns the canonical /invite/<token>
 *     URL for staff to paste into an email / DM.
 *   - consumeMentorInvite: any signed-in user. Validates the token
 *     (exists, not expired, not already consumed by someone else,
 *     email match if restricted), then flips the caller's role to
 *     'mentor' via admin SDK. Idempotent for the SAME consumer —
 *     a second call by the original consumer returns success without
 *     mutating anything, which lets the /invite landing page retry
 *     after a network blip without bricking the link.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

const PUBLIC_BASE_URL = 'https://staija.org'

const DEFAULT_EXPIRY_DAYS = 30
const MAX_EXPIRY_DAYS = 180
const MAX_NOTE_LENGTH = 500

interface CreateInput {
  /** Optional admin audit note ("Reached out via LinkedIn"). */
  note?: string
  /** Optional email restriction. The consume call rejects unless the
   *  signed-in user's email matches (case-insensitive). Without it,
   *  anyone with the URL can consume — fine for trusted forwards. */
  email?: string
  /** Days until the invite expires. Defaults to 30; capped at 180 so
   *  a forgotten link doesn't sit around for years. */
  expiresInDays?: number
}

interface CreateResult {
  token: string
  url: string
  expiresAt: number
}

interface ConsumeInput {
  token: string
}

interface ConsumeResult {
  ok: true
  /** Whether this call actually changed the role (vs. an idempotent
   *  re-fire by the original consumer). The client uses this to
   *  decide whether to celebrate ("Welcome aboard, mentor!") or
   *  silently bounce to /mentor. */
  changed: boolean
}

async function callerRole(uid: string): Promise<string | null> {
  const snap = await admin.firestore().collection('users').doc(uid).get()
  return (snap.data()?.role as string | undefined) ?? null
}

export const createMentorInvite = onCall<CreateInput>(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
  },
  async (req): Promise<CreateResult> => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const role = await callerRole(req.auth.uid)
    if (role !== 'staff' && role !== 'admin') {
      throw new HttpsError('permission-denied', 'Staff or admin role required.')
    }

    const input = req.data ?? ({} as CreateInput)
    const trimmedNote =
      typeof input.note === 'string' ? input.note.trim().slice(0, MAX_NOTE_LENGTH) : ''
    const restrictEmail =
      typeof input.email === 'string' && input.email.trim()
        ? input.email.trim().toLowerCase()
        : undefined
    const requestedDays =
      typeof input.expiresInDays === 'number' && Number.isFinite(input.expiresInDays)
        ? Math.max(1, Math.min(MAX_EXPIRY_DAYS, Math.floor(input.expiresInDays)))
        : DEFAULT_EXPIRY_DAYS

    // 32 hex chars from 16 random bytes — opaque, unguessable, fits
    // in a URL without encoding. We use it as both the doc ID and
    // the URL path segment so there's exactly one source of truth
    // for "what does this invite identify".
    const token = crypto.randomBytes(16).toString('hex')
    const now = Date.now()
    const expiresAt = now + requestedDays * 24 * 60 * 60 * 1000

    const db = admin.firestore()
    // Denormalise the issuer's display name so the consume landing
    // page can show "Yinka Vaughan invited you" without a second
    // user-doc read on the prospective consumer's side (who may not
    // have read access to arbitrary user docs).
    const issuerSnap = await db.collection('users').doc(req.auth.uid).get()
    const createdByName =
      (issuerSnap.data()?.displayName as string | undefined) ??
      req.auth.token.email ??
      'A teammate'

    const doc: Record<string, unknown> = {
      token,
      createdBy: req.auth.uid,
      createdByName,
      createdAt: now,
      expiresAt,
      consumed: false,
    }
    if (trimmedNote) doc.note = trimmedNote
    if (restrictEmail) doc.email = restrictEmail
    await db.collection('mentorInvites').doc(token).set(doc)

    return {
      token,
      url: `${PUBLIC_BASE_URL}/invite/${token}`,
      expiresAt,
    }
  },
)

export const consumeMentorInvite = onCall<ConsumeInput>(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
  },
  async (req): Promise<ConsumeResult> => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', 'Sign in to accept your invitation.')
    }
    const { token } = req.data ?? ({} as ConsumeInput)
    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'token required.')
    }

    const db = admin.firestore()
    const ref = db.collection('mentorInvites').doc(token)
    const snap = await ref.get()
    if (!snap.exists) {
      throw new HttpsError('not-found', 'This invitation link is invalid or has been revoked.')
    }
    const invite = snap.data() as {
      consumed?: boolean
      consumedBy?: string
      expiresAt?: number
      email?: string
    }

    // Idempotent re-fire by the original consumer. The /invite page
    // might retry on network blip / page refresh — those should
    // succeed silently instead of leaving the user with a "this
    // invite was already used" error on their own freshly-consumed
    // link.
    if (invite.consumed === true && invite.consumedBy === req.auth.uid) {
      return { ok: true, changed: false }
    }
    if (invite.consumed === true) {
      throw new HttpsError('failed-precondition', 'This invitation has already been used.')
    }
    if (typeof invite.expiresAt === 'number' && invite.expiresAt < Date.now()) {
      throw new HttpsError('failed-precondition', 'This invitation has expired.')
    }
    if (invite.email) {
      const callerEmail = (req.auth.token.email ?? '').toLowerCase()
      if (callerEmail !== invite.email) {
        throw new HttpsError(
          'permission-denied',
          `This invitation is for ${invite.email}. Sign in with that account to accept.`,
        )
      }
    }

    const now = Date.now()
    // Transactional update: mark the invite consumed AND flip the
    // user's role in one batch. If either side fails the other
    // doesn't half-commit; a partial-failure where the invite is
    // marked consumed but the role didn't flip would be a stuck
    // state requiring admin intervention.
    const userRef = db.collection('users').doc(req.auth.uid)
    await db.runTransaction(async (tx) => {
      // Re-read inside the transaction so a parallel consume race
      // (same token, two devices, sub-second apart) loses cleanly
      // instead of letting both succeed.
      const fresh = await tx.get(ref)
      const freshData = fresh.data() as { consumed?: boolean; consumedBy?: string } | undefined
      if (freshData?.consumed === true && freshData.consumedBy !== req.auth!.uid) {
        throw new HttpsError('failed-precondition', 'This invitation has already been used.')
      }
      tx.update(ref, {
        consumed: true,
        consumedBy: req.auth!.uid,
        consumedAt: now,
      })
      tx.update(userRef, {
        role: 'mentor',
        updatedAt: new Date(),
      })
    })

    return { ok: true, changed: true }
  },
)
