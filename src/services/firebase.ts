// Firebase Service Layer for STAIJA Phase 3A
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
import type {
  User,
  UserCredential
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  limit
} from 'firebase/firestore'
import type { Query as FsQuery, CollectionReference, DocumentData } from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage'
import { auth, db, storage } from '../config/firebase.ts'

// Audit log types
export interface AuditLog {
  id: string
  type: 'role_change' | 'permission_check'
  userId: string
  timestamp: Date
  changedBy?: string
  previousRole?: UserRole
  newRole?: UserRole
  permission?: Permission
  granted?: boolean
  reason?: string
  context?: string
  ipAddress?: string
  userAgent?: string
}

// Types
export type UserRole = 'admin' | 'content_editor' | 'alumni' | 'applicant' | 'staff' | 'student'

// Roles that can be assigned during public signup
export type PublicAssignableRole = 'applicant' | 'alumni'

// Roles that can be assigned by admins only
export type AdminAssignableRole = UserRole

// Roles that can be assigned via email link authentication
export type EmailLinkAssignableRole = 'applicant' | 'staff' | 'alumni'

// Permission definitions
export type Permission =
  // Admin permissions
  | 'manage_users'
  | 'manage_roles'
  | 'view_all_users'
  | 'manage_system_settings'

  // Content permissions
  | 'create_content'
  | 'edit_content'
  | 'delete_content'
  | 'publish_content'
  | 'manage_content_categories'

  // Application permissions
  | 'view_applications'
  | 'review_applications'
  | 'manage_applications'
  | 'export_applications'

  // Program permissions
  | 'create_programs'
  | 'edit_programs'
  | 'delete_programs'
  | 'manage_program_settings'

  // Alumni permissions
  | 'access_alumni_portal'
  | 'manage_alumni_profiles'
  | 'share_alumni_stories'
  | 'network_with_alumni'

  // Student permissions
  | 'view_program_content'
  | 'access_student_portal'
  | 'participate_in_programs'
  | 'submit_program_work'
  | 'access_mentor_support'

  // Applicant permissions
  | 'apply_to_programs'
  | 'view_own_applications'
  | 'edit_own_applications'

  // General permissions
  | 'view_public_content'
  | 'contact_support'
  | 'manage_profile'

// Role-to-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'manage_users',
    'manage_roles',
    'view_all_users',
    'manage_system_settings',
    'create_content',
    'edit_content',
    'delete_content',
    'publish_content',
    'manage_content_categories',
    'view_applications',
    'review_applications',
    'manage_applications',
    'export_applications',
    'create_programs',
    'edit_programs',
    'delete_programs',
    'manage_program_settings',
    'access_alumni_portal',
    'manage_alumni_profiles',
    'share_alumni_stories',
    'network_with_alumni',
    'view_public_content',
    'contact_support',
    'manage_profile'
  ],

  staff: [
    'view_all_users',
    'view_applications',
    'review_applications',
    'manage_applications',
    'create_programs',
    'edit_programs',
    'manage_program_settings',
    'access_alumni_portal',
    'manage_alumni_profiles',
    'view_public_content',
    'contact_support',
    'manage_profile'
  ],

  content_editor: [
    'create_content',
    'edit_content',
    'delete_content',
    'publish_content',
    'manage_content_categories',
    'view_public_content',
    'contact_support',
    'manage_profile'
  ],

  alumni: [
    'access_alumni_portal',
    'share_alumni_stories',
    'network_with_alumni',
    'view_public_content',
    'contact_support',
    'manage_profile'
  ],

  applicant: [
    'apply_to_programs',
    'view_own_applications',
    'edit_own_applications',
    'view_public_content',
    'contact_support',
    'manage_profile'
  ],

  student: [
    'view_own_applications',
    'view_program_content',
    'access_student_portal',
    'participate_in_programs',
    'submit_program_work',
    'access_mentor_support',
    'view_public_content',
    'contact_support',
    'manage_profile'
  ]
}

// Permission checking utilities
export class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || []
    return permissions.includes(permission)
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Check if a role can perform admin actions
   */
  static isAdminRole(role: UserRole): boolean {
    return ['admin'].includes(role)
  }

  /**
   * Check if a role can perform staff actions
   */
  static isStaffRole(role: UserRole): boolean {
    return ['admin', 'staff'].includes(role)
  }

  /**
   * Check if a role can edit content
   */
  static isContentEditorRole(role: UserRole): boolean {
    return ['admin', 'content_editor'].includes(role)
  }

  /**
   * Check if a role can access alumni features
   */
  static isAlumniRole(role: UserRole): boolean {
    return ['admin', 'alumni'].includes(role)
  }

  /**
   * Check if a role is a student role
   */
  static isStudentRole(role: UserRole): boolean {
    return ['admin', 'student'].includes(role)
  }

  /**
   * Check if a user can assign a specific role
   */
  static canAssignRole(currentRole: UserRole, targetRole: UserRole): boolean {
    // Only admins can assign any role
    if (currentRole === 'admin') return true

    // Staff can assign applicant, staff, and alumni roles
    if (currentRole === 'staff') {
      return ['applicant', 'staff', 'alumni'].includes(targetRole)
    }

    // Others cannot assign roles
    return false
  }

  /**
   * Check if a role transition is valid
   */
  static isValidRoleTransition(currentRole: UserRole, newRole: UserRole): boolean {
    if (currentRole === newRole) return true // No change is always valid

    // Define allowed role transitions
    const allowedTransitions: Record<UserRole, UserRole[]> = {
      'applicant': ['student', 'alumni'],
      'student': ['alumni', 'applicant'],
      'alumni': ['applicant', 'student'],
      'staff': ['admin', 'applicant'],
      'admin': ['staff', 'applicant', 'alumni'],
      'content_editor': ['admin', 'staff']
    }

    return allowedTransitions[currentRole]?.includes(newRole) ?? false
  }
}

// Audit Service for tracking role changes and security events
export class AuditService {
  /**
   * Log a role change event
   */
  static async logRoleChange(params: {
    userId: string
    previousRole: UserRole
    newRole: UserRole
    changedBy: string
    reason?: string
  }): Promise<void> {
    try {
      const auditLog = {
        type: 'role_change',
        userId: params.userId,
        previousRole: params.previousRole,
        newRole: params.newRole,
        changedBy: params.changedBy,
        reason: params.reason || 'Role change',
        timestamp: new Date(),
        ipAddress: '', // Would be populated by backend in production
        userAgent: '' // Would be populated by backend in production
      }

      await addDoc(collection(db, 'audit_logs'), auditLog)
    } catch (error) {
      console.error('Failed to log role change:', error)
      // Don't throw here as audit logging shouldn't break the main operation
    }
  }

  /**
   * Log a permission check event
   */
  static async logPermissionCheck(params: {
    userId: string
    permission: Permission
    granted: boolean
    context?: string
  }): Promise<void> {
    try {
      const auditLog = {
        type: 'permission_check',
        userId: params.userId,
        permission: params.permission,
        granted: params.granted,
        context: params.context || '',
        timestamp: new Date()
      }

      await addDoc(collection(db, 'audit_logs'), auditLog)
    } catch (error) {
      console.error('Failed to log permission check:', error)
    }
  }

  /**
   * Get audit logs for a user (admin only)
   */
  static async getAuditLogs(userId?: string, logLimit: number = 50): Promise<AuditLog[]> {
    try {
      let q = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(logLimit)
      )

      if (userId) {
        q = query(q, where('userId', '==', userId))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog))
    } catch (error) {
      console.error('Failed to get audit logs:', error)
      throw error
    }
  }
}

// Role Transition Service for managing automatic role changes
export class RoleTransitionService {
  /**
   * Check if a user is eligible for role transition
   */
  static async checkTransitionEligibility(userId: string, targetRole: UserRole): Promise<{
    eligible: boolean
    reason?: string
    requiredActions?: string[]
  }> {
    try {
      const userProfile = await DatabaseService.getUserProfile(userId)
      if (!userProfile) {
        return { eligible: false, reason: 'User profile not found' }
      }

      // Check transition requirements based on target role
      switch (targetRole) {
        case 'alumni':
          return await this.checkAlumniEligibility(userProfile)

        case 'student':
          return await this.checkStudentEligibility(userProfile)

        case 'content_editor':
          return await this.checkContentEditorEligibility(userProfile)

        case 'staff':
          return await this.checkStaffEligibility(userProfile)

        case 'admin':
          return await this.checkAdminEligibility(userProfile)

        default:
          return { eligible: false, reason: 'Invalid target role for transition' }
      }
    } catch (error) {
      console.error('Error checking transition eligibility:', error)
      return { eligible: false, reason: 'Error checking eligibility' }
    }
  }

  /**
   * Check if applicant can transition to student
   */
  private static async checkStudentEligibility(userProfile: UserProfile): Promise<{
    eligible: boolean
    reason?: string
    requiredActions?: string[]
  }> {
    if (userProfile.role !== 'applicant') {
      return { eligible: false, reason: 'User must be an applicant to transition to student' }
    }

    // Check if user has been accepted into a program
    const userApplications = await DatabaseService.getUserApplications(userProfile.uid)
    const acceptedApplications = userApplications.filter(app =>
      app.status === 'accepted' && app.program
    )

    if (acceptedApplications.length === 0) {
      return {
        eligible: false,
        reason: 'User must be accepted into a program to become a student',
        requiredActions: ['Apply to a program', 'Get program acceptance']
      }
    }

    return { eligible: true }
  }

  /**
   * Check if applicant can transition to alumni
   */
  private static async checkAlumniEligibility(userProfile: UserProfile): Promise<{
    eligible: boolean
    reason?: string
    requiredActions?: string[]
  }> {
    if (userProfile.role !== 'applicant' && userProfile.role !== 'student') {
      return { eligible: false, reason: 'User must be an applicant or student to transition to alumni' }
    }

    // Check if user has completed a program
    const userApplications = await DatabaseService.getUserApplications(userProfile.uid)
    const completedApplications = userApplications.filter(app =>
      app.status === 'accepted' &&
      app.program &&
      this.isProgramCompleted(app)
    )

    if (completedApplications.length === 0) {
      return {
        eligible: false,
        reason: 'User must complete a program to become alumni',
        requiredActions: ['Complete program requirements']
      }
    }

    return { eligible: true }
  }

  /**
   * Check if user can transition to content editor
   */
  private static checkContentEditorEligibility(userProfile: UserProfile): {
    eligible: boolean
    reason?: string
    requiredActions?: string[]
  } {
    const allowedSourceRoles: UserRole[] = ['staff', 'alumni', 'admin']
    if (!allowedSourceRoles.includes(userProfile.role)) {
      return {
        eligible: false,
        reason: 'Only staff, alumni, or admins can become content editors',
        requiredActions: ['Must be staff, alumni, or admin first']
      }
    }

    // Additional criteria could be added here (e.g., content creation experience)
    return { eligible: true }
  }

  /**
   * Check if user can transition to staff
   */
  private static checkStaffEligibility(userProfile: UserProfile): {
    eligible: boolean
    reason?: string
    requiredActions?: string[]
  } {
    const allowedSourceRoles: UserRole[] = ['content_editor', 'alumni']
    if (!allowedSourceRoles.includes(userProfile.role)) {
      return {
        eligible: false,
        reason: 'Only content editors or alumni can become staff',
        requiredActions: ['Must be content editor or alumni first']
      }
    }

    // Additional criteria could be added here (e.g., performance metrics)
    return { eligible: true }
  }

  /**
   * Check if user can transition to admin
   */
  private static checkAdminEligibility(userProfile: UserProfile): {
    eligible: boolean
    reason?: string
    requiredActions?: string[]
  } {
    if (userProfile.role !== 'staff') {
      return {
        eligible: false,
        reason: 'Only staff members can become admins',
        requiredActions: ['Must be staff first', 'Requires admin approval']
      }
    }

    // Admin transitions typically require manual approval
    return {
      eligible: false,
      reason: 'Admin role requires manual approval from existing admin',
      requiredActions: ['Get approval from existing admin']
    }
  }

  /**
   * Process automatic role transitions based on conditions
   */
  static async processAutomaticTransitions(): Promise<void> {
    try {
      // This would typically be called by a scheduled job or cron
      console.log('Processing automatic role transitions...')

      // Get all applicants who might be eligible for alumni status
      // In a real implementation, this would query the database
      const applicants = await this.getApplicantsForTransition()

      for (const applicant of applicants) {
        const eligibility = await this.checkTransitionEligibility(applicant.uid, 'alumni')
        if (eligibility.eligible) {
          await this.performTransition(applicant.uid, 'alumni', 'Automatic transition based on program completion')
        }
      }

      console.log('Automatic transitions processed')
    } catch (error) {
      console.error('Error processing automatic transitions:', error)
    }
  }

  /**
   * Perform a role transition with validation
   */
  static async performTransition(
    userId: string,
    targetRole: UserRole,
    reason: string,
    _performedBy?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const eligibility = await this.checkTransitionEligibility(userId, targetRole)

      if (!eligibility.eligible) {
        return {
          success: false,
          message: eligibility.reason || 'Transition not eligible'
        }
      }

      await AuthService.assignRole(userId, targetRole, reason)

      return {
        success: true,
        message: `Role transitioned to ${targetRole}`
      }
    } catch (error) {
      console.error('Error performing role transition:', error)
      const errorMessage = error instanceof Error ? error.message : 'Transition failed'
      return {
        success: false,
        message: errorMessage
      }
    }
  }

  /**
   * Get transition history for a user
   */
  static async getTransitionHistory(userId: string): Promise<AuditLog[]> {
    try {
      const auditLogs = await AuditService.getAuditLogs(userId, 50)
      return auditLogs.filter(log => log.type === 'role_change')
    } catch (error) {
      console.error('Error getting transition history:', error)
      return []
    }
  }

  // Helper methods
  private static isProgramCompleted(application: Application): boolean {
    // Logic to determine if a program is completed
    // This could check completion dates, milestones, etc.
    if (!application.submittedAt) return false

    const submittedDate = new Date(application.submittedAt)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Simple check: if application was submitted more than 6 months ago and accepted
    return submittedDate < sixMonthsAgo && application.status === 'accepted'
  }

  private static getApplicantsForTransition(): UserProfile[] {
    // In a real implementation, this would query the database for applicants
    // who meet certain criteria for automatic transition
    try {
      // This is a placeholder - would need actual database query
      const allUsers: UserProfile[] = [] // Would fetch from database
      return allUsers.filter(user => user.role === 'applicant')
    } catch (error) {
      console.error('Error getting applicants for transition:', error)
      return []
    }
  }
}

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  // Applicant-specific fields
  program?: 'stepup_scholars' | 'dynamerge'
  applicationStatus?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
}

export interface ContentItem {
  id?: string
  title: string
  content: string
  author: string
  type: 'blog' | 'program' | 'event' | 'alumni_story'
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  publishDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Application {
  id?: string
  userId: string
  program: 'stepup_scholars' | 'dynamerge'
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    dateOfBirth: string
    nationality: string
    currentInstitution?: string
    currentLevel?: string
  }
  academicInfo: {
    gpa?: string
    major?: string
    graduationYear?: string
    relevantCourses?: string[]
  }
  researchInterests: string[]
  motivation: string
  experience: string
  references: {
    name: string
    email: string
    institution: string
    relationship: string
  }[]
  documents?: {
    cv?: string
    transcript?: string
    recommendationLetter?: string
  }
  submittedAt?: Date
  reviewedAt?: Date
  reviewedBy?: string
  feedback?: string
  createdAt: Date
  updatedAt: Date
}

export interface Program {
  id?: string
  name: string
  slug: string
  description: string
  overview: string
  benefits: string[]
  requirements: string[]
  applicationProcess: {
    steps: Array<{
      title: string
      description: string
      duration: string
    }>
    summary: {
      totalTime: string
      successRate: string
      responseTime: string
    }
  }
  dates: {
    applicationStart: string
    applicationEnd: string
    programStart: string
    programEnd: string
    decisionsBy: string
  }
  eligibility: {
    ageRange: string
    educationLevel: string
    location: string
    otherRequirements: string[]
  }
  curriculum: {
    duration: string
    format: string
    topics: string[]
    activities: string[]
  }
  contact: {
    email: string
    phone?: string
    additionalInfo?: string
  }
  status: 'active' | 'inactive' | 'draft'
  createdAt: Date
  updatedAt: Date
  updatedBy: string
}

// Authentication Service
export class AuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Create new user account (public signup - limited roles for security)
  static async signUp(email: string, password: string, displayName: string, role: PublicAssignableRole = 'applicant'): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
        
        // Create user profile in Firestore with specified role
        await this.createUserProfile(userCredential.user, displayName, role)
        // Send email verification
        try { await sendEmailVerification(userCredential.user) } catch (_) { /* noop */ }
      }
      
      return userCredential
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  // Sign in with Google
  static async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await this.ensureUserProfile(cred.user)
    return cred
  }

  // Sign in with GitHub
  static async signInWithGitHub(): Promise<UserCredential> {
    const provider = new GithubAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await this.ensureUserProfile(cred.user)
    return cred
  }

  // Send verification email to current user
  static async sendVerificationEmail(): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('No authenticated user')
    await sendEmailVerification(user)
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  // Update password for current user
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

  // Email Link Authentication Methods
  static async sendSignInLink(email: string, role?: EmailLinkAssignableRole): Promise<void> {
    try {
      const actionCodeSettings = {
        url: `${globalThis.location.origin}/auth/email-link-callback`,
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.staija.app'
        },
        android: {
          packageName: 'com.staija.app',
          installApp: true,
          minimumVersion: '12'
        }
      }

      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      
      // Save email and role for later use
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
      
      // Clear stored email
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

  // Admin-only method to assign any role to a user
  static async assignRole(userId: string, role: AdminAssignableRole, reason?: string): Promise<void> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('No authenticated user')

      // Get current user profile to check permissions
      const currentUserProfile = await DatabaseService.getUserProfile(currentUser.uid)
      if (!currentUserProfile) throw new Error('Current user profile not found')

      // Verify the current user has permission to assign this role
      if (!PermissionService.canAssignRole(currentUserProfile.role, role)) {
        throw new Error('Insufficient permissions to assign this role')
      }

      // Get target user profile to validate role transition
      const targetUserProfile = await DatabaseService.getUserProfile(userId)
      if (!targetUserProfile) throw new Error('Target user profile not found')

      // Validate role transition
      if (!PermissionService.isValidRoleTransition(targetUserProfile.role, role)) {
        throw new Error('Invalid role transition')
      }

      // Update the user's role
      await DatabaseService.updateUserProfile(userId, { role })

      // Log the role change for audit purposes
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

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser
  }

  // Get current user's profile
  static async getUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser
    if (!user) return null
    return await DatabaseService.getUserProfile(user.uid)
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!auth) {
      console.warn('Firebase auth not available')
      // Return a no-op unsubscribe function
      return () => {}
    }
    return onAuthStateChanged(auth, callback)
  }

  // Create user profile in Firestore
  private static async createUserProfile(user: User, displayName: string, role: AdminAssignableRole = 'applicant'): Promise<void> {
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

  // Ensure profile exists for OAuth sign-ins
  private static async ensureUserProfile(user: User): Promise<void> {
    if (!user) return
    const existing = await getDoc(doc(db, 'users', user.uid))
    if (!existing.exists()) {
      const name = user.displayName || user.email || 'User'
      await this.createUserProfile(user, String(name))
    }
  }
}

// Database Service
export class DatabaseService {
  // Get user profile
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db) {
      console.warn('Firestore not available')
      return null
    }
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile
      }
      return null
    } catch (error) {
      console.error('Get user profile error:', error)
      throw error
    }
  }

  // Update user profile
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  // Get content items
  static async getContentItems(type?: string, status?: string): Promise<ContentItem[]> {
    try {
      let q: FsQuery<DocumentData> | CollectionReference<DocumentData> = collection(db, 'content')
      
      if (type) {
        q = query(q, where('type', '==', type))
      }
      
      if (status) {
        q = query(q, where('status', '==', status))
      }
      
      q = query(q, orderBy('createdAt', 'desc'))
      
      const querySnapshot = await getDocs(q)
      const items: ContentItem[] = []
      
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ContentItem)
      })
      
      return items
    } catch (error) {
      console.error('Get content items error:', error)
      throw error
    }
  }

  // Create content item
  static async createContentItem(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'content'), {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      console.error('Create content item error:', error)
      throw error
    }
  }

  // Update content item
  static async updateContentItem(id: string, updates: Partial<ContentItem>): Promise<void> {
    try {
      const docRef = doc(db, 'content', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Update content item error:', error)
      throw error
    }
  }

  // Delete content item
  static async deleteContentItem(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'content', id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Delete content item error:', error)
      throw error
    }
  }

  // Listen to content changes (real-time)
  static onContentChanges(callback: (items: ContentItem[]) => void): () => void {
    const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, (querySnapshot) => {
      const items: ContentItem[] = []
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ContentItem)
      })
      callback(items)
    })
  }

  // Application Management Methods
  static async getUserApplications(userId: string): Promise<Application[]> {
    try {
      const q = query(
        collection(db, 'applications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const applications: Application[] = []
      querySnapshot.forEach((doc) => {
        applications.push({ id: doc.id, ...doc.data() } as Application)
      })
      return applications
    } catch (error) {
      console.error('Get user applications error:', error)
      throw error
    }
  }

  static async getApplication(applicationId: string): Promise<Application | null> {
    try {
      const docRef = doc(db, 'applications', applicationId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Application
      }
      return null
    } catch (error) {
      console.error('Get application error:', error)
      throw error
    }
  }

  static async createApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'applications'), {
        ...application,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return docRef.id
    } catch (error) {
      console.error('Create application error:', error)
      throw error
    }
  }

  static async updateApplication(applicationId: string, updates: Partial<Application>): Promise<void> {
    try {
      const docRef = doc(db, 'applications', applicationId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Update application error:', error)
      throw error
    }
  }

  // Staff methods for managing applications
  static async getAllApplications(status?: string): Promise<Application[]> {
    try {
      let q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'))
      
      if (status) {
        q = query(q, where('status', '==', status))
      }
      
      const querySnapshot = await getDocs(q)
      const applications: Application[] = []
      querySnapshot.forEach((doc) => {
        applications.push({ id: doc.id, ...doc.data() } as Application)
      })
      return applications
    } catch (error) {
      console.error('Get all applications error:', error)
      throw error
    }
  }

  // Program Management Methods
  static async getProgram(slug: string): Promise<Program | null> {
    try {
      const q = query(collection(db, 'programs'), where('slug', '==', slug), limit(1))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) return null
      
      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Program
    } catch (error) {
      console.error('Get program error:', error)
      throw error
    }
  }

  static async getAllPrograms(): Promise<Program[]> {
    try {
      const q = query(collection(db, 'programs'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Program)
    } catch (error) {
      console.error('Get all programs error:', error)
      throw error
    }
  }

  static async createProgram(program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date()
      const programData = {
        ...program,
        createdAt: now,
        updatedAt: now
      }
      
      const docRef = await addDoc(collection(db, 'programs'), programData)
      return docRef.id
    } catch (error) {
      console.error('Create program error:', error)
      throw error
    }
  }

  static async updateProgram(id: string, updates: Partial<Program>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }
      
      await updateDoc(doc(db, 'programs', id), updateData)
    } catch (error) {
      console.error('Update program error:', error)
      throw error
    }
  }

  static async deleteProgram(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'programs', id))
    } catch (error) {
      console.error('Delete program error:', error)
      throw error
    }
  }

  static async getActivePrograms(): Promise<Program[]> {
    try {
      const q = query(
        collection(db, 'programs'), 
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Program)
    } catch (error) {
      console.error('Get active programs error:', error)
      throw error
    }
  }
}

// Storage Service
export class StorageService {
  // Upload file
  static async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path)
      const snapshot = await uploadBytes(storageRef, file)
      return await getDownloadURL(snapshot.ref)
    } catch (error) {
      console.error('Upload file error:', error)
      throw error
    }
  }

  // Delete file
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Delete file error:', error)
      throw error
    }
  }

  // Get file URL
  static async getFileURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error('Get file URL error:', error)
      throw error
    }
  }

  // List files in directory
  static async listFiles(path: string): Promise<string[]> {
    try {
      const storageRef = ref(storage, path)
      const result = await listAll(storageRef)
      return result.items.map(item => item.fullPath)
    } catch (error) {
      console.error('List files error:', error)
      throw error
    }
  }
}
