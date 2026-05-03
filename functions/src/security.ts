/**
 * Account-security callables.
 *
 * - signOutEverywhere: revokes the user's refresh tokens via the Admin
 *   SDK, which forces every other browser/tab to require a fresh sign-in
 *   on the next ID-token refresh (default ~1h). The originating client
 *   should call signOut() locally afterward — that part is just clearing
 *   the local session, not invalidating it server-side.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

export const signOutEverywhere = onCall<Record<string, never>>(
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
    await admin.auth().revokeRefreshTokens(request.auth.uid)
    return { ok: true }
  },
)
