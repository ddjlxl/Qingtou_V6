export interface Slot {
  id: string
  zoneCode: string
  slotNo: string
  row: number
  col: number
  status: 'empty' | 'loaded' | 'empty_container'
  containerNo: string | null
  containerStatus: 'heavy' | 'empty' | null
  customerName: string | null
  containerType: '20GP' | '40GP' | '40HQ' | '45HQ' | null
  sealNo: string | null
  storedAt: string | null
  remark: string | null
}

export interface Zone {
  id: string
  name: string
  zoneCode: string
  sortOrder: number
  usedCount: number
  totalCount: number
  slots: Slot[]
}

export interface WarehouseStatistics {
  totalSlots: number
  usedSlots: number
  availableSlots: number
  heavyCount: number
  emptyContainerCount: number
  utilizationRate: number
}

export type SlotFilter = 'all' | 'heavy' | 'empty' | 'empty_slot'

export interface ManualInboundItem {
  containerNo: string
  containerStatus: 'heavy' | 'empty'
  customerName?: string
  containerType?: string
  sealNo?: string
}

export interface InboundResultItem {
  slotNo: string
  containerNo: string
}

export interface ManualInboundResponse {
  storedCount: number
  items: InboundResultItem[]
}

export interface ImportInboundResponse {
  totalRows: number
  storedCount: number
  errors: string[]
}

export interface OutboundItem {
  slotId: string
}

export interface OutboundResultItem {
  slotNo: string
  containerNo: string
  orderNo: string
}

export interface OutboundResponse {
  outboundCount: number
  items: OutboundResultItem[]
}

export interface MoveRequest {
  sourceSlotId: string
  targetSlotId: string
}

export interface SlotUpdateRequest {
  customerName?: string
  remark?: string
  containerStatus?: 'heavy' | 'empty'
}

export interface SearchHighlight {
  slotId: string
  zoneCode: string
  slotNo: string
  containerNo: string | null
  customerName: string | null
  matchedFields: string[]
}

export interface SearchResponse {
  keyword: string
  total: number
  items: SearchHighlight[]
  zoneCounts: Record<string, number>
}
