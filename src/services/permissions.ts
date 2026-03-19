import type { UserRole, Permission } from './types'

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

export class PermissionService {
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || []
    return permissions.includes(permission)
  }

  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }

  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }

  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  static isAdminRole(role: UserRole): boolean {
    return ['admin'].includes(role)
  }

  static isStaffRole(role: UserRole): boolean {
    return ['admin', 'staff'].includes(role)
  }

  static isContentEditorRole(role: UserRole): boolean {
    return ['admin', 'content_editor'].includes(role)
  }

  static isAlumniRole(role: UserRole): boolean {
    return ['admin', 'alumni'].includes(role)
  }

  static isStudentRole(role: UserRole): boolean {
    return ['admin', 'student'].includes(role)
  }

  static canAssignRole(currentRole: UserRole, targetRole: UserRole): boolean {
    if (currentRole === 'admin') return true
    if (currentRole === 'staff') {
      return ['applicant', 'staff', 'alumni'].includes(targetRole)
    }
    return false
  }

  static isValidRoleTransition(currentRole: UserRole, newRole: UserRole): boolean {
    if (currentRole === newRole) return true

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
