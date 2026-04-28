import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/HomeView.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { guestOnly: true } },
  { path: '/search', name: 'Search', component: () => import('../views/Search.vue') },
  { path: '/trending', name: 'Trending', component: () => import('../views/Trending.vue') },
  { path: '/media/:id', name: 'MediaDetail', component: () => import('../views/MediaDetail.vue') },
  { path: '/review/new/:mediaId', name: 'WriteReview', component: () => import('../views/WriteReview.vue'), meta: { requiresAuth: true } },
  { path: '/review/edit/:reviewId', name: 'EditReview', component: () => import('../views/WriteReview.vue'), meta: { requiresAuth: true } },
  { path: '/watchlist', name: 'Watchlist', component: () => import('../views/Watchlist.vue'), meta: { requiresAuth: true } },
  { path: '/profile/:username', name: 'Profile', component: () => import('../views/ProfileView.vue') },
  { path: '/profile/:username/connections', name: 'Connections', component: () => import('../views/ConnectionsView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'Login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'Home' }
})

export default router