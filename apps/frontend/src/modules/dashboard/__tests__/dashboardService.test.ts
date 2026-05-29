import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()

vi.mock('@/shared/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}))

import { dashboardService } from '../services/dashboardService'
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

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDashboard', () => {
    it('calls GET /v1/dashboard endpoint', async () => {
      mockGet.mockResolvedValue(makeDashboardData())

      await dashboardService.getDashboard()

      expect(mockGet).toHaveBeenCalledWith('/v1/dashboard')
    })

    it('returns DashboardData on success', async () => {
      const mockData = makeDashboardData()
      mockGet.mockResolvedValue(mockData)

      const result = await dashboardService.getDashboard()

      expect(result).toEqual(mockData)
    })

    it('returns data with vehicles', async () => {
      const mockData = makeDashboardData({
        vehicles: [
          {
            id: 'v1',
            plateNo: '沪A12345',
            status: 'idle' as const,
            lat: 31.23,
            lng: 121.47,
            location: '上海港',
            driverName: '张三',
            driverPhone: '13800138000',
          },
        ],
      })
      mockGet.mockResolvedValue(mockData)

      const result = await dashboardService.getDashboard()

      expect(result.vehicles).toHaveLength(1)
      expect(result.vehicles[0].plateNo).toBe('沪A12345')
    })

    it('returns data with null avgTransportMinutes', async () => {
      const mockData = makeDashboardData({
        stats: {
          todayTaskCount: 0,
          completionRate: 0,
          overdueCount: 0,
          avgTransportMinutes: null,
        },
      })
      mockGet.mockResolvedValue(mockData)

      const result = await dashboardService.getDashboard()

      expect(result.stats.avgTransportMinutes).toBeNull()
    })

    it('propagates network error', async () => {
      mockGet.mockRejectedValue(new Error('网络错误'))

      await expect(dashboardService.getDashboard()).rejects.toThrow('网络错误')
    })

    it('propagates 401 error', async () => {
      mockGet.mockRejectedValue({ code: 401, message: '未授权' })

      await expect(dashboardService.getDashboard()).rejects.toEqual({
        code: 401,
        message: '未授权',
      })
    })
  })
})
