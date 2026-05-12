import { createRouter, createWebHistory } from 'vue-router'
import { LoginForm, useAuthStore } from '@/modules/auth'
import { AppLayout } from '@/shared/components'
import { FleetPage } from '@/modules/fleet'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/fleet',
        },
        {
          path: 'fleet',
          name: 'Fleet',
          component: FleetPage,
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginForm,
      meta: { requiresAuth: false },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn

  if (isLoggedIn && to.path === '/login') {
    next('/')
    return
  }

  if (to.meta.requiresAuth !== false && !isLoggedIn) {
    next('/login')
    return
  }

  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(authStore.userRole)) {
    next('/')
    return
  }

  next()
})

export default router
