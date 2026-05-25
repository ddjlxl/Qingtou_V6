import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Zone, WarehouseStatistics, Slot, ManualInboundResponse, ImportInboundResponse, OutboundResponse, SearchHighlight } from '../types'

const mockFetchZones = vi.fn()
const mockFetchStatistics = vi.fn()
const mockManualInbound = vi.fn()
const mockImportInbound = vi.fn()
const mockOutbound = vi.fn()
const mockMove = vi.fn()
const mockUpdateSlot = vi.fn()
const mockSearchSlots = vi.fn()

vi.mock('../services/warehouseService', () => ({
  warehouseService: {
    fetchZones: (...args: unknown[]) => mockFetchZones(...args),
    fetchStatistics: (...args: unknown[]) => mockFetchStatistics(...args),
    manualInbound: (...args: unknown[]) => mockManualInbound(...args),
    importInbound: (...args: unknown[]) => mockImportInbound(...args),
    outbound: (...args: unknown[]) => mockOutbound(...args),
    move: (...args: unknown[]) => mockMove(...args),
    updateSlot: (...args: unknown[]) => mockUpdateSlot(...args),
    searchSlots: (...args: unknown[]) => mockSearchSlots(...args),
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
    totalCount: 10,
    slots: [],
    ...overrides,
  }
}

function makeStatistics(overrides: Record<string, unknown> = {}): WarehouseStatistics {
  return {
    totalSlots: 100,
    usedSlots: 60,
    availableSlots: 40,
    heavyCount: 50,
    emptyContainerCount: 10,
    utilizationRate: 0.6,
    ...overrides,
  }
}

describe('useWarehouseStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty zones array', () => {
      const store = useWarehouseStore()
      expect(store.zones).toEqual([])
    })

    it('has loading as false', () => {
      const store = useWarehouseStore()
      expect(store.loading).toBe(false)
    })

    it('has filter as "all"', () => {
      const store = useWarehouseStore()
      expect(store.filter).toBe('all')
    })

    it('has statistics as null', () => {
      const store = useWarehouseStore()
      expect(store.statistics).toBeNull()
    })

    it('has empty selectedSlotIds', () => {
      const store = useWarehouseStore()
      expect(store.selectedSlotIds.size).toBe(0)
    })

    it('has isMoveMode as false', () => {
      const store = useWarehouseStore()
      expect(store.isMoveMode).toBe(false)
    })

    it('has moveSourceSlot as null', () => {
      const store = useWarehouseStore()
      expect(store.moveSourceSlot).toBeNull()
    })

    it('has empty searchHighlights', () => {
      const store = useWarehouseStore()
      expect(store.searchHighlights.size).toBe(0)
    })

    it('has empty searchZoneCounts', () => {
      const store = useWarehouseStore()
      expect(store.searchZoneCounts).toEqual({})
    })
  })

  describe('fetchZones', () => {
    it('fetches zones successfully', async () => {
      const mockZones = [makeZone({ id: 'zone-1' }), makeZone({ id: 'zone-2', zoneCode: 'B' })]
      mockFetchZones.mockResolvedValue({ zones: mockZones })

      const store = useWarehouseStore()
      await store.fetchZones()

      expect(mockFetchZones).toHaveBeenCalled()
      expect(store.zones).toEqual(mockZones)
    })

    it('sets loading to true during fetch', async () => {
      mockFetchZones.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ zones: [] }), 100)))

      const store = useWarehouseStore()
      const promise = store.fetchZones()

      expect(store.loading).toBe(true)
      await promise
      expect(store.loading).toBe(false)
    })

    it('sets loading to false on error', async () => {
      mockFetchZones.mockRejectedValue(new Error('Network error'))

      const store = useWarehouseStore()
      await expect(store.fetchZones()).rejects.toThrow('Network error')
      expect(store.loading).toBe(false)
    })

    it('updates zones with fetched data', async () => {
      const mockZones = [
        makeZone({
          id: 'zone-1',
          name: 'A区',
          usedCount: 5,
          totalCount: 10,
          slots: [makeSlot({ id: 'slot-1' })],
        }),
      ]
      mockFetchZones.mockResolvedValue({ zones: mockZones })

      const store = useWarehouseStore()
      await store.fetchZones()

      expect(store.zones).toHaveLength(1)
      expect(store.zones[0].name).toBe('A区')
      expect(store.zones[0].slots).toHaveLength(1)
    })
  })

  describe('fetchStatistics', () => {
    it('fetches statistics successfully', async () => {
      const mockStats = makeStatistics()
      mockFetchStatistics.mockResolvedValue(mockStats)

      const store = useWarehouseStore()
      await store.fetchStatistics()

      expect(mockFetchStatistics).toHaveBeenCalled()
      expect(store.statistics).toEqual(mockStats)
    })

    it('updates statistics with fetched data', async () => {
      const mockStats = makeStatistics({
        totalSlots: 200,
        usedSlots: 150,
        utilizationRate: 0.75,
      })
      mockFetchStatistics.mockResolvedValue(mockStats)

      const store = useWarehouseStore()
      await store.fetchStatistics()

      expect(store.statistics?.totalSlots).toBe(200)
      expect(store.statistics?.usedSlots).toBe(150)
      expect(store.statistics?.utilizationRate).toBe(0.75)
    })

    it('handles error in fetchStatistics', async () => {
      mockFetchStatistics.mockRejectedValue(new Error('Failed to fetch statistics'))

      const store = useWarehouseStore()
      await expect(store.fetchStatistics()).rejects.toThrow('Failed to fetch statistics')
    })
  })

  describe('init', () => {
    it('calls both fetchZones and fetchStatistics', async () => {
      mockFetchZones.mockResolvedValue({ zones: [] })
      mockFetchStatistics.mockResolvedValue(makeStatistics())

      const store = useWarehouseStore()
      await store.init()

      expect(mockFetchZones).toHaveBeenCalled()
      expect(mockFetchStatistics).toHaveBeenCalled()
    })

    it('sets both zones and statistics', async () => {
      const mockZones = [makeZone()]
      const mockStats = makeStatistics()
      mockFetchZones.mockResolvedValue({ zones: mockZones })
      mockFetchStatistics.mockResolvedValue(mockStats)

      const store = useWarehouseStore()
      await store.init()

      expect(store.zones).toEqual(mockZones)
      expect(store.statistics).toEqual(mockStats)
    })
  })

  describe('setFilter', () => {
    it('updates filter value', () => {
      const store = useWarehouseStore()
      store.setFilter('heavy')
      expect(store.filter).toBe('heavy')
    })

    it('can change filter multiple times', () => {
      const store = useWarehouseStore()
      store.setFilter('heavy')
      expect(store.filter).toBe('heavy')
      store.setFilter('empty')
      expect(store.filter).toBe('empty')
      store.setFilter('all')
      expect(store.filter).toBe('all')
    })
  })

  describe('toggleSlotSelection', () => {
    it('adds slot to selection', () => {
      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      expect(store.selectedSlotIds.has('slot-1')).toBe(true)
    })

    it('removes slot from selection if already selected', () => {
      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      expect(store.selectedSlotIds.has('slot-1')).toBe(true)
      store.toggleSlotSelection('slot-1')
      expect(store.selectedSlotIds.has('slot-1')).toBe(false)
    })

    it('can select multiple slots', () => {
      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      store.toggleSlotSelection('slot-2')
      store.toggleSlotSelection('slot-3')
      expect(store.selectedSlotIds.size).toBe(3)
    })
  })

  describe('clearSelection', () => {
    it('clears all selected slots', () => {
      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      store.toggleSlotSelection('slot-2')
      expect(store.selectedSlotIds.size).toBe(2)
      store.clearSelection()
      expect(store.selectedSlotIds.size).toBe(0)
    })

    it('works when no slots are selected', () => {
      const store = useWarehouseStore()
      store.clearSelection()
      expect(store.selectedSlotIds.size).toBe(0)
    })
  })

  describe('selectedSlots getter', () => {
    it('returns empty array when no slots selected', () => {
      const store = useWarehouseStore()
      expect(store.selectedSlots).toEqual([])
    })

    it('returns selected slots', async () => {
      const slot1 = makeSlot({ id: 'slot-1' })
      const slot2 = makeSlot({ id: 'slot-2' })
      const slot3 = makeSlot({ id: 'slot-3' })
      const mockZones = [
        makeZone({
          zoneCode: 'A',
          slots: [slot1, slot2],
        }),
        makeZone({
          zoneCode: 'B',
          slots: [slot3],
        }),
      ]
      mockFetchZones.mockResolvedValue({ zones: mockZones })

      const store = useWarehouseStore()
      await store.fetchZones()
      store.toggleSlotSelection('slot-1')
      store.toggleSlotSelection('slot-3')

      expect(store.selectedSlots).toHaveLength(2)
      expect(store.selectedSlots.map((s) => s.id)).toContain('slot-1')
      expect(store.selectedSlots.map((s) => s.id)).toContain('slot-3')
    })
  })

  describe('manualInbound', () => {
    it('calls service and refreshes data', async () => {
      const mockResponse: ManualInboundResponse = {
        storedCount: 1,
        items: [{ slotNo: 'A-01-01', containerNo: 'CONT123' }],
      }
      mockManualInbound.mockResolvedValue(mockResponse)
      mockFetchZones.mockResolvedValue({ zones: [] })
      mockFetchStatistics.mockResolvedValue(makeStatistics())

      const store = useWarehouseStore()
      const result = await store.manualInbound('A', {
        containerNo: 'CONT123',
        containerStatus: 'heavy',
      })

      expect(mockManualInbound).toHaveBeenCalledWith('A', [
        { containerNo: 'CONT123', containerStatus: 'heavy' },
      ])
      expect(result.storedCount).toBe(1)
      expect(mockFetchZones).toHaveBeenCalled()
      expect(mockFetchStatistics).toHaveBeenCalled()
    })

    it('handles error in manualInbound', async () => {
      mockManualInbound.mockRejectedValue(new Error('Inbound failed'))

      const store = useWarehouseStore()
      await expect(
        store.manualInbound('A', { containerNo: 'CONT123', containerStatus: 'heavy' })
      ).rejects.toThrow('Inbound failed')
    })
  })

  describe('importInbound', () => {
    it('calls service and refreshes data', async () => {
      const mockResponse: ImportInboundResponse = {
        totalRows: 10,
        storedCount: 8,
        errors: ['第3行：箱号已存在'],
      }
      mockImportInbound.mockResolvedValue(mockResponse)
      mockFetchZones.mockResolvedValue({ zones: [] })
      mockFetchStatistics.mockResolvedValue(makeStatistics())

      const store = useWarehouseStore()
      const file = new File([''], 'test.xlsx')
      const result = await store.importInbound('A', file)

      expect(mockImportInbound).toHaveBeenCalledWith('A', file)
      expect(result.totalRows).toBe(10)
      expect(result.storedCount).toBe(8)
      expect(mockFetchZones).toHaveBeenCalled()
      expect(mockFetchStatistics).toHaveBeenCalled()
    })

    it('handles error in importInbound', async () => {
      mockImportInbound.mockRejectedValue(new Error('Import failed'))

      const store = useWarehouseStore()
      await expect(store.importInbound('A', new File([''], 'test.xlsx'))).rejects.toThrow(
        'Import failed'
      )
    })
  })

  describe('outbound', () => {
    it('calls service, clears selection, and refreshes data', async () => {
      const mockResponse: OutboundResponse = {
        outboundCount: 2,
        items: [
          { slotNo: 'A-01-01', containerNo: 'CONT1', orderNo: 'ORD-001' },
          { slotNo: 'A-01-02', containerNo: 'CONT2', orderNo: 'ORD-002' },
        ],
      }
      mockOutbound.mockResolvedValue(mockResponse)
      mockFetchZones.mockResolvedValue({ zones: [] })
      mockFetchStatistics.mockResolvedValue(makeStatistics())

      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      store.toggleSlotSelection('slot-2')
      const result = await store.outbound(['slot-1', 'slot-2'], '出口')

      expect(mockOutbound).toHaveBeenCalledWith(['slot-1', 'slot-2'], '出口')
      expect(result.outboundCount).toBe(2)
      expect(store.selectedSlotIds.size).toBe(0)
      expect(mockFetchZones).toHaveBeenCalled()
      expect(mockFetchStatistics).toHaveBeenCalled()
    })

    it('clears selection even when outbound succeeds', async () => {
      mockOutbound.mockResolvedValue({ outboundCount: 1, items: [] })
      mockFetchZones.mockResolvedValue({ zones: [] })
      mockFetchStatistics.mockResolvedValue(makeStatistics())

      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      await store.outbound(['slot-1'])

      expect(store.selectedSlotIds.size).toBe(0)
    })

    it('handles error in outbound', async () => {
      mockOutbound.mockRejectedValue(new Error('Outbound failed'))

      const store = useWarehouseStore()
      await expect(store.outbound(['slot-1'])).rejects.toThrow('Outbound failed')
    })
  })

  describe('toggleMoveMode', () => {
    it('toggles isMoveMode', () => {
      const store = useWarehouseStore()
      expect(store.isMoveMode).toBe(false)
      store.toggleMoveMode()
      expect(store.isMoveMode).toBe(true)
      store.toggleMoveMode()
      expect(store.isMoveMode).toBe(false)
    })

    it('clears moveSourceSlot when exiting move mode', () => {
      const store = useWarehouseStore()
      const slot = makeSlot({ id: 'slot-1' })
      store.setMoveSource(slot)
      expect(store.moveSourceSlot).not.toBeNull()
      store.toggleMoveMode()
      expect(store.isMoveMode).toBe(true)
      store.toggleMoveMode()
      expect(store.moveSourceSlot).toBeNull()
    })
  })

  describe('setMoveSource', () => {
    it('sets moveSourceSlot', () => {
      const store = useWarehouseStore()
      const slot = makeSlot({ id: 'slot-1', slotNo: 'A-01-01' })
      store.setMoveSource(slot)
      expect(store.moveSourceSlot).toEqual(slot)
    })

    it('can change moveSourceSlot', () => {
      const store = useWarehouseStore()
      const slot1 = makeSlot({ id: 'slot-1' })
      const slot2 = makeSlot({ id: 'slot-2' })
      store.setMoveSource(slot1)
      expect(store.moveSourceSlot?.id).toBe('slot-1')
      store.setMoveSource(slot2)
      expect(store.moveSourceSlot?.id).toBe('slot-2')
    })
  })

  describe('move', () => {
    it('calls service and resets move state', async () => {
      mockMove.mockResolvedValue(undefined)
      mockFetchZones.mockResolvedValue({ zones: [] })
      mockFetchStatistics.mockResolvedValue(makeStatistics())

      const store = useWarehouseStore()
      const slot = makeSlot({ id: 'slot-1' })
      store.setMoveSource(slot)
      store.toggleMoveMode()
      await store.move('slot-1', 'slot-2')

      expect(mockMove).toHaveBeenCalledWith('slot-1', 'slot-2')
      expect(store.moveSourceSlot).toBeNull()
      expect(store.isMoveMode).toBe(false)
      expect(mockFetchZones).toHaveBeenCalled()
      expect(mockFetchStatistics).toHaveBeenCalled()
    })

    it('handles error in move', async () => {
      mockMove.mockRejectedValue(new Error('Move failed'))

      const store = useWarehouseStore()
      await expect(store.move('slot-1', 'slot-2')).rejects.toThrow('Move failed')
    })
  })

  describe('updateSlot', () => {
    it('calls service and refreshes data', async () => {
      mockUpdateSlot.mockResolvedValue(undefined)
      mockFetchZones.mockResolvedValue({ zones: [] })
      mockFetchStatistics.mockResolvedValue(makeStatistics())

      const store = useWarehouseStore()
      await store.updateSlot('slot-1', { customerName: '新客户', remark: '新备注' })

      expect(mockUpdateSlot).toHaveBeenCalledWith('slot-1', {
        customerName: '新客户',
        remark: '新备注',
      })
      expect(mockFetchZones).toHaveBeenCalled()
      expect(mockFetchStatistics).toHaveBeenCalled()
    })

    it('handles error in updateSlot', async () => {
      mockUpdateSlot.mockRejectedValue(new Error('Update failed'))

      const store = useWarehouseStore()
      await expect(
        store.updateSlot('slot-1', { customerName: '新客户' })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('setSearchHighlights', () => {
    it('sets searchHighlights and searchZoneCounts', () => {
      const store = useWarehouseStore()
      const highlights = new Map<string, SearchHighlight>()
      highlights.set('slot-1', {
        slotId: 'slot-1',
        zoneCode: 'A',
        slotNo: 'A-01-01',
        containerNo: 'CONT123',
        customerName: '客户',
        matchedFields: ['containerNo'],
      })
      const zoneCounts = { A: 1 }

      store.setSearchHighlights(highlights, zoneCounts)

      expect(store.searchHighlights.size).toBe(1)
      expect(store.searchZoneCounts).toEqual({ A: 1 })
    })

    it('can update searchHighlights multiple times', () => {
      const store = useWarehouseStore()

      const highlights1 = new Map<string, SearchHighlight>()
      highlights1.set('slot-1', {
        slotId: 'slot-1',
        zoneCode: 'A',
        slotNo: 'A-01-01',
        containerNo: null,
        customerName: null,
        matchedFields: ['slotNo'],
      })
      store.setSearchHighlights(highlights1, { A: 1 })
      expect(store.searchHighlights.size).toBe(1)

      const highlights2 = new Map<string, SearchHighlight>()
      highlights2.set('slot-2', {
        slotId: 'slot-2',
        zoneCode: 'B',
        slotNo: 'B-01-01',
        containerNo: null,
        customerName: null,
        matchedFields: ['slotNo'],
      })
      highlights2.set('slot-3', {
        slotId: 'slot-3',
        zoneCode: 'B',
        slotNo: 'B-01-02',
        containerNo: null,
        customerName: null,
        matchedFields: ['slotNo'],
      })
      store.setSearchHighlights(highlights2, { B: 2 })
      expect(store.searchHighlights.size).toBe(2)
      expect(store.searchZoneCounts).toEqual({ B: 2 })
    })
  })

  describe('clearSearchHighlights', () => {
    it('clears searchHighlights and searchZoneCounts', () => {
      const store = useWarehouseStore()
      const highlights = new Map<string, SearchHighlight>()
      highlights.set('slot-1', {
        slotId: 'slot-1',
        zoneCode: 'A',
        slotNo: 'A-01-01',
        containerNo: null,
        customerName: null,
        matchedFields: ['slotNo'],
      })
      store.setSearchHighlights(highlights, { A: 1 })

      expect(store.searchHighlights.size).toBe(1)
      expect(store.searchZoneCounts).toEqual({ A: 1 })

      store.clearSearchHighlights()

      expect(store.searchHighlights.size).toBe(0)
      expect(store.searchZoneCounts).toEqual({})
    })

    it('works when searchHighlights is already empty', () => {
      const store = useWarehouseStore()
      store.clearSearchHighlights()
      expect(store.searchHighlights.size).toBe(0)
      expect(store.searchZoneCounts).toEqual({})
    })
  })

  describe('isSlotSelected', () => {
    it('returns true for selected slot', () => {
      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      expect(store.isSlotSelected('slot-1')).toBe(true)
    })

    it('returns false for unselected slot', () => {
      const store = useWarehouseStore()
      expect(store.isSlotSelected('slot-1')).toBe(false)
    })

    it('returns false after slot is deselected', () => {
      const store = useWarehouseStore()
      store.toggleSlotSelection('slot-1')
      expect(store.isSlotSelected('slot-1')).toBe(true)
      store.toggleSlotSelection('slot-1')
      expect(store.isSlotSelected('slot-1')).toBe(false)
    })
  })
})
