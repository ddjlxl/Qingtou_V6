<script setup lang="ts">
import { computed } from 'vue'
import type { Zone, SlotFilter, Slot } from '../types'
import SlotCell from './SlotCell.vue'

const props = defineProps<{
  zone: Zone
  filter: SlotFilter
  selectedSlotIds: Set<string>
  moveSourceId?: string
  isMoveMode?: boolean
  searchHitIds?: Set<string>
  searchMatchCount?: number
}>()

const emit = defineEmits<{
  (e: 'slotClick', slotData: Slot): void
}>()

const visibleSlotIds = computed(() => {
  if (props.filter === 'all') return null
  const ids = new Set<string>()
  for (const s of props.zone.slots) {
    let visible = false
    switch (props.filter) {
      case 'heavy': visible = s.status === 'loaded'; break
      case 'empty': visible = s.status === 'empty_container'; break
      case 'empty_slot': visible = s.status === 'empty'; break
    }
    if (visible) ids.add(s.id)
  }
  return ids
})
</script>

<template>
  <div class="zone-card">
    <div class="zone-card__header">
      <span class="zone-card__title">{{ zone.zoneCode }} 区</span>
      <span class="zone-card__count">({{ zone.usedCount }}/{{ zone.totalCount }})</span>
      <span
        v-if="searchMatchCount"
        class="zone-card__search-count"
      >匹配 {{ searchMatchCount }}</span>
    </div>
    <div class="zone-card__grid">
      <SlotCell
        v-for="slot in zone.slots"
        :key="slot.id"
        :slot-data="slot"
        :selected="selectedSlotIds.has(slot.id)"
        :is-move-source="moveSourceId === slot.id"
        :is-move-target="isMoveMode && !!moveSourceId && slot.status === 'empty'"
        :is-search-hit="searchHitIds?.has(slot.id)"
        :visible="visibleSlotIds === null || visibleSlotIds.has(slot.id)"
        @click="emit('slotClick', slot)"
      />
    </div>
  </div>
</template>

<style scoped>
.zone-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.zone-card__header {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.zone-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.zone-card__count {
  font-size: 12px;
  color: #909399;
}

.zone-card__search-count {
  font-size: 11px;
  color: #e6a23c;
  margin-left: auto;
}

.zone-card__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
</style>
