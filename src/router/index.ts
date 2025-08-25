import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue'), meta: { title: 'Home — STAIJA' } },
  { path: '/programs', name: 'programs', component: () => import('../views/Programs.vue'), meta: { title: 'Programs — STAIJA' } },
  { path: '/programs/stepup-scholars', name: 'stepup', component: () => import('../views/StepUp.vue'), meta: { title: 'StepUp Scholars — STAIJA' } },
  { path: '/programs/dynamerge', name: 'dynamerge', component: () => import('../views/Dynamerge.vue'), meta: { title: 'Dynamerge — STAIJA' } },
  { path: '/get-involved', name: 'get-involved', component: () => import('../views/GetInvolved.vue'), meta: { title: 'Get Involved — STAIJA' } },
  { path: '/donate', name: 'donate', component: () => import('../views/Donate.vue'), meta: { title: 'Donate — STAIJA' } },
  { path: '/about', name: 'about', component: () => import('../views/About.vue'), meta: { title: 'About — STAIJA' } },
  { path: '/blog', name: 'blog', component: () => import('../views/Blog.vue'), meta: { title: 'Stories — STAIJA' } },
  { path: '/contact', name: 'contact', component: () => import('../views/Contact.vue'), meta: { title: 'Contact — STAIJA' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFound.vue'), meta: { title: 'Page Not Found — STAIJA' } },
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
    document.title = to.meta.title
  }
})

export default router


