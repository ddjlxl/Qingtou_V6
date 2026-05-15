<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useDispatchStore } from '../stores/useDispatchStore'
import type { Order } from '../types/order'

const props = defineProps<{
  visible: boolean
  order: Order | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const store = useDispatchStore()

const selectedDriverId = ref('')
const selectedVehicleId = ref('')
const submitting = ref(false)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      selectedDriverId.value = ''
      selectedVehicleId.value = ''
      store.fetchAvailableResources()
    }
  }
)

watch(selectedVehicleId, (val) => {
  if (val) {
    const vehicle = store.availableVehicles.find((v) => v.id === val)
    if (vehicle?.boundDriverName) {
      const driver = store.availableDrivers.find(
        (d) => d.name === vehicle.boundDriverName
      )
      if (driver) {
        selectedDriverId.value = driver.id
      }
    }
  }
})

watch(selectedDriverId, (val) => {
  if (val) {
    const driver = store.availableDrivers.find((d) => d.id === val)
    if (driver?.boundVehiclePlateNo) {
      const vehicle = store.availableVehicles.find(
        (v) => v.plateNo === driver.boundVehiclePlateNo
      )
      if (vehicle) {
        selectedVehicleId.value = vehicle.id
      }
    }
  }
})

async function handleAssign() {
  if (!props.order || !selectedDriverId.value || !selectedVehicleId.value) return

  submitting.value = true
  try {
    await store.assignOrder(props.order.id, {
      driverId: selectedDriverId.value,
      vehicleId: selectedVehicleId.value,
    })
    ElMessage.success('分配成功')
    emit('update:visible', false)
    emit('success')
  } catch {
    // error handled by store
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="分配任务"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div
      v-if="order"
      class="assign-dialog__info"
    >
      <p><strong>任务编号：</strong>{{ order.orderNo }}</p>
      <p><strong>路线：</strong>{{ [order.originName, order.destName].filter(Boolean).join(' → ') || '-' }}</p>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="assign-dialog__section">
          <h4>选择司机</h4>
          <div
            v-if="store.availableDrivers.length === 0"
            class="assign-dialog__empty"
          >
            暂无可分配的司机
          </div>
          <el-radio-group
            v-else
            v-model="selectedDriverId"
            class="assign-dialog__list"
          >
            <el-radio
              v-for="d in store.availableDrivers"
              :key="d.id"
              :value="d.id"
              class="assign-dialog__item"
            >
              <span>{{ d.name }}</span>
              <span class="assign-dialog__phone">{{ d.phone }}</span>
            </el-radio>
          </el-radio-group>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="assign-dialog__section">
          <h4>选择车辆</h4>
          <div
            v-if="store.availableVehicles.length === 0"
            class="assign-dialog__empty"
          >
            暂无可分配的车辆
          </div>
          <el-radio-group
            v-else
            v-model="selectedVehicleId"
            class="assign-dialog__list"
          >
            <el-radio
              v-for="v in store.availableVehicles"
              :key="v.id"
              :value="v.id"
              class="assign-dialog__item"
            >
              <span>{{ v.plateNo }}</span>
            </el-radio>
          </el-radio-group>
        </div>
      </el-col>
    </el-row>

    <template #footer>
      <div class="assign-dialog__footer">
        <el-button @click="handleClose">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!selectedDriverId || !selectedVehicleId"
          @click="handleAssign"
        >
          确认分配
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.assign-dialog__info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.assign-dialog__info p {
  margin: 4px 0;
  font-size: 14px;
}

.assign-dialog__section {
  min-height: 200px;
}

.assign-dialog__section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.assign-dialog__empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

.assign-dialog__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assign-dialog__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin: 0;
}

.assign-dialog__phone {
  color: #909399;
  font-size: 12px;
}

.assign-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>