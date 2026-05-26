import http from '@/shared/api/client'
import type { Zone, WarehouseStatistics, ManualInboundItem, ManualInboundResponse, ImportInboundResponse, OutboundResponse, SearchResponse } from '../types'

export const warehouseService = {
  fetchZones() {
    return http.get<{ zones: Zone[] }>('/v1/warehouse/zones')
  },

  fetchStatistics() {
    return http.get<WarehouseStatistics>('/v1/warehouse/statistics')
  },

  manualInbound(zoneCode: string, items: ManualInboundItem[]) {
    return http.post<ManualInboundResponse>('/v1/warehouse/slots/manual-inbound', {
      zoneCode,
      items,
    })
  },

  importInbound(zoneCode: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<ImportInboundResponse>(
      `/v1/warehouse/slots/import-inbound?zone_code=${encodeURIComponent(zoneCode)}`,
      formData,
    )
  },

  outbound(slotIds: string[]) {
    return http.post<OutboundResponse>('/v1/warehouse/slots/outbound', {
      items: slotIds.map((id) => ({ slotId: id })),
    })
  },

  move(sourceSlotId: string, targetSlotId: string) {
    return http.post('/v1/warehouse/slots/move', {
      sourceSlotId,
      targetSlotId,
    })
  },

  updateSlot(slotId: string, data: { customerName?: string; remark?: string; containerStatus?: 'heavy' | 'empty' }) {
    return http.put(`/v1/warehouse/slots/${slotId}`, data)
  },

  searchSlots(keyword: string) {
    return http.get<SearchResponse>('/v1/warehouse/slots/search', {
      keyword,
    })
  },
}
