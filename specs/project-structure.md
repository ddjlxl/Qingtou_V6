# 项目目录结构

> **版本**：v1.5
> **创建日期**：2026-05-03
> **更新日期**：2026-05-27

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
│   │   │   ├── favicon.svg
│   │   │   └── icons.svg
│   │   ├── src/
│   │   │   ├── modules/                 # ⭐ 业务模块（特性架构核心）
│   │   │   │   ├── auth/                # 用户认证 ✅ 已完成
│   │   │   │   │   ├── components/      # LoginForm.vue
│   │   │   │   │   ├── stores/          # useAuthStore.ts
│   │   │   │   │   ├── services/        # authService.ts
│   │   │   │   │   ├── types/           # index.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/       # LoginForm.test.ts, useAuthStore.test.ts
│   │   │   │   │
│   │   │   │   ├── dashboard/           # 运营看板 ⬜ 未开发
│   │   │   │   │   └── ...              # M2 Phase 2.1 开发
│   │   │   │   │
│   │   │   │   ├── dispatch/            # 调度中心 ✅ 已完成
│   │   │   │   │   ├── components/      # OrderFormDialog, OrderTable, OrderTableBody, OrderTableToolbar, AssignDialog, AddressDialog, RouteTemplateDialog, useOrderTable
│   │   │   │   │   │   └── sections/    # AssignSection, BusinessSection, ContainerSection, CustomerSection, RouteSection
│   │   │   │   │   ├── composables/     # useOrderForm, useOrderFormHelpers, useOrderFormOptions, useOrderFormRules, useOrderFormWatchers
│   │   │   │   │   ├── pages/           # DispatchPage.vue
│   │   │   │   │   ├── stores/          # useDispatchStore.ts, dispatchStoreActions.ts
│   │   │   │   │   ├── services/        # dispatchService.ts
│   │   │   │   │   ├── types/           # index.ts, order.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── __tests__/       # 12 个测试文件
│   │   │   │   │
│   │   │   │   ├── fleet/               # 车队管理 ✅ 已完成
│   │   │   │   │   ├── components/      # VehicleManagement, VehicleFormDialog, DriverManagement, DriverFormDialog, CertificateManagement, CertificateFormDialog, TransportRecordManagement, TransportFilterBar, TransportStatistics, StatisticsTab, StatusTag, certificateFormConfig
│   │   │   │   │   ├── pages/           # FleetPage.vue
│   │   │   │   │   ├── stores/          # useFleetStore, useFleetVehicles, useFleetDrivers, useFleetCertificates, useFleetTransport, useFleetStatistics
│   │   │   │   │   ├── services/        # fleetService.ts
│   │   │   │   │   ├── types/           # vehicle.ts, driver.ts, certificate.ts, transport-record.ts, statistics.ts, index.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/       # 22 个测试文件
│   │   │   │   │
│   │   │   │   ├── driver/              # 司机端 ✅ 已完成
│   │   │   │   │   ├── components/      # DriverOrderCard.vue
│   │   │   │   │   ├── pages/           # DriverWorkbench.vue, DriverHistory.vue, DriverProfile.vue
│   │   │   │   │   ├── stores/          # useDriverStore.ts
│   │   │   │   │   ├── services/        # driverService.ts
│   │   │   │   │   ├── types/           # index.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/       # 4 个测试文件
│   │   │   │   │
│   │   │   │   ├── warehouse/           # 仓库管理 ✅ 已完成
│   │   │   │   │   ├── components/      # ZoneCard, SlotCell, ManualInboundDialog, ImportInboundDialog, OutboundDialog, SlotEditDialog, StatisticsPanel
│   │   │   │   │   ├── composables/     # useWarehouseSearch
│   │   │   │   │   ├── pages/           # WarehousePage.vue
│   │   │   │   │   ├── stores/          # useWarehouseStore.ts
│   │   │   │   │   ├── services/        # warehouseService.ts
│   │   │   │   │   ├── types/           # index.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── __tests__/       # 12 个测试文件
│   │   │   │   │
│   │   │   │   ├── settings/            # 系统设置 ⬜ 未开发
│   │   │   │   │   └── ...              # M2 Phase 2.1 开发
│   │   │   │   │
│   │   │   │   └── help-center/         # 帮助中心 ⬜ 未开发
│   │   │   │       └── ...              # M3 Phase 3.1 开发
│   │   │   │
│   │   │   ├── shared/                  # 共享基础设施
│   │   │   │   ├── components/          # 通用 UI 组件
│   │   │   │   │   ├── AppLayout.vue    # 主布局组件（Header + Sidebar）
│   │   │   │   │   ├── MobileTabBar.vue # 移动端底部 Tab 栏
│   │   │   │   │   ├── EmptyState.vue
│   │   │   │   │   └── LoadingSpinner.vue
│   │   │   │   ├── utils/               # 工具函数
│   │   │   │   │   ├── format.ts        # formatDate, formatMoney
│   │   │   │   │   ├── logger.ts        # 日志工具
│   │   │   │   │   ├── permission.ts    # hasRole, isAdmin
│   │   │   │   │   ├── typeGuards.ts    # 类型守卫
│   │   │   │   │   ├── validate.ts      # isPhone, isRequired
│   │   │   │   │   └── index.ts
│   │   │   │   ├── api/                 # HTTP 客户端
│   │   │   │   │   ├── client.ts        # Axios 实例 + 拦截器
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts             # 统一导出入口
│   │   │   │   └── index.test.ts
│   │   │   │
│   │   │   ├── views/                   # 页面级视图
│   │   │   │   └── Welcome.vue
│   │   │   ├── router/                  # 路由
│   │   │   │   ├── index.ts             # 路由配置 + 守卫（合并在一个文件）
│   │   │   │   └── __tests__/
│   │   │   │       └── guard.test.ts
│   │   │   ├── assets/                  # 静态资源
│   │   │   │   ├── styles/
│   │   │   │   │   └── global.css       # 全局样式重置
│   │   │   │   ├── hero.png
│   │   │   │   ├── vite.svg
│   │   │   │   └── vue.svg
│   │   │   ├── App.vue
│   │   │   ├── App.test.ts
│   │   │   └── main.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── driver/                           # 司机端 ✅ 已完成（集成在 frontend/modules/driver/）
│   │   └── ...                           # 移动端适配已完成
│   │
│   └── server/                           # 后端（FastAPI + Python）
│       ├── app/
│       │   ├── api/                      # API 路由（按模块组织）
│       │   │   ├── v1/
│       │   │   │   ├── __init__.py
│       │   │   │   ├── auth.py           # 认证接口 ✅
│       │   │   │   ├── dispatch.py       # 调度接口 ✅
│       │   │   │   ├── driver.py         # 司机端接口 ✅
│       │   │   │   ├── fleet.py          # 车队接口 ✅
│       │   │   │   ├── fleet_certificates.py   # 证照接口 ✅
│       │   │   │   ├── fleet_drivers.py        # 司机接口 ✅
│       │   │   │   ├── fleet_statistics.py     # 统计接口 ✅
│       │   │   │   ├── fleet_transport_records.py # 运输流水接口 ✅
│       │   │   │   ├── fleet_vehicles.py       # 车辆接口 ✅
│       │   │   │   ├── dashboard.py     # ⬜ 未开发
│       │   │   │   ├── warehouse.py     # 仓库接口 ✅
│       │   │   │   ├── settings.py      # ⬜ 未开发
│       │   │   │   └── help_center.py   # ⬜ 未开发
│       │   │   └── deps.py               # 依赖注入（get_db, get_current_user）
│       │   ├── models/                   # SQLAlchemy 数据模型
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   ├── user.py
│       │   │   ├── order.py              # ⚠️ 含 dispatch 迁移字段（waypoints, business_type, documents）
│       │   │   ├── vehicle.py
│       │   │   ├── driver.py
│       │   │   ├── certificate.py
│       │   │   ├── transport_record.py
│       │   │   ├── warehouse.py
│       │   │   ├── storage_slot.py
│       │   │   ├── common_address.py
│       │   │   ├── business_type_route.py # dispatch 业务类型快捷填充
│       │   │   ├── dispatch_address.py    # dispatch 常用地址
│       │   │   ├── operation_log.py
│       │   │   ├── system_config.py
│       │   │   └── help_article.py
│       │   ├── schemas/                  # Pydantic 请求/响应模型
│       │   │   ├── __init__.py
│       │   │   ├── auth.py
│       │   │   ├── dispatch.py            # dispatch 请求/响应 Schema
│       │   │   ├── fleet.py
│       │   │   └── warehouse.py           # warehouse 请求/响应 Schema
│       │   ├── services/                 # 业务逻辑层
│       │   │   ├── __init__.py
│       │   │   ├── auth_service.py
│       │   │   ├── dispatch_service.py
│       │   │   ├── dispatch_address_service.py  # 调度常用地址
│       │   │   ├── route_template_service.py    # 业务类型路线模板
│       │   │   ├── fleet_service.py
│       │   │   └── warehouse_service.py   # 仓库管理
│       │   ├── core/                     # 核心配置
│       │   │   ├── __init__.py
│       │   │   ├── config.py             # 应用配置（读取 .env）
│       │   │   ├── constants.py          # 系统常量（SYSTEM_USER_ID）
│       │   │   ├── database.py           # 数据库引擎 + Session 管理
│       │   │   ├── exception_handlers.py # 全局异常处理器
│       │   │   ├── exceptions.py         # 业务异常类（AppException）
│       │   │   ├── logger.py             # 日志配置
│       │   │   ├── security.py           # JWT 生成/验证 + 密码哈希
│       │   │   └── validators/           # 字段级校验
│       │   │       └── fleet_validator.py
│       │   ├── scheduler.py              # APScheduler 定时任务（超时检测 + 证照预警）
│       │   └── main.py                   # FastAPI 应用入口
│       ├── tests/                        # 后端测试 ✅ 25 个测试文件
│       │   ├── __init__.py
│       │   ├── conftest.py
│       │   ├── test_auth_api.py
│       │   ├── test_dispatch_api.py
│       │   ├── test_dispatch_route_template.py
│       │   ├── test_dispatch_service.py
│       │   ├── test_exception_handlers.py
│       │   ├── test_exceptions.py
│       │   ├── test_fleet_certificates.py
│       │   ├── test_fleet_drivers.py
│       │   ├── test_fleet_statistics.py
│       │   ├── test_fleet_transport_records.py
│       │   ├── test_fleet_validator.py
│       │   ├── test_fleet_vehicles.py
│       │   ├── test_logger.py
│       │   ├── test_security.py
│       │   ├── test_skeleton_order_bug.py
│       │   ├── test_warehouse_service.py
│       │   ├── test_complete_order_linkage.py
│       │   ├── test_container_status_api.py
│       │   ├── test_container_status.py
│       │   ├── test_driver_api.py
│       │   ├── test_driver_user_sync.py
│       │   ├── test_delete_order_linkage.py
│       │   ├── test_import_upgrade.py
│       │   ├── test_standalone.py
│       │   └── test_minimal.py
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
│       │   ├── enums.ts
│       │   ├── api.ts                    # ApiResponse<T>, PaginatedResponse<T>...
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── specs/                                # 规格文档（V6 设计产出）
│   ├── PROJECT-CONTEXT.md
│   ├── comprehensive-review-plan.md
│   ├── development-roadmap.md
│   ├── development-standards.md
│   ├── element-plus-design-standards.md
│   ├── product-overview.md
│   ├── project-structure.md
│   ├── requirements-clarification.md
│   ├── review-report-2026-05-15.md
│   ├── tech-stack.md
│   └── features/
│       ├── auth/
│       │   ├── design.md
│       │   ├── development-plan.md
│       │   ├── requirements.md
│       │   └── tasks.md
│       ├── database-model/
│       │   ├── design.md
│       │   └── requirements.md
│       ├── dispatch/
│       │   ├── design.md
│       │   └── requirements.md
│       ├── dispatch-container-edit/
│       │   ├── design.md
│       │   ├── requirements.md
│       │   └── tasks.md
│       ├── dispatch-fleet-linkage/
│       │   ├── design.md
│       │   ├── requirements.md
│       │   └── tasks.md
│       ├── driver-mobile/
│       │   ├── design.md
│       │   ├── requirements.md
│       │   └── tasks.md
│       ├── fleet/
│       │   ├── KNOWN-ISSUES.md
│       │   ├── design.md
│       │   ├── requirements.md
│       │   ├── review-checklist.md
│       │   └── tasks.md
│       ├── warehouse/
│       │   ├── design.md
│       │   ├── requirements.md
│       │   └── tasks.md
│       ├── shared/
│       │   ├── requirements.md
│       │   └── tasks.md
│       └── test-coverage/
│           └── tasks.md
│
├── docs/                                 # 开发文档
│   ├── 2026-03-15-公司业务与运营全维度总结.md
│   ├── AI纯大模型开发可行性评估.md
│   ├── V4调度中心页面功能详细文档.md
│   ├── v4仓库管理页面需求澄清.md
│   ├── SQLite转PostgreSQL迁移踩坑总结.md
│   ├── 审查标准.md
│   ├── 模块概览.md
│   ├── 项目健康检查维度手册.md
│   ├── Harness Engineering 研究報告.md
│   ├── Harness Engineering 优化建议.md
│   ├── Harness Engineering 优化实施路线图.md
│   └── 开发记录/
│       ├── Bug修复_切换业务类型路线不跟随变化_20260516.md
│       ├── Bug修复_路线模板允许空地址_20260516.md
│       ├── Bug修复_运输流水下载模板失败_20260523.md
│       ├── Bug修复_出库业务类型地址自动填充_20260526.md
│       ├── Bug修复_移动后选中状态未清空_20260526.md
│       ├── 仓库管理_迭代_CR-001_20260526.md
│       ├── 健康报告_2026-05-21.md
│       ├── 测试补充_阶段1_完成报告.md
│       ├── 测试补充_阶段2_完成报告.md
│       ├── 测试补充_阶段3_完成报告.md
│       └── 测试补充_阶段4_完成报告.md
│
├── scripts/                              # 脚本工具
│   ├── architecture-check.js
│   ├── code-quality-check.js
│   ├── create-v6-skills.js
│   ├── development-validation.js
│   ├── init-project.js
│   ├── pre-development-checklist.js
│   ├── test_vehicle_management.py        # e2e 车辆管理测试脚本
│   └── screenshots/                      # e2e 测试截图
│       ├── step1_fleet_page.png
│       ├── step2_vehicle_tab.png
│       ├── step3_dialog_open.png
│       ├── step4_after_save.png
│       └── step5_blur_validation.png
│
├── .trae/                                # AI 协作规则配置
│   └── rules/
│       ├── project-context.md
│       ├── project_rules.md
│       ├── guardrails.md
│       └── ai-constraints.md
│
├── pnpm-workspace.yaml
├── .gitignore
├── AGENTS.md                             # 项目入口地图
├── CLAUDE.md                             # 通用编码行为准则
├── README.md
└── package.json                          # Monorepo 根 package.json
```

---

## 三、模块职责说明

### 前端模块

| 模块 | 开发状态 | 职责 | 依赖 |
|------|---------|------|------|
| auth | ✅ 已完成 | 登录/登出、token 管理、角色权限 | shared |
| dashboard | ⬜ 未开发 | 首页看板、地图定位、指标统计、运力列表 | shared, auth |
| dispatch | ✅ 已完成 | 任务 CRUD、司机分配、常用地址 | shared, auth, fleet |
| driver | ✅ 已完成 | 司机工作台、任务状态更新、移动端适配 | shared, auth, dispatch |
| fleet | ✅ 已完成 | 车辆/司机档案、证照管理、运输流水、车队统计 | shared, auth |
| warehouse | ✅ 已完成 | 仓库/库位管理、出入库、库存查询、批量导入、集装箱移动 | shared, auth |
| settings | ⬜ 未开发 | 用户管理、参数配置、操作日志 | shared, auth |
| help-center | ⬜ 未开发 | 图文教程展示、后台编辑管理 | shared, auth |

### 后端模块

| 模块 | 开发状态 | 职责 | 依赖 |
|------|---------|------|------|
| api/v1/auth | ✅ 已完成 | 登录/注册/token 刷新 | models, services, core |
| api/v1/dashboard | ⬜ 未开发 | 看板数据聚合、地图数据 | models, services |
| api/v1/dispatch | ✅ 已完成 | 任务 CRUD、分配 | models, services |
| api/v1/driver | ✅ 已完成 | 司机端任务查询、状态更新 | models, services |
| api/v1/fleet | ✅ 已完成 | 车辆/司机管理、证照、统计 | models, services |
| api/v1/warehouse | ✅ 已完成 | 仓库/库位/出入库/移动/搜索/统计 | models, services |
| api/v1/settings | ⬜ 未开发 | 用户管理、参数、日志 | models, services |
| api/v1/help_center | ⬜ 未开发 | 教程内容管理 | models, services |

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
| OCR 位置 | 绑定 dispatch | 🔜 `shared/services/` 跨模块共用（M2 实现） |

---

## 七、关联文档

- 技术栈选型：[tech-stack.md](tech-stack.md)
- 产品概述：[product-overview.md](product-overview.md)
- 需求澄清：[requirements-clarification.md](requirements-clarification.md)
- 下一步：[开发规范制定](development-standards.md)
