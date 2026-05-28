<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Slot } from '../types'

const props = withDefaults(
  defineProps<{
    slotData: Slot
    selected?: boolean
    isMoveSource?: boolean
    isMoveTarget?: boolean
    isSearchHit?: boolean
    isSearching?: boolean
    visible?: boolean
  }>(),
  {
    selected: false,
    isMoveSource: false,
    isMoveTarget: false,
    isSearchHit: false,
    isSearching: false,
    visible: true,
  }
)

const emit = defineEmits<{
  (e: 'click', slotData: Slot): void
}>()

const statusClass: Record<string, string> = {
  empty: 'slot--empty',
  loaded: 'slot--loaded',
  empty_container: 'slot--empty-container',
}

const statusText: Record<string, string> = {
  loaded: '重箱',
  empty_container: '空箱',
}

const tooltipContent = computed(() => {
  if (!props.visible) return ''
  const s = props.slotData
  if (s.status === 'empty') return `库位：${s.slotNo}\n状态：空位`
  const lines = [`箱号：${s.containerNo}`]
  lines.push(`状态：${statusText[s.status] || s.status}`)
  if (s.customerName) lines.push(`货主：${s.customerName}`)
  if (s.containerType) lines.push(`箱型：${s.containerType}`)
  if (s.sealNo) lines.push(`封号：${s.sealNo}`)
  lines.push(`库位：${s.slotNo}`)
  if (s.storedAt) lines.push(`入库：${dayjs(s.storedAt).format('YYYY-MM-DD HH:mm')}`)
  return lines.join('\n')
})

function handleClick() {
  if (!props.visible) return
  emit('click', props.slotData)
}
</script>

<template>
  <div
    class="slot-cell"
    :class="[
      visible ? statusClass[props.slotData.status] : 'slot--hidden',
      { 'slot--selected': selected, 'slot--move-source': isMoveSource, 'slot--move-target': isMoveTarget, 'slot--search-hit': isSearchHit, 'slot--search-dimmed': isSearching && !isSearchHit },
    ]"
    :title="tooltipContent"
    @click="handleClick"
  >
    <span class="slot-cell__label">
      {{ props.slotData.containerNo || '' }}
    </span>
    <span
      v-if="selected"
      class="slot-cell__check"
    >&#10003;</span>
  </div>
</template>

<style scoped>
.slot-cell {
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  cursor: default;
  transition: transform 0.15s;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}

.slot-cell:hover {
  transform: scale(1.05);
}

.slot--empty {
  background: #e8e8e8;
  color: #999;
  cursor: pointer;
}

.slot--hidden {
  background: #f5f5f5;
  cursor: default;
  opacity: 0.3;
}

.slot--loaded {
  background: #409eff;
  color: #fff;
}

.slot--empty-container {
  background: #67c23a;
  color: #fff;
  cursor: pointer;
}

.slot--selected {
  outline: 2px solid #409eff;
  outline-offset: -2px;
  position: relative;
}

.slot-cell__check {
  position: absolute;
  top: 1px;
  right: 2px;
  font-size: 10px;
  color: #fff;
}

.slot--move-source {
  animation: blink 0.5s infinite;
}

.slot--move-target {
  border: 2px dashed #67c23a;
  cursor: pointer;
}

.slot--search-hit {
  outline: 3px solid #ff9900;
  outline-offset: -2px;
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(255, 153, 0, 0.5);
  z-index: 1;
}

.slot--search-dimmed {
  opacity: 0.4;
}

@media (max-width: 600px) {
  .slot-cell {
    height: 40px;
    font-size: 12px;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
