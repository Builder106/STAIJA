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

// Types
export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: 'admin' | 'content_editor' | 'alumni' | 'applicant' | 'staff'
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

  // Create new user account
  static async signUp(email: string, password: string, displayName: string, role: 'applicant' | 'staff' = 'applicant'): Promise<UserCredential> {
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
  static async sendSignInLink(email: string, role?: 'applicant' | 'staff' | 'alumni'): Promise<void> {
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/email-link-callback`,
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
      window.localStorage.setItem('emailForSignIn', email)
      if (role) {
        window.localStorage.setItem('roleForSignIn', role)
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
      window.localStorage.removeItem('emailForSignIn')
      window.localStorage.removeItem('roleForSignIn')
      
      return result
    } catch (error) {
      console.error('Complete sign in with email link error:', error)
      throw error
    }
  }

  static isSignInWithEmailLink(url: string): boolean {
    return isSignInWithEmailLink(auth, url)
  }

  static getStoredEmail(): string | null {
    return window.localStorage.getItem('emailForSignIn')
  }

  static getStoredRole(): string | null {
    return window.localStorage.getItem('roleForSignIn')
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
    return onAuthStateChanged(auth, callback)
  }

  // Create user profile in Firestore
  private static async createUserProfile(user: User, displayName: string, role: 'applicant' | 'staff' | 'student' = 'applicant'): Promise<void> {
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
