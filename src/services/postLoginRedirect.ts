/**
 * Where to send a freshly-authenticated user, by role.
 *
 * Used in three places:
 *   - The global router.beforeEach guard, when a user lacks the
 *     permissions for the route they were trying to reach
 *   - The auth forms (LoginForm, SignUpForm, EmailLinkCallback) after a
 *     successful sign-in/sign-up
 *
 * Keep these consumers using the same helper so a sign-in via Google,
 * email/password, or magic link all land on the same role-appropriate
 * dashboard. Drift here means one path ends up at /admin while another
 * ends up at /home for the same user.
 */

import type { UserRole } from './types'
import { PermissionService } from './permissions'

export type PostLoginRouteName =
  | 'admin'
  | 'student-dashboard'
  | 'alumni-home'
  | 'mentor-dashboard'
  | 'applicant-dashboard'
  | 'home'

export function postLoginRouteName(role: UserRole | null | undefined): PostLoginRouteName {
  if (!role) return 'home'
  if (PermissionService.isStaffRole(role)) return 'admin'
  if (PermissionService.isStudentRole(role)) return 'student-dashboard'
  if (PermissionService.isAlumniRole(role)) return 'alumni-home'
  if (PermissionService.isMentorRole(role)) return 'mentor-dashboard'
  if (PermissionService.hasPermission(role, 'view_own_applications')) {
    return 'applicant-dashboard'
  }
  return 'home'
}
