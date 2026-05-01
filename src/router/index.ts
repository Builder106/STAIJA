import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { auth } from '../config/firebase.ts'
import { DatabaseService, PermissionService, type Permission } from '../services/firebase.ts'

// Extend the RouteMeta interface to include our custom properties
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    permissions?: Permission[]
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue'), meta: { title: 'STAIJA' } },
  { path: '/programs/stepup-scholars', name: 'stepup', component: () => import('../views/StepUp.vue'), meta: { title: 'StepUp Scholars' } },
  { path: '/programs/dynamerge', name: 'dynamerge', component: () => import('../views/Dynamerge.vue'), meta: { title: 'Dynamerge' } },
  { path: '/get-involved', name: 'get-involved', component: () => import('../views/GetInvolved.vue'), meta: { title: 'Get Involved' } },
  { path: '/donate', name: 'donate', component: () => import('../views/Donate.vue'), meta: { title: 'Donate' } },
  { path: '/donor', name: 'donor-dashboard', component: () => import('../views/donor/DonorDashboard.vue'), meta: { title: 'My Donations — STAIJA', requiresAuth: true } },
  { path: '/about', name: 'about', component: () => import('../views/About.vue'), meta: { title: 'About' } },
  { path: '/press', name: 'press', component: () => import('../views/Press.vue'), meta: { title: 'Press — STAIJA' } },
  { path: '/blog', name: 'blog', component: () => import('../views/Blog.vue'), meta: { title: 'Stories' } },
  { path: '/blog/:slug', name: 'blog-post', component: () => import('../views/BlogPost.vue'), meta: { title: 'Story — STAIJA' } },
  { path: '/contact', name: 'contact', component: () => import('../views/Contact.vue'), meta: { title: 'Contact' } },
  { path: '/events', name: 'events', component: () => import('../views/Events.vue'), meta: { title: 'Events & Workshops' } },
  { path: '/events/:slug', name: 'event-detail', component: () => import('../views/EventDetail.vue'), meta: { title: 'Event Details' } },
  
  // Authentication routes
  { path: '/login', name: 'login', component: () => import('../views/Login.vue'), meta: { title: 'Sign In' } },
  { path: '/signup', name: 'signup', component: () => import('../views/SignUp.vue'), meta: { title: 'Sign Up' } },
  
  // Applicant routes
  { path: '/applicant', name: 'applicant-dashboard', component: () => import('../views/applicant/ApplicantDashboard.vue'), meta: { title: 'My Applications — STAIJA', requiresAuth: true, permissions: ['view_own_applications'] } },
  { path: '/applicant/applications', name: 'applicant-applications', component: () => import('../views/applicant/ApplicantApplications.vue'), meta: { title: 'My Applications — STAIJA', requiresAuth: true, permissions: ['view_own_applications'] } },
  { path: '/applicant/applications/new', name: 'new-application', component: () => import('../views/applicant/NewApplication.vue'), meta: { title: 'New Application — STAIJA', requiresAuth: true, permissions: ['apply_to_programs'] } },
  { path: '/applicant/applications/:id', name: 'view-application', component: () => import('../views/applicant/ApplicantViewApplication.vue'), meta: { title: 'Application Details — STAIJA', requiresAuth: true, permissions: ['view_own_applications'] } },
  { path: '/applicant/applications/:id/edit', name: 'edit-application', component: () => import('../views/applicant/EditApplication.vue'), meta: { title: 'Edit Application — STAIJA', requiresAuth: true, permissions: ['edit_own_applications'] } },

  // Student routes
  { path: '/student', name: 'student-dashboard', component: () => import('../views/student/StudentDashboard.vue'), meta: { title: 'My Program — STAIJA', requiresAuth: true, permissions: ['access_student_portal'] } },
  { path: '/student/program', name: 'student-program', component: () => import('../views/student/StudentProgramContent.vue'), meta: { title: 'Program Content — STAIJA', requiresAuth: true, permissions: ['view_program_content'] } },
  { path: '/student/assignments', name: 'student-assignments', component: () => import('../views/student/Assignments.vue'), meta: { title: 'Assignments — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/student/mentor', name: 'student-mentor', component: () => import('../views/student/MentorSupport.vue'), meta: { title: 'Mentor Support — STAIJA', requiresAuth: true, permissions: ['access_mentor_support'] } },
  { path: '/student/progress', name: 'student-progress', component: () => import('../views/student/Progress.vue'), meta: { title: 'My Progress — STAIJA', requiresAuth: true, permissions: ['access_student_portal'] } },
  
  // Staff/Admin routes
  { path: '/admin', name: 'admin', component: () => import('../views/Admin.vue'), meta: { title: 'Admin Panel — STAIJA', requiresAuth: true, permissions: ['view_all_users'] } },
  { path: '/admin/applications', name: 'admin-applications', component: () => import('../views/admin/AdminApplications.vue'), meta: { title: 'Applications Management — STAIJA', requiresAuth: true, permissions: ['view_applications'] } },
  { path: '/admin/applications/:id', name: 'admin-view-application', component: () => import('../views/admin/AdminViewApplication.vue'), meta: { title: 'Review Application — STAIJA', requiresAuth: true, permissions: ['review_applications'] } },
  { path: '/admin/applications/:id/review', name: 'admin-review-application', component: () => import('../views/admin/ReviewApplication.vue'), meta: { title: 'Review Application — STAIJA', requiresAuth: true, permissions: ['review_applications'] } },
  { path: '/admin/programs', name: 'admin-programs', component: () => import('../views/admin/ProgramManagement.vue'), meta: { title: 'Program Management — STAIJA', requiresAuth: true, permissions: ['manage_program_settings'] } },
  { path: '/admin/users', name: 'admin-users', component: () => import('../views/admin/UserManagement.vue'), meta: { title: 'User Management — STAIJA', requiresAuth: true, permissions: ['manage_users'] } },

  // Content Editor routes
  { path: '/content', name: 'content-dashboard', component: () => import('../views/content/ContentDashboard.vue'), meta: { title: 'Content Management — STAIJA', requiresAuth: true, permissions: ['create_content'] } },
  { path: '/content/blog', name: 'content-blog', component: () => import('../views/content/BlogManagement.vue'), meta: { title: 'Blog Management — STAIJA', requiresAuth: true, permissions: ['edit_content'] } },
  { path: '/content/blog/new', name: 'content-new-blog', component: () => import('../views/content/NewBlogPost.vue'), meta: { title: 'New Blog Post — STAIJA', requiresAuth: true, permissions: ['create_content'] } },
  { path: '/content/blog/:id/edit', name: 'content-edit-blog', component: () => import('../views/content/EditBlogPost.vue'), meta: { title: 'Edit Blog Post — STAIJA', requiresAuth: true, permissions: ['edit_content'] } },
  { path: '/content/programs', name: 'content-programs', component: () => import('../views/content/ProgramContent.vue'), meta: { title: 'Program Content — STAIJA', requiresAuth: true, permissions: ['edit_content'] } },
  { path: '/content/events', name: 'content-events', component: () => import('../views/content/EventManagement.vue'), meta: { title: 'Event Management — STAIJA', requiresAuth: true, permissions: ['edit_content'] } },
  { path: '/content/categories', name: 'content-categories', component: () => import('../views/content/CategoryManagement.vue'), meta: { title: 'Category Management — STAIJA', requiresAuth: true, permissions: ['manage_content_categories'] } },
  
  // Email Link Authentication
  { path: '/auth/email-link-callback', name: 'email-link-callback', component: () => import('../views/auth/EmailLinkCallback.vue'), meta: { title: 'Sign In — STAIJA' } },
  
  // Legacy dashboard (redirects based on role)
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: 'Dashboard — STAIJA', requiresAuth: true } },

  // Alumni portal routes
  { path: '/alumni', name: 'alumni-home', component: () => import('../views/alumni/AlumniHome.vue'), meta: { title: 'Alumni — STAIJA', requiresAuth: true, permissions: ['access_alumni_portal'] } },
  { path: '/alumni/profile', name: 'alumni-profile', component: () => import('../views/alumni/AlumniProfile.vue'), meta: { title: 'My Alumni Profile — STAIJA', requiresAuth: true, permissions: ['access_alumni_portal'] } },
  { path: '/alumni/directory', name: 'alumni-directory', component: () => import('../views/alumni/AlumniDirectory.vue'), meta: { title: 'Alumni Directory — STAIJA', requiresAuth: true, permissions: ['network_with_alumni'] } },
  { path: '/alumni/stories', name: 'alumni-stories', component: () => import('../views/alumni/AlumniStories.vue'), meta: { title: 'Alumni Stories — STAIJA', requiresAuth: true, permissions: ['share_alumni_stories'] } },
  
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFound.vue'), meta: { title: 'Page Not Found' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta && typeof to.meta.title === 'string') {
    const g = globalThis as unknown as { document?: { title: string } }
    if (g.document) g.document.title = to.meta.title
  }
})

// Global auth and permission guard
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = Boolean(to.meta?.requiresAuth)
  const requiredPermissions = to.meta?.permissions || []

  // Wait for Firebase Auth to be ready (if it's still initializing)
  await new Promise<void>(resolve => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      unsubscribe()
      resolve()
    })
  })

  if (!requiresAuth && requiredPermissions.length === 0) {
    return next()
  }

  const user = auth.currentUser
  if (!user) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // If no specific permissions required, allow access
  if (requiredPermissions.length === 0) return next()

  try {
    const profile = await DatabaseService.getUserProfile(user.uid)
    const userRole = profile?.role
    
    if (!userRole) {
      // No role assigned, redirect to login
      return next({ name: 'login' })
    }
    
    // Check if user has required permissions
    const hasRequiredPermissions = PermissionService.hasAnyPermission(userRole, requiredPermissions)

    if (hasRequiredPermissions) {
      return next()
    }
    
        // User doesn't have required permissions, redirect based on their role capabilities
    if (PermissionService.isStaffRole(userRole)) {
        return next({ name: 'admin' })
    } else if (PermissionService.isContentEditorRole(userRole)) {
      return next({ name: 'content-dashboard' })
    } else if (PermissionService.isStudentRole(userRole)) {
      return next({ name: 'student-dashboard' })
    } else if (PermissionService.isAlumniRole(userRole)) {
        return next({ name: 'alumni-home' })
    } else if (PermissionService.hasPermission(userRole, 'view_own_applications')) {
        return next({ name: 'applicant-dashboard' })
    } else {
      return next({ name: 'home' })
    }
  } catch (error) {
    console.error('Auth guard error:', error)
    return next({ name: 'login' })
  }
})

export default router


