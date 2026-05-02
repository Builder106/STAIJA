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
