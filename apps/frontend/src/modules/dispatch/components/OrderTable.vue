<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { useDispatchStore } from '../stores/useDispatchStore'
import { OrderStatus } from '../types/order'
import type { Order } from '../types/order'
import OrderTableToolbar from './OrderTableToolbar.vue'
import OrderTableBody from './OrderTableBody.vue'
import { tabs, debouncedSearch } from './useOrderTable'

const store = useDispatchStore()

const emit = defineEmits<{
  create: []
  edit: [order: Order]
  assign: [order: Order]
  complete: [order: Order]
  delete: [order: Order]
}>()

function onKeywordInput(val: string) {
  debouncedSearch((v) => store.setKeyword(v), val)
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
    <OrderTableToolbar
      v-model:keyword="store.keyword"
      @create="emit('create')"
      @update:keyword="onKeywordInput"
    />

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

    <OrderTableBody
      v-else
      :orders="store.orders"
      table-max-height="calc(100vh - 320px)"
      @edit="emit('edit', $event)"
      @assign="emit('assign', $event)"
      @complete="emit('complete', $event)"
      @delete="emit('delete', $event)"
    />

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
.order-table__tabs {
  margin-bottom: 16px;
}

.order-table__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 0;
  color: #909399;
}

.order-table__error {
  padding: 24px 0;
}

.order-table__empty {
  padding: 48px 0;
}

.order-table__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>