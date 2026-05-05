<template>
  <div>
    <el-table
      v-loading="loading"
      :data="pagedData"
      empty-text="暂无数据"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
      />
    </el-table>
    <el-pagination
      v-if="pagination && total > pageSize"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      class="mt-4"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Column {
  prop: string
  label: string
  width?: string
}

const props = withDefaults(
  defineProps<{
    columns: Column[]
    data: Record<string, unknown>[]
    loading?: boolean
    pagination?: boolean
    pageSize?: number
  }>(),
  {
    loading: false,
    pagination: false,
    pageSize: 20,
  },
)

const currentPage = ref(1)
const total = computed(() => props.data.length)

const pagedData = computed(() => {
  if (!props.pagination) return props.data
  const start = (currentPage.value - 1) * props.pageSize
  return props.data.slice(start, start + props.pageSize)
})
</script>
