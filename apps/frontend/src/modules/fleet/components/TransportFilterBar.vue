<script setup lang="ts">
defineProps<{
  dateRange: [string, string] | null
  vehicleFilter: string
  driverFilter: string
  vehicleOptions: Array<{ id: string; plate_no: string }>
  driverOptions: Array<{ id: string; name: string }>
  importLoading: boolean
}>()

const emit = defineEmits<{
  'update:dateRange': [value: [string, string] | null]
  'update:vehicleFilter': [value: string]
  'update:driverFilter': [value: string]
  search: []
  reset: []
  'file-change': [file: unknown]
  'download-template': []
}>()
</script>

<template>
  <div class="transport-filter-bar">
    <div class="filter-row">
      <el-date-picker
        :model-value="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="业务开始日期"
        end-placeholder="业务结束日期"
        value-format="YYYY-MM-DD"
        style="width: 280px"
        @update:model-value="emit('update:dateRange', $event as [string, string] | null)"
      />
      <el-select
        :model-value="vehicleFilter"
        placeholder="选择车辆"
        clearable
        style="width: 160px"
        @update:model-value="emit('update:vehicleFilter', $event)"
      >
        <el-option
          v-for="v in vehicleOptions"
          :key="v.id"
          :label="v.plate_no"
          :value="v.id"
        />
      </el-select>
      <el-select
        :model-value="driverFilter"
        placeholder="选择司机"
        clearable
        style="width: 160px"
        @update:model-value="emit('update:driverFilter', $event)"
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
        @click="emit('search')"
      >
        查询
      </el-button>
      <el-button @click="emit('reset')">
        重置
      </el-button>
    </div>

    <div class="toolbar-row">
      <div class="toolbar-left">
        <el-upload
          :show-file-list="false"
          :before-upload="() => false"
          :on-change="(file: unknown) => emit('file-change', file)"
          accept=".txt,.xlsx"
        >
          <el-button
            type="primary"
            :loading="importLoading"
          >
            导入运输流水
          </el-button>
        </el-upload>
        <el-button @click="emit('download-template')">
          下载模板
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}
</style>