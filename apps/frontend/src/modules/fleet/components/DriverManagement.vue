<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import type { Driver } from '../types/driver'
import { isApiError } from '@/shared/utils'
import DriverFormDialog from './DriverFormDialog.vue'

const fleetStore = useFleetStore()

const dialogVisible = ref(false)
const editingDriver = ref<Driver | null>(null)

async function loadDrivers() {
  await fleetStore.fetchDrivers()
}

function handleAdd() {
  editingDriver.value = null
  dialogVisible.value = true
}

function handleEdit(driver: Driver) {
  editingDriver.value = driver
  dialogVisible.value = true
}

async function handleDisable(driver: Driver) {
  try {
    await ElMessageBox.confirm(
      `确定要停用司机 ${driver.name} 吗？`,
      '停用确认',
      { type: 'warning' }
    )
    await fleetStore.disableDriver(driver.id)
    ElMessage.success('司机已停用')
  } catch (err: unknown) {
    if (err === 'cancel') return
    const message = isApiError(err) ? err.message : '停用失败'
    ElMessage.error(message)
  }
}

async function handleDelete(driver: Driver) {
  try {
    await ElMessageBox.confirm(
      `确定要删除司机 ${driver.name} 吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning' }
    )
    await fleetStore.deleteDriver(driver.id)
    ElMessage.success('司机已删除')
    await loadDrivers()
  } catch (err: unknown) {
    if (err === 'cancel') return
    const message = isApiError(err) ? err.message : '删除失败'
    ElMessage.error(message)
  }
}

function handleDialogSuccess() {
  loadDrivers()
}

onMounted(() => {
  loadDrivers()
})
</script>

<template>
  <div class="driver-management">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">新增司机</el-button>
    </div>

    <el-table
      v-loading="fleetStore.driverLoading"
      :data="fleetStore.drivers"
      style="width: 100%"
    >
      <template #empty>
        <EmptyState description="暂无司机数据" />
      </template>
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="phone" label="手机号" min-width="140" />
      <el-table-column prop="boundVehiclePlateNo" label="关联车辆" min-width="120">
        <template #default="{ row }">
          {{ row.boundVehiclePlateNo || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" fixed="right">
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

    <DriverFormDialog
      v-model:visible="dialogVisible"
      :driver="editingDriver"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<style scoped>
.driver-management {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
</style>