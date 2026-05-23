<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDriverStore } from '../stores/useDriverStore'
import { EmptyState, LoadingSpinner } from '@/shared/components'
import { OrderStatus } from '@/modules/dispatch'
import DriverOrderCard from '../components/DriverOrderCard.vue'

const store = useDriverStore()

const isMobile = ref(false)
let mediaQuery: MediaQueryList

function onMediaChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
  store.fetchOrders()
})

onUnmounted(() => {
  mediaQuery.removeEventListener('change', onMediaChange)
})

function loadMoreData() {
  store.loadMore()
}

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待发车', value: OrderStatus.ASSIGNED },
  { label: '运输中', value: OrderStatus.TRANSITING },
  { label: '已完成', value: OrderStatus.COMPLETED },
]
</script>

<template>
  <div class="driver-workbench">
    <div class="driver-workbench__header">
      <h2>我的任务</h2>
    </div>

    <div class="driver-workbench__tabs">
      <el-radio-group
        :model-value="store.activeTab"
        @change="store.setTab"
      >
        <el-radio-button
          v-for="tab in STATUS_TABS"
          :key="tab.value"
          :value="tab.value"
        >
          {{ tab.label }}
          <span class="driver-workbench__count">
            ({{ store.tabCounts[tab.value] ?? 0 }})
          </span>
        </el-radio-button>
      </el-radio-group>
    </div>

    <div
      v-loading="store.loading"
      class="driver-workbench__content"
    >
      <EmptyState
        v-if="!store.loading && store.orders.length === 0"
        icon="FolderOpened"
        title="暂无任务"
        description="当前没有分配给您的任务"
      />

      <!-- 桌面端：卡片 + 分页 -->
      <template v-if="!isMobile">
        <DriverOrderCard
          v-for="order in store.orders"
          :key="order.id"
          :order="order"
        />

        <div
          v-if="store.total > store.pageSize"
          class="driver-workbench__pagination"
        >
          <el-pagination
            :current-page="store.page"
            :page-size="store.pageSize"
            :total="store.total"
            layout="prev, pager, next"
            @current-change="store.setPage"
          />
        </div>
      </template>

      <!-- 移动端：无限滚动 -->
      <div
        v-else
        v-infinite-scroll="loadMoreData"
        :infinite-scroll-disabled="store.loadingMore || !store.hasMore"
        :infinite-scroll-distance="50"
        class="driver-workbench__scroll-container"
      >
        <DriverOrderCard
          v-for="order in store.orders"
          :key="order.id"
          :order="order"
        />

        <LoadingSpinner
          v-if="store.loadingMore"
          text="加载中..."
        />
        <p
          v-if="!store.hasMore && store.orders.length > 0"
          class="driver-workbench__no-more"
        >
          没有更多了
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.driver-workbench {
  padding: 20px;
}

.driver-workbench__header h2 {
  margin: 0 0 16px;
  font-size: 20px;
  color: #303133;
}

.driver-workbench__tabs {
  margin-bottom: 20px;
}

.driver-workbench__count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.driver-workbench__content {
  min-height: 200px;
}

.driver-workbench__pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.driver-workbench__scroll-container {
  min-height: 200px;
}

.driver-workbench__no-more {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 16px 0;
  margin: 0;
}

@media (max-width: 767px) {
  .driver-workbench {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 12px;
  }

  .driver-workbench__tabs {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
