import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockGetVehicles = vi.fn()
const mockCreateVehicle = vi.fn()
const mockUpdateVehicle = vi.fn()
const mockDisableVehicle = vi.fn()
const mockBindDriverToVehicle = vi.fn()

vi.mock('../services/fleetService', () => ({
  fleetService: {
    getVehicles: (...args: unknown[]) => mockGetVehicles(...args),
    createVehicle: (...args: unknown[]) => mockCreateVehicle(...args),
    updateVehicle: (...args: unknown[]) => mockUpdateVehicle(...args),
    disableVehicle: (...args: unknown[]) => mockDisableVehicle(...args),
    bindDriverToVehicle: (...args: unknown[]) => mockBindDriverToVehicle(...args),
  },
}))

import { useFleetStore } from '../stores/useFleetStore'
import { VehicleStatus, Ownership } from '../types/vehicle'

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    plateNo: '粤A12345',
    ownership: Ownership.OWN,
    boundDriverId: null,
    boundDriverName: undefined,
    status: VehicleStatus.IDLE,
    isDisabled: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('useFleetStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty vehicles array', () => {
      const store = useFleetStore()
      expect(store.vehicles).toEqual([])
    })

    it('has vehicleLoading as false', () => {
      const store = useFleetStore()
      expect(store.vehicleLoading).toBe(false)
    })

    it('has vehicleError as null', () => {
      const store = useFleetStore()
      expect(store.vehicleError).toBeNull()
    })
  })

  describe('fetchVehicles', () => {
    it('loads vehicles into state', async () => {
      const store = useFleetStore()
      const vehicles = [makeVehicle(), makeVehicle({ id: 'v2', plateNo: '粤B67890' })]
      mockGetVehicles.mockResolvedValue({ items: vehicles, total: 2, page: 1, pageSize: 20 })

      await store.fetchVehicles()

      expect(store.vehicles).toEqual(vehicles)
      expect(store.vehicleLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockGetVehicles.mockRejectedValue(new Error('网络错误'))

      await store.fetchVehicles()

      expect(store.vehicleError).toBe('网络错误')
      expect(store.vehicleLoading).toBe(false)
    })
  })

  describe('createVehicle', () => {
    it('adds new vehicle to beginning of list', async () => {
      const store = useFleetStore()
      store.vehicles = [makeVehicle({ id: 'v2', plateNo: '粤B67890' })]
      const newVehicle = makeVehicle({ id: 'v1', plateNo: '粤A12345' })
      mockCreateVehicle.mockResolvedValue(newVehicle)

      await store.createVehicle({ plateNo: '粤A12345', ownership: Ownership.OWN })

      expect(store.vehicles).toHaveLength(2)
      expect(store.vehicles[0].id).toBe('v1')
    })

    it('throws error on failure', async () => {
      const store = useFleetStore()
      mockCreateVehicle.mockRejectedValue(new Error('车牌号已存在'))

      await expect(
        store.createVehicle({ plateNo: '粤A12345', ownership: Ownership.OWN })
      ).rejects.toThrow('车牌号已存在')
    })
  })

  describe('updateVehicle', () => {
    it('updates vehicle in list', async () => {
      const store = useFleetStore()
      store.vehicles = [makeVehicle()]
      const updated = makeVehicle({ ownership: Ownership.EXTERNAL })
      mockUpdateVehicle.mockResolvedValue(updated)

      await store.updateVehicle('v1', { ownership: Ownership.EXTERNAL })

      expect(store.vehicles[0].ownership).toBe(Ownership.EXTERNAL)
    })
  })

  describe('disableVehicle', () => {
    it('marks vehicle as disabled', async () => {
      const store = useFleetStore()
      store.vehicles = [makeVehicle()]
      mockDisableVehicle.mockResolvedValue(undefined)

      await store.disableVehicle('v1')

      expect(store.vehicles[0].isDisabled).toBe(true)
    })
  })

  describe('bindDriverToVehicle', () => {
    it('calls fleetService.bindDriverToVehicle with correct params', async () => {
      const store = useFleetStore()
      mockBindDriverToVehicle.mockResolvedValue({
        needConfirm: false,
        message: '司机绑定成功',
      })

      const result = await store.bindDriverToVehicle('v1', 'd1', false)

      expect(mockBindDriverToVehicle).toHaveBeenCalledWith('v1', {
        driverId: 'd1',
        confirmed: false,
      })
      expect(result.needConfirm).toBe(false)
    })

    it('calls with confirmed=true', async () => {
      const store = useFleetStore()
      mockBindDriverToVehicle.mockResolvedValue({
        needConfirm: false,
        message: '司机绑定成功',
      })

      await store.bindDriverToVehicle('v1', 'd1', true)

      expect(mockBindDriverToVehicle).toHaveBeenCalledWith('v1', {
        driverId: 'd1',
        confirmed: true,
      })
    })

    it('returns needConfirm=true when driver already bound', async () => {
      const store = useFleetStore()
      mockBindDriverToVehicle.mockResolvedValue({
        needConfirm: true,
        message: '该司机已关联车辆 粤B67890，是否更换关联？',
        oldVehicleId: 'v2',
        oldVehiclePlateNo: '粤B67890',
      })

      const result = await store.bindDriverToVehicle('v1', 'd2', false)

      expect(result.needConfirm).toBe(true)
      expect(result.oldVehicleId).toBe('v2')
      expect(result.oldVehiclePlateNo).toBe('粤B67890')
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockBindDriverToVehicle.mockRejectedValue(new Error('车辆不存在'))

      await expect(
        store.bindDriverToVehicle('v1', 'd1', false)
      ).rejects.toThrow('车辆不存在')
      expect(store.vehicleError).toBe('车辆不存在')
    })
  })
  describe('computed properties', () => {
    it('idleVehicles filters correctly', () => {
      const store = useFleetStore()
      store.vehicles = [
        makeVehicle({ id: 'v1', status: VehicleStatus.IDLE }),
        makeVehicle({ id: 'v2', status: VehicleStatus.TRANSITING }),
        makeVehicle({ id: 'v3', status: VehicleStatus.OVERDUE }),
      ]

      expect(store.idleVehicles).toHaveLength(1)
      expect(store.idleVehicles[0].id).toBe('v1')
    })

    it('transitingVehicles filters correctly', () => {
      const store = useFleetStore()
      store.vehicles = [
        makeVehicle({ id: 'v1', status: VehicleStatus.IDLE }),
        makeVehicle({ id: 'v2', status: VehicleStatus.TRANSITING }),
      ]

      expect(store.transitingVehicles).toHaveLength(1)
      expect(store.transitingVehicles[0].id).toBe('v2')
    })

    it('overdueVehicles filters correctly', () => {
      const store = useFleetStore()
      store.vehicles = [
        makeVehicle({ id: 'v1', status: VehicleStatus.IDLE }),
        makeVehicle({ id: 'v3', status: VehicleStatus.OVERDUE }),
      ]

      expect(store.overdueVehicles).toHaveLength(1)
      expect(store.overdueVehicles[0].id).toBe('v3')
    })
  })
})