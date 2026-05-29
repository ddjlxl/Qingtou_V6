# Dashboard 运营看板 技术方案

> **版本**：v1.0
> **创建日期**：2026-05-28
> **需求文档**：产品概述 [product-overview.md](../../product-overview.md) 第二节
> **设计目标**：实现系统首页运营看板——全局指标卡片、天地图车辆实时定位、地图与运力列表双向联动、30 秒自动刷新

---

## 目录

- [一、功能概述](#一功能概述)
- [二、现有代码分析](#二现有代码分析)
- [三、数据模型设计](#三数据模型设计)
- [四、API 设计](#四api-设计)
- [五、前端设计](#五前端设计)
- [六、核心逻辑](#六核心逻辑)
- [七、AC 覆盖汇总表](#七ac-覆盖汇总表)
- [八、设计决策记录](#八设计决策记录)

---

## 一、功能概述

- **功能名称**：Dashboard 运营看板
- **需求文档**：[product-overview.md](../../product-overview.md) 板块 1（4 条 AC）
- **设计目标**：实现地图全屏的运营看板首页，浮动统计卡片 + 右侧浮动运力面板，30 秒自动刷新

---

## 二、现有代码分析

### 技术栈合规检查（必做，逐项确认）

- [x] 已读取 `specs/tech-stack.md`，确认本设计所有技术选型在批准范围内
- [x] UI 组件：仅使用 Element Plus（`el-card`、`el-input`、`el-tag`、`el-badge`、`el-progress`），不引入其他 UI 库
- [x] 样式方案：仅使用 `<style scoped>`，不使用 Tailwind CSS
- [x] 地图：仅使用 Leaflet 1.9 原生 API，不使用 @vue-leaflet 封装层
- [x] 日期处理：仅使用 dayjs，不使用 moment.js
- [x] 已用 Glob 工具审计 `shared/components/` 目录，确认引用的公共组件真实存在
- [x] 已用 Glob 工具审计 `shared/utils/` 目录，确认引用的工具函数真实存在

### 涉及模块

- `apps/server/app/models/order.py` — Order 模型（只读查询：今日任务数、完成率、超时数、平均转运时间）→ AC-001
- `apps/server/app/models/vehicle.py` — Vehicle 模型（只读查询：车辆位置、状态、绑定司机）→ AC-002, AC-003
- `apps/server/app/models/driver.py` — Driver 模型（只读查询：司机姓名、电话）→ AC-002
- `apps/server/app/services/dispatch_service.py` — 复用 `get_order_status_counts(db)` 函数
- `apps/frontend/src/shared/` — 公共组件和工具（可复用）
- `apps/frontend/src/modules/fleet/` — fleet 模块（参考 Store/Service/类型定义模式）
- `apps/frontend/src/router/index.ts` — 路由配置（需新增 `/dashboard` 路由，调整 `/` 重定向）
- `apps/frontend/src/shared/components/AppLayout.vue` — 侧边栏菜单（需新增"运营看板"菜单项）

### 可复用抽象（已审计，逐项标注验证状态）

| 组件/工具 | 文件路径 | 验证状态 |
|-----------|---------|---------|
| HTTP 客户端（Axios 实例） | `apps/frontend/src/shared/api/client.ts` | ✅ 已验证 |
| LoadingSpinner 加载组件 | `apps/frontend/src/shared/components/LoadingSpinner.vue` | ✅ 已验证 |
| EmptyState 空状态组件 | `apps/frontend/src/shared/components/EmptyState.vue` | ✅ 已验证 |
| AppLayout 布局组件 | `apps/frontend/src/shared/components/AppLayout.vue` | ✅ 已验证 |
| formatDate 日期格式化 | `apps/frontend/src/shared/utils/format.ts` | ✅ 已验证 |
| logger 日志工具 | `apps/frontend/src/shared/utils/logger.ts` | ✅ 已验证 |
| AppException 业务异常 | `apps/server/app/core/exceptions.py` | ✅ 已验证 |
| get_order_status_counts | `apps/server/app/services/dispatch_service.py` | ✅ 已验证（直接复用） |
| Leaflet 地图库 | `leaflet` npm 包（已在 package.json） | ✅ 已验证 |
| Element Plus 组件库 | 全局注册 | ✅ 已验证 |

### 影响范围

- **路由**：`/` 默认重定向从 `/fleet` 改为 `/dashboard`（调度员/管理员角色）
- **AppLayout 侧边栏**：新增"运营看板"菜单项（`index="/dashboard"`），置于车队管理之前
- **数据库**：无新增表、无迁移，纯只读聚合查询
- **API**：新增 1 个 GET 接口，不影响现有接口

---

## 三、数据模型设计

dashboard 为纯聚合查询模块，不需要新建数据库表。所有数据来自现有模型：

| 数据来源 | 模型 | 查询字段 | 用途 |
|---------|------|---------|------|
| 今日任务数 | `Order` | `COUNT(*) WHERE DATE(created_at) = today` | → AC-001 |
| 完成率 | `Order` | `completed_count / assigned_count WHERE DATE(created_at) = today` | → AC-001 |
| 超时数 | `Order` | `COUNT(*) WHERE status = 'overdue'` | → AC-001 |
| 平均转运时间 | `Order` | `AVG(completed_at - assigned_at) WHERE completed_at IS NOT NULL AND DATE(created_at) = today` | → AC-001 |
| 状态统计 | `Order` | `GROUP BY status`（复用 `get_order_status_counts`） | → AC-001 |
| 车辆位置 | `Vehicle` | `plate_no, status, current_lat, current_lng, current_location, bound_driver_id` | → AC-002, AC-003 |
| 司机信息 | `Driver` | `name, phone`（通过 `bound_driver_id` JOIN） | → AC-002 |

---

## 四、API 设计

### 4.1 接口列表

| 方法 | 路径 | 描述 | 对应 AC |
|------|------|------|---------|
| GET | /api/v1/dashboard | 获取运营看板全部数据（指标 + 状态统计 + 车辆位置） | → AC-001, AC-002, AC-003, AC-004 |

### 4.2 请求/响应 Schema

#### 后端 Pydantic Schema

```python
# apps/server/app/schemas/dashboard.py

from pydantic import BaseModel


class DashboardStats(BaseModel):
    today_task_count: int          # 今日创建任务数
    completion_rate: float         # 完成率 (0-1)
    overdue_count: int             # 当前超时任务数
    avg_transport_minutes: float | None  # 平均转运时长（分钟），无数据时为 None


class VehicleLocationItem(BaseModel):
    id: str
    plate_no: str
    status: str                   # idle / transiting / overdue
    lat: float | None
    lng: float | None
    location: str | None          # 位置描述文本
    driver_name: str | None
    driver_phone: str | None


class StatusCounts(BaseModel):
    pending: int
    assigned: int
    transiting: int
    completed: int
    overdue: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    status_counts: StatusCounts
    vehicles: list[VehicleLocationItem]
```

#### 前端 TypeScript 类型

```typescript
// apps/frontend/src/modules/dashboard/types/index.ts

export interface DashboardStats {
  todayTaskCount: number
  completionRate: number
  overdueCount: number
  avgTransportMinutes: number | null
}

export interface VehicleLocation {
  id: string
  plateNo: string
  status: 'idle' | 'transiting' | 'overdue'
  lat: number | null
  lng: number | null
  location: string | null
  driverName: string | null
  driverPhone: string | null
}

export interface StatusCounts {
  pending: number
  assigned: number
  transiting: number
  completed: number
  overdue: number
}

export interface DashboardData {
  stats: DashboardStats
  statusCounts: StatusCounts
  vehicles: VehicleLocation[]
}
```

---

## 五、前端设计

### 5.1 页面布局（地图全屏 + 浮动面板）

```
┌─────────────────────────────────────────────────────────┐
│  AppLayout 顶栏                                          │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐                                │
│ │ 今日 12  完成率 85%   │ ← 浮动统计卡片（左上角）         │
│ │ 超时 2   平均 32分钟  │   半透明背景，z-index 高于地图    │
│ └──────────────────────┘                                │
│                                                         │
│                                                         │
│              地图区域（占满整个 main 区域）                  │
│              Leaflet + 天地图瓦片                         │
│              车辆 Marker 标记点                           │
│                                                         │
│                                 ┌────────────────┐      │
│                                 │ 🔍 搜索车辆     │      │
│                                 │                │      │
│                                 │ 沪A12345 张三   │      │
│                                 │ 运输中          │ ← 浮动│
│                                 │ 沪B67890 李四   │  面板 │
│                                 │ 空闲            │ (右侧)│
│                                 │ ...             │      │
│                                 ├────────────────┤      │
│                                 │ 状态概览        │      │
│                                 │ 待分配:5       │      │
│                                 │ 已分配:3       │      │
│                                 │ 运输中:8       │      │
│                                 │ 已完成:123     │      │
│                                 │ 超时:1         │      │
│                                 └────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 5.2 组件结构

```
DashboardPage.vue                  # 页面容器：管理数据获取/刷新，组合子组件
├── StatisticsOverlay.vue          # 浮动统计卡片（4 个指标，左上角绝对定位）
├── MapArea.vue                    # 地图区域（Leaflet 初始化，占满容器）
│   └── (Leaflet 原生 DOM 操作)     #   L.map + L.tileLayer + L.marker
└── FleetPanel.vue                 # 浮动右侧面板
    ├── 搜索框（el-input）           #   车牌/司机姓名筛选
    ├── 车辆列表（el-table 简化行）   #   点击高亮 → emit 到 DashboardPage → MapArea.flyTo
    └── StatusOverview.vue         #   状态统计（5 个 el-tag + 数字）
```

### 5.3 组件职责与交互

#### DashboardPage.vue
- 挂载时调用 `store.fetchDashboard()` 获取数据
- 启动 30 秒 `setInterval` 自动刷新（`onUnmounted` 清理）
- 管理 `selectedVehicleId` 状态，驱动地图与列表双向联动
- 提供手动刷新按钮

#### StatisticsOverlay.vue
- Props: `stats: DashboardStats`
- 纯展示组件，4 个指标卡片
- 绝对定位在页面左上角，`z-index: 1000`
- `avgTransportMinutes` 为 null 时显示 "--"

#### MapArea.vue
- **必须导入** `import 'leaflet/dist/leaflet.css'`（否则瓦片和控件无法渲染）
- Props: `vehicles: VehicleLocation[]`, `selectedVehicleId: string | null`
- Emits: `select-vehicle(id: string)`
- `onMounted`：创建 Leaflet 地图实例，默认中心 `[31.23, 121.47]`（上海港区域），zoom=12，添加天地图/OSM 瓦片层
- `watch(vehicles)`：增量更新车辆 Marker（新增/移除/移动/状态变更）
  - 位置变更：`existing.setLatLng([v.lat, v.lng])`
  - 状态变更：`existing.setIcon(getStatusIcon(v.status))`
  - 首次加载有坐标车辆后：`map.fitBounds(L.featureGroup(markers).getBounds().pad(0.1))`
- `watch(selectedVehicleId)`：高亮对应 Marker + `flyTo` 动画
- 点击 Marker → `emit('select-vehicle', vehicleId)`
- `onUnmounted`：销毁地图实例（`map.remove()`）
- 车辆 Marker 按状态着色：空闲=绿色、运输中=蓝色、超时=红色
- 无坐标的车辆（lat/lng=null）不显示在地图上

#### FleetPanel.vue
- Props: `vehicles: VehicleLocation[]`, `statusCounts: StatusCounts`, `selectedVehicleId: string | null`
- Emits: `select-vehicle(id: string)`
- 浮动在页面右侧，`z-index: 1000`，可滚动
- 搜索框：按车牌号或司机姓名过滤列表
- 点击列表项 → `emit('select-vehicle', vehicleId)` → MapArea 飞过去
- StatusOverview：5 行状态统计（待分配/已分配/运输中/已完成/超时），使用 `el-tag` + 数字

### 5.4 状态管理

```typescript
// apps/frontend/src/modules/dashboard/stores/useDashboardStore.ts
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard() {
    loading.value = true
    error.value = null
    try {
      const res = await dashboardService.getDashboard()
      data.value = res
    } catch (e) {
      error.value = '获取看板数据失败'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchDashboard }
})
```

### 5.5 路由配置

```typescript
// router/index.ts 变更

// 1. 新增 dashboard 路由
{
  path: 'dashboard',
  name: 'Dashboard',
  component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
  meta: { requiresAuth: true, roles: ['admin', 'dispatcher'] },
}

// 2. 修改 `/` 重定向（调度员/管理员从 /fleet 改为 /dashboard）
{
  path: '',
  redirect: () => {
    const authStore = useAuthStore()
    return authStore.userRole === 'driver' ? '/driver' : '/dashboard'
  },
}
```

### 5.6 AppLayout 侧边栏变更

在车队管理菜单项之前新增"运营看板"菜单项：

```vue
<el-menu-item index="/dashboard">
  <el-icon><DataAnalysis /></el-icon>
  <template #title>运营看板</template>
</el-menu-item>
```

需导入 `DataAnalysis` 图标（`@element-plus/icons-vue`）。

---

## 六、核心逻辑

### 6.1 数据获取流程

```
DashboardPage.onMounted()
  → store.fetchDashboard()
    → GET /api/v1/dashboard
      → dashboard_service.get_dashboard(db)
        → get_order_status_counts(db)  // 复用 dispatch 服务
        → 查询今日订单聚合（COUNT、AVG、超时数）
        → 查询车辆+司机（JOIN Driver）
      → 返回 DashboardResponse
    → 更新 store.data
  → MapArea 渲染 Marker
  → FleetPanel 渲染列表
  → 启动 30s 定时器
```

### 6.2 地图-列表双向联动 → AC-003

```
点击地图 Marker:
  MapArea emit('select-vehicle', vehicleId)
  → DashboardPage.selectedVehicleId = vehicleId
  → FleetPanel: 列表项高亮 + 自动滚动到可见区域
  → MapArea: Marker 弹窗显示车辆信息

点击列表项:
  FleetPanel emit('select-vehicle', vehicleId)
  → DashboardPage.selectedVehicleId = vehicleId
  → MapArea: flyTo(lat, lng, 15) + 高亮 Marker + 弹窗
  → FleetPanel: 列表项高亮
```

### 6.3 地图 Marker 颜色规则 → AC-002

| 车辆状态 | Marker 颜色 | 含义 |
|---------|------------|------|
| `idle` | 绿色 `#67c23a` | 空闲可用 |
| `transiting` | 蓝色 `#409eff` | 运输中 |
| `overdue` | 红色 `#f56c6c` | 超时 |

使用 Leaflet `L.divIcon` 自定义 HTML Marker，显示为带颜色圆点。

### 6.4 30 秒自动刷新 → AC-004

```typescript
let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  store.fetchDashboard()
  refreshTimer = setInterval(() => store.fetchDashboard(), 30_000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
```

- 手动刷新：点击刷新按钮，立即执行 `store.fetchDashboard()`，重置定时器
- 刷新期间不显示全屏 loading，保持当前数据显示，避免闪烁
- 首次加载（`data === null`）时显示 LoadingSpinner

### 6.5 平均转运时间计算（后端）

```python
# 查询今日已完成且已分配的任务
result = await db.execute(
    select(
        func.avg(
            func.extract('epoch', Order.completed_at - Order.assigned_at) / 60
        )
    ).where(
        func.date(Order.created_at) == today,
        Order.completed_at.isnot(None),
        Order.assigned_at.isnot(None),
    )
)
avg_minutes = result.scalar()  # float | None
```

### 6.6 车辆位置增量更新（前端优化）

地图 Marker 更新策略：避免全量清除重建，使用 Marker ID 映射：

```typescript
const markerMap = new Map<string, L.Marker>()

function updateMarkers(vehicles: VehicleLocation[]) {
  const newIds = new Set(vehicles.map(v => v.id))
  
  // 移除已不存在的车辆 Marker
  for (const [id, marker] of markerMap) {
    if (!newIds.has(id)) {
      map.removeLayer(marker)
      markerMap.delete(id)
    }
  }
  
  // 更新或新增
  for (const v of vehicles) {
    if (!v.lat || !v.lng) continue
    const existing = markerMap.get(v.id)
    if (existing) {
      existing.setLatLng([v.lat, v.lng])
      existing.setIcon(getStatusIcon(v.status))
    } else {
      const marker = L.marker([v.lat, v.lng], { icon: getStatusIcon(v.status) })
      marker.bindPopup(formatPopupContent(v))
      marker.on('click', () => emit('select-vehicle', v.id))
      marker.addTo(map)
      markerMap.set(v.id, marker)
    }
  }
}
```

---

## 七、AC 覆盖汇总表

| AC 编号 | AC 描述 | 技术实现点 | 状态 |
|---------|---------|-----------|------|
| AC-001 | 核心指标数据与实际任务数据一致（任务数、完成率、超时数） | 后端聚合查询 `GET /api/v1/dashboard`。today_task_count 按 `created_at` 当天统计；completion_rate = 今日已完成 / 今日非待分配订单数（assigned + transiting + completed + overdue）；overdue_count = 全局超时数；avg_transport_minutes = 已完成任务 AVG(completed_at - assigned_at) | ✅ 已覆盖 |
| AC-002 | 点击地图车辆标记弹出基本信息（车牌、司机、状态） | `L.marker.bindPopup()` 显示车牌/司机名/状态。Marker 按状态着色（绿/蓝/红）。有 lat/lng 才渲染 Marker | ✅ 已覆盖 |
| AC-003 | 地图与运力列表双向联动 | DashboardPage 维护 `selectedVehicleId`，MapArea click Marker → emit，FleetPanel click 行 → emit。MapArea 响应 `flyTo` + 高亮，FleetPanel 响应列表高亮 + 滚动可见 | ✅ 已覆盖 |
| AC-004 | 首页加载后地图正常显示天地图瓦片，车辆标记出现在对应坐标位置 | Leaflet + `L.tileLayer(天地图URL)` 或降级 OSM。`onMounted` 创建地图，车辆数据返回后渲染 Marker。30 秒自动刷新保持数据时效性 | ✅ 已覆盖 |

---

## 八、设计决策记录

### 决策 1：地图全屏 + 浮动面板布局
- **选项 A**：地图 75% 宽 + 右侧栏 25% — 传统分栏，空间利用率低
- **选项 B**：地图全屏 + 浮动面板 — 地图撑满，统计卡片和信息面板浮动覆盖
- **选择**：**B**
- **理由**：用户明确"地图占大部分空间"。地图全屏最大化视野，浮动面板（`position: absolute; z-index: 1000`）不挤占地图空间，拖拽/缩放地图时不受影响。

### 决策 2：首页路由从 /fleet 改为 /dashboard
- **理由**：产品概述明确"运营看板是首页"，调度员上班第一件事就是打开这个页面。与产品需求一致。

### 决策 3：单一 API 接口返回全部数据
- **选项 A**：单一接口 `GET /api/v1/dashboard`
- **选项 B**：拆分接口 `/dashboard/overview` + `/dashboard/fleet-locations`
- **选择**：**A**
- **理由**：整页 30 秒刷新一次，一次请求减少往返，后端查询优化（单次 DB 连接），前端只需一次 loading 管理。

### 决策 4：天地图优先，OSM 降级
- **理由**：路线图中已明确策略。通过环境变量 `VITE_TIANDITU_KEY` 控制，无 key 时自动使用 OpenStreetMap 免费瓦片。

### 决策 5：Leaflet 原生 API，不用 Vue 封装
- **理由**：技术栈规范明确"Leaflet 1.9（原生 API，不使用 Vue 封装层）"。在 `onMounted` 中直接 `L.map()` 操作 DOM，`onUnmounted` 销毁。组件间通过 props/emit 通信，不通过 Leaflet 对象引用传递。

---

## 九、文件清单

### 新建文件

| 文件 | 说明 |
|------|------|
| `apps/frontend/src/modules/dashboard/index.ts` | 模块导出入口 |
| `apps/frontend/src/modules/dashboard/pages/DashboardPage.vue` | 页面容器 |
| `apps/frontend/src/modules/dashboard/components/StatisticsOverlay.vue` | 浮动统计卡片 |
| `apps/frontend/src/modules/dashboard/components/MapArea.vue` | 地图区域 |
| `apps/frontend/src/modules/dashboard/components/FleetPanel.vue` | 浮动右侧面板 |
| `apps/frontend/src/modules/dashboard/components/StatusOverview.vue` | 状态统计 |
| `apps/frontend/src/modules/dashboard/stores/useDashboardStore.ts` | Pinia Store |
| `apps/frontend/src/modules/dashboard/services/dashboardService.ts` | API 服务 |
| `apps/frontend/src/modules/dashboard/types/index.ts` | 类型定义 |
| `apps/server/app/api/v1/dashboard.py` | API 路由 |
| `apps/server/app/services/dashboard_service.py` | 业务逻辑 |
| `apps/server/app/schemas/dashboard.py` | Pydantic Schema |

### 修改文件

| 文件 | 变更 |
|------|------|
| `apps/frontend/src/router/index.ts` | 新增 `/dashboard` 路由，修改 `/` 重定向 |
| `apps/frontend/src/shared/components/AppLayout.vue` | 新增"运营看板"菜单项 |
| `apps/server/app/main.py` | 注册 dashboard_router |

---

## 十、关联文档

- 产品概述：[product-overview.md](../../product-overview.md)
- 技术栈：[tech-stack.md](../../tech-stack.md)
- 开发规范：[development-standards.md](../../development-standards.md)
- 路线图：[development-roadmap.md](../../development-roadmap.md)