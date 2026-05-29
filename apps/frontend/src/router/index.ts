import { createRouter, createWebHistory } from 'vue-router'
import { LoginForm, useAuthStore } from '@/modules/auth'
import { AppLayout } from '@/shared/components'
import { DashboardPage } from '@/modules/dashboard'
import { FleetPage } from '@/modules/fleet'
import { DispatchPage } from '@/modules/dispatch'
import { DriverWorkbench, DriverHistory, DriverProfile } from '@/modules/driver'
import { WarehousePage } from '@/modules/warehouse'

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
          redirect: () => {
            const authStore = useAuthStore()
            return authStore.userRole === 'driver' ? '/driver' : '/dashboard'
          },
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: DashboardPage,
          meta: { requiresAuth: true, roles: ['admin', 'dispatcher'] },
        },
        {
          path: 'fleet',
          name: 'Fleet',
          component: FleetPage,
          meta: { requiresAuth: true, roles: ['admin', 'dispatcher'] },
        },
        {
          path: 'dispatch',
          name: 'Dispatch',
          component: DispatchPage,
          meta: { requiresAuth: true, roles: ['admin', 'dispatcher'] },
        },
        {
          path: 'warehouse',
          name: 'Warehouse',
          component: WarehousePage,
          meta: { requiresAuth: true, roles: ['admin', 'warehouse_keeper'] },
        },
        {
          path: 'driver',
          name: 'Driver',
          component: DriverWorkbench,
          meta: { requiresAuth: true, roles: ['driver'] },
        },
        {
          path: 'driver/history',
          name: 'DriverHistory',
          component: DriverHistory,
          meta: { requiresAuth: true, roles: ['driver'] },
        },
        {
          path: 'driver/profile',
          name: 'DriverProfile',
          component: DriverProfile,
          meta: { requiresAuth: true, roles: ['driver'] },
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
