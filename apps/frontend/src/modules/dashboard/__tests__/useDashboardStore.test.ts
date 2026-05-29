import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockGetDashboard = vi.fn()

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  },
}))

import { useDashboardStore } from '../stores/useDashboardStore'
import type { DashboardData } from '../types'

function makeDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    stats: {
      todayTaskCount: 12,
      completionRate: 0.85,
      overdueCount: 2,
      avgTransportMinutes: 32,
    },
    statusCounts: {
      pending: 5,
      assigned: 3,
      transiting: 8,
      completed: 123,
      overdue: 1,
    },
    vehicles: [],
    ...overrides,
  }
}

describe('useDashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has data as null', () => {
      const store = useDashboardStore()
      expect(store.data).toBeNull()
    })

    it('has loading as false', () => {
      const store = useDashboardStore()
      expect(store.loading).toBe(false)
    })

    it('has error as null', () => {
      const store = useDashboardStore()
      expect(store.error).toBeNull()
    })
  })

  describe('fetchDashboard', () => {
    it('loads data into state on success', async () => {
      const store = useDashboardStore()
      const mockData = makeDashboardData()
      mockGetDashboard.mockResolvedValue(mockData)

      await store.fetchDashboard()

      expect(store.data).toEqual(mockData)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets loading to true during fetch', async () => {
      const store = useDashboardStore()
      let loadingDuringFetch = false
      mockGetDashboard.mockImplementation(async () => {
        loadingDuringFetch = store.loading
        return makeDashboardData()
      })

      await store.fetchDashboard()

      expect(loadingDuringFetch).toBe(true)
    })

    it('resets loading to false after success', async () => {
      const store = useDashboardStore()
      mockGetDashboard.mockResolvedValue(makeDashboardData())

      await store.fetchDashboard()

      expect(store.loading).toBe(false)
    })

    it('sets error on failure', async () => {
      const store = useDashboardStore()
      mockGetDashboard.mockRejectedValue(new Error('网络错误'))

      await store.fetchDashboard()

      expect(store.error).toBe('获取看板数据失败')
      expect(store.loading).toBe(false)
    })

    it('resets loading to false after failure', async () => {
      const store = useDashboardStore()
      mockGetDashboard.mockRejectedValue(new Error('网络错误'))

      await store.fetchDashboard()

      expect(store.loading).toBe(false)
    })

    it('clears previous error on new fetch', async () => {
      const store = useDashboardStore()
      mockGetDashboard.mockRejectedValueOnce(new Error('网络错误'))
      await store.fetchDashboard()
      expect(store.error).toBe('获取看板数据失败')

      mockGetDashboard.mockResolvedValue(makeDashboardData())
      await store.fetchDashboard()
      expect(store.error).toBeNull()
    })

    it('preserves previous data on fetch failure', async () => {
      const store = useDashboardStore()
      const firstData = makeDashboardData()
      mockGetDashboard.mockResolvedValue(firstData)
      await store.fetchDashboard()
      expect(store.data).toEqual(firstData)

      mockGetDashboard.mockRejectedValue(new Error('网络错误'))
      await store.fetchDashboard()
      expect(store.data).toEqual(firstData)
    })

    it('calls dashboardService.getDashboard', async () => {
      const store = useDashboardStore()
      mockGetDashboard.mockResolvedValue(makeDashboardData())

      await store.fetchDashboard()

      expect(mockGetDashboard).toHaveBeenCalledOnce()
    })
  })

  describe('resetState', () => {
    it('resets all state to initial values', async () => {
      const store = useDashboardStore()
      mockGetDashboard.mockResolvedValue(makeDashboardData())
      await store.fetchDashboard()

      store.resetState()

      expect(store.data).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
