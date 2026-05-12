<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import { VehicleStatus } from '../types/vehicle'
import type { Vehicle } from '../types/vehicle'
import { isApiError } from '@/shared/utils'
import StatusTag from './StatusTag.vue'
import VehicleFormDialog from './VehicleFormDialog.vue'
import { fleetService } from '../services/fleetService'

const fleetStore = useFleetStore()

const statusFilter = ref<string>('')
const dialogVisible = ref(false)
const editingVehicle = ref<Vehicle | null>(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '空闲', value: VehicleStatus.IDLE },
  { label: '运输中', value: VehicleStatus.TRANSITING },
  { label: '超时', value: VehicleStatus.OVERDUE },
]

async function loadVehicles() {
  const params = statusFilter.value
    ? { status: statusFilter.value as VehicleStatus }
    : undefined
  await fleetStore.fetchVehicles(params)
}

function handleStatusChange() {
  loadVehicles()
}

function handleAdd() {
  editingVehicle.value = null
  dialogVisible.value = true
}

function handleEdit(vehicle: Vehicle) {
  editingVehicle.value = vehicle
  dialogVisible.value = true
}

async function handleDisable(vehicle: Vehicle) {
  try {
    await ElMessageBox.confirm(
      `确定要停用车辆 ${vehicle.plateNo} 吗？`,
      '停用确认',
      { type: 'warning' }
    )
    await fleetStore.disableVehicle(vehicle.id)
    ElMessage.success('车辆已停用')
  } catch (err: unknown) {
    if (err === 'cancel') return
    const message = isApiError(err) ? err.message : '停用失败'
    ElMessage.error(message)
  }
}

async function handleDelete(vehicle: Vehicle) {
  try {
    await ElMessageBox.confirm(
      `确定要删除车辆 ${vehicle.plateNo} 吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning' }
    )
    await fleetService.deleteVehicle(vehicle.id)
    ElMessage.success('车辆已删除')
    await loadVehicles()
  } catch (err: unknown) {
    if (err === 'cancel') return
    const message = isApiError(err) ? err.message : '删除失败'
    ElMessage.error(message)
  }
}

function handleDialogSuccess() {
  loadVehicles()
}

onMounted(() => {
  loadVehicles()
})
</script>

<template>
  <div class="vehicle-management">
    <div class="toolbar">
      <el-select
        v-model="statusFilter"
        placeholder="状态筛选"
        clearable
        style="width: 140px"
        @change="handleStatusChange"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-button
        type="primary"
        @click="handleAdd"
      >
        新增车辆
      </el-button>
    </div>

    <el-table
      v-loading="fleetStore.vehicleLoading"
      :data="fleetStore.vehicles"
      style="width: 100%"
    >
      <el-table-column
        prop="plateNo"
        label="车牌号"
        min-width="120"
      />
      <el-table-column
        prop="ownership"
        label="归属性质"
        min-width="100"
      >
        <template #default="{ row }">
          {{ row.ownership === 'own' ? '自有车辆' : '外协车辆' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="boundDriverName"
        label="关联司机"
        min-width="120"
      >
        <template #default="{ row }">
          {{ row.boundDriverName || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="status"
        label="状态"
        min-width="100"
      >
        <template #default="{ row }">
          <StatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        min-width="180"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :disabled="row.isDisabled"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="!row.isDisabled"
            type="warning"
            link
            @click="handleDisable(row)"
          >
            停用
          </el-button>
          <el-button
            type="danger"
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <VehicleFormDialog
      v-model:visible="dialogVisible"
      :vehicle="editingVehicle"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<style scoped>
.vehicle-management {
  padding: 16px 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>