<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import { fleetService } from '../services/fleetService'
import { isApiError } from '@/shared/utils'
import EmptyState from '@/shared/components/EmptyState.vue'
import TransportFilterBar from './TransportFilterBar.vue'
import TransportStatistics from './TransportStatistics.vue'

const fleetStore = useFleetStore()

const dateRange = ref<[string, string] | null>(null)
const vehicleFilter = ref('')
const driverFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const importLoading = ref(false)

const vehicleOptions = ref<Array<{ id: string; plate_no: string }>>([])
const driverOptions = ref<Array<{ id: string; name: string }>>([])

async function loadTransportRecords() {
  const params: Record<string, unknown> = {
    page: currentPage.value,
    page_size: pageSize.value,
  }
  if (dateRange.value && dateRange.value[0]) {
    params.start_date = dateRange.value[0]
  }
  if (dateRange.value && dateRange.value[1]) {
    params.end_date = dateRange.value[1]
  }
  if (vehicleFilter.value) {
    params.vehicle_id = vehicleFilter.value
  }
  if (driverFilter.value) {
    params.driver_id = driverFilter.value
  }
  await fleetStore.fetchTransportRecords(params)
}

async function loadFilterOptions() {
  try {
    const [vehiclesRes, driversRes] = await Promise.all([
      fleetService.getVehicles({ pageSize: 100 }),
      fleetService.getDrivers({ pageSize: 100 }),
    ])
    vehicleOptions.value = vehiclesRes.items.map((v) => ({
      id: v.id,
      plate_no: v.plateNo,
    }))
    driverOptions.value = driversRes.items.map((d) => ({
      id: d.id,
      name: d.name,
    }))
  } catch {
    // 筛选选项加载失败不影响主流程
  }
}

function handleSearch() {
  currentPage.value = 1
  loadTransportRecords()
}

function handleReset() {
  dateRange.value = null
  vehicleFilter.value = ''
  driverFilter.value = ''
  currentPage.value = 1
  loadTransportRecords()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadTransportRecords()
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  loadTransportRecords()
}

async function handleImport(file: File) {
  importLoading.value = true
  try {
    const result = await fleetStore.importTransportRecords(file)
    ElMessage.success(
      `导入完成：成功 ${result.successCount} 条，重复 ${result.duplicateCount} 条，错误 ${result.errorCount} 条`
    )
    await loadTransportRecords()
  } catch (err: unknown) {
    const message = isApiError(err) ? err.message : '导入失败'
    ElMessage.error(message)
  } finally {
    importLoading.value = false
  }
}

function handleFileChange(file: unknown) {
  const rawFile = (file as { raw?: File })?.raw
  if (!rawFile) return
  const fileName = rawFile.name.toLowerCase()
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.txt')) {
    ElMessage.error('仅支持 Excel (.xlsx) 或 txt 格式')
    return
  }
  handleImport(rawFile)
}

async function handleDownloadTemplate() {
  try {
    await fleetStore.downloadTransportRecordTemplate()
    ElMessage.success('模板下载成功')
  } catch (err: unknown) {
    const message = isApiError(err) ? err.message : '下载模板失败'
    ElMessage.error(message)
  }
}

onMounted(() => {
  loadTransportRecords()
  loadFilterOptions()
  fleetStore.fetchTransportRecordStatistics()
})
</script>

<template>
  <div class="transport-record-management">
    <TransportFilterBar
      :date-range="dateRange"
      :vehicle-filter="vehicleFilter"
      :driver-filter="driverFilter"
      :vehicle-options="vehicleOptions"
      :driver-options="driverOptions"
      :import-loading="importLoading"
      @update:date-range="dateRange = $event"
      @update:vehicle-filter="vehicleFilter = $event"
      @update:driver-filter="driverFilter = $event"
      @search="handleSearch"
      @reset="handleReset"
      @file-change="handleFileChange"
      @download-template="handleDownloadTemplate"
    />

    <TransportStatistics :statistics="fleetStore.transportRecordStatistics" />

    <el-alert
      v-if="fleetStore.transportRecordError"
      :title="fleetStore.transportRecordError"
      type="error"
      show-icon
      closable
      class="error-alert"
    />

    <el-table
      v-loading="fleetStore.transportRecordLoading"
      :data="fleetStore.transportRecords"
      style="width: 100%"
    >
      <el-table-column
        prop="orderNo"
        label="任务编号"
        min-width="120"
      />
      <el-table-column
        prop="customerInfo"
        label="客户信息"
        min-width="120"
      />
      <el-table-column
        prop="origin"
        label="起运地"
        min-width="100"
      />
      <el-table-column
        label="途径地"
        min-width="140"
      >
        <template #default="{ row }">
          {{ row.waypoints && row.waypoints.length > 0 ? row.waypoints.join(' → ') : '-' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="destination"
        label="目的地"
        min-width="100"
      />
      <el-table-column
        prop="containerNo"
        label="箱号"
        min-width="120"
      />
      <el-table-column
        prop="containerStatus"
        label="空重箱"
        min-width="80"
      >
        <template #default="{ row }">
          {{ row.containerStatus === 'heavy' ? '重箱' : row.containerStatus === 'empty' ? '空箱' : '-' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="vehiclePlateNo"
        label="执行车辆"
        min-width="120"
      >
        <template #default="{ row }">
          {{ row.vehiclePlateNo || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="driverName"
        label="执行司机"
        min-width="100"
      >
        <template #default="{ row }">
          {{ row.driverName || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="businessDate"
        label="业务日期"
        min-width="120"
      >
        <template #default="{ row }">
          {{ row.businessDate || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="importedAt"
        label="导入时间"
        min-width="160"
      />
    </el-table>

    <EmptyState
      v-if="!fleetStore.transportRecordLoading && fleetStore.transportRecords.length === 0"
      description="暂无运输流水数据"
    />

    <div
      v-if="fleetStore.transportRecordTotal > 0"
      class="pagination-wrapper"
    >
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="fleetStore.transportRecordTotal"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.transport-record-management {
  padding: 16px 0;
}

.error-alert {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>