import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Zone, Slot } from '../types'

const mockFetchZones = vi.fn()
const mockFetchStatistics = vi.fn()
const mockMove = vi.fn()

vi.mock('../services/warehouseService', () => ({
  warehouseService: {
    fetchZones: (...args: unknown[]) => mockFetchZones(...args),
    fetchStatistics: (...args: unknown[]) => mockFetchStatistics(...args),
    move: (...args: unknown[]) => mockMove(...args),
  },
}))

import { useWarehouseStore } from '../stores/useWarehouseStore'

function makeSlot(overrides: Record<string, unknown> = {}): Slot {
  return {
    id: 'slot-1',
    zoneCode: 'A',
    slotNo: 'A-01-01',
    row: 1,
    col: 1,
    status: 'empty',
    containerNo: null,
    containerStatus: null,
    customerName: null,
    containerType: null,
    sealNo: null,
    storedAt: null,
    remark: null,
    ...overrides,
  }
}

function makeZone(overrides: Record<string, unknown> = {}): Zone {
  return {
    id: 'zone-1',
    name: 'A区',
    zoneCode: 'A',
    sortOrder: 1,
    usedCount: 0,
    totalCount: 12,
    slots: [],
    ...overrides,
  }
}

describe('集装箱移动完整流程测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('场景1：正常移动流程（用户先选中库位，再进入移动模式）', () => {
    it('完整模拟用户操作：选中库位 → 进入移动模式 → 选择源 → 点击目标 → 验证状态清空', async () => {
      const sourceSlot = makeSlot({
        id: 'slot-1',
        slotNo: 'A-01-01',
        status: 'loaded',
        containerNo: 'CONT001',
        containerStatus: 'heavy',
      })
      const targetSlot = makeSlot({
        id: 'slot-2',
        slotNo: 'A-01-02',
        status: 'empty',
      })
      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [sourceSlot, targetSlot],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 1,
        availableSlots: 11,
        heavyCount: 1,
        emptyContainerCount: 0,
        utilizationRate: 0.08,
      })
      mockMove.mockResolvedValue(undefined)

      const store = useWarehouseStore()
      await store.init()

      expect(store.zones).toHaveLength(1)
      expect(store.selectedSlotIds.size).toBe(0)
      expect(store.isMoveMode).toBe(false)
      expect(store.moveSourceSlot).toBeNull()

      store.toggleSlotSelection('slot-1')
      expect(store.selectedSlotIds.has('slot-1')).toBe(true)
      expect(store.selectedSlots).toHaveLength(1)
      expect(store.selectedSlots[0].containerNo).toBe('CONT001')

      store.toggleMoveMode()
      expect(store.isMoveMode).toBe(true)

      store.setMoveSource(sourceSlot)
      expect(store.moveSourceSlot).toEqual(sourceSlot)
      expect(store.moveSourceSlot?.id).toBe('slot-1')

      await store.move('slot-1', 'slot-2')

      expect(mockMove).toHaveBeenCalledWith('slot-1', 'slot-2')
      expect(store.moveSourceSlot).toBeNull()
      expect(store.isMoveMode).toBe(true)

      expect(store.selectedSlotIds.has('slot-1')).toBe(false)
      expect(store.selectedSlotIds.size).toBe(0)
    })

    it('移动失败时，选中状态应该保留', async () => {
      const sourceSlot = makeSlot({
        id: 'slot-1',
        status: 'loaded',
        containerNo: 'CONT001',
      })
      const targetSlot = makeSlot({
        id: 'slot-2',
        status: 'empty',
      })
      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [sourceSlot, targetSlot],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 1,
        availableSlots: 11,
        heavyCount: 1,
        emptyContainerCount: 0,
        utilizationRate: 0.08,
      })
      mockMove.mockRejectedValue(new Error('目标库位已被占用'))

      const store = useWarehouseStore()
      await store.init()

      store.toggleSlotSelection('slot-1')
      expect(store.selectedSlotIds.has('slot-1')).toBe(true)

      store.toggleMoveMode()
      store.setMoveSource(sourceSlot)

      await expect(store.move('slot-1', 'slot-2')).rejects.toThrow('目标库位已被占用')

      expect(store.selectedSlotIds.has('slot-1')).toBe(true)
      expect(store.selectedSlotIds.size).toBe(1)
    })
  })

  describe('场景2：直接进入移动模式（未预先选中库位）', () => {
    it('用户直接点击移动按钮 → 选择源 → 点击目标 → 验证无选中状态残留', async () => {
      const sourceSlot = makeSlot({
        id: 'slot-1',
        status: 'loaded',
        containerNo: 'CONT001',
      })
      const targetSlot = makeSlot({
        id: 'slot-2',
        status: 'empty',
      })
      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [sourceSlot, targetSlot],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 1,
        availableSlots: 11,
        heavyCount: 1,
        emptyContainerCount: 0,
        utilizationRate: 0.08,
      })
      mockMove.mockResolvedValue(undefined)

      const store = useWarehouseStore()
      await store.init()

      expect(store.selectedSlotIds.size).toBe(0)

      store.toggleMoveMode()
      expect(store.isMoveMode).toBe(true)

      store.setMoveSource(sourceSlot)
      expect(store.moveSourceSlot).toEqual(sourceSlot)

      await store.move('slot-1', 'slot-2')

      expect(store.moveSourceSlot).toBeNull()
      expect(store.isMoveMode).toBe(true)
      expect(store.selectedSlotIds.size).toBe(0)
    })
  })

  describe('场景3：取消移动操作', () => {
    it('用户进入移动模式 → 选择源 → 取消移动 → 验证状态清空', async () => {
      const sourceSlot = makeSlot({
        id: 'slot-1',
        status: 'loaded',
        containerNo: 'CONT001',
      })
      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [sourceSlot],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 1,
        availableSlots: 11,
        heavyCount: 1,
        emptyContainerCount: 0,
        utilizationRate: 0.08,
      })

      const store = useWarehouseStore()
      await store.init()

      store.toggleSlotSelection('slot-1')
      expect(store.selectedSlotIds.has('slot-1')).toBe(true)

      store.toggleMoveMode()
      store.setMoveSource(sourceSlot)

      store.toggleMoveMode()

      expect(store.isMoveMode).toBe(false)
      expect(store.moveSourceSlot).toBeNull()
      expect(store.selectedSlotIds.has('slot-1')).toBe(true)
    })
  })

  describe('场景4：多次移动操作', () => {
    it('用户连续移动多个集装箱，验证每次移动后状态都正确清空', async () => {
      const slot1 = makeSlot({
        id: 'slot-1',
        slotNo: 'A-01-01',
        status: 'loaded',
        containerNo: 'CONT001',
      })
      const slot2 = makeSlot({
        id: 'slot-2',
        slotNo: 'A-01-02',
        status: 'empty',
      })
      const slot3 = makeSlot({
        id: 'slot-3',
        slotNo: 'A-01-03',
        status: 'loaded',
        containerNo: 'CONT002',
      })
      const slot4 = makeSlot({
        id: 'slot-4',
        slotNo: 'A-01-04',
        status: 'empty',
      })

      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [slot1, slot2, slot3, slot4],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 2,
        availableSlots: 10,
        heavyCount: 2,
        emptyContainerCount: 0,
        utilizationRate: 0.17,
      })
      mockMove.mockResolvedValue(undefined)

      const store = useWarehouseStore()
      await store.init()

      store.toggleMoveMode()
      store.setMoveSource(slot1)
      await store.move('slot-1', 'slot-2')

      expect(store.selectedSlotIds.size).toBe(0)
      expect(store.moveSourceSlot).toBeNull()
      expect(store.isMoveMode).toBe(true)

      store.setMoveSource(slot3)
      await store.move('slot-3', 'slot-4')

      expect(store.selectedSlotIds.size).toBe(0)
      expect(store.moveSourceSlot).toBeNull()
      expect(store.isMoveMode).toBe(true)
    })
  })

  describe('场景5：移动模式下切换选中状态', () => {
    it('用户在移动模式下点击其他库位，不应改变选中状态', async () => {
      const slot1 = makeSlot({
        id: 'slot-1',
        status: 'loaded',
        containerNo: 'CONT001',
      })
      const slot2 = makeSlot({
        id: 'slot-2',
        status: 'loaded',
        containerNo: 'CONT002',
      })
      const slot3 = makeSlot({
        id: 'slot-3',
        status: 'empty',
      })

      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [slot1, slot2, slot3],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 2,
        availableSlots: 10,
        heavyCount: 2,
        emptyContainerCount: 0,
        utilizationRate: 0.17,
      })

      const store = useWarehouseStore()
      await store.init()

      store.toggleSlotSelection('slot-1')
      expect(store.selectedSlotIds.has('slot-1')).toBe(true)

      store.toggleMoveMode()
      store.setMoveSource(slot2)

      expect(store.selectedSlotIds.has('slot-1')).toBe(true)
      expect(store.moveSourceSlot?.id).toBe('slot-2')
    })
  })

  describe('边界情况测试', () => {
    it('移动源库位和目标库位相同时，应该抛出错误', async () => {
      const slot = makeSlot({
        id: 'slot-1',
        status: 'loaded',
        containerNo: 'CONT001',
      })

      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [slot],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 1,
        availableSlots: 11,
        heavyCount: 1,
        emptyContainerCount: 0,
        utilizationRate: 0.08,
      })

      const store = useWarehouseStore()
      await store.init()

      store.toggleMoveMode()
      store.setMoveSource(slot)

      mockMove.mockRejectedValue(new Error('源库位和目标库位不能相同'))
      await expect(store.move('slot-1', 'slot-1')).rejects.toThrow('源库位和目标库位不能相同')
    })

    it('目标库位不是空位时，应该抛出错误', async () => {
      const sourceSlot = makeSlot({
        id: 'slot-1',
        status: 'loaded',
        containerNo: 'CONT001',
      })
      const targetSlot = makeSlot({
        id: 'slot-2',
        status: 'loaded',
        containerNo: 'CONT002',
      })

      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [sourceSlot, targetSlot],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 2,
        availableSlots: 10,
        heavyCount: 2,
        emptyContainerCount: 0,
        utilizationRate: 0.17,
      })

      const store = useWarehouseStore()
      await store.init()

      store.toggleMoveMode()
      store.setMoveSource(sourceSlot)

      mockMove.mockRejectedValue(new Error('目标库位不是空位'))
      await expect(store.move('slot-1', 'slot-2')).rejects.toThrow('目标库位不是空位')
    })
  })

  describe('场景6：ESC 键退出移动模式', () => {
    it('用户在移动模式下按 ESC 键，应该退出移动模式', async () => {
      const sourceSlot = makeSlot({
        id: 'slot-1',
        status: 'loaded',
        containerNo: 'CONT001',
      })
      const targetSlot = makeSlot({
        id: 'slot-2',
        status: 'empty',
      })

      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [sourceSlot, targetSlot],
        }),
      ]

      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue({
        totalSlots: 12,
        usedSlots: 1,
        availableSlots: 11,
        heavyCount: 1,
        emptyContainerCount: 0,
        utilizationRate: 0.08,
      })
      mockMove.mockResolvedValue(undefined)

      const store = useWarehouseStore()
      await store.init()

      store.toggleMoveMode()
      expect(store.isMoveMode).toBe(true)

      store.setMoveSource(sourceSlot)
      await store.move('slot-1', 'slot-2')

      expect(store.isMoveMode).toBe(true)

      store.toggleMoveMode()
      expect(store.isMoveMode).toBe(false)
      expect(store.moveSourceSlot).toBeNull()
    })
  })
})
