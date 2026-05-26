<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWarehouseStore } from '../stores/useWarehouseStore'
import { useWarehouseSearch } from '../composables/useWarehouseSearch'
import StatisticsPanel from '../components/StatisticsPanel.vue'
import ZoneCard from '../components/ZoneCard.vue'
import ManualInboundDialog from '../components/ManualInboundDialog.vue'
import ImportInboundDialog from '../components/ImportInboundDialog.vue'
import OutboundDialog from '../components/OutboundDialog.vue'
import SlotEditDialog from '../components/SlotEditDialog.vue'
import type { SlotFilter, Slot } from '../types'

const store = useWarehouseStore()
const { keyword, searchHighlights, zoneCounts, searchTotal, clearSearch } = useWarehouseSearch()

const filterOptions: { label: string; value: SlotFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '重箱', value: 'heavy' },
  { label: '空箱', value: 'empty' },
  { label: '空位', value: 'empty_slot' },
]

const manualInboundVisible = ref(false)
const importInboundVisible = ref(false)
const outboundVisible = ref(false)
const editVisible = ref(false)
const editingSlot = ref<Slot | null>(null)
const selectedZoneCode = ref('')

const searchHitIds = computed(() => new Set(searchHighlights.value.keys()))

const statusToggleVisible = computed(() => {
  if (store.selectedSlots.length === 0) return false

  if (store.selectedSlots.length === 1) {
    const slot = store.selectedSlots[0]
    return slot.status === 'empty_container' || slot.status === 'loaded'
  }

  return store.selectedSlots.every((s) => s.containerStatus === 'empty')
})

const statusToggleLabel = computed(() => {
  const count = store.selectedSlots.length

  if (count === 1) {
    const slot = store.selectedSlots[0]
    if (slot?.containerStatus === 'empty') return '标记为重箱'
    if (slot?.containerStatus === 'heavy') return '标记为空箱'
    return ''
  }

  return `批量标记为重箱 (${count})`
})

watch(searchHighlights, (val) => {
  store.setSearchHighlights(val, zoneCounts.value)
})

watch(keyword, (val) => {
  if (!val) {
    store.clearSearchHighlights()
  }
})

onMounted(() => {
  store.init()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && store.isMoveMode) {
    store.toggleMoveMode()
  }
}

function handleSlotClick(slotData: Slot) {
  if (store.isMoveMode) {
    if (slotData.status === 'empty' && store.moveSourceSlot) {
      store.move(store.moveSourceSlot.id, slotData.id).catch((err: { message?: string }) => {
        ElMessage.error(err.message || '移动失败')
      })
    } else if (slotData.status !== 'empty') {
      store.setMoveSource(slotData)
    }
    return
  }

  if (slotData.status === 'empty') {
    selectedZoneCode.value = slotData.zoneCode
    manualInboundVisible.value = true
  } else {
    store.toggleSlotSelection(slotData.id)
  }
}

function openManualInbound() {
  if (!selectedZoneCode.value && store.zones.length > 0) {
    selectedZoneCode.value = store.zones[0].zoneCode
  }
  manualInboundVisible.value = true
}

function openImportInbound() {
  if (!selectedZoneCode.value && store.zones.length > 0) {
    selectedZoneCode.value = store.zones[0].zoneCode
  }
  importInboundVisible.value = true
}

function openOutbound() {
  outboundVisible.value = true
}

function openEdit() {
  const slot = store.selectedSlots[0]
  if (!slot) return
  editingSlot.value = slot
  editVisible.value = true
}

async function toggleContainerStatus() {
  const slots = store.selectedSlots
  if (slots.length === 0) return

  const newStatus = slots[0].containerStatus === 'empty' ? 'heavy' : 'empty'

  if (newStatus === 'empty' && slots.length === 1) {
    try {
      await ElMessageBox.confirm(
        '将重箱改为空箱后，货物信息将被清除。确定继续？',
        '确认变更',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }

  try {
    const results = await Promise.allSettled(
      slots.map((slot) => store.updateSlot(slot.id, { containerStatus: newStatus }))
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      ElMessage.warning(`${slots.length - failed.length} 个成功，${failed.length} 个失败`)
    } else {
      ElMessage.success(`已更新 ${slots.length} 个库位状态`)
    }
  } catch (err: unknown) {
    const error = err as { message?: string }
    ElMessage.error(error.message || '状态更新失败')
  }
}
</script>

<template>
  <div class="warehouse-page">
    <div class="warehouse-page__sticky">
      <div class="warehouse-page__header">
        <h2>仓库总览</h2>
        <div class="warehouse-page__actions">
          <el-input
            v-model="keyword"
            placeholder="搜索箱号/货主"
            size="small"
            clearable
            style="width: 160px"
            @clear="clearSearch"
          />
          <el-select
            v-model="selectedZoneCode"
            placeholder="选择区域"
            size="small"
            style="width: 120px"
          >
            <el-option
              v-for="zone in store.zones"
              :key="zone.id"
              :label="zone.zoneCode"
              :value="zone.zoneCode"
            />
          </el-select>
          <el-button
            size="small"
            type="primary"
            :disabled="!selectedZoneCode || store.isMoveMode"
            @click="openManualInbound"
          >
            手动录入
          </el-button>
          <el-button
            size="small"
            :disabled="!selectedZoneCode || store.isMoveMode"
            @click="openImportInbound"
          >
            导入
          </el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="store.selectedSlots.length === 0 || store.isMoveMode"
            @click="openOutbound"
          >
            出库{{ store.selectedSlots.length > 0 ? `(${store.selectedSlots.length})` : '' }}
          </el-button>
          <el-button
            size="small"
            :type="store.isMoveMode ? 'warning' : 'default'"
            @click="store.toggleMoveMode()"
          >
            {{ store.isMoveMode ? '取消移动' : '移动' }}
          </el-button>
          <el-button
            size="small"
            :disabled="store.selectedSlots.length !== 1 || store.isMoveMode"
            @click="openEdit"
          >
            编辑
          </el-button>
          <el-button
            v-if="statusToggleVisible"
            size="small"
            :disabled="store.isMoveMode"
            @click="toggleContainerStatus"
          >
            {{ statusToggleLabel }}
          </el-button>
        </div>
      </div>

      <StatisticsPanel
        v-if="store.statistics"
        :stats="store.statistics"
      />

      <div
        v-if="store.isMoveMode"
        class="warehouse-page__move-hint"
      >
        <el-tag type="warning">
          移动模式：点击有箱库位选择源，再点击空位完成移动。按 ESC 键退出
        </el-tag>
      </div>

      <div
        v-if="keyword && searchTotal > 0"
        class="warehouse-page__search-hint"
      >
        <el-tag type="info">
          匹配 {{ searchTotal }} 个库位
        </el-tag>
      </div>

      <div class="warehouse-page__filter">
        <el-radio-group
          size="small"
          :model-value="store.filter"
          @update:model-value="store.setFilter"
        >
          <el-radio-button
            v-for="opt in filterOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div
      v-loading="store.loading"
      class="warehouse-page__zones"
    >
      <ZoneCard
        v-for="zone in store.zones"
        :key="zone.id"
        :zone="zone"
        :filter="store.filter"
        :selected-slot-ids="store.selectedSlotIds"
        :move-source-id="store.moveSourceSlot?.id"
        :is-move-mode="store.isMoveMode"
        :search-hit-ids="searchHitIds"
        :search-match-count="zoneCounts[zone.zoneCode]"
        @slot-click="handleSlotClick"
      />
    </div>

    <ManualInboundDialog
      v-model:visible="manualInboundVisible"
      :zone-code="selectedZoneCode"
    />

    <ImportInboundDialog
      v-model:visible="importInboundVisible"
      :zone-code="selectedZoneCode"
    />

    <OutboundDialog
      v-model:visible="outboundVisible"
      :selected-slots="store.selectedSlots"
    />

    <SlotEditDialog
      v-model:visible="editVisible"
      :slot-data="editingSlot"
    />
  </div>
</template>

<style scoped>
.warehouse-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.warehouse-page__sticky {
  flex-shrink: 0;
  background: #f5f7fa;
}

.warehouse-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.warehouse-page__header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.warehouse-page__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.warehouse-page__move-hint,
.warehouse-page__search-hint {
  margin-bottom: 12px;
}

.warehouse-page__filter {
  margin: 16px 0;
}

.warehouse-page__zones {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

@media (max-width: 900px) {
  .warehouse-page__zones {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .warehouse-page__zones {
    grid-template-columns: 1fr;
  }
}
</style>
