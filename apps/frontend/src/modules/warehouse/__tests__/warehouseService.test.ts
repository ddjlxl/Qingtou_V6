import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Zone, WarehouseStatistics, ManualInboundResponse, ImportInboundResponse, OutboundResponse, SearchResponse } from '../types'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()

vi.mock('@/shared/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}))

import { warehouseService } from '../services/warehouseService'

describe('warehouseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchZones', () => {
    it('calls GET /v1/warehouse/zones', async () => {
      const mockZones: Zone[] = [
        {
          id: 'zone-1',
          name: 'A区',
          zoneCode: 'A',
          sortOrder: 1,
          usedCount: 10,
          totalCount: 20,
          slots: [],
        },
      ]
      mockGet.mockResolvedValue({ zones: mockZones })

      const result = await warehouseService.fetchZones()

      expect(mockGet).toHaveBeenCalledWith('/v1/warehouse/zones')
      expect(result.zones).toEqual(mockZones)
    })

    it('returns empty zones array when no data', async () => {
      mockGet.mockResolvedValue({ zones: [] })

      const result = await warehouseService.fetchZones()

      expect(result.zones).toEqual([])
    })
  })

  describe('fetchStatistics', () => {
    it('calls GET /v1/warehouse/statistics', async () => {
      const mockStats: WarehouseStatistics = {
        totalSlots: 100,
        usedSlots: 60,
        availableSlots: 40,
        heavyCount: 50,
        emptyContainerCount: 10,
        utilizationRate: 0.6,
      }
      mockGet.mockResolvedValue(mockStats)

      const result = await warehouseService.fetchStatistics()

      expect(mockGet).toHaveBeenCalledWith('/v1/warehouse/statistics')
      expect(result).toEqual(mockStats)
    })

    it('returns statistics with zero values', async () => {
      const mockStats: WarehouseStatistics = {
        totalSlots: 0,
        usedSlots: 0,
        availableSlots: 0,
        heavyCount: 0,
        emptyContainerCount: 0,
        utilizationRate: 0,
      }
      mockGet.mockResolvedValue(mockStats)

      const result = await warehouseService.fetchStatistics()

      expect(result.totalSlots).toBe(0)
      expect(result.utilizationRate).toBe(0)
    })
  })

  describe('manualInbound', () => {
    it('calls POST /v1/warehouse/slots/manual-inbound with zoneCode and items', async () => {
      const mockResponse: ManualInboundResponse = {
        storedCount: 2,
        items: [
          { slotNo: 'A-01-01', containerNo: 'CONT123' },
          { slotNo: 'A-01-02', containerNo: 'CONT456' },
        ],
      }
      mockPost.mockResolvedValue(mockResponse)

      const items = [
        { containerNo: 'CONT123', containerStatus: 'heavy' as const, customerName: '客户1' },
        { containerNo: 'CONT456', containerStatus: 'empty' as const },
      ]
      const result = await warehouseService.manualInbound('A', items)

      expect(mockPost).toHaveBeenCalledWith('/v1/warehouse/slots/manual-inbound', {
        zoneCode: 'A',
        items,
      })
      expect(result.storedCount).toBe(2)
      expect(result.items).toHaveLength(2)
    })

    it('returns storedCount as 0 when no items stored', async () => {
      const mockResponse: ManualInboundResponse = {
        storedCount: 0,
        items: [],
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await warehouseService.manualInbound('A', [])

      expect(result.storedCount).toBe(0)
      expect(result.items).toHaveLength(0)
    })
  })

  describe('importInbound', () => {
    it('calls POST /v1/warehouse/slots/import-inbound with FormData', async () => {
      const mockResponse: ImportInboundResponse = {
        totalRows: 10,
        storedCount: 8,
        errors: ['第3行：箱号已存在'],
      }
      mockPost.mockResolvedValue(mockResponse)

      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const result = await warehouseService.importInbound('A', file)

      expect(mockPost).toHaveBeenCalled()
      const callArgs = mockPost.mock.calls[0]
      expect(callArgs[0]).toBe('/v1/warehouse/slots/import-inbound?zone_code=A')
      expect(callArgs[1]).toBeInstanceOf(FormData)
      expect(result.totalRows).toBe(10)
      expect(result.storedCount).toBe(8)
      expect(result.errors).toHaveLength(1)
    })

    it('encodes zoneCode in URL', async () => {
      mockPost.mockResolvedValue({ totalRows: 0, storedCount: 0, errors: [] })

      await warehouseService.importInbound('区域A', new File([''], 'test.xlsx'))

      const callArgs = mockPost.mock.calls[0]
      expect(callArgs[0]).toBe('/v1/warehouse/slots/import-inbound?zone_code=%E5%8C%BA%E5%9F%9FA')
    })

    it('returns empty errors array when all rows succeed', async () => {
      const mockResponse: ImportInboundResponse = {
        totalRows: 5,
        storedCount: 5,
        errors: [],
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await warehouseService.importInbound('A', new File([''], 'test.xlsx'))

      expect(result.errors).toHaveLength(0)
    })
  })

  describe('outbound', () => {
    it('calls POST /v1/warehouse/slots/outbound with slotIds', async () => {
      const mockResponse: OutboundResponse = {
        outboundCount: 2,
        items: [
          { slotNo: 'A-01-01', containerNo: 'CONT123', orderNo: 'ORD-001' },
          { slotNo: 'A-01-02', containerNo: 'CONT456', orderNo: 'ORD-002' },
        ],
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await warehouseService.outbound(['slot-1', 'slot-2'])

      expect(mockPost).toHaveBeenCalledWith('/v1/warehouse/slots/outbound', {
        items: [{ slotId: 'slot-1' }, { slotId: 'slot-2' }],
        businessType: null,
      })
      expect(result.outboundCount).toBe(2)
      expect(result.items).toHaveLength(2)
    })

    it('calls POST with businessType when provided', async () => {
      mockPost.mockResolvedValue({ outboundCount: 1, items: [] })

      await warehouseService.outbound(['slot-1'], '出口')

      expect(mockPost).toHaveBeenCalledWith('/v1/warehouse/slots/outbound', {
        items: [{ slotId: 'slot-1' }],
        businessType: '出口',
      })
    })

    it('returns outboundCount as 0 when no slots selected', async () => {
      const mockResponse: OutboundResponse = {
        outboundCount: 0,
        items: [],
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await warehouseService.outbound([])

      expect(result.outboundCount).toBe(0)
    })
  })

  describe('move', () => {
    it('calls POST /v1/warehouse/slots/move with sourceSlotId and targetSlotId', async () => {
      mockPost.mockResolvedValue(undefined)

      await warehouseService.move('slot-1', 'slot-2')

      expect(mockPost).toHaveBeenCalledWith('/v1/warehouse/slots/move', {
        sourceSlotId: 'slot-1',
        targetSlotId: 'slot-2',
      })
    })

    it('returns undefined on success', async () => {
      mockPost.mockResolvedValue(undefined)

      const result = await warehouseService.move('slot-1', 'slot-2')

      expect(result).toBeUndefined()
    })
  })

  describe('updateSlot', () => {
    it('calls PUT /v1/warehouse/slots/:id with data', async () => {
      mockPut.mockResolvedValue(undefined)

      await warehouseService.updateSlot('slot-1', { customerName: '新客户', remark: '新备注' })

      expect(mockPut).toHaveBeenCalledWith('/v1/warehouse/slots/slot-1', {
        customerName: '新客户',
        remark: '新备注',
      })
    })

    it('calls PUT with partial data', async () => {
      mockPut.mockResolvedValue(undefined)

      await warehouseService.updateSlot('slot-1', { remark: '仅更新备注' })

      expect(mockPut).toHaveBeenCalledWith('/v1/warehouse/slots/slot-1', {
        remark: '仅更新备注',
      })
    })

    it('returns undefined on success', async () => {
      mockPut.mockResolvedValue(undefined)

      const result = await warehouseService.updateSlot('slot-1', { customerName: '客户' })

      expect(result).toBeUndefined()
    })
  })

  describe('searchSlots', () => {
    it('calls GET /v1/warehouse/slots/search with keyword', async () => {
      const mockResponse: SearchResponse = {
        keyword: 'CONT',
        total: 2,
        items: [
          {
            slotId: 'slot-1',
            zoneCode: 'A',
            slotNo: 'A-01-01',
            containerNo: 'CONT123',
            customerName: '客户1',
            matchedFields: ['containerNo'],
          },
          {
            slotId: 'slot-2',
            zoneCode: 'A',
            slotNo: 'A-01-02',
            containerNo: 'CONT456',
            customerName: '客户2',
            matchedFields: ['containerNo'],
          },
        ],
        zoneCounts: { A: 2 },
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await warehouseService.searchSlots('CONT')

      expect(mockGet).toHaveBeenCalledWith('/v1/warehouse/slots/search', { keyword: 'CONT' })
      expect(result.keyword).toBe('CONT')
      expect(result.total).toBe(2)
      expect(result.items).toHaveLength(2)
      expect(result.zoneCounts).toEqual({ A: 2 })
    })

    it('returns empty results when no matches', async () => {
      const mockResponse: SearchResponse = {
        keyword: 'NOTFOUND',
        total: 0,
        items: [],
        zoneCounts: {},
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await warehouseService.searchSlots('NOTFOUND')

      expect(result.total).toBe(0)
      expect(result.items).toHaveLength(0)
      expect(result.zoneCounts).toEqual({})
    })

    it('returns items with null containerNo and customerName', async () => {
      const mockResponse: SearchResponse = {
        keyword: 'A-01',
        total: 1,
        items: [
          {
            slotId: 'slot-1',
            zoneCode: 'A',
            slotNo: 'A-01-01',
            containerNo: null,
            customerName: null,
            matchedFields: ['slotNo'],
          },
        ],
        zoneCounts: { A: 1 },
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await warehouseService.searchSlots('A-01')

      expect(result.items[0].containerNo).toBeNull()
      expect(result.items[0].customerName).toBeNull()
    })
  })
})
