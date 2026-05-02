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

export type UserRole = 'admin' | 'content_editor' | 'alumni' | 'applicant' | 'staff' | 'student' | 'mentor'

export type PublicAssignableRole = 'applicant' | 'alumni'

export type AdminAssignableRole = UserRole

// Mentors are vetted/invited (not self-signup), but the invitation flow uses
// the same email-link mechanism we use for staff onboarding.
export type EmailLinkAssignableRole = 'applicant' | 'staff' | 'alumni' | 'mentor'

export type Permission =
  | 'manage_users'
  | 'manage_roles'
  | 'view_all_users'
  | 'manage_system_settings'
  | 'create_content'
  | 'edit_content'
  | 'delete_content'
  | 'publish_content'
  | 'manage_content_categories'
  | 'view_applications'
  | 'review_applications'
  | 'manage_applications'
  | 'export_applications'
  | 'create_programs'
  | 'edit_programs'
  | 'delete_programs'
  | 'manage_program_settings'
  | 'access_alumni_portal'
  | 'manage_alumni_profiles'
  | 'share_alumni_stories'
  | 'network_with_alumni'
  | 'view_program_content'
  | 'access_student_portal'
  | 'participate_in_programs'
  | 'submit_program_work'
  | 'access_mentor_support'
  | 'view_assigned_students'
  | 'submit_mentor_feedback'
  | 'apply_to_programs'
  | 'view_own_applications'
  | 'edit_own_applications'
  | 'view_public_content'
  | 'contact_support'
  | 'manage_profile'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
  program?: 'stepup_scholars' | 'dynamerge'
  applicationStatus?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
}

// A mentor↔student pairing for the duration of a program.
// Created by staff/admin (initially in Firestore directly; an admin UI for
// this can come later). Read by the mentor portal to populate "your students".
export interface MentorAssignment {
  id?: string
  mentorId: string
  studentId: string
  program: 'stepup_scholars' | 'dynamerge'
  status: 'active' | 'ended'
  assignedAt: Date
  endedAt?: Date
  assignedBy?: string
  notes?: string
}

// Free-form feedback a mentor leaves about an assigned student. Visible to
// the mentor (their own past entries) and to staff/admin. Student visibility
// is intentionally deferred — adding a student-facing surface needs UX
// thinking (timing of disclosure, ability to respond, etc.) that's separate
// from getting the mentor side working.
export interface MentorFeedback {
  id?: string
  mentorId: string
  studentId: string
  content: string
  submittedAt: Date
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
