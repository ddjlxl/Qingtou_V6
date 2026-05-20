# 司机工作台移动端适配 技术方案

## 一、功能概述
- **功能名称**：司机工作台移动端适配
- **需求文档**：[requirements.md](./requirements.md)
- **设计目标**：在仅改动 AppLayout.vue、DriverWorkbench.vue、useDriverStore.ts 三个文件的前提下，实现 768px 以下司机角色的移动端底部 Tab 布局、卡片单列全宽、上拉无限滚动

## 二、现有代码分析

### 技术栈合规检查（必做，逐项确认）
- [x] 已读取 `specs/tech-stack.md`，确认本设计所有技术选型在批准范围内
- [x] UI 组件：仅使用 Element Plus（`el-button`、`el-tag`、`el-radio-group`、`el-pagination`、`v-infinite-scroll` 等），不引入其他 UI 库
- [x] 样式方案：仅使用 `<style scoped>`，不使用 Tailwind CSS
- [x] 地图：不涉及
- [x] 日期处理：不涉及
- [x] 已用 Glob 审计 `shared/components/`：EmptyState、LoadingSpinner 均真实存在
- [x] 已确认 `v-infinite-scroll` 为 Element Plus 内置指令，`app.use(ElementPlus)` 全量注册已包含，无需额外引入

### 涉及模块

| 模块 | 文件 | 改动类型 |
|------|------|---------|
| shared | `src/shared/components/AppLayout.vue` | 重构：添加移动端布局分支 |
| driver | `src/modules/driver/pages/DriverWorkbench.vue` | 改造：响应式卡片 + 无限滚动 |
| driver | `src/modules/driver/stores/useDriverStore.ts` | 扩展：追加加载模式 |
| driver | `src/modules/driver/index.ts` | 导出新增组件 |
| router | `src/router/index.ts` | 新增两个占位路由 |

### 可复用抽象（已审计）

| 组件/工具 | 文件路径 | 验证状态 |
|-----------|---------|---------|
| EmptyState | `src/shared/components/EmptyState.vue` | ✅ 已验证 |
| LoadingSpinner | `src/shared/components/LoadingSpinner.vue` | ✅ 已验证 |

### 影响范围
- **AppLayout.vue**：桌面端布局保持不变；仅当 `宽度 < 768px && 角色 === driver` 时走新移动端分支
- **DriverWorkbench.vue**：桌面端功能完全不变；移动端通过 `matchMedia` 切换滚动容器和加载模式
- **其他页面**：fleet、dispatch 页面不受任何影响（角色不匹配，永不触发移动端布局）

## 三、前端设计

### 3.1 AppLayout.vue —— 双布局 v-if/v-else

**移动端判断**：

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(false)
let mediaQuery: MediaQueryList

function checkMobile() {
  isMobile.value = mediaQuery.matches && authStore.userRole === 'driver'
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  mediaQuery.addEventListener('change', checkMobile)
  checkMobile()
})

onUnmounted(() => {
  mediaQuery.removeEventListener('change', checkMobile)
})
```

**模板结构**：→ AC-001, AC-002, AC-016

```
<template>
  <!-- 桌面端：现有侧边栏布局，完全不动 -->
  <el-container v-if="!isMobile" class="app-layout">
    ... (现有代码不变)
  </el-container>

  <!-- 移动端：顶部标题栏 + 内容 + 底部 Tab 栏 -->
  <div v-else class="app-layout-mobile">
    <div class="mobile-topbar">我的任务</div>
    <div class="mobile-content">
      <router-view />
    </div>
    <div class="mobile-tabbar">
      <div class="mobile-tabbar__item" @click="router.push('/driver')">
        <List /> <span>任务</span>
      </div>
      <div class="mobile-tabbar__item" @click="router.push('/driver/history')">
        <Clock /> <span>历史</span>
      </div>
      <div class="mobile-tabbar__item" @click="router.push('/driver/profile')">
        <User /> <span>我的</span>
      </div>
    </div>
  </div>
</template>
```

→ AC-003, AC-004, AC-005, AC-017

**CSS 关键约束**：

```css
.app-layout-mobile {
  display: flex;
  flex-direction: column;
  height: 100vh;           /* 占满视口 */
  height: 100dvh;          /* 动态视口，避免移动端地址栏遮挡 */
  overflow: hidden;
}

.mobile-topbar {
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 600;
}

.mobile-content {
  flex: 1;
  overflow: hidden;        /* 不在此滚动，由 DriverWorkbench 内部管理 */
}

.mobile-tabbar {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom);  /* iPhone 底部安全区 */
}

.mobile-tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #999;
  cursor: pointer;
}
```

→ AC-017

### 3.2 DriverWorkbench.vue —— 移动端响应式改造

**移动端检测**（与 AppLayout 相同逻辑，但只检测宽度）：

```typescript
const isMobile = ref(false)
let mediaQuery: MediaQueryList

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', (e) => { isMobile.value = e.matches })
  store.fetchOrders()
})

onUnmounted(() => {
  mediaQuery.removeEventListener('change', () => {})
})
```

**模板结构**：

```html
<!-- 桌面端分页 -->
<el-pagination v-if="!isMobile && store.total > store.pageSize" ... />

<!-- 移动端无限滚动 -->
<div
  v-else-if="isMobile"
  v-infinite-scroll="loadMoreData"
  :infinite-scroll-disabled="store.loadingMore || !store.hasMore"
  :infinite-scroll-distance="50"
  class="driver-workbench__scroll-container"
>
  <!-- 任务卡片列表（共用） -->
  ...

  <!-- 加载状态 -->
  <LoadingSpinner v-if="store.loadingMore" text="加载中..." />
  <p v-if="!store.hasMore && store.orders.length > 0" class="driver-workbench__no-more">
    没有更多了
  </p>
</div>
```

→ AC-008, AC-012, AC-013

`loadMoreData` 直接调用 `store.loadMore()`。

**卡片样式**（CSS 媒体查询）：→ AC-006, AC-007

```css
/* 桌面端保持两列 */
.driver-workbench__card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}

/* 移动端单列 + 按钮加大 */
@media (max-width: 767px) {
  .driver-workbench {
    height: 100%;              /* 配合 AppLayout 的 mobile-content */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 12px;
  }

  .driver-workbench__card-body {
    grid-template-columns: 1fr;  /* 单列 */
  }

  .driver-workbench__card-actions .el-button {
    min-height: 44px;            /* 触控最小尺寸 */
    min-width: 40%;
    font-size: 15px;
  }

  .driver-workbench__tabs {
    overflow-x: auto;            /* 横向滚动 */
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}
```

→ AC-006, AC-007, AC-009

### 3.3 useDriverStore.ts —— 追加加载模式

新增三个导出：→ AC-008, AC-011, AC-012, AC-013

```typescript
const loadingMore = ref(false)

const hasMore = computed(() => orders.value.length < total.value)

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    page.value++
    const params: DriverOrderListParams = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    const result = await driverService.getOrders(params)
    orders.value.push(...result.items)  // 追加，不替换
  } catch (e) {
    page.value--  // 失败回退页码
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loadingMore.value = false
  }
}
```

→ AC-011

**Tab 切换防竞态**（→ AC-015）：

在 `setTab` 中增加请求版本号机制：

```typescript
let requestId = 0

async function fetchOrders() {
  loading.value = true
  error.value = null
  const currentRequestId = ++requestId
  try {
    const params: DriverOrderListParams = { page: page.value, pageSize: pageSize.value }
    if (activeTab.value !== 'all') params.status = activeTab.value
    const result = await driverService.getOrders(params)
    // 只保留最新请求的结果
    if (currentRequestId !== requestId) return
    orders.value = result.items
    total.value = result.total
    statusCounts.value = result.statusCounts
  } catch (e) {
    if (currentRequestId !== requestId) return
    error.value = e instanceof Error ? e.message : '获取任务列表失败'
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}
```

→ AC-015

**导出新增项**：`loadingMore`, `hasMore`, `loadMore`

### 3.4 路由改造

`src/router/index.ts` 新增两个子路由：→ AC-004, AC-005

```typescript
{
  path: 'driver/history',
  name: 'DriverHistory',
  component: () => import('@/modules/driver/pages/DriverHistory.vue'),
  meta: { requiresAuth: true, roles: ['driver'] },
},
{
  path: 'driver/profile',
  name: 'DriverProfile',
  component: () => import('@/modules/driver/pages/DriverProfile.vue'),
  meta: { requiresAuth: true, roles: ['driver'] },
},
```

### 3.5 新增占位组件

**DriverHistory.vue** → AC-004：

```vue
<template>
  <EmptyState icon="Clock" title="暂无历史任务" description="已完成的任务将显示在这里" />
</template>
<script setup lang="ts">
import { EmptyState } from '@/shared/components'
</script>
```

**DriverProfile.vue** → AC-005, AC-010：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth'

const router = useRouter()
const authStore = useAuthStore()
const displayName = computed(() => authStore.user?.name || authStore.user?.username || '司机')

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="driver-profile">
    <div class="driver-profile__avatar">
      <el-icon :size="48"><User /></el-icon>
    </div>
    <div class="driver-profile__name">{{ displayName }}</div>
    <el-button type="danger" @click="handleLogout">退出登录</el-button>
  </div>
</template>
```

→ AC-005, AC-010

同时更新 `src/modules/driver/index.ts` 导出新增组件。

### 3.6 移动端底部 Tab 当前路由高亮

AppLayout 中 `mobile-tabbar__item` 根据 `route.path` 判断当前激活 Tab：

```typescript
const route = useRoute()

function isActiveTab(path: string): boolean {
  if (path === '/driver') return route.path === '/driver'
  return route.path.startsWith(path)
}
```

对应 CSS：`.mobile-tabbar__item--active { color: #409eff; }`

## 四、AC 覆盖汇总表

| AC 编号 | AC 描述 | 技术实现点 | 状态 |
|---------|---------|-----------|------|
| AC-001 | 司机手机浏览器自动切换移动端布局 | AppLayout: `matchMedia` + `userRole` 双重判断，`v-if/v-else` 切换模板 | ✅ |
| AC-002 | 桌面端用户不触发移动端 | `userRole !== 'driver'` 短路判断，永远不进移动端分支 | ✅ |
| AC-003 | 点击「任务」Tab 进入 /driver | `router.push('/driver')` | ✅ |
| AC-004 | 点击「历史」Tab 显示占位 | `/driver/history` 路由 + DriverHistory.vue EmptyState | ✅ |
| AC-005 | 点击「我的」Tab 显示姓名和退出 | `/driver/profile` 路由 + DriverProfile.vue | ✅ |
| AC-006 | 卡片单列全宽 | CSS `@media (max-width: 767px)` 改 `grid-template-columns: 1fr` | ✅ |
| AC-007 | 按钮 ≥ 44px 触控区 | CSS `min-height: 44px; min-width: 40%` | ✅ |
| AC-008 | 上拉自动加载更多 | `v-infinite-scroll` + `store.loadMore()` 追加模式 | ✅ |
| AC-009 | 状态 Tab 横向滚动 | CSS `overflow-x: auto; white-space: nowrap` | ✅ |
| AC-010 | 退出登录跳转 /login | `authStore.logout()` + `router.push('/login')` | ✅ |
| AC-011 | 加载失败保留已有数据 | `loadMore` 中 `catch` 回退 `page.value--`，不修改 orders | ✅ |
| AC-012 | 最后一页显示"没有更多了" | `!store.hasMore && orders.length > 0` 条件渲染提示文字 | ✅ |
| AC-013 | 加载中防抖 | `infinite-scroll-disabled="store.loadingMore || !store.hasMore"` | ✅ |
| AC-014 | 空 Tab 显示 EmptyState | 现有逻辑不变，`orders.length === 0` 时渲染 EmptyState | ✅ |
| AC-015 | 快速切 Tab 防竞态 | `requestId` 递增模式，只保留最新请求结果 | ✅ |
| AC-016 | 宽度 + 角色双重判断 | `mediaQuery.matches && authStore.userRole === 'driver'` | ✅ |
| AC-017 | 底部栏 fixed 三等分 | `flex: 1` + `padding-bottom: env(safe-area-inset-bottom)` | ✅ |
| AC-018 | 按钮显隐逻辑 | 现有 `canStart`/`canComplete` 逻辑不变，移动端同样复用 | ✅ |
| AC-019 | 卡片信息字段 | 现有模板字段不变，仅 CSS 布局调整 | ✅ |

## 五、设计决策记录

### 决策1：移动端判断维度
- **选项 A**：纯 CSS `@media` 控制样式，DOM 始终存在
- **选项 B**：JS `matchMedia` + 角色判断，`v-if/v-else` 完全切换模板
- **选择**：B
- **理由**：桌面端和移动端 DOM 结构根本不同（侧边栏 vs 底部 Tab 栏），v-if 避免渲染无用 DOM，且角色判断需要 JS 参与

### 决策2：v-infinite-scroll 放置位置
- **选项 A**：放在 AppLayout 的滚动容器上
- **选项 B**：放在 DriverWorkbench 自身
- **选择**：B
- **理由**：DriverWorkbench 自己检测移动端并管理滚动，保持 AppLayout 零业务耦合

### 决策3：Store 改造方式
- **选项 A**：修改现有 `fetchOrders`，加参数控制替换/追加
- **选项 B**：保持 `fetchOrders` 不变（始终替换），新增独立 `loadMore` 方法（始终追加）
- **选择**：B
- **理由**：职责清晰——切 Tab 用替换，滚到底用追加，调错方法的可能性为零

### 决策4：Tab 切换竞态处理
- **选项 A**：使用 AbortController 取消前一个请求
- **选项 B**：使用 requestId 递增，忽略旧请求结果
- **选择**：B
- **理由**：无需改动 HTTP 层，纯 Store 内部逻辑，更简单；且不依赖网络层是否支持 abort

## 六、文件改动清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/shared/components/AppLayout.vue` | 修改 | 新增移动端模板分支 + 样式 |
| `src/modules/driver/pages/DriverWorkbench.vue` | 修改 | 移动端滚动容器 + 无限滚动 + 响应式样式 |
| `src/modules/driver/stores/useDriverStore.ts` | 修改 | hasMore、loadingMore、loadMore、requestId 竞态处理 |
| `src/modules/driver/pages/DriverHistory.vue` | 新建 | 占位页 |
| `src/modules/driver/pages/DriverProfile.vue` | 新建 | 个人信息 + 退出登录 |
| `src/modules/driver/index.ts` | 修改 | 新增导出 |
| `src/router/index.ts` | 修改 | 新增两个路由 |