import { describe, it, expect } from 'vitest'
import { PermissionService, ALL_ROLES, ALL_PERMISSIONS } from '../../src/services/permissions'
import type { UserRole } from '../../src/services/types'

describe('PermissionService', () => {
  describe('role identity helpers', () => {
    it('isStaffRole returns true for staff and admin only', () => {
      expect(PermissionService.isStaffRole('staff')).toBe(true)
      expect(PermissionService.isStaffRole('admin')).toBe(true)
      expect(PermissionService.isStaffRole('applicant')).toBe(false)
      expect(PermissionService.isStaffRole('student')).toBe(false)
      expect(PermissionService.isStaffRole('alumni')).toBe(false)
      expect(PermissionService.isStaffRole('mentor')).toBe(false)
    })

    it('isAdminRole is strict — staff does not match', () => {
      expect(PermissionService.isAdminRole('admin')).toBe(true)
      expect(PermissionService.isAdminRole('staff')).toBe(false)
    })

    it('isStudentRole is strict', () => {
      expect(PermissionService.isStudentRole('student')).toBe(true)
      expect(PermissionService.isStudentRole('alumni')).toBe(false)
    })

    it('isAlumniRole is strict', () => {
      expect(PermissionService.isAlumniRole('alumni')).toBe(true)
      expect(PermissionService.isAlumniRole('student')).toBe(false)
    })

    it('isMentorRole is strict', () => {
      expect(PermissionService.isMentorRole('mentor')).toBe(true)
      expect(PermissionService.isMentorRole('staff')).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('staff can view and manage applications', () => {
      expect(PermissionService.hasPermission('staff', 'view_applications')).toBe(true)
      expect(PermissionService.hasPermission('staff', 'review_applications')).toBe(true)
    })

    it('applicant cannot view all applications', () => {
      expect(PermissionService.hasPermission('applicant', 'view_applications')).toBe(false)
    })

    it('applicant can view their own applications', () => {
      expect(PermissionService.hasPermission('applicant', 'view_own_applications')).toBe(true)
    })

    it('mentor can view assigned students and submit feedback', () => {
      expect(PermissionService.hasPermission('mentor', 'view_assigned_students')).toBe(true)
      expect(PermissionService.hasPermission('mentor', 'submit_mentor_feedback')).toBe(true)
    })

    it('mentor cannot manage users', () => {
      expect(PermissionService.hasPermission('mentor', 'manage_users')).toBe(false)
    })

    it('admin is a superset of staff permissions', () => {
      const staffPerms = PermissionService.getRolePermissions('staff')
      for (const perm of staffPerms) {
        expect(PermissionService.hasPermission('admin', perm)).toBe(true)
      }
    })

    // Boundary cases — keep the technical/non-technical split honest.
    it('staff cannot create programs (admin-only)', () => {
      expect(PermissionService.hasPermission('staff', 'create_programs')).toBe(false)
      expect(PermissionService.hasPermission('admin', 'create_programs')).toBe(true)
    })

    it('staff cannot manage alumni profiles (admin-only)', () => {
      expect(PermissionService.hasPermission('staff', 'manage_alumni_profiles')).toBe(false)
      expect(PermissionService.hasPermission('admin', 'manage_alumni_profiles')).toBe(true)
    })

    it('admin does not have alumni-community participation permissions', () => {
      // share_alumni_stories and network_with_alumni are alumni-only social
      // features; admins moderate via manage_alumni_profiles, not by joining.
      expect(PermissionService.hasPermission('admin', 'share_alumni_stories')).toBe(false)
      expect(PermissionService.hasPermission('admin', 'network_with_alumni')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission matches', () => {
      expect(
        PermissionService.hasAnyPermission('applicant', ['manage_users', 'view_own_applications'])
      ).toBe(true)
    })

    it('returns false when none match', () => {
      expect(
        PermissionService.hasAnyPermission('applicant', ['manage_users', 'delete_programs'])
      ).toBe(false)
    })

    it('returns false for empty permissions array', () => {
      expect(PermissionService.hasAnyPermission('admin', [])).toBe(false)
    })
  })

  describe('ALL_ROLES / ALL_PERMISSIONS', () => {
    it('ALL_ROLES contains every UserRole', () => {
      const expected: UserRole[] = ['admin', 'staff', 'alumni', 'applicant', 'student', 'mentor']
      for (const r of expected) {
        expect(ALL_ROLES).toContain(r)
      }
    })

    it('ALL_PERMISSIONS has no duplicates', () => {
      expect(ALL_PERMISSIONS.length).toBe(new Set(ALL_PERMISSIONS).size)
    })

    it('every role has at least one permission', () => {
      for (const role of ALL_ROLES) {
        expect(PermissionService.getRolePermissions(role).length).toBeGreaterThan(0)
      }
    })
  })
})
