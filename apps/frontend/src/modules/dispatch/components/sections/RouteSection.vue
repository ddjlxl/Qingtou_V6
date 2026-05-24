<script setup lang="ts">
import { computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import type { OrderFormState } from '../../composables/useOrderForm'

const props = defineProps<{
  form: OrderFormState
  disabled: boolean
  routeSummary: string
}>()

const emit = defineEmits<{
  addWaypoint: []
  removeWaypoint: [index: number]
  openAddressDialog: []
  'update:originName': [value: string]
  'update:destName': [value: string]
  'update:waypoint': [index: number, value: string]
}>()

const originName = computed({
  get: () => props.form.originName,
  set: (val) => emit('update:originName', val),
})

const destName = computed({
  get: () => props.form.destName,
  set: (val) => emit('update:destName', val),
})

function onWaypointInput(index: number, value: string) {
  emit('update:waypoint', index, value)
}
</script>

<template>
  <el-divider content-position="left">
    路线规划
  </el-divider>
  <el-row :gutter="16">
    <el-col :span="14">
      <el-form-item label="起运地">
        <el-input
          v-model="originName"
          :disabled="disabled"
          placeholder="请输入起运地"
          clearable
        >
          <template #append>
            <el-button :disabled="disabled" @click="emit('openAddressDialog')">
              常用
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <div class="route-section__waypoints">
        <div
          v-for="(_, index) in form.waypoints"
          :key="index"
          class="route-section__waypoint-item"
        >
          <el-form-item :label="`途径点${index + 1}`">
            <el-input
              :model-value="form.waypoints[index]"
              :disabled="disabled"
              placeholder="请输入途径点"
              @input="onWaypointInput(index, $event)"
            >
              <template #append>
                <el-button
                  type="danger"
                  :icon="Delete"
                  :disabled="disabled"
                  @click="emit('removeWaypoint', index)"
                />
              </template>
            </el-input>
          </el-form-item>
        </div>
        <el-button
          v-if="!disabled"
          type="primary"
          link
          @click="emit('addWaypoint')"
        >
          + 添加途径点
        </el-button>
      </div>

      <el-form-item label="目的地">
        <el-input
          v-model="destName"
          :disabled="disabled"
          placeholder="请输入目的地"
          clearable
        >
          <template #append>
            <el-button :disabled="disabled" @click="emit('openAddressDialog')">
              常用
            </el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-col>
    <el-col :span="10">
      <el-card
        shadow="never"
        class="route-section__summary"
      >
        <template #header>
          <span>路线预览</span>
        </template>
        <p
          v-if="routeSummary"
          class="route-section__route-text"
        >
          {{ routeSummary }}
        </p>
        <p
          v-else
          class="route-section__route-placeholder"
        >
          填写起运地和目的地后自动生成
        </p>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
.route-section__waypoints {
  margin-bottom: 16px;
}

.route-section__waypoint-item {
  margin-bottom: 8px;
}

.route-section__summary {
  height: 100%;
}

.route-section__route-text {
  color: #409eff;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
}

.route-section__route-placeholder {
  color: #909399;
  font-size: 13px;
}
</style>