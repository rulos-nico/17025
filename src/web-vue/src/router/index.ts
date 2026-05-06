import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/equipos' },
    { path: '/login', component: () => import('@/pages/Login.vue'), meta: { public: true } },
    { path: '/equipos', component: () => import('@/pages/Equipos.vue') },
    { path: '/dashboard', component: () => import('@/pages/Dashboard.vue') },
  ],
});

router.beforeEach(to => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) return '/login';
  if (to.path === '/login' && auth.isAuthenticated) return '/equipos';
});

export default router;
