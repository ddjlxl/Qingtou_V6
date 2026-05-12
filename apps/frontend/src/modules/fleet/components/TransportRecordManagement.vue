<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import { fleetService } from '../services/fleetService'
import { isApiError } from '@/shared/utils'
import EmptyState from '@/shared/components/EmptyState.vue'

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
    <div class="filter-bar">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
      />
      <el-select
        v-model="vehicleFilter"
        placeholder="选择车辆"
        clearable
        style="width: 160px"
      >
        <el-option
          v-for="v in vehicleOptions"
          :key="v.id"
          :label="v.plate_no"
          :value="v.id"
        />
      </el-select>
      <el-select
        v-model="driverFilter"
        placeholder="选择司机"
        clearable
        style="width: 160px"
      >
        <el-option
          v-for="d in driverOptions"
          :key="d.id"
          :label="d.name"
          :value="d.id"
        />
      </el-select>
      <el-button
        type="primary"
        @click="handleSearch"
      >
        查询
      </el-button>
      <el-button @click="handleReset">
        重置
      </el-button>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-upload
          :show-file-list="false"
          :before-upload="() => false"
          :on-change="handleFileChange"
          accept=".txt,.xlsx"
        >
          <el-button
            type="primary"
            :loading="importLoading"
          >
            导入运输流水
          </el-button>
        </el-upload>
        <el-button @click="handleDownloadTemplate">
          下载模板
        </el-button>
      </div>
    </div>

    <div
      v-if="fleetStore.transportRecordStatistics"
      class="statistics-section"
    >
      <div class="statistics-group">
        <div class="statistics-title">
          司机任务统计
        </div>
        <div
          v-for="item in fleetStore.transportRecordStatistics.byDriver"
          :key="item.driverId"
          class="statistics-item"
        >
          <span>{{ item.driverName }}</span>
          <el-tag type="primary">
            {{ item.count }} 单
          </el-tag>
        </div>
        <div
          v-if="fleetStore.transportRecordStatistics.byDriver.length === 0"
          class="statistics-empty"
        >
          暂无数据
        </div>
      </div>
      <div class="statistics-group">
        <div class="statistics-title">
          车辆任务统计
        </div>
        <div
          v-for="item in fleetStore.transportRecordStatistics.byVehicle"
          :key="item.vehicleId"
          class="statistics-item"
        >
          <span>{{ item.vehiclePlateNo }}</span>
          <el-tag type="success">
            {{ item.count }} 单
          </el-tag>
        </div>
        <div
          v-if="fleetStore.transportRecordStatistics.byVehicle.length === 0"
          class="statistics-empty"
        >
          暂无数据
        </div>
      </div>
    </div>

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

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.statistics-section {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.statistics-group {
  flex: 1;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px 16px;
}

.statistics-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.statistics-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
}

.statistics-empty {
  font-size: 13px;
  color: #c0c4cc;
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