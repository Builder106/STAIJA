/**
 * First-admin bootstrap for a fresh Firebase project.
 *
 * Why this exists: the normal role-elevation surface
 * ([src/views/admin/UserManagement.vue](../../src/views/admin/UserManagement.vue))
 * is itself gated behind the `admin` role — so a brand-new project
 * (staging today, any future test env tomorrow) has no way to mint
 * its first admin without an operator manually editing the
 * `users/{uid}.role` field via the Firebase Console. That's brittle
 * (one typo and you lock yourself out, no audit trail) and has to be
 * redone for every new project.
 *
 * This callable replaces that manual step with a one-shot,
 * audit-logged elevation that can only succeed once per project.
 *
 * Trust model:
 *   - Caller must be signed in.
 *   - Caller's email must end in `@staija.org` (mirrors the
 *     auto-elevation policy in src/services/auth.ts) and be verified.
 *     This matches the existing assumption that "verified @staija.org"
 *     == "an internal team member."
 *   - The function refuses if EITHER:
 *       a) the `meta/bootstrap` sentinel doc already exists (someone
 *          already ran this), OR
 *       b) any user with role='admin' already exists (defensive — covers
 *          projects where admins were minted by manual Firestore edit
 *          before this function landed, e.g. prod).
 *
 * What it writes (atomic transaction):
 *   - `users/{caller.uid}.role` → `'admin'` (+ `updatedAt`)
 *   - `meta/bootstrap` → records who ran it and when (sentinel)
 *   - `audit_logs/{auto}` → role_change entry, same shape as the
 *     client-side AuditService writes
 *
 * Operator invocation (no SPA surface yet, by design):
 *   cd functions && npm run shell --project=<staija-staging|staija>
 *   > bootstrapAdmin({})
 *
 * Or from the deployed environment via the Firebase Functions REST
 * API with a signed-in user's ID token. We can add a hidden `/bootstrap`
 * SPA route later if the shell invocation becomes inconvenient.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

const STAFF_DOMAIN = '@staija.org'

export const bootstrapAdmin = onCall<Record<string, never>>(
  {
    // App Check is intentionally NOT enforced. This callable is meant
    // to be runnable from `firebase functions:shell` (where there's no
    // App Check token) when standing up a fresh environment. The email
    // gate + idempotency sentinel together provide the real security
    // boundary; App Check would add nothing on top.
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to bootstrap admin.')
    }

    const email = (request.auth.token.email ?? '').toLowerCase()
    const emailVerified = request.auth.token.email_verified === true

    if (!email.endsWith(STAFF_DOMAIN)) {
      throw new HttpsError(
        'permission-denied',
        `Bootstrap is restricted to ${STAFF_DOMAIN} addresses.`,
      )
    }

    if (!emailVerified) {
      throw new HttpsError(
        'permission-denied',
        'Verify your email address before running bootstrap.',
      )
    }

    const db = admin.firestore()
    const sentinelRef = db.collection('meta').doc('bootstrap')
    const userRef = db.collection('users').doc(request.auth.uid)
    const adminsQuery = db.collection('users').where('role', '==', 'admin').limit(1)

    await db.runTransaction(async (txn) => {
      // 1. Sentinel check — has bootstrap already run for this project?
      const sentinelSnap = await txn.get(sentinelRef)
      if (sentinelSnap.exists) {
        const data = sentinelSnap.data() ?? {}
        throw new HttpsError(
          'failed-precondition',
          `Bootstrap already ran for this project (by ${data.bootstrappedEmail ?? 'unknown'}). ` +
            `Use the Users admin screen to change roles.`,
        )
      }

      // 2. Defensive admin check — even without a sentinel, refuse if
      //    any admin exists (covers prod, where the first admin was
      //    minted by manual Firestore edit before this function existed).
      const existingAdmins = await txn.get(adminsQuery)
      if (!existingAdmins.empty) {
        throw new HttpsError(
          'failed-precondition',
          'An admin already exists for this project. Bootstrap is only for new environments.',
        )
      }

      // 3. The caller must already have a user profile (created by the
      //    normal sign-in flow's `ensureUserProfile` path). Without it
      //    there's no doc to elevate.
      const userSnap = await txn.get(userRef)
      if (!userSnap.exists) {
        throw new HttpsError(
          'not-found',
          'Sign in to STAIJA once first so your user profile gets created, then re-run bootstrap.',
        )
      }

      const previousRole = (userSnap.data() ?? {}).role ?? 'unknown'

      // 4. Elevate.
      txn.update(userRef, {
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // 5. Set the sentinel so subsequent bootstrap calls fail at (1)
      //    instead of having to run the more expensive admins-query
      //    every time.
      txn.set(sentinelRef, {
        bootstrappedBy: request.auth!.uid,
        bootstrappedEmail: email,
        bootstrappedAt: admin.firestore.FieldValue.serverTimestamp(),
        previousRole,
      })

      // 6. Audit-log the elevation. Shape mirrors AuditService.logRoleChange
      //    in src/services/audit.ts so the audit_logs UI doesn't need a
      //    new code path to render bootstrap events.
      const auditRef = db.collection('audit_logs').doc()
      txn.set(auditRef, {
        type: 'role_change',
        userId: request.auth!.uid,
        previousRole,
        newRole: 'admin',
        changedBy: request.auth!.uid,
        reason: 'bootstrap_admin: first admin for project',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: '',
        userAgent: '',
      })
    })

    return { ok: true, role: 'admin' as const }
  },
)
