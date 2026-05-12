import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()

vi.mock('@/shared/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}))

import { fleetService } from '../services/fleetService'

describe('fleetService - statistics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatistics', () => {
    it('calls GET statistics endpoint', async () => {
      mockGet.mockResolvedValue({ certificateWarningCount: 3, monthTaskCount: 42 })

      await fleetService.getStatistics()

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/statistics')
    })

    it('returns FleetStatistics data', async () => {
      const mockData = { certificateWarningCount: 5, monthTaskCount: 100 }
      mockGet.mockResolvedValue(mockData)

      const result = await fleetService.getStatistics()

      expect(result).toEqual(mockData)
    })
  })
})