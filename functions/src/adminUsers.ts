/**
 * Admin user listing enriched with Firebase Auth metadata.
 *
 * The browser SDK can only read Auth metadata (creationTime,
 * lastSignInTime, emailVerified, disabled) for the *currently signed-in*
 * user — not for arbitrary uids. This callable runs server-side with the
 * Admin SDK and merges Auth metadata into the Firestore user docs so the
 * admin UI can show real "joined" / "last seen" dates instead of falling
 * back to (often missing) Firestore timestamps.
 *
 * Auth: caller must have role staff or admin. App Check enforced.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

interface EnrichedUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: string | null
  emailVerified: boolean
  disabled: boolean
  creationTime: string | null
  lastSignInTime: string | null
  program: string | null
  applicationStatus: string | null
}

export const adminListUsers = onCall<Record<string, never>, Promise<{ users: EnrichedUser[] }>>(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.')
    }
    const db = admin.firestore()
    const callerSnap = await db.collection('users').doc(request.auth.uid).get()
    const callerRole = callerSnap.data()?.role
    if (callerRole !== 'staff' && callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Staff or admin role required.')
    }

    // Fetch all Firestore user docs and all Auth users in parallel.
    // listUsers paginates at 1000; loop until exhausted. Production user
    // count is small enough that this is fine — revisit if it grows past
    // a few thousand.
    const [firestoreSnap, authUsers] = await Promise.all([
      db.collection('users').get(),
      listAllAuthUsers(),
    ])

    const profileByUid = new Map<string, FirebaseFirestore.DocumentData>()
    for (const doc of firestoreSnap.docs) profileByUid.set(doc.id, doc.data())

    const merged: EnrichedUser[] = authUsers.map((u) => {
      const profile = profileByUid.get(u.uid) ?? {}
      return {
        uid: u.uid,
        email: u.email ?? profile.email ?? null,
        displayName: profile.displayName ?? u.displayName ?? null,
        photoURL: profile.photoURL ?? u.photoURL ?? null,
        role: profile.role ?? null,
        emailVerified: u.emailVerified ?? false,
        disabled: u.disabled ?? false,
        creationTime: u.metadata?.creationTime ?? null,
        lastSignInTime: u.metadata?.lastSignInTime ?? null,
        program: profile.program ?? null,
        applicationStatus: profile.applicationStatus ?? null,
      }
    })

    // Include any Firestore-only profiles (orphans where Auth user is gone
    // but doc lingers) so admins can clean them up.
    for (const [uid, profile] of profileByUid) {
      if (!merged.find((m) => m.uid === uid)) {
        merged.push({
          uid,
          email: profile.email ?? null,
          displayName: profile.displayName ?? null,
          photoURL: profile.photoURL ?? null,
          role: profile.role ?? null,
          emailVerified: false,
          disabled: false,
          creationTime: null,
          lastSignInTime: null,
          program: profile.program ?? null,
          applicationStatus: profile.applicationStatus ?? null,
        })
      }
    }

    return { users: merged }
  },
)

async function listAllAuthUsers(): Promise<admin.auth.UserRecord[]> {
  const all: admin.auth.UserRecord[] = []
  let pageToken: string | undefined
  do {
    const page = await admin.auth().listUsers(1000, pageToken)
    all.push(...page.users)
    pageToken = page.pageToken
  } while (pageToken)
  return all
}
