import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { auth } from '../config/firebase'
import { DatabaseService } from '../services/firebase'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue'), meta: { title: 'STAIJA' } },
  { path: '/programs/stepup-scholars', name: 'stepup', component: () => import('../views/StepUp.vue'), meta: { title: 'StepUp Scholars' } },
  { path: '/programs/dynamerge', name: 'dynamerge', component: () => import('../views/Dynamerge.vue'), meta: { title: 'Dynamerge' } },
  { path: '/get-involved', name: 'get-involved', component: () => import('../views/GetInvolved.vue'), meta: { title: 'Get Involved' } },
  { path: '/donate', name: 'donate', component: () => import('../views/Donate.vue'), meta: { title: 'Donate' } },
  { path: '/about', name: 'about', component: () => import('../views/About.vue'), meta: { title: 'About' } },
  { path: '/blog', name: 'blog', component: () => import('../views/Blog.vue'), meta: { title: 'Stories' } },
  { path: '/contact', name: 'contact', component: () => import('../views/Contact.vue'), meta: { title: 'Contact' } },
  
  // Authentication routes
  { path: '/login', name: 'login', component: () => import('../views/Login.vue'), meta: { title: 'Sign In' } },
  { path: '/signup', name: 'signup', component: () => import('../views/SignUp.vue'), meta: { title: 'Sign Up' } },
  
  // Applicant routes
  { path: '/applicant', name: 'applicant-dashboard', component: () => import('../views/applicant/ApplicantDashboard.vue'), meta: { title: 'My Applications — STAIJA', requiresAuth: true, roles: ['applicant'] } },
  { path: '/applicant/applications', name: 'applicant-applications', component: () => import('../views/applicant/ApplicantApplications.vue'), meta: { title: 'My Applications — STAIJA', requiresAuth: true, roles: ['applicant'] } },
  { path: '/applicant/applications/new', name: 'new-application', component: () => import('../views/applicant/NewApplication.vue'), meta: { title: 'New Application — STAIJA', requiresAuth: true, roles: ['applicant'] } },
  { path: '/applicant/applications/:id', name: 'view-application', component: () => import('../views/applicant/ViewApplication.vue'), meta: { title: 'Application Details — STAIJA', requiresAuth: true, roles: ['applicant'] } },
  { path: '/applicant/applications/:id/edit', name: 'edit-application', component: () => import('../views/applicant/EditApplication.vue'), meta: { title: 'Edit Application — STAIJA', requiresAuth: true, roles: ['applicant'] } },
  
  // Staff/Admin routes
  { path: '/admin', name: 'admin', component: () => import('../views/Admin.vue'), meta: { title: 'Admin Panel — STAIJA', requiresAuth: true, roles: ['admin', 'staff'] } },
  { path: '/admin/applications', name: 'admin-applications', component: () => import('../views/admin/AdminApplications.vue'), meta: { title: 'Applications Management — STAIJA', requiresAuth: true, roles: ['admin', 'staff'] } },
  { path: '/admin/applications/:id', name: 'admin-view-application', component: () => import('../views/admin/ViewApplication.vue'), meta: { title: 'Review Application — STAIJA', requiresAuth: true, roles: ['admin', 'staff'] } },
  { path: '/admin/applications/:id/review', name: 'admin-review-application', component: () => import('../views/admin/ReviewApplication.vue'), meta: { title: 'Review Application — STAIJA', requiresAuth: true, roles: ['admin', 'staff'] } },
  { path: '/admin/programs', name: 'admin-programs', component: () => import('../views/admin/ProgramManagement.vue'), meta: { title: 'Program Management — STAIJA', requiresAuth: true, roles: ['admin', 'staff'] } },
  
  // Email Link Authentication
  { path: '/auth/email-link-callback', name: 'email-link-callback', component: () => import('../views/auth/EmailLinkCallback.vue'), meta: { title: 'Sign In — STAIJA' } },
  
  // Legacy dashboard (redirects based on role)
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: 'Dashboard — STAIJA', requiresAuth: true } },

  // Alumni portal routes
  { path: '/alumni', name: 'alumni-home', component: () => import('../views/alumni/AlumniHome.vue'), meta: { title: 'Alumni — STAIJA', requiresAuth: true, roles: ['alumni', 'admin'] } },
  { path: '/alumni/profile', name: 'alumni-profile', component: () => import('../views/alumni/AlumniProfile.vue'), meta: { title: 'My Alumni Profile — STAIJA', requiresAuth: true, roles: ['alumni', 'admin'] } },
  { path: '/alumni/directory', name: 'alumni-directory', component: () => import('../views/alumni/AlumniDirectory.vue'), meta: { title: 'Alumni Directory — STAIJA', requiresAuth: true, roles: ['alumni', 'admin'] } },
  { path: '/alumni/stories', name: 'alumni-stories', component: () => import('../views/alumni/AlumniStories.vue'), meta: { title: 'Alumni Stories — STAIJA', requiresAuth: true, roles: ['alumni', 'admin'] } },
  
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

// Global auth and role guard
router.beforeEach(async (to) => {
  const requiresAuth = Boolean(to.meta && (to.meta as any).requiresAuth)
  const allowedRoles = ((to.meta && (to.meta as any).roles) || []) as string[]

  if (!requiresAuth && allowedRoles.length === 0) return true

  const user = auth.currentUser
  if (!user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // If no specific roles required, allow access
  if (allowedRoles.length === 0) return true

  try {
    const profile = await DatabaseService.getUserProfile(user.uid)
    const userRole = profile?.role
    
    if (!userRole) {
      // No role assigned, redirect to login
      return { name: 'login' }
    }
    
    if (allowedRoles.includes(userRole)) {
      return true
    }
    
    // User doesn't have required role, redirect based on their actual role
    switch (userRole) {
      case 'applicant':
        return { name: 'applicant-dashboard' }
      case 'admin':
      case 'staff':
        return { name: 'admin' }
      case 'alumni':
        return { name: 'alumni-home' }
      default:
        return { name: 'applicant-dashboard' }
    }
  } catch (error) {
    console.error('Auth guard error:', error)
    return { name: 'login' }
  }
})

export default router


