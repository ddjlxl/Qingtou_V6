<script setup lang="ts">
import type { Slot } from '../types'

const props = withDefaults(
  defineProps<{
    slotData: Slot
    selected?: boolean
    isMoveSource?: boolean
    isMoveTarget?: boolean
    isSearchHit?: boolean
    visible?: boolean
  }>(),
  {
    selected: false,
    isMoveSource: false,
    isMoveTarget: false,
    isSearchHit: false,
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

const statusLabel: Record<string, string> = {
  empty: '',
  loaded: '重',
  empty_container: '空',
}

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
      { 'slot--selected': selected, 'slot--move-source': isMoveSource, 'slot--move-target': isMoveTarget, 'slot--search-hit': isSearchHit },
    ]"
    :title="visible ? (props.slotData.containerNo || props.slotData.slotNo) : ''"
    @click="handleClick"
  >
    <span class="slot-cell__label">
      {{ statusLabel[props.slotData.status] || '' }}
    </span>
    <span
      v-if="selected"
      class="slot-cell__check"
    >&#10003;</span>
  </div>
</template>

<style scoped>
.slot-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  cursor: default;
  transition: transform 0.15s;
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
  outline: 2px solid #e6a23c;
  outline-offset: -2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
