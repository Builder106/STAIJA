import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/config/firebase.ts', () => ({
  auth: {},
  getDb: vi.fn(async () => ({})),
  getStorageBucket: vi.fn(async () => ({})),
  getPublicStorageBucket: vi.fn(async () => ({})),
  getFns: vi.fn(async () => ({})),
}))

const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockUpdateDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({ set: vi.fn(), commit: vi.fn() })),
  serverTimestamp: vi.fn(() => new Date()),
}))

const mockSignInWithEmailAndPassword = vi.fn()
const mockSignInWithPopup = vi.fn()
const mockCreateUserWithEmailAndPassword = vi.fn()
const mockSendEmailVerification = vi.fn()
const mockUpdateProfile = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  sendEmailVerification: (...args: unknown[]) => mockSendEmailVerification(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  GoogleAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updatePassword: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
}))

// Mock audit and database services to avoid pulling in extra Firestore logic.
vi.mock('../../src/services/audit.ts', () => ({
  AuditService: { logRoleChange: vi.fn() },
}))
vi.mock('../../src/services/database.ts', () => ({
  DatabaseService: {
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    getAllUsers: vi.fn(),
    saveProgramWithHistory: vi.fn(),
    getProgramHistory: vi.fn(),
  },
}))

import { AuthService } from '../../src/services/auth'

// A minimal Firebase User stub that satisfies the shape AuthService reads.
function makeUser(overrides: {
  uid?: string
  email?: string
  emailVerified?: boolean
  displayName?: string
} = {}) {
  return {
    uid: overrides.uid ?? 'user-1',
    email: overrides.email ?? 'test@example.com',
    emailVerified: overrides.emailVerified ?? false,
    displayName: overrides.displayName ?? 'Test User',
  }
}

describe('AuthService.signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetDoc.mockResolvedValue(undefined)
    mockUpdateDoc.mockResolvedValue(undefined)
    mockSendEmailVerification.mockResolvedValue(undefined)
    mockUpdateProfile.mockResolvedValue(undefined)
  })

  describe('new user (no existing Firestore profile)', () => {
    beforeEach(() => {
      mockGetDoc.mockResolvedValue({ exists: () => false })
    })

    it('creates an applicant profile for a regular email and returns applicant role', async () => {
      const user = makeUser({ email: 'student@gmail.com', emailVerified: false })
      mockSignInWithEmailAndPassword.mockResolvedValue({ user })

      const { role } = await AuthService.signIn('student@gmail.com', 'pw')

      expect(role).toBe('applicant')
      expect(mockSetDoc).toHaveBeenCalledOnce()
      const savedProfile = mockSetDoc.mock.calls[0][1]
      expect(savedProfile.role).toBe('applicant')
    })

    it('creates a staff profile when a @staija.org email is already verified', async () => {
      const user = makeUser({ email: 'yinka@staija.org', emailVerified: true })
      mockSignInWithEmailAndPassword.mockResolvedValue({ user })

      const { role } = await AuthService.signIn('yinka@staija.org', 'pw')

      expect(role).toBe('staff')
      const savedProfile = mockSetDoc.mock.calls[0][1]
      expect(savedProfile.role).toBe('staff')
    })

    it('creates an applicant profile for @staija.org when email is NOT yet verified', async () => {
      const user = makeUser({ email: 'new@staija.org', emailVerified: false })
      mockSignInWithEmailAndPassword.mockResolvedValue({ user })

      const { role } = await AuthService.signIn('new@staija.org', 'pw')

      expect(role).toBe('applicant')
      const savedProfile = mockSetDoc.mock.calls[0][1]
      expect(savedProfile.role).toBe('applicant')
    })
  })

  describe('returning user (existing Firestore profile)', () => {
    it('returns the existing role without touching Firestore for a regular user', async () => {
      const user = makeUser({ email: 'returning@gmail.com', emailVerified: true })
      mockSignInWithEmailAndPassword.mockResolvedValue({ user })
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'applicant', email: user.email }),
      })

      const { role } = await AuthService.signIn('returning@gmail.com', 'pw')

      expect(role).toBe('applicant')
      expect(mockUpdateDoc).not.toHaveBeenCalled()
    })

    it('auto-elevates applicant → staff when @staija.org email becomes verified', async () => {
      const user = makeUser({ email: 'yinka@staija.org', emailVerified: true })
      mockSignInWithEmailAndPassword.mockResolvedValue({ user })
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'applicant', email: user.email }),
      })

      const { role } = await AuthService.signIn('yinka@staija.org', 'pw')

      expect(role).toBe('staff')
      expect(mockUpdateDoc).toHaveBeenCalledOnce()
      const update = mockUpdateDoc.mock.calls[0][1]
      expect(update.role).toBe('staff')
    })

    it('does not elevate when @staija.org email is not yet verified', async () => {
      const user = makeUser({ email: 'pending@staija.org', emailVerified: false })
      mockSignInWithEmailAndPassword.mockResolvedValue({ user })
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'applicant', email: user.email }),
      })

      const { role } = await AuthService.signIn('pending@staija.org', 'pw')

      expect(role).toBe('applicant')
      expect(mockUpdateDoc).not.toHaveBeenCalled()
    })

    it('returns staff role without re-elevating an already-staff user', async () => {
      const user = makeUser({ email: 'yinka@staija.org', emailVerified: true })
      mockSignInWithEmailAndPassword.mockResolvedValue({ user })
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ role: 'staff', email: user.email }),
      })

      const { role } = await AuthService.signIn('yinka@staija.org', 'pw')

      expect(role).toBe('staff')
      expect(mockUpdateDoc).not.toHaveBeenCalled()
    })
  })
})

describe('AuthService.signInWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetDoc.mockResolvedValue(undefined)
    mockUpdateDoc.mockResolvedValue(undefined)
  })

  it('returns the resolved role alongside the credential', async () => {
    const user = makeUser({ email: 'user@gmail.com', emailVerified: true })
    mockSignInWithPopup.mockResolvedValue({ user })
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'alumni', email: user.email }),
    })

    const { credential, role } = await AuthService.signInWithGoogle()

    expect(credential.user).toBe(user)
    expect(role).toBe('alumni')
  })

  it('creates a new profile on first Google sign-in', async () => {
    const user = makeUser({ email: 'first@gmail.com', emailVerified: true })
    mockSignInWithPopup.mockResolvedValue({ user })
    mockGetDoc.mockResolvedValue({ exists: () => false })

    const { role } = await AuthService.signInWithGoogle()

    expect(role).toBe('applicant')
    expect(mockSetDoc).toHaveBeenCalledOnce()
  })
})
