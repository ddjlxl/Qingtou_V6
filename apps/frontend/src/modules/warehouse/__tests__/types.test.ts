import { describe, it, expect } from 'vitest'
import type {
  Slot,
  Zone,
  WarehouseStatistics,
  SlotFilter,
  ManualInboundItem,
  InboundResultItem,
  ManualInboundResponse,
  ImportInboundResponse,
  OutboundItem,
  OutboundResultItem,
  OutboundResponse,
  MoveRequest,
  SlotUpdateRequest,
  SearchHighlight,
  SearchResponse,
} from '../types'

describe('Warehouse types', () => {
  describe('Slot type', () => {
    it('has all required fields for empty slot', () => {
      const slot: Slot = {
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
      }

      expect(slot.id).toBe('slot-1')
      expect(slot.zoneCode).toBe('A')
      expect(slot.slotNo).toBe('A-01-01')
      expect(slot.row).toBe(1)
      expect(slot.col).toBe(1)
      expect(slot.status).toBe('empty')
      expect(slot.containerNo).toBeNull()
      expect(slot.containerStatus).toBeNull()
      expect(slot.customerName).toBeNull()
      expect(slot.containerType).toBeNull()
      expect(slot.sealNo).toBeNull()
      expect(slot.storedAt).toBeNull()
      expect(slot.remark).toBeNull()
    })

    it('has all required fields for loaded slot', () => {
      const slot: Slot = {
        id: 'slot-2',
        zoneCode: 'B',
        slotNo: 'B-02-03',
        row: 2,
        col: 3,
        status: 'loaded',
        containerNo: 'CONT123456',
        containerStatus: 'heavy',
        customerName: '测试客户',
        containerType: '40GP',
        sealNo: 'SEAL789',
        storedAt: '2026-01-01T00:00:00Z',
        remark: '备注信息',
      }

      expect(slot.status).toBe('loaded')
      expect(slot.containerNo).toBe('CONT123456')
      expect(slot.containerStatus).toBe('heavy')
      expect(slot.customerName).toBe('测试客户')
      expect(slot.containerType).toBe('40GP')
      expect(slot.sealNo).toBe('SEAL789')
      expect(slot.storedAt).toBe('2026-01-01T00:00:00Z')
      expect(slot.remark).toBe('备注信息')
    })

    it('has all required fields for empty_container slot', () => {
      const slot: Slot = {
        id: 'slot-3',
        zoneCode: 'C',
        slotNo: 'C-03-05',
        row: 3,
        col: 5,
        status: 'empty_container',
        containerNo: 'CONT999999',
        containerStatus: 'empty',
        customerName: null,
        containerType: '20GP',
        sealNo: null,
        storedAt: '2026-01-02T00:00:00Z',
        remark: null,
      }

      expect(slot.status).toBe('empty_container')
      expect(slot.containerStatus).toBe('empty')
    })

    it('supports all status values', () => {
      const emptySlot: Slot = {
        id: '1',
        zoneCode: 'A',
        slotNo: 'A-01',
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
      }

      const loadedSlot: Slot = { ...emptySlot, id: '2', status: 'loaded' }
      const emptyContainerSlot: Slot = { ...emptySlot, id: '3', status: 'empty_container' }

      expect(emptySlot.status).toBe('empty')
      expect(loadedSlot.status).toBe('loaded')
      expect(emptyContainerSlot.status).toBe('empty_container')
    })

    it('supports all containerType values', () => {
      const baseSlot: Slot = {
        id: '1',
        zoneCode: 'A',
        slotNo: 'A-01',
        row: 1,
        col: 1,
        status: 'loaded',
        containerNo: 'CONT',
        containerStatus: 'heavy',
        customerName: '客户',
        containerType: '20GP',
        sealNo: null,
        storedAt: null,
        remark: null,
      }

      const types: Array<'20GP' | '40GP' | '40HQ' | '45HQ'> = ['20GP', '40GP', '40HQ', '45HQ']
      types.forEach((type) => {
        const slot: Slot = { ...baseSlot, containerType: type }
        expect(slot.containerType).toBe(type)
      })
    })
  })

  describe('Zone type', () => {
    it('has all required fields', () => {
      const zone: Zone = {
        id: 'zone-1',
        name: 'A区',
        zoneCode: 'A',
        sortOrder: 1,
        usedCount: 10,
        totalCount: 20,
        slots: [],
      }

      expect(zone.id).toBe('zone-1')
      expect(zone.name).toBe('A区')
      expect(zone.zoneCode).toBe('A')
      expect(zone.sortOrder).toBe(1)
      expect(zone.usedCount).toBe(10)
      expect(zone.totalCount).toBe(20)
      expect(zone.slots).toEqual([])
    })

    it('contains slots array', () => {
      const slot: Slot = {
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
      }

      const zone: Zone = {
        id: 'zone-1',
        name: 'A区',
        zoneCode: 'A',
        sortOrder: 1,
        usedCount: 1,
        totalCount: 1,
        slots: [slot],
      }

      expect(zone.slots).toHaveLength(1)
      expect(zone.slots[0]).toEqual(slot)
    })

    it('can have multiple slots', () => {
      const slots: Slot[] = [
        {
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
        },
        {
          id: 'slot-2',
          zoneCode: 'A',
          slotNo: 'A-01-02',
          row: 1,
          col: 2,
          status: 'loaded',
          containerNo: 'CONT',
          containerStatus: 'heavy',
          customerName: '客户',
          containerType: '40GP',
          sealNo: null,
          storedAt: null,
          remark: null,
        },
      ]

      const zone: Zone = {
        id: 'zone-1',
        name: 'A区',
        zoneCode: 'A',
        sortOrder: 1,
        usedCount: 1,
        totalCount: 2,
        slots: slots,
      }

      expect(zone.slots).toHaveLength(2)
      expect(zone.slots[0].status).toBe('empty')
      expect(zone.slots[1].status).toBe('loaded')
    })
  })

  describe('WarehouseStatistics type', () => {
    it('has all required fields', () => {
      const stats: WarehouseStatistics = {
        totalSlots: 100,
        usedSlots: 60,
        availableSlots: 40,
        heavyCount: 50,
        emptyContainerCount: 10,
        utilizationRate: 0.6,
      }

      expect(stats.totalSlots).toBe(100)
      expect(stats.usedSlots).toBe(60)
      expect(stats.availableSlots).toBe(40)
      expect(stats.heavyCount).toBe(50)
      expect(stats.emptyContainerCount).toBe(10)
      expect(stats.utilizationRate).toBe(0.6)
    })

    it('can have zero values', () => {
      const stats: WarehouseStatistics = {
        totalSlots: 0,
        usedSlots: 0,
        availableSlots: 0,
        heavyCount: 0,
        emptyContainerCount: 0,
        utilizationRate: 0,
      }

      expect(stats.totalSlots).toBe(0)
      expect(stats.usedSlots).toBe(0)
      expect(stats.utilizationRate).toBe(0)
    })
  })

  describe('SlotFilter type', () => {
    it('supports all filter values', () => {
      const allFilter: SlotFilter = 'all'
      const heavyFilter: SlotFilter = 'heavy'
      const emptyFilter: SlotFilter = 'empty'
      const emptySlotFilter: SlotFilter = 'empty_slot'

      expect(allFilter).toBe('all')
      expect(heavyFilter).toBe('heavy')
      expect(emptyFilter).toBe('empty')
      expect(emptySlotFilter).toBe('empty_slot')
    })
  })

  describe('ManualInboundItem type', () => {
    it('has required fields', () => {
      const item: ManualInboundItem = {
        containerNo: 'CONT123',
        containerStatus: 'heavy',
      }

      expect(item.containerNo).toBe('CONT123')
      expect(item.containerStatus).toBe('heavy')
    })

    it('has optional fields', () => {
      const item: ManualInboundItem = {
        containerNo: 'CONT456',
        containerStatus: 'empty',
        customerName: '客户名',
        containerType: '40GP',
        sealNo: 'SEAL123',
      }

      expect(item.customerName).toBe('客户名')
      expect(item.containerType).toBe('40GP')
      expect(item.sealNo).toBe('SEAL123')
    })
  })

  describe('InboundResultItem type', () => {
    it('has all required fields', () => {
      const item: InboundResultItem = {
        slotNo: 'A-01-01',
        containerNo: 'CONT123',
      }

      expect(item.slotNo).toBe('A-01-01')
      expect(item.containerNo).toBe('CONT123')
    })
  })

  describe('ManualInboundResponse type', () => {
    it('has all required fields', () => {
      const response: ManualInboundResponse = {
        storedCount: 2,
        items: [
          { slotNo: 'A-01-01', containerNo: 'CONT123' },
          { slotNo: 'A-01-02', containerNo: 'CONT456' },
        ],
      }

      expect(response.storedCount).toBe(2)
      expect(response.items).toHaveLength(2)
    })
  })

  describe('ImportInboundResponse type', () => {
    it('has all required fields', () => {
      const response: ImportInboundResponse = {
        totalRows: 10,
        storedCount: 8,
        errors: ['第3行：箱号已存在', '第7行：库位已满'],
      }

      expect(response.totalRows).toBe(10)
      expect(response.storedCount).toBe(8)
      expect(response.errors).toHaveLength(2)
    })

    it('can have empty errors', () => {
      const response: ImportInboundResponse = {
        totalRows: 5,
        storedCount: 5,
        errors: [],
      }

      expect(response.errors).toHaveLength(0)
    })
  })

  describe('OutboundItem type', () => {
    it('has all required fields', () => {
      const item: OutboundItem = {
        slotId: 'slot-1',
      }

      expect(item.slotId).toBe('slot-1')
    })
  })

  describe('OutboundResultItem type', () => {
    it('has all required fields', () => {
      const item: OutboundResultItem = {
        slotNo: 'A-01-01',
        containerNo: 'CONT123',
        orderNo: 'ORD-2026-001',
      }

      expect(item.slotNo).toBe('A-01-01')
      expect(item.containerNo).toBe('CONT123')
      expect(item.orderNo).toBe('ORD-2026-001')
    })
  })

  describe('OutboundResponse type', () => {
    it('has all required fields', () => {
      const response: OutboundResponse = {
        outboundCount: 3,
        items: [
          { slotNo: 'A-01-01', containerNo: 'CONT1', orderNo: 'ORD-001' },
          { slotNo: 'A-01-02', containerNo: 'CONT2', orderNo: 'ORD-002' },
          { slotNo: 'A-01-03', containerNo: 'CONT3', orderNo: 'ORD-003' },
        ],
      }

      expect(response.outboundCount).toBe(3)
      expect(response.items).toHaveLength(3)
    })
  })

  describe('MoveRequest type', () => {
    it('has all required fields', () => {
      const request: MoveRequest = {
        sourceSlotId: 'slot-1',
        targetSlotId: 'slot-2',
      }

      expect(request.sourceSlotId).toBe('slot-1')
      expect(request.targetSlotId).toBe('slot-2')
    })
  })

  describe('SlotUpdateRequest type', () => {
    it('allows partial updates', () => {
      const request1: SlotUpdateRequest = {
        customerName: '新客户',
      }

      const request2: SlotUpdateRequest = {
        remark: '新备注',
      }

      const request3: SlotUpdateRequest = {
        customerName: '客户',
        remark: '备注',
      }

      expect(request1.customerName).toBe('新客户')
      expect(request1.remark).toBeUndefined()
      expect(request2.remark).toBe('新备注')
      expect(request3.customerName).toBe('客户')
      expect(request3.remark).toBe('备注')
    })
  })

  describe('SearchHighlight type', () => {
    it('has all required fields', () => {
      const highlight: SearchHighlight = {
        slotId: 'slot-1',
        zoneCode: 'A',
        slotNo: 'A-01-01',
        containerNo: 'CONT123',
        customerName: '客户名',
        matchedFields: ['containerNo', 'customerName'],
      }

      expect(highlight.slotId).toBe('slot-1')
      expect(highlight.zoneCode).toBe('A')
      expect(highlight.slotNo).toBe('A-01-01')
      expect(highlight.containerNo).toBe('CONT123')
      expect(highlight.customerName).toBe('客户名')
      expect(highlight.matchedFields).toEqual(['containerNo', 'customerName'])
    })

    it('can have null containerNo and customerName', () => {
      const highlight: SearchHighlight = {
        slotId: 'slot-2',
        zoneCode: 'B',
        slotNo: 'B-02-01',
        containerNo: null,
        customerName: null,
        matchedFields: ['slotNo'],
      }

      expect(highlight.containerNo).toBeNull()
      expect(highlight.customerName).toBeNull()
    })
  })

  describe('SearchResponse type', () => {
    it('has all required fields', () => {
      const response: SearchResponse = {
        keyword: 'CONT',
        total: 5,
        items: [
          {
            slotId: 'slot-1',
            zoneCode: 'A',
            slotNo: 'A-01-01',
            containerNo: 'CONT123',
            customerName: '客户',
            matchedFields: ['containerNo'],
          },
        ],
        zoneCounts: {
          A: 3,
          B: 2,
        },
      }

      expect(response.keyword).toBe('CONT')
      expect(response.total).toBe(5)
      expect(response.items).toHaveLength(1)
      expect(response.zoneCounts['A']).toBe(3)
      expect(response.zoneCounts['B']).toBe(2)
    })

    it('can have empty results', () => {
      const response: SearchResponse = {
        keyword: 'NOTFOUND',
        total: 0,
        items: [],
        zoneCounts: {},
      }

      expect(response.total).toBe(0)
      expect(response.items).toHaveLength(0)
      expect(response.zoneCounts).toEqual({})
    })
  })
})
