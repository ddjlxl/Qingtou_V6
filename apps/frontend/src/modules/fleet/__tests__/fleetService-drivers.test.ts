import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/shared/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

import { fleetService } from '../services/fleetService'

describe('fleetService - drivers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDrivers', () => {
    it('calls GET /v1/fleet/drivers', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })

      await fleetService.getDrivers()

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/drivers', { params: undefined })
    })

    it('passes params to GET /v1/fleet/drivers', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })

      await fleetService.getDrivers({ page: 2, pageSize: 10 })

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/drivers', { params: { page: 2, pageSize: 10 } })
    })
  })

  describe('getDriver', () => {
    it('calls GET /v1/fleet/drivers/:id', async () => {
      const driver = { id: 'd1', name: '张三', phone: '13800138000' }
      mockGet.mockResolvedValue(driver)

      const result = await fleetService.getDriver('d1')

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/drivers/d1')
      expect(result).toEqual(driver)
    })
  })

  describe('createDriver', () => {
    it('calls POST /v1/fleet/drivers', async () => {
      const driver = { id: 'd1', name: '张三', phone: '13800138000' }
      mockPost.mockResolvedValue(driver)

      const result = await fleetService.createDriver({ name: '张三', phone: '13800138000' })

      expect(mockPost).toHaveBeenCalledWith('/v1/fleet/drivers', { name: '张三', phone: '13800138000' })
      expect(result).toEqual(driver)
    })
  })

  describe('updateDriver', () => {
    it('calls PUT /v1/fleet/drivers/:id', async () => {
      const driver = { id: 'd1', name: '李四', phone: '13800138000' }
      mockPut.mockResolvedValue(driver)

      const result = await fleetService.updateDriver('d1', { name: '李四' })

      expect(mockPut).toHaveBeenCalledWith('/v1/fleet/drivers/d1', { name: '李四' })
      expect(result).toEqual(driver)
    })
  })

  describe('deleteDriver', () => {
    it('calls DELETE /v1/fleet/drivers/:id', async () => {
      mockDelete.mockResolvedValue(undefined)

      await fleetService.deleteDriver('d1')

      expect(mockDelete).toHaveBeenCalledWith('/v1/fleet/drivers/d1')
    })
  })

  describe('disableDriver', () => {
    it('calls PUT /v1/fleet/drivers/:id/disable', async () => {
      mockPut.mockResolvedValue(undefined)

      await fleetService.disableDriver('d1')

      expect(mockPut).toHaveBeenCalledWith('/v1/fleet/drivers/d1/disable')
    })
  })
})