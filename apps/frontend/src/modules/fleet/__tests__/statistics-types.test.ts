import { describe, it, expect } from 'vitest'
import type { FleetStatistics } from '../types/statistics'

describe('Statistics types', () => {
  describe('FleetStatistics interface', () => {
    it('has certificateWarningCount as number', () => {
      const stats: FleetStatistics = {
        certificateWarningCount: 5,
        monthTaskCount: 42,
      }
      expect(typeof stats.certificateWarningCount).toBe('number')
    })

    it('has monthTaskCount as number', () => {
      const stats: FleetStatistics = {
        certificateWarningCount: 0,
        monthTaskCount: 100,
      }
      expect(typeof stats.monthTaskCount).toBe('number')
    })

    it('accepts zero values', () => {
      const stats: FleetStatistics = {
        certificateWarningCount: 0,
        monthTaskCount: 0,
      }
      expect(stats.certificateWarningCount).toBe(0)
      expect(stats.monthTaskCount).toBe(0)
    })
  })
})