import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Zone, WarehouseStatistics, SlotFilter, Slot, ManualInboundItem, ManualInboundResponse, ImportInboundResponse, OutboundResponse, SearchHighlight } from '../types'
import { warehouseService } from '../services/warehouseService'

export const useWarehouseStore = defineStore('warehouse', () => {
  const zones = ref<Zone[]>([])
  const statistics = ref<WarehouseStatistics | null>(null)
  const filter = ref<SlotFilter>('all')
  const loading = ref(false)
  const inboundZoneCode = ref('')
  const selectedSlotIds = ref<Set<string>>(new Set())
  const isMoveMode = ref(false)
  const moveSourceSlot = ref<Slot | null>(null)
  const searchHighlights = ref<Map<string, SearchHighlight>>(new Map())
  const searchZoneCounts = ref<Record<string, number>>({})

  const selectedSlots = computed<Slot[]>(() => {
    const result: Slot[] = []
    for (const zone of zones.value) {
      for (const slot of zone.slots) {
        if (selectedSlotIds.value.has(slot.id)) {
          result.push(slot)
        }
      }
    }
    return result
  })

  function toggleSlotSelection(slotId: string) {
    const next = new Set(selectedSlotIds.value)
    if (next.has(slotId)) {
      next.delete(slotId)
    } else {
      next.add(slotId)
    }
    selectedSlotIds.value = next
  }

  function clearSelection() {
    selectedSlotIds.value = new Set()
  }

  function isSlotSelected(slotId: string): boolean {
    return selectedSlotIds.value.has(slotId)
  }

  async function fetchZones() {
    loading.value = true
    try {
      const data = await warehouseService.fetchZones()
      zones.value = data.zones
    } finally {
      loading.value = false
    }
  }

  async function fetchStatistics() {
    statistics.value = await warehouseService.fetchStatistics()
  }

  async function init() {
    await Promise.all([fetchZones(), fetchStatistics()])
  }

  function setFilter(newFilter: SlotFilter) {
    filter.value = newFilter
  }

  async function manualInbound(zoneCode: string, item: ManualInboundItem): Promise<ManualInboundResponse> {
    const result = await warehouseService.manualInbound(zoneCode, [item])
    await Promise.all([fetchZones(), fetchStatistics()])
    return result
  }

  async function importInbound(zoneCode: string, file: File): Promise<ImportInboundResponse> {
    const result = await warehouseService.importInbound(zoneCode, file)
    await Promise.all([fetchZones(), fetchStatistics()])
    return result
  }

  async function outbound(slotIds: string[], businessType?: string): Promise<OutboundResponse> {
    const result = await warehouseService.outbound(slotIds, businessType)
    clearSelection()
    await Promise.all([fetchZones(), fetchStatistics()])
    return result
  }

  function toggleMoveMode() {
    isMoveMode.value = !isMoveMode.value
    if (!isMoveMode.value) {
      moveSourceSlot.value = null
    }
  }

  function setMoveSource(slot: Slot) {
    moveSourceSlot.value = slot
  }

  async function move(sourceSlotId: string, targetSlotId: string) {
    await warehouseService.move(sourceSlotId, targetSlotId)
    moveSourceSlot.value = null
    isMoveMode.value = false
    await Promise.all([fetchZones(), fetchStatistics()])
  }

  async function updateSlot(slotId: string, data: { customerName?: string; remark?: string }) {
    await warehouseService.updateSlot(slotId, data)
    await Promise.all([fetchZones(), fetchStatistics()])
  }

  function setSearchHighlights(highlights: Map<string, SearchHighlight>, zoneCounts: Record<string, number>) {
    searchHighlights.value = highlights
    searchZoneCounts.value = zoneCounts
  }

  function clearSearchHighlights() {
    searchHighlights.value = new Map()
    searchZoneCounts.value = {}
  }

  return {
    zones,
    statistics,
    filter,
    loading,
    inboundZoneCode,
    selectedSlotIds,
    selectedSlots,
    isMoveMode,
    moveSourceSlot,
    searchHighlights,
    searchZoneCounts,
    fetchZones,
    fetchStatistics,
    init,
    setFilter,
    manualInbound,
    importInbound,
    outbound,
    toggleSlotSelection,
    clearSelection,
    isSlotSelected,
    toggleMoveMode,
    setMoveSource,
    move,
    updateSlot,
    setSearchHighlights,
    clearSearchHighlights,
  }
})
