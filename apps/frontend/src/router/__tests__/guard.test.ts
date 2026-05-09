import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockToken = vi.fn(() => '')
const mockUserRole = vi.fn(() => '')

vi.mock('@/modules/auth/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    token: mockToken(),
    userRole: mockUserRole(),
    isLoggedIn: !!mockToken(),
  }),
}))

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

function createTestRouter(routes: RouteRecordRaw[]) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach((to, _from, next) => {
    const isLoggedIn = !!mockToken()
    const userRole = mockUserRole()

    if (isLoggedIn && to.path === '/login') {
      next('/')
      return
    }

    if (to.meta.requiresAuth !== false && !isLoggedIn) {
      next('/login')
      return
    }

    const allowedRoles = to.meta.roles as string[] | undefined
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      next('/')
      return
    }

    next()
  })

  return router
}

describe('Route Guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockToken.mockReturnValue('')
    mockUserRole.mockReturnValue('')
  })

  describe('unauthenticated user', () => {
    it('redirects to /login when accessing protected route', async () => {
      const router = createTestRouter([
        { path: '/', component: { template: '<div>Home</div>' }, meta: { requiresAuth: true } },
        { path: '/login', component: { template: '<div>Login</div>' }, meta: { requiresAuth: false } },
      ])

      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('allows access to /login without authentication', async () => {
      const router = createTestRouter([
        { path: '/', component: { template: '<div>Home</div>' }, meta: { requiresAuth: true } },
        { path: '/login', component: { template: '<div>Login</div>' }, meta: { requiresAuth: false } },
      ])

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('authenticated user', () => {
    beforeEach(() => {
      mockToken.mockReturnValue('valid-token')
    })

    it('allows access to protected route when authenticated', async () => {
      const router = createTestRouter([
        { path: '/', component: { template: '<div>Home</div>' }, meta: { requiresAuth: true } },
        { path: '/login', component: { template: '<div>Login</div>' }, meta: { requiresAuth: false } },
      ])

      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('redirects authenticated user from /login to /', async () => {
      const router = createTestRouter([
        { path: '/', component: { template: '<div>Home</div>' }, meta: { requiresAuth: true } },
        { path: '/login', component: { template: '<div>Login</div>' }, meta: { requiresAuth: false } },
      ])

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('role-based access', () => {
    beforeEach(() => {
      mockToken.mockReturnValue('valid-token')
    })

    it('allows access when user has required role', async () => {
      mockUserRole.mockReturnValue('admin')

      const router = createTestRouter([
        { path: '/admin', component: { template: '<div>Admin</div>' }, meta: { requiresAuth: true, roles: ['admin'] } },
        { path: '/', component: { template: '<div>Home</div>' }, meta: { requiresAuth: true } },
        { path: '/login', component: { template: '<div>Login</div>' }, meta: { requiresAuth: false } },
      ])

      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/admin')
    })

    it('redirects to / when user lacks required role', async () => {
      mockUserRole.mockReturnValue('driver')

      const router = createTestRouter([
        { path: '/admin', component: { template: '<div>Admin</div>' }, meta: { requiresAuth: true, roles: ['admin'] } },
        { path: '/', component: { template: '<div>Home</div>' }, meta: { requiresAuth: true } },
        { path: '/login', component: { template: '<div>Login</div>' }, meta: { requiresAuth: false } },
      ])

      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })
})
