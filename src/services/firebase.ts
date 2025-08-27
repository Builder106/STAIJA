// Firebase Service Layer for STAIJA Phase 3A
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
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
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage'
import { auth, db, storage } from '../config/firebase'

// Types
export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: 'admin' | 'content_editor' | 'alumni' | 'student'
  createdAt: Date
  updatedAt: Date
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
  static async signUp(email: string, password: string, displayName: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
        
        // Create user profile in Firestore
        await this.createUserProfile(userCredential.user, displayName)
      }
      
      return userCredential
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
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

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  }

  // Create user profile in Firestore
  private static async createUserProfile(user: User, displayName: string): Promise<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName,
      role: 'student', // Default role
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)
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
      let q = collection(db, 'content')
      
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
