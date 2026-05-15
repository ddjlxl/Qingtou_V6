<script setup lang="ts">
import { Search, Loading } from '@element-plus/icons-vue'
import { useDispatchStore } from '../stores/useDispatchStore'
import { OrderStatus, DocumentType } from '../types/order'
import type { Order } from '../types/order'

const store = useDispatchStore()

const emit = defineEmits<{
  create: []
  edit: [order: Order]
  assign: [order: Order]
  complete: [order: Order]
  delete: [order: Order]
}>()

const tabs = [
  { value: 'all' as const, label: '全部' },
  { value: OrderStatus.PENDING, label: '待分配' },
  { value: OrderStatus.ASSIGNED, label: '已分配' },
  { value: OrderStatus.TRANSITING, label: '运输中' },
  { value: OrderStatus.COMPLETED, label: '已完成' },
  { value: OrderStatus.OVERDUE, label: '已超时' },
]

const statusTagConfig: Record<string, { type: string; label: string }> = {
  [OrderStatus.PENDING]: { type: 'info', label: '待分配' },
  [OrderStatus.ASSIGNED]: { type: 'warning', label: '已分配' },
  [OrderStatus.TRANSITING]: { type: '', label: '运输中' },
  [OrderStatus.COMPLETED]: { type: 'success', label: '已完成' },
  [OrderStatus.OVERDUE]: { type: 'danger', label: '已超时' },
}

const documentLabels: Record<string, string> = {
  [DocumentType.PICKUP_ORDER]: '提箱单',
  [DocumentType.WEIGHING]: '过磅',
  [DocumentType.RECTIFICATION]: '整改',
}

function formatRoute(order: Order): string {
  const parts: string[] = []
  if (order.originName) parts.push(order.originName)
  if (order.waypoints && order.waypoints.length > 0) {
    parts.push(...order.waypoints)
  }
  if (order.destName) parts.push(order.destName)
  return parts.length > 0 ? parts.join(' → ') : '-'
}

function canEdit(order: Order): boolean {
  return order.status === OrderStatus.PENDING
}

function canAssign(order: Order): boolean {
  return order.status === OrderStatus.PENDING
}

function canComplete(order: Order): boolean {
  return [OrderStatus.ASSIGNED, OrderStatus.TRANSITING, OrderStatus.OVERDUE].includes(order.status)
}

function needsDeleteConfirm(order: Order): boolean {
  return order.status !== OrderStatus.PENDING
}

function getDeleteConfirmMessage(order: Order): string {
  if (order.status === OrderStatus.ASSIGNED || order.status === OrderStatus.TRANSITING) {
    return '该任务正在执行中，确定删除吗？车辆和司机将自动释放'
  }
  return '确定删除该任务吗？'
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onKeywordInput(val: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setKeyword(val)
  }, 300)
}

function onTabChange(tab: string) {
  store.setTab(tab as OrderStatus | 'all')
}

function onPageChange(p: number) {
  store.setPage(p)
}

function onPageSizeChange(ps: number) {
  store.setPageSize(ps)
}
</script>

<template>
  <div class="order-table">
    <div class="order-table__toolbar">
      <el-input
        v-model="store.keyword"
        placeholder="搜索任务编号/箱号/客户名称"
        clearable
        style="width: 320px"
        @input="onKeywordInput"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button
        type="primary"
        @click="emit('create')"
      >
        新建任务
      </el-button>
    </div>

    <el-tabs
      :model-value="store.activeTab"
      class="order-table__tabs"
      @update:model-value="onTabChange"
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.value"
        :label="`${tab.label}（${store.tabCounts[tab.value]}）`"
        :name="tab.value"
      />
    </el-tabs>

    <div
      v-if="store.loading"
      class="order-table__loading"
    >
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>加载中...</span>
    </div>

    <div
      v-else-if="store.error"
      class="order-table__error"
    >
      <el-result
        icon="error"
        :title="store.error"
      >
        <template #extra>
          <el-button
            type="primary"
            @click="store.fetchOrders()"
          >
            重试
          </el-button>
        </template>
      </el-result>
    </div>

    <div
      v-else-if="store.orders.length === 0"
      class="order-table__empty"
    >
      <el-empty description="暂无任务数据">
        <el-button
          type="primary"
          @click="emit('create')"
        >
          新建任务
        </el-button>
      </el-empty>
    </div>

    <el-table
      v-else
      :data="store.orders"
      stripe
      style="width: 100%"
    >
      <el-table-column
        prop="orderNo"
        label="任务编号"
        width="160"
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
        min-width="200"
      >
        <template #default="{ row }">
          <span class="order-table__route">{{ formatRoute(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="箱号"
        width="120"
      >
        <template #default="{ row }">
          {{ row.containerNo || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        label="箱型"
        width="80"
      >
        <template #default="{ row }">
          {{ row.containerType || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        label="单证"
        width="120"
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
        width="140"
      >
        <template #default="{ row }">
          <div>{{ row.driverName || '-' }}</div>
          <div class="order-table__plate">
            {{ row.vehiclePlateNo || '-' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="状态"
        width="90"
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
      >
        <template #default="{ row }">
          {{ row.createdAt }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="200"
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

    <div
      v-if="store.total > 0"
      class="order-table__pagination"
    >
      <el-pagination
        :current-page="store.page"
        :page-size="store.pageSize"
        :total="store.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="onPageChange"
        @size-change="onPageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.order-table__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.order-table__tabs {
  margin-bottom: 16px;
}

.order-table__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 0;
  color: #909399;
}

.order-table__empty {
  padding: 40px 0;
}

.order-table__error {
  padding: 20px 0;
}

.order-table__route {
  color: #606266;
  font-size: 13px;
}

.order-table__plate {
  color: #909399;
  font-size: 12px;
}

.order-table__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>