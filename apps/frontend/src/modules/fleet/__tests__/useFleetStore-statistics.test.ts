import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockGetStatistics = vi.fn()

vi.mock('../services/fleetService', () => ({
  fleetService: {
    getStatistics: (...args: unknown[]) => mockGetStatistics(...args),
  },
}))

import { useFleetStore } from '../stores/useFleetStore'

describe('useFleetStore - statistics', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has statistics as null', () => {
      const store = useFleetStore()
      expect(store.statistics).toBeNull()
    })

    it('has statisticsLoading as false', () => {
      const store = useFleetStore()
      expect(store.statisticsLoading).toBe(false)
    })

    it('has statisticsError as null', () => {
      const store = useFleetStore()
      expect(store.statisticsError).toBeNull()
    })
  })

  describe('fetchStatistics', () => {
    it('loads statistics into state', async () => {
      const store = useFleetStore()
      const stats = { certificateWarningCount: 3, monthTaskCount: 42 }
      mockGetStatistics.mockResolvedValue(stats)

      await store.fetchStatistics()

      expect(store.statistics).toEqual(stats)
      expect(store.statisticsLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockGetStatistics.mockRejectedValue(new Error('网络错误'))

      await store.fetchStatistics()

      expect(store.statisticsError).toBe('网络错误')
      expect(store.statisticsLoading).toBe(false)
    })
  })
})