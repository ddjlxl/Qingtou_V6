import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockGetDrivers = vi.fn()
const mockCreateDriver = vi.fn()
const mockUpdateDriver = vi.fn()
const mockDisableDriver = vi.fn()
const mockDeleteDriver = vi.fn()

vi.mock('../services/fleetService', () => ({
  fleetService: {
    getVehicles: vi.fn(),
    createVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    disableVehicle: vi.fn(),
    getDrivers: (...args: unknown[]) => mockGetDrivers(...args),
    createDriver: (...args: unknown[]) => mockCreateDriver(...args),
    updateDriver: (...args: unknown[]) => mockUpdateDriver(...args),
    disableDriver: (...args: unknown[]) => mockDisableDriver(...args),
    deleteDriver: (...args: unknown[]) => mockDeleteDriver(...args),
  },
}))

import { useFleetStore } from '../stores/useFleetStore'

function makeDriver(overrides: Record<string, unknown> = {}) {
  return {
    id: 'd1',
    name: '张三',
    phone: '13800138000',
    boundVehicleId: null,
    boundVehiclePlateNo: undefined,
    isDisabled: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('useFleetStore - drivers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty drivers array', () => {
      const store = useFleetStore()
      expect(store.drivers).toEqual([])
    })

    it('has driverLoading as false', () => {
      const store = useFleetStore()
      expect(store.driverLoading).toBe(false)
    })

    it('has driverError as null', () => {
      const store = useFleetStore()
      expect(store.driverError).toBeNull()
    })
  })

  describe('fetchDrivers', () => {
    it('loads drivers into state', async () => {
      const store = useFleetStore()
      const drivers = [makeDriver(), makeDriver({ id: 'd2', name: '李四', phone: '13900139000' })]
      mockGetDrivers.mockResolvedValue({ items: drivers, total: 2, page: 1, pageSize: 20 })

      await store.fetchDrivers()

      expect(store.drivers).toEqual(drivers)
      expect(store.driverLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockGetDrivers.mockRejectedValue(new Error('网络错误'))

      await store.fetchDrivers()

      expect(store.driverError).toBe('网络错误')
      expect(store.driverLoading).toBe(false)
    })
  })

  describe('createDriver', () => {
    it('adds new driver to beginning of list', async () => {
      const store = useFleetStore()
      store.drivers = [makeDriver({ id: 'd2', name: '李四' })]
      const newDriver = makeDriver({ id: 'd1', name: '张三' })
      mockCreateDriver.mockResolvedValue(newDriver)

      await store.createDriver({ name: '张三', phone: '13800138000' })

      expect(store.drivers).toHaveLength(2)
      expect(store.drivers[0].id).toBe('d1')
    })

    it('throws error on failure', async () => {
      const store = useFleetStore()
      mockCreateDriver.mockRejectedValue(new Error('手机号已存在'))

      await expect(
        store.createDriver({ name: '张三', phone: '13800138000' })
      ).rejects.toThrow('手机号已存在')
    })
  })

  describe('updateDriver', () => {
    it('updates driver in list', async () => {
      const store = useFleetStore()
      store.drivers = [makeDriver()]
      const updated = makeDriver({ name: '张三三' })
      mockUpdateDriver.mockResolvedValue(updated)

      await store.updateDriver('d1', { name: '张三三' })

      expect(store.drivers[0].name).toBe('张三三')
    })
  })

  describe('disableDriver', () => {
    it('marks driver as disabled', async () => {
      const store = useFleetStore()
      store.drivers = [makeDriver()]
      mockDisableDriver.mockResolvedValue(undefined)

      await store.disableDriver('d1')

      expect(store.drivers[0].isDisabled).toBe(true)
    })
  })

  describe('deleteDriver', () => {
    it('removes driver from list', async () => {
      const store = useFleetStore()
      store.drivers = [makeDriver(), makeDriver({ id: 'd2', name: '李四', phone: '13900139000' })]
      mockDeleteDriver.mockResolvedValue(undefined)

      await store.deleteDriver('d1')

      expect(store.drivers).toHaveLength(1)
      expect(store.drivers[0].id).toBe('d2')
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      store.drivers = [makeDriver()]
      mockDeleteDriver.mockRejectedValue(new Error('该司机有历史记录，无法删除'))

      await expect(store.deleteDriver('d1')).rejects.toThrow('该司机有历史记录，无法删除')
      expect(store.driverError).toBe('该司机有历史记录，无法删除')
    })
  })
})