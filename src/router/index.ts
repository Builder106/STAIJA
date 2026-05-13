import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { auth } from '../config/firebase.ts'
import { DatabaseService, PermissionService, postLoginRouteName, type Permission } from '../services/firebase.ts'
import type { UserRole } from '../services/types'
import { donationsEnabled } from '../config/features.ts'

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
  {
    path: '/donor',
    name: 'donor-dashboard',
    component: () => import('../views/donor/DonorDashboard.vue'),
    meta: { title: 'My Donations — STAIJA', requiresAuth: true },
    // Donations gated behind compliance — no donor records exist yet,
    // so the dashboard would be empty and confusing. Redirect home.
    beforeEnter: (_to, _from, next) => {
      if (!donationsEnabled) return next({ name: 'home' })
      next()
    },
  },
  // Optional `:step` segment makes the wizard's position bookmarkable
  // and survives a page refresh. Apply.vue maps the slug to the
  // matching stepsMeta entry on mount + watches the route to keep them
  // in sync. Bare /apply/:program still works — falls back to the
  // first step (eligibility).
  { path: '/apply/:program/:step?', name: 'apply', component: () => import('../views/apply/Apply.vue'), meta: { title: 'Apply — STAIJA', requiresAuth: true } },
  { path: '/refs/:token', name: 'reference-upload', component: () => import('../views/refs/ReferenceUpload.vue'), meta: { title: 'Submit a reference — STAIJA' } },
  // Mentor-invite consume landing. Public so unauthenticated visitors
  // can see who invited them; the view itself bounces to /login with
  // `?redirect=/invite/<token>` when no session exists.
  { path: '/invite/:token', name: 'mentor-invite', component: () => import('../views/InviteAccept.vue'), meta: { title: 'Accept your mentor invitation — STAIJA' } },
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
  { path: '/applicant/applications/:id', name: 'view-application', component: () => import('../views/apply/Status.vue'), meta: { title: 'Application Status — STAIJA', requiresAuth: true, permissions: ['view_own_applications'] } },
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
  // The "view" and "review" admin surfaces collapsed into one. The
  // legacy AdminViewApplication.vue rendered the same data on a
  // separate /:id route, then required a second click to reach the
  // decision form at /:id/review — two-step navigation for what's
  // really one task. ReviewApplication.vue now serves both paths;
  // /:id/review stays as an alias so any existing bookmarks +
  // outbound links (e.g. the Admin overview's "Open" links) keep
  // working without a redirect round-trip.
  { path: '/admin/applications/:id', name: 'admin-review-application', component: () => import('../views/admin/ReviewApplication.vue'), alias: '/admin/applications/:id/review', meta: { title: 'Review Application — STAIJA', requiresAuth: true, permissions: ['review_applications'] } },
  { path: '/admin/programs', name: 'admin-programs', component: () => import('../views/admin/ProgramManagement.vue'), meta: { title: 'Program Management — STAIJA', requiresAuth: true, permissions: ['manage_program_settings'] } },
  { path: '/admin/users', name: 'admin-users', component: () => import('../views/admin/UserManagement.vue'), meta: { title: 'User Management — STAIJA', requiresAuth: true, permissions: ['manage_users'] } },
  { path: '/admin/cohorts', name: 'admin-cohorts', component: () => import('../views/admin/Cohorts.vue'), meta: { title: 'Cohorts — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },
  { path: '/admin/enroll', name: 'admin-enroll', component: () => import('../views/admin/EnrollStudent.vue'), meta: { title: 'Enroll student — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },
  // Temporary — Phase 1 avatar motion preview. Any signed-in user can
  // view it (no permission gate) so dev/staging accounts without an
  // admin role still see the route. Delete once avatar work ships.
  { path: '/admin/avatar-preview', name: 'admin-avatar-preview', component: () => import('../views/admin/AvatarPreview.vue'), meta: { title: 'Avatar preview — STAIJA', requiresAuth: true } },

  // LMS content authoring (STAIJA-native wrapper around Contentful Management API).
  // Both staff and admin can manage course content via manage_cohorts permission.
  { path: '/admin/content', name: 'admin-content', component: () => import('../views/admin/content/ContentHome.vue'), meta: { title: 'Course content — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },
  { path: '/admin/content/outline', name: 'admin-content-outline', component: () => import('../views/admin/content/CourseOutline.vue'), meta: { title: 'AI course outliner — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },
  // The four flat-list routes (/admin/content/{courses,modules,lessons,assignments})
  // were retired in favour of the tree view at /admin/content. We keep
  // redirects so any old bookmarks or links from prior emails don't 404.
  // Path-specific :id routes still match (e.g. /admin/content/courses/new
  // and /admin/content/courses/<id>) — Vue Router matches the longer
  // path first.
  { path: '/admin/content/courses', redirect: { name: 'admin-content' } },
  { path: '/admin/content/courses/:id', name: 'admin-content-course-edit', component: () => import('../views/admin/content/CourseEdit.vue'), meta: { title: 'Edit course — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },
  { path: '/admin/content/modules', redirect: { name: 'admin-content' } },
  { path: '/admin/content/modules/:id', name: 'admin-content-module-edit', component: () => import('../views/admin/content/ModuleEdit.vue'), meta: { title: 'Edit module — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },
  { path: '/admin/content/lessons', redirect: { name: 'admin-content' } },
  { path: '/admin/content/lessons/:id', name: 'admin-content-lesson-edit', component: () => import('../views/admin/content/LessonEdit.vue'), meta: { title: 'Edit lesson — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },
  { path: '/admin/content/assignments', redirect: { name: 'admin-content' } },
  { path: '/admin/content/assignments/:id', name: 'admin-content-assignment-edit', component: () => import('../views/admin/content/AssignmentEdit.vue'), meta: { title: 'Edit assignment — STAIJA', requiresAuth: true, permissions: ['manage_cohorts'] } },

  // LMS routes — student-facing
  { path: '/learn', name: 'learn-home', component: () => import('../views/learn/CourseHome.vue'), meta: { title: 'My course — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/learn/course/:slug', name: 'learn-course', component: () => import('../views/learn/CourseHome.vue'), meta: { title: 'Course — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/learn/module/:slug', name: 'learn-module', component: () => import('../views/learn/ModuleView.vue'), meta: { title: 'Module — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/learn/lesson/:slug', name: 'learn-lesson', component: () => import('../views/learn/LessonView.vue'), meta: { title: 'Lesson — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/learn/assignment/:slug', name: 'learn-assignment', component: () => import('../views/learn/AssignmentView.vue'), meta: { title: 'Assignment — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/learn/submissions/:id', name: 'learn-submission', component: () => import('../views/learn/SubmissionDetail.vue'), meta: { title: 'Submission — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/learn/sessions', name: 'learn-sessions', component: () => import('../views/learn/SessionsList.vue'), meta: { title: 'Sessions — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },
  { path: '/learn/sessions/:id', name: 'learn-session', component: () => import('../views/learn/SessionDetail.vue'), meta: { title: 'Session — STAIJA', requiresAuth: true, permissions: ['participate_in_programs'] } },

  // LMS routes — mentor-facing
  { path: '/learn/mentor/students/:studentId', name: 'learn-mentor-student', component: () => import('../views/learn/mentor/StudentDetail.vue'), meta: { title: 'Student — STAIJA', requiresAuth: true, permissions: ['view_assigned_students'] } },
  { path: '/learn/mentor/submissions/:id', name: 'learn-mentor-submission', component: () => import('../views/learn/mentor/SubmissionReview.vue'), meta: { title: 'Review submission — STAIJA', requiresAuth: true, permissions: ['grade_submissions'] } },
  { path: '/learn/mentor/schedule', name: 'learn-mentor-schedule', component: () => import('../views/learn/mentor/ScheduleSession.vue'), meta: { title: 'Schedule session — STAIJA', requiresAuth: true, permissions: ['manage_sessions'] } },

  // /content/* in-app CMS was retired in favour of Contentful (see commit
  // history). Editorial workflows now live at app.contentful.com — admins
  // get a deep-link from /admin's Quick Actions panel.

  // Account settings (all authenticated users)
  { path: '/account/settings', name: 'account-settings', component: () => import('../views/account/Settings.vue'), meta: { title: 'Account Settings — STAIJA', requiresAuth: true } },

  // Email Link Authentication
  { path: '/auth/email-link-callback', name: 'email-link-callback', component: () => import('../views/auth/EmailLinkCallback.vue'), meta: { title: 'Sign In — STAIJA' } },

  // /dashboard was retired — auth flows now route directly to the
  // role-specific dashboard via postLoginRouteName(). The header link
  // (SiteHeader.vue:dashboardPath) does the same.

  // Mentor portal routes
  { path: '/mentor', name: 'mentor-dashboard', component: () => import('../views/mentor/MentorDashboard.vue'), meta: { title: 'Mentor portal — STAIJA', requiresAuth: true, permissions: ['view_assigned_students'] } },
  { path: '/mentor/feedback/:studentId', name: 'mentor-feedback', component: () => import('../views/mentor/MentorFeedback.vue'), meta: { title: 'Leave feedback — STAIJA', requiresAuth: true, permissions: ['submit_mentor_feedback'] } },

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
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

// Resolves once Firebase Auth emits its first event — created once at
// module load and reused across all navigations instead of recreating a
// listener on every beforeEach call.
const authReady = new Promise<void>(resolve => {
  const unsub = auth.onAuthStateChanged(() => { unsub(); resolve() })
})

// Per-UID profile cache: avoids a Firestore read on every protected navigation.
// Invalidated when the active UID changes (i.e. sign-out / account switch).
let _cachedUid: string | null = null
let _cachedRole: UserRole | null = null

function invalidateProfileCache() {
  _cachedUid = null
  _cachedRole = null
}

// Warm the cache from the outside (e.g. after sign-in, the role is
// already known — no reason to re-fetch it in the guard).
export function primeProfileCache(uid: string, role: UserRole | null) {
  _cachedUid = uid
  _cachedRole = role
}

router.afterEach((to) => {
  if (to.meta && typeof to.meta.title === 'string') {
    const g = globalThis as unknown as { document?: { title: string } }
    if (g.document) g.document.title = to.meta.title
  }
})

// Catch failed lazy-import chunks on stale-cache visits. When a new
// deploy ships, every route component's chunk hash changes. A user
// with a cached index.html from an earlier deploy holds references to
// old chunk filenames; the moment they navigate to a route Vue Router
// tries to lazy-load, the fetch 404s and the navigation silently
// fails — symptom is an empty page with no console error. Hard refresh
// "fixes" it because it drops the cached HTML. We do that hard refresh
// for the user instead of leaving them stranded. Uses location.assign
// (not just router.replace) so the browser re-fetches index.html with
// the current chunk hashes baked in.
router.onError((error, to) => {
  const msg = error instanceof Error ? error.message : String(error)
  // Per-browser error messages for failed dynamic imports vary widely.
  // Cover the major patterns we've seen in the wild:
  //   - "Failed to fetch dynamically imported module" (Chrome/Edge)
  //   - "Importing a module script failed"           (Safari)
  //   - "error loading dynamically imported module"  (Firefox)
  //   - "TypeError: Load failed"                     (Safari, generic
  //                                                   fetch-failure shape
  //                                                   that also covers
  //                                                   content-blocker
  //                                                   interference)
  //   - "ChunkLoadError"                             (legacy webpack-style
  //                                                   shape, occasionally
  //                                                   surfaced by Vite)
  const isChunkLoadFailure =
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /^TypeError:\s*Load failed/i.test(msg) ||
    /Load failed$/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    // HTML-parsed-as-JS shapes. The SPA fallback in vercel.json used to
    // rewrite missing /assets/*.js requests to index.html (200 OK with
    // HTML body), and the browser would surface the parse failure as
    // one of these. Excluded /assets/ from the rewrite, but keep the
    // patterns around for any edge / proxy that still does the rewrite.
    /Unexpected token\s*['"<]/i.test(msg) ||
    /strict MIME type/i.test(msg) ||
    /Failed to execute module/i.test(msg)
  if (isChunkLoadFailure && typeof window !== 'undefined') {
    // Tag the reload so a chunk that 404s on the *fresh* HTML too
    // (genuine 404 — route component was deleted) doesn't trap us in
    // an infinite reload loop.
    const reloaded = sessionStorage.getItem('staija.chunkReloaded')
    if (reloaded !== to.fullPath) {
      sessionStorage.setItem('staija.chunkReloaded', to.fullPath)
      window.location.assign(to.fullPath)
    } else {
      sessionStorage.removeItem('staija.chunkReloaded')
      console.error('[router] chunk load failed twice for', to.fullPath, '— surfacing error')
    }
  }
})

// Global auth and permission guard
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = Boolean(to.meta?.requiresAuth)
  const requiredPermissions = to.meta?.permissions || []

  await authReady

  if (!requiresAuth && requiredPermissions.length === 0) {
    return next()
  }

  const user = auth.currentUser
  if (!user) {
    invalidateProfileCache()
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (requiredPermissions.length === 0) return next()

  try {
    let userRole: UserRole | null
    if (user.uid === _cachedUid) {
      userRole = _cachedRole
    } else {
      const profile = await DatabaseService.getUserProfile(user.uid)
      userRole = profile?.role ?? null
      _cachedUid = user.uid
      _cachedRole = userRole
    }

    if (!userRole) return next({ name: 'login' })

    if (PermissionService.hasAnyPermission(userRole, requiredPermissions)) {
      return next()
    }

    // User lacks permission for this route — send to their own dashboard.
    return next({ name: postLoginRouteName(userRole) })
  } catch (error) {
    console.error('Auth guard error:', error)
    return next({ name: 'login' })
  }
})

export default router


