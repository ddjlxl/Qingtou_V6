<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { dispatchService } from '../services/dispatchService'
import type { RouteTemplate } from '../types/order'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const loading = ref(false)
const templates = ref<RouteTemplate[]>([])
const editingMap = ref<Record<string, { originName: string; waypoints: string[]; destName: string }>>({})

const businessTypeLabels: Record<string, string> = {
  heavy_transport: '重箱运输',
  empty_transport: '空箱运输',
  short_haul: '短驳',
}

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await fetchTemplates()
    }
  }
)

async function fetchTemplates() {
  loading.value = true
  try {
    const res = await dispatchService.listRouteTemplates()
    templates.value = res.items
    editingMap.value = {}
    for (const t of res.items) {
      if (t.businessType) {
        editingMap.value[t.businessType] = {
          originName: t.originName,
          waypoints: t.waypoints ? [...t.waypoints] : [],
          destName: t.destName,
        }
      }
    }
  } catch {
    ElMessage.error('获取路线模板失败')
  } finally {
    loading.value = false
  }
}

function addWaypoint(businessType: string) {
  const edit = editingMap.value[businessType]
  if (edit) {
    edit.waypoints.push('')
  }
}

function removeWaypoint(businessType: string, index: number) {
  const edit = editingMap.value[businessType]
  if (edit) {
    edit.waypoints.splice(index, 1)
  }
}

async function handleSave(businessType: string) {
  const edit = editingMap.value[businessType]
  if (!edit) return

  const waypoints = edit.waypoints.filter((w) => w.trim() !== '')
  try {
    await dispatchService.updateRouteTemplate(businessType, {
      originName: edit.originName,
      waypoints: waypoints.length > 0 ? waypoints : null,
      destName: edit.destName,
    })
    ElMessage.success('路线模板已更新')
  } catch {
    ElMessage.error('更新路线模板失败')
  }
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="路线模板管理"
    width="650px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div v-loading="loading">
      <div
        v-for="tpl in templates"
        :key="tpl.businessType"
        class="route-template-item"
      >
        <template v-if="tpl.businessType && editingMap[tpl.businessType]">
          <h4 class="route-template-item__title">
            {{ businessTypeLabels[tpl.businessType] || tpl.businessType }}
          </h4>
          <div class="route-template-item__row">
            <label>启运地</label>
            <el-input
              v-model="editingMap[tpl.businessType].originName"
              placeholder="启运地"
            />
          </div>
          <div class="route-template-item__row">
            <label>途径点</label>
            <div class="route-template-item__waypoints">
              <div
                v-for="(_, idx) in editingMap[tpl.businessType].waypoints"
                :key="idx"
                class="route-template-item__waypoint-row"
              >
                <el-input
                  v-model="editingMap[tpl.businessType].waypoints[idx]"
                  placeholder="途径点"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="removeWaypoint(tpl.businessType, idx)"
                />
              </div>
              <el-button
                type="primary"
                size="small"
                @click="addWaypoint(tpl.businessType)"
              >
                + 添加途径点
              </el-button>
            </div>
          </div>
          <div class="route-template-item__row">
            <label>目的地</label>
            <el-input
              v-model="editingMap[tpl.businessType].destName"
              placeholder="目的地"
            />
          </div>
          <div class="route-template-item__actions">
            <el-button
              type="primary"
              @click="handleSave(tpl.businessType)"
            >
              保存
            </el-button>
          </div>
        </template>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.route-template-item {
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.route-template-item__title {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #303133;
}

.route-template-item__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.route-template-item__row label {
  width: 60px;
  line-height: 32px;
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
}

.route-template-item__waypoints {
  flex: 1;
}

.route-template-item__waypoint-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.route-template-item__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>