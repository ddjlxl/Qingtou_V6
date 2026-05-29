import { describe, it, expect } from 'vitest'
import type { DashboardStats, VehicleLocation, StatusCounts, DashboardData, VehicleDashboardStatus } from '../types'

describe('Dashboard types', () => {
  describe('DashboardStats', () => {
    it('accepts valid stats with avgTransportMinutes as number', () => {
      const stats: DashboardStats = {
        todayTaskCount: 12,
        completionRate: 0.85,
        overdueCount: 2,
        avgTransportMinutes: 32.5,
      }
      expect(stats.todayTaskCount).toBe(12)
      expect(stats.completionRate).toBe(0.85)
      expect(stats.overdueCount).toBe(2)
      expect(stats.avgTransportMinutes).toBe(32.5)
    })

    it('accepts avgTransportMinutes as null', () => {
      const stats: DashboardStats = {
        todayTaskCount: 0,
        completionRate: 0,
        overdueCount: 0,
        avgTransportMinutes: null,
      }
      expect(stats.avgTransportMinutes).toBeNull()
    })
  })

  describe('VehicleLocation', () => {
    it('accepts vehicle with coordinates', () => {
      const vehicle: VehicleLocation = {
        id: 'v1',
        plateNo: '沪A12345',
        status: 'idle',
        lat: 31.23,
        lng: 121.47,
        location: '上海港',
        driverName: '张三',
        driverPhone: '13800138000',
      }
      expect(vehicle.id).toBe('v1')
      expect(vehicle.lat).toBe(31.23)
    })

    it('accepts vehicle without coordinates', () => {
      const vehicle: VehicleLocation = {
        id: 'v2',
        plateNo: '沪B67890',
        status: 'transiting',
        lat: null,
        lng: null,
        location: null,
        driverName: null,
        driverPhone: null,
      }
      expect(vehicle.lat).toBeNull()
      expect(vehicle.lng).toBeNull()
    })
  })

  describe('VehicleDashboardStatus', () => {
    it('accepts valid status values', () => {
      const statuses: VehicleDashboardStatus[] = ['idle', 'transiting', 'overdue']
      expect(statuses).toHaveLength(3)
      expect(statuses).toContain('idle')
      expect(statuses).toContain('transiting')
      expect(statuses).toContain('overdue')
    })
  })

  describe('StatusCounts', () => {
    it('accepts valid status counts', () => {
      const counts: StatusCounts = {
        pending: 5,
        assigned: 3,
        transiting: 8,
        completed: 123,
        overdue: 1,
      }
      expect(counts.pending).toBe(5)
      expect(counts.completed).toBe(123)
    })

    it('accepts zero counts', () => {
      const counts: StatusCounts = {
        pending: 0,
        assigned: 0,
        transiting: 0,
        completed: 0,
        overdue: 0,
      }
      expect(counts.pending).toBe(0)
    })
  })

  describe('DashboardData', () => {
    it('combines stats, statusCounts, and vehicles', () => {
      const data: DashboardData = {
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
        vehicles: [
          {
            id: 'v1',
            plateNo: '沪A12345',
            status: 'idle',
            lat: 31.23,
            lng: 121.47,
            location: '上海港',
            driverName: '张三',
            driverPhone: '13800138000',
          },
        ],
      }
      expect(data.stats.todayTaskCount).toBe(12)
      expect(data.statusCounts.overdue).toBe(1)
      expect(data.vehicles).toHaveLength(1)
    })

    it('accepts empty vehicles array', () => {
      const data: DashboardData = {
        stats: {
          todayTaskCount: 0,
          completionRate: 0,
          overdueCount: 0,
          avgTransportMinutes: null,
        },
        statusCounts: {
          pending: 0,
          assigned: 0,
          transiting: 0,
          completed: 0,
          overdue: 0,
        },
        vehicles: [],
      }
      expect(data.vehicles).toEqual([])
    })
  })
})
