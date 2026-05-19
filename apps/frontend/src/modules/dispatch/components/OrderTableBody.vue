<script setup lang="ts">
import type { Order } from '../types/order'
import {
  statusTagConfig,
  documentLabels,
  formatRoute,
  formatDateTime,
  canEdit,
  canAssign,
  canComplete,
  needsDeleteConfirm,
  getDeleteConfirmMessage,
} from './useOrderTable'

defineProps<{
  orders: Order[]
}>()

const emit = defineEmits<{
  edit: [order: Order]
  assign: [order: Order]
  complete: [order: Order]
  delete: [order: Order]
}>()
</script>

<template>
  <el-table
    :data="orders"
    stripe
    style="width: 100%"
  >
    <el-table-column
      prop="orderNo"
      label="任务编号"
      width="160"
      align="center"
    />
    <el-table-column
      label="客户名称"
      width="120"
    >
      <template #default="{ row }">
        {{ row.customerName || '-' }}
      </template>
    </el-table-column>
    <el-table-column
      label="路线"
      width="300"
    >
      <template #default="{ row }">
        <span class="order-table-body__route">{{ formatRoute(row) }}</span>
      </template>
    </el-table-column>
    <el-table-column
      label="箱号"
      width="140"
      align="center"
    >
      <template #default="{ row }">
        {{ row.containerNo || '-' }}
      </template>
    </el-table-column>
    <el-table-column
      label="箱型"
      width="80"
      align="center"
    >
      <template #default="{ row }">
        {{ row.containerType || '-' }}
      </template>
    </el-table-column>
    <el-table-column
      label="单证"
      width="160"
      align="center"
    >
      <template #default="{ row }">
        <template v-if="row.documents && row.documents.length > 0">
          <el-tag
            v-for="doc in row.documents"
            :key="doc"
            size="small"
            style="margin-right: 4px"
          >
            {{ documentLabels[doc] || doc }}
          </el-tag>
        </template>
        <span v-else>-</span>
      </template>
    </el-table-column>
    <el-table-column
      label="司机/车牌"
      width="160"
      align="center"
    >
      <template #default="{ row }">
        {{ row.driverName || '-' }} / {{ row.vehiclePlateNo || '-' }}
      </template>
    </el-table-column>
    <el-table-column
      label="状态"
      width="90"
      align="center"
    >
      <template #default="{ row }">
        <el-tag
          :type="statusTagConfig[row.status]?.type || 'info'"
          size="small"
        >
          {{ statusTagConfig[row.status]?.label || row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      label="创建时间"
      width="160"
      align="center"
    >
      <template #default="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </el-table-column>
    <el-table-column
      label="操作"
      width="200"
      align="center"
      fixed="right"
    >
      <template #default="{ row }">
        <el-button
          v-if="canAssign(row)"
          type="primary"
          size="small"
          link
          @click="emit('assign', row)"
        >
          分配
        </el-button>
        <el-button
          v-if="canEdit(row)"
          size="small"
          link
          @click="emit('edit', row)"
        >
          编辑
        </el-button>
        <el-button
          v-if="canComplete(row)"
          type="success"
          size="small"
          link
          @click="emit('complete', row)"
        >
          标记完成
        </el-button>
        <el-popconfirm
          v-if="needsDeleteConfirm(row)"
          :title="getDeleteConfirmMessage(row)"
          confirm-button-text="确定"
          cancel-button-text="取消"
          @confirm="emit('delete', row)"
        >
          <template #reference>
            <el-button
              type="danger"
              size="small"
              link
            >
              删除
            </el-button>
          </template>
        </el-popconfirm>
        <el-button
          v-else
          type="danger"
          size="small"
          link
          @click="emit('delete', row)"
        >
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.order-table-body__route {
  color: #606266;
}
</style>