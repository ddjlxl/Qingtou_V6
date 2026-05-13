# 项目目录结构

> **版本**：v1.0  
> **创建日期**：2026-05-03  
> **来源**：基于技术栈选型和产品板块的结构设计  

---

## 一、设计思路

- **架构模式**：特性架构（Feature-based / Domain-driven）
- **选择理由**：V4 采用分层架构（按技术层分目录），导致改一个功能需要跳 5 个目录（components/、composables/、services/、stores/、types/），代码天然容易散乱。V6 改为特性架构——每个业务模块自包含，改调度功能只进 `modules/dispatch/` 一个目录。
- **核心模块**：auth、dashboard、dispatch、fleet、warehouse、settings、help-center（7 个业务模块 + 1 个共享基础设施）

---

## 二、完整目录树

```
Qingtou_V6/
├── apps/
│   ├── frontend/                        # 调度端（Vue 3 + Vite + TypeScript）
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── modules/                 # ⭐ 业务模块（特性架构核心）
│   │   │   │   ├── auth/                # 用户认证
│   │   │   │   │   ├── components/      # LoginForm.vue
│   │   │   │   │   ├── stores/          # useAuthStore.ts
│   │   │   │   │   ├── services/        # authService.ts
│   │   │   │   │   ├── types/           # auth.types.ts
│   │   │   │   │   ├── index.ts         # 模块公共 API
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   ├── dashboard/           # 运营看板
│   │   │   │   │   ├── components/      # StatCard, MapViewer, VehicleList...
│   │   │   │   │   ├── stores/          # useDashboardStore.ts
│   │   │   │   │   ├── services/        # dashboardService.ts
│   │   │   │   │   ├── composables/     # useMapInteraction, useAutoRefresh...
│   │   │   │   │   ├── types/           # dashboard.types.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   ├── dispatch/            # 调度中心
│   │   │   │   │   ├── components/      # TaskList, TaskForm, AssignDialog...
│   │   │   │   │   ├── stores/          # useDispatchStore.ts
│   │   │   │   │   ├── services/        # dispatchService.ts
│   │   │   │   │   ├── composables/     # useTaskFilter, useSmartDispatch...
│   │   │   │   │   ├── types/           # dispatch.types.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   ├── fleet/               # 车队管理
│   │   │   │   │   ├── components/      # VehicleManagement, DriverManagement, CertificateManagement, TransportRecordManagement, StatisticsTab, StatusTag, FormDialogs...
│   │   │   │   │   ├── pages/           # FleetPage.vue
│   │   │   │   │   ├── stores/          # useFleetStore.ts
│   │   │   │   │   ├── services/        # fleetService.ts
│   │   │   │   │   ├── types/           # vehicle.ts, driver.ts, certificate.ts, transport-record.ts, statistics.ts, index.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   ├── warehouse/           # 仓库管理
│   │   │   │   │   ├── components/      # SlotGrid, WarehouseLayout...
│   │   │   │   │   ├── stores/          # useWarehouseStore.ts
│   │   │   │   │   ├── services/        # warehouseService.ts
│   │   │   │   │   ├── types/           # warehouse.types.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   ├── settings/            # 系统设置
│   │   │   │   │   ├── components/      # UserManager, LogViewer...
│   │   │   │   │   ├── stores/          # useSettingsStore.ts
│   │   │   │   │   ├── services/        # settingsService.ts
│   │   │   │   │   ├── types/           # settings.types.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   │
│   │   │   │   └── help-center/         # 帮助中心
│   │   │   │       ├── components/      # ArticleViewer, ArticleEditor...
│   │   │   │       ├── stores/          # useHelpCenterStore.ts
│   │   │   │       ├── services/        # helpCenterService.ts
│   │   │   │       ├── types/           # helpCenter.types.ts
│   │   │   │       ├── index.ts
│   │   │   │       └── __tests__/
│   │   │   │
│   │   │   ├── shared/                  # 共享基础设施
│   │   │   │   ├── components/          # 通用 UI 组件
│   │   │   │   │   ├── AppHeader.vue
│   │   │   │   │   ├── AppSidebar.vue
│   │   │   │   │   ├── EmptyState.vue
│   │   │   │   │   └── LoadingSpinner.vue
│   │   │   │   ├── composables/         # 通用组合式函数
│   │   │   │   │   ├── useMessage.ts
│   │   │   │   │   ├── usePermission.ts
│   │   │   │   │   └── usePagination.ts
│   │   │   │   ├── services/            # 跨模块服务
│   │   │   │   │   └── ocrService.ts    # OCR 识别（调度/仓库/司机端共用）
│   │   │   │   ├── utils/               # 工具函数
│   │   │   │   │   ├── logger.ts
│   │   │   │   │   ├── date.ts
│   │   │   │   │   ├── format.ts
│   │   │   │   │   └── storage.ts
│   │   │   │   └── api/                 # HTTP 客户端
│   │   │   │       ├── client.ts        # Axios 实例 + 拦截器
│   │   │   │       └── types.ts         # 通用 API 响应类型
│   │   │   │
│   │   │   ├── layouts/                 # 布局
│   │   │   │   ├── DefaultLayout.vue    # 调度端主布局（Header + Sidebar）
│   │   │   │   └── AuthLayout.vue       # 登录页布局
│   │   │   ├── router/                  # 路由
│   │   │   │   ├── index.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── guards.ts            # 路由守卫（权限检查）
│   │   │   ├── assets/                  # 静态资源
│   │   │   │   └── styles/
│   │   │   │       ├── variables.css    # CSS 变量（颜色、间距）
│   │   │   │       └── global.css       # 全局样式重置
│   │   │   ├── App.vue
│   │   │   └── main.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── .env.development
│   │   ├── .env.production
│   │   └── package.json
│   │
│   ├── driver/                           # 司机端（独立 HTML 页面，无构建工具链）
│   │   ├── index.html                    # 登录页
│   │   ├── task-hall.html                # 任务大厅
│   │   ├── my-tasks.html                 # 我的任务
│   │   ├── task-detail.html              # 任务详情
│   │   ├── history.html                  # 历史记录
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   ├── api.js                    # API 调用封装
│   │   │   ├── auth.js                   # 登录状态管理
│   │   │   └── utils.js                  # 工具函数
│   │   └── assets/
│   │       └── logo.png
│   │
│   └── server/                           # 后端（FastAPI + Python）
│       ├── app/
│       │   ├── api/                      # API 路由（按模块组织）
│       │   │   ├── v1/
│       │   │   │   ├── __init__.py
│       │   │   │   ├── auth.py           # 认证接口
│       │   │   │   ├── dashboard.py      # 看板接口
│       │   │   │   ├── dispatch.py       # 调度接口
│       │   │   │   ├── fleet.py          # 车队接口
│       │   │   │   ├── fleet_certificates.py  # 证照接口
│       │   │   │   ├── fleet_drivers.py       # 司机接口
│       │   │   │   ├── fleet_statistics.py    # 统计接口
│       │   │   │   ├── fleet_transport_records.py  # 运输流水接口
│       │   │   │   ├── fleet_vehicles.py      # 车辆接口
│       │   │   │   ├── warehouse.py      # 仓库接口
│       │   │   │   ├── settings.py       # 设置接口
│       │   │   │   └── help_center.py    # 帮助中心接口
│       │   │   └── deps.py               # 依赖注入（get_db, get_current_user）
│       │   ├── models/                   # SQLAlchemy 数据模型
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   ├── user.py
│       │   │   ├── order.py
│       │   │   ├── vehicle.py
│       │   │   ├── driver.py
│       │   │   ├── certificate.py
│       │   │   ├── transport_record.py
│       │   │   ├── warehouse.py
│       │   │   ├── storage_slot.py
│       │   │   ├── common_address.py
│       │   │   ├── operation_log.py
│       │   │   ├── system_config.py
│       │   │   └── help_article.py
│       │   ├── schemas/                  # Pydantic 请求/响应模型
│       │   │   ├── __init__.py
│       │   │   ├── auth.py
│       │   │   └── fleet.py
│       │   ├── services/                 # 业务逻辑层
│       │   │   ├── __init__.py
│       │   │   ├── auth_service.py
│       │   │   └── fleet_service.py
│       │   ├── core/                     # 核心配置
│       │   │   ├── __init__.py
│       │   │   ├── config.py             # 应用配置（读取 .env）
│       │   │   ├── security.py           # JWT 生成/验证 + 密码哈希
│       │   │   └── database.py           # 数据库引擎 + Session 管理
│       │   └── main.py                   # FastAPI 应用入口
│       ├── tests/
│       │   ├── conftest.py               # 测试 fixtures
│       │   ├── test_auth.py
│       │   ├── test_tasks.py
│       │   └── test_vehicles.py
│       ├── alembic/                      # 数据库迁移
│       │   ├── versions/
│       │   └── env.py
│       ├── alembic.ini
│       ├── requirements.txt
│       └── .env
│
├── packages/                             # 共享包
│   └── shared-types/                     # 前后端共享类型定义
│       ├── src/
│       │   ├── enums.ts                  # TaskStatus, VehicleStatus, UserRole...
│       │   ├── api.ts                    # ApiResponse<T>, PaginatedResponse<T>...
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                                 # 开发文档（V4 迁移参考）
│   ├── V6需求文档.md
│   ├── V6数据库设计.md
│   ├── V6开发规则.md
│   ├── V6技术栈配置.md
│   ├── V6项目结构规范.md
│   ├── V4踩坑记录与V6解决方案.md
│   ├── V4优点继承与V6增强.md
│   └── 业务规则详细说明.md
│
├── specs/                                # 规格文档（V6 设计产出）
│   ├── requirements-clarification.md
│   ├── product-overview.md
│   ├── tech-stack.md
│   └── project-structure.md              # ← 当前文件
│
├── scripts/                              # 脚本工具
│   └── code-quality-check.js
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example
└── README.md
```

---

## 三、模块职责说明

### 前端模块

| 模块 | 职责 | 依赖 |
|------|------|------|
| auth | 登录/登出、token 管理、角色权限 | shared |
| dashboard | 首页看板、地图定位、指标统计、运力列表 | shared, auth |
| dispatch | 任务 CRUD、司机分配、智能调度、常用地址 | shared, auth, fleet |
| fleet | 车辆/司机档案、证照管理、运输流水、车队统计 | shared, auth |
| warehouse | 仓库/库位管理、出入库、库存查询、批量导入 | shared, auth |
| settings | 用户管理、参数配置、操作日志 | shared, auth |
| help-center | 图文教程展示、后台编辑管理 | shared, auth |

### 后端模块

| 模块 | 职责 | 依赖 |
|------|------|------|
| api/v1/auth | 登录/注册/token 刷新 | models, services, core |
| api/v1/dashboard | 看板数据聚合、地图数据 | models, services |
| api/v1/dispatch | 任务 CRUD、分配、OCR 识别 | models, services |
| api/v1/fleet | 车辆/司机管理、证照 | models, services |
| api/v1/warehouse | 仓库/库位/出入库 | models, services |
| api/v1/settings | 用户管理、参数、日志 | models, services |
| api/v1/help_center | 教程内容管理 | models, services |

---

## 四、模块间通信规则

### 规则 1：模块只能通过 `index.ts` 对外暴露

```typescript
// ✅ 正确：通过 index.ts 引用
import { useDispatchStore } from '@/modules/dispatch'

// ❌ 禁止：直接引用模块内部文件
import { useDispatchStore } from '@/modules/dispatch/stores/useDispatchStore'
```

### 规则 2：shared 不依赖任何业务模块

`shared/` 是纯基础设施，可以被所有模块引用，但它自己不引用任何业务模块。

### 规则 3：模块间依赖单向

```
shared ← auth ← dashboard
              ← dispatch ← fleet
              ← warehouse
              ← settings
              ← help-center
```

---

## 五、命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| Vue 组件文件 | PascalCase | `TaskList.vue` |
| TypeScript 文件 | camelCase | `dispatchService.ts` |
| 类型定义文件 | camelCase + .types | `dispatch.types.ts` |
| Store 文件 | use + PascalCase + Store | `useDispatchStore.ts` |
| 测试文件 | 同源文件名 + .test | `dispatchService.test.ts` |
| Python 文件 | snake_case | `task_service.py` |
| 模块目录 | kebab-case | `help-center/` |
| 组件目录 | PascalCase | `TaskList/` |

---

## 六、与 V4 结构的关键区别

| | V4 | V6 |
|---|---|---|
| 架构模式 | 分层架构（按技术层分） | 特性架构（按业务模块分） |
| 改调度功能 | 跳 5 个目录 | 只进 `modules/dispatch/` |
| 模块边界 | 模糊（composables 全局混放） | 清晰（每个模块自包含） |
| 删除模块 | 满项目找文件 | 删一个目录 |
| 前后端类型 | 各定义一套，容易不一致 | `packages/shared-types/` 统一 |
| 模块间引用 | 随意引用内部文件 | 只能通过 `index.ts` |
| OCR 位置 | 绑定 dispatch | `shared/services/` 跨模块共用 |

---

## 七、关联文档

- 技术栈选型：[tech-stack.md](tech-stack.md)
- 产品概述：[product-overview.md](product-overview.md)
- 需求澄清：[requirements-clarification.md](requirements-clarification.md)
- 下一步：[开发规范制定](development-standards.md)
