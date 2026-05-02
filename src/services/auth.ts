import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updatePassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth'
import type { User, UserCredential } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase.ts'
import type {
  UserProfile,
  PublicAssignableRole,
  AdminAssignableRole,
  EmailLinkAssignableRole,
} from './types'
import { PermissionService } from './permissions'
import { AuditService } from './audit'
import { DatabaseService } from './database'

export class AuthService {
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      // Same idempotent profile sync OAuth sign-ins run — picks up role
      // elevations once a STAIJA staff member verifies their email.
      await this.ensureUserProfile(cred.user)
      return cred
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  static async signUp(
    email: string,
    password: string,
    displayName: string,
    role: PublicAssignableRole = 'applicant'
  ): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
        // Even @staija.org sign-ups land as 'applicant' here — the staff
        // elevation only fires after the user has clicked the Firebase
        // verification email (which only the real IONOS mailbox owner can do).
        // See ensureUserProfile() for the elevation step.
        await this.createUserProfile(userCredential.user, displayName, role)
        try { await sendEmailVerification(userCredential.user) } catch (_) { /* noop */ }
      }

      return userCredential
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  static async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await this.ensureUserProfile(cred.user)
    return cred
  }

  static async signInWithGitHub(): Promise<UserCredential> {
    const provider = new GithubAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await this.ensureUserProfile(cred.user)
    return cred
  }

  static async sendVerificationEmail(): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('No authenticated user')
    await sendEmailVerification(user)
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('No authenticated user')
      await updatePassword(user, newPassword)
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }

  static async updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('No authenticated user')
    await updateProfile(user, data)
  }

  static async sendSignInLink(email: string, role?: EmailLinkAssignableRole): Promise<void> {
    try {
      const actionCodeSettings = {
        url: `${globalThis.location.origin}/auth/email-link-callback`,
        handleCodeInApp: true,
        iOS: { bundleId: 'com.staija.app' },
        android: {
          packageName: 'com.staija.app',
          installApp: true,
          minimumVersion: '12'
        }
      }

      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      globalThis.localStorage.setItem('emailForSignIn', email)
      if (role) {
        globalThis.localStorage.setItem('roleForSignIn', role)
      }
    } catch (error) {
      console.error('Send sign in link error:', error)
      throw error
    }
  }

  static async completeSignInWithEmailLink(email: string, url: string): Promise<UserCredential> {
    try {
      const result = await signInWithEmailLink(auth, email, url)
      globalThis.localStorage.removeItem('emailForSignIn')
      globalThis.localStorage.removeItem('roleForSignIn')
      return result
    } catch (error) {
      console.error('Complete sign in with email link error:', error)
      throw error
    }
  }

  static isSignInWithEmailLink(url: string): boolean {
    return isSignInWithEmailLink(auth, url)
  }

  static async assignRole(userId: string, role: AdminAssignableRole, reason?: string): Promise<void> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('No authenticated user')

      const currentUserProfile = await DatabaseService.getUserProfile(currentUser.uid)
      if (!currentUserProfile) throw new Error('Current user profile not found')

      if (!PermissionService.canAssignRole(currentUserProfile.role, role)) {
        throw new Error('Insufficient permissions to assign this role')
      }

      const targetUserProfile = await DatabaseService.getUserProfile(userId)
      if (!targetUserProfile) throw new Error('Target user profile not found')

      if (!PermissionService.isValidRoleTransition(targetUserProfile.role, role)) {
        throw new Error('Invalid role transition')
      }

      await DatabaseService.updateUserProfile(userId, { role })

      await AuditService.logRoleChange({
        userId,
        previousRole: targetUserProfile.role,
        newRole: role,
        changedBy: currentUser.uid,
        reason: reason || 'Role assignment by admin'
      })
    } catch (error) {
      console.error('Assign role error:', error)
      throw error
    }
  }

  static getStoredEmail(): string | null {
    return globalThis.localStorage.getItem('emailForSignIn')
  }

  static getStoredRole(): string | null {
    return globalThis.localStorage.getItem('roleForSignIn')
  }

  static getCurrentUser(): User | null {
    return auth.currentUser
  }

  static async getUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser
    if (!user) return null
    return await DatabaseService.getUserProfile(user.uid)
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!auth) {
      console.warn('Firebase auth not available')
      return () => {}
    }
    return onAuthStateChanged(auth, callback)
  }

  static async createUserProfile(
    user: User,
    displayName: string,
    role: AdminAssignableRole = 'applicant'
  ): Promise<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)
  }

  private static async ensureUserProfile(user: User): Promise<void> {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const existing = await getDoc(ref)

    if (!existing.exists()) {
      const name = user.displayName || user.email || 'User'
      // First-time profile: only auto-promote to staff if the OAuth provider
      // has already verified the email. Email/password sign-ups land as
      // 'applicant' here (email isn't verified yet) and elevate later, the
      // first time they sign in after clicking the Firebase verification
      // link delivered to their IONOS mailbox.
      const role: AdminAssignableRole =
        user.emailVerified && isStaffEmail(user.email) ? 'staff' : 'applicant'
      await this.createUserProfile(user, String(name), role)
      return
    }

    // Existing profile: auto-elevate applicant -> staff once the user proves
    // they own the @staija.org mailbox by clicking Firebase's verification
    // email. Only the real mailbox owner can complete that step, so this is
    // a safe self-promotion. The matching Firestore rule re-verifies
    // email_verified + domain server-side, so a tampered client can't write
    // 'staff' without actually owning the inbox.
    const profile = existing.data() as UserProfile
    if (
      profile.role === 'applicant' &&
      user.emailVerified &&
      isStaffEmail(user.email)
    ) {
      await updateDoc(ref, { role: 'staff', updatedAt: new Date() })
    }
  }
}

const STAFF_EMAIL_DOMAIN = 'staija.org'

function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const at = email.lastIndexOf('@')
  if (at < 0) return false
  return email.slice(at + 1).toLowerCase() === STAFF_EMAIL_DOMAIN
}
