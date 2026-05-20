# V6 开发进度

> ⚠️ 同一时间只开一个会话进行开发。多开会话可能导致进度文件冲突。
> 最后更新：2026-05-20（dispatch-fleet-linkage 联动全部完成，M1 MVP 核心功能已实现）

---

## 当前状态

| 里程碑 | 阶段 | 状态 |
|--------|------|------|
| M1: MVP | Phase 1.1 项目骨架 | ✅ 已完成 |
| M1: MVP | Phase 1.2 基础设施 | ✅ 已完成 |
| M1: MVP | Phase 1.3 核心业务 — auth 认证 | ✅ 已完成 |
| M1: MVP | Phase 1.3 核心业务 — fleet 车队管理 | ✅ 已完成 |
| M1: MVP | Phase 1.3 核心业务 — dispatch 调度中心 | ✅ 已完成 |
| M1: MVP | Phase 1.3 核心业务 — driver 司机端 | ✅ 已完成 |
| M1: MVP | Phase 1.3 核心业务 — dispatch-fleet-linkage 联动 | ✅ 已完成 |
| M2: 完整版 | - | ⬜ 未开始 |
| M3: 增强版 | - | ⬜ 未开始 |

---

## 已完成

### Phase 1.1：项目骨架 ✅

- [x] Monorepo 初始化（pnpm workspace）
- [x] 前端项目（Vite + Vue 3 + TS + Element Plus）
- [x] 后端项目（FastAPI + SQLAlchemy，目录结构 + requirements.txt）
- [x] shared-types 共享包（枚举 + API 类型）
- [x] 司机端目录骨架
- [x] 工具链配置（ESLint 9 flat config、Prettier、TS 严格模式、Vitest）
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅ / dev ✅

### Phase 1.2：基础设施 — 数据库模型 ✅

- [x] 技术选型确认：PostgreSQL（从 SQLite 迁移，支持生产部署）
- [x] 数据库模型设计文档：[specs/features/database-model/design.md](file:///e:/Qingtou_V6/specs/features/database-model/design.md)
- [x] SQLAlchemy 模型实现（每个模型独立文件）：
  - [x] [users](file:///e:/Qingtou_V6/apps/server/app/models/user.py) — 用户表
  - [x] [orders](file:///e:/Qingtou_V6/apps/server/app/models/order.py) — 订单表
  - [x] [drivers](file:///e:/Qingtou_V6/apps/server/app/models/driver.py) — 司机表
  - [x] [vehicles](file:///e:/Qingtou_V6/apps/server/app/models/vehicle.py) — 车辆表
  - [x] [warehouses](file:///e:/Qingtou_V6/apps/server/app/models/warehouse.py) — 仓库表
  - [x] [storage_slots](file:///e:/Qingtou_V6/apps/server/app/models/storage_slot.py) — 库位表
  - [x] [certificates](file:///e:/Qingtou_V6/apps/server/app/models/certificate.py) — 证照表
  - [x] [common_addresses](file:///e:/Qingtou_V6/apps/server/app/models/common_address.py) — 常用地址表
  - [x] [operation_logs](file:///e:/Qingtou_V6/apps/server/app/models/operation_log.py) — 操作日志表
  - [x] [system_configs](file:///e:/Qingtou_V6/apps/server/app/models/system_config.py) — 系统配置表
  - [x] [help_articles](file:///e:/Qingtou_V6/apps/server/app/models/help_article.py) — 帮助文章表
- [x] 数据库连接管理：[app/core/database.py](file:///e:/Qingtou_V6/apps/server/app/core/database.py)
- [x] 应用配置管理：[app/core/config.py](file:///e:/Qingtou_V6/apps/server/app/core/config.py)
- [x] Alembic 迁移配置：[alembic.ini](file:///e:/Qingtou_V6/apps/server/alembic.ini) + [alembic/env.py](file:///e:/Qingtou_V6/apps/server/alembic/env.py)
- [x] 初始迁移脚本：[alembic/versions/20260503_init_database.py](file:///e:/Qingtou_V6/apps/server/alembic/versions/20260503_init_database.py)
- [x] PostgreSQL 数据库验证通过：11 张表全部创建成功（从 SQLite 迁移）

### Phase 1.2：基础设施 — shared 公共模块 ✅

- [x] 技术设计文档：[specs/features/shared/requirements.md](file:///e:/Qingtou_V6/specs/features/shared/requirements.md)
- [x] 任务规划文档：[specs/features/shared/tasks.md](file:///e:/Qingtou_V6/specs/features/shared/tasks.md)
- [x] 前端 Axios 客户端：
  - [x] [client.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/api/client.ts) — HTTP 客户端 + 拦截器
  - [x] [client.test.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/api/client.test.ts) — 单元测试
  - [x] 支持 token 自动注入、401 自动跳转、统一错误处理
  - [x] 集成 `ApiResponse<T>` 类型
- [x] 前端工具函数：
  - [x] [format.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/format.ts) — 日期/金额格式化
  - [x] [validate.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/validate.ts) — 手机号/必填验证
  - [x] [permission.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/permission.ts) — 角色权限检查
  - [x] 所有工具函数均有对应测试文件
- [x] 前端通用 UI 组件：
  - [x] [EmptyState.vue](file:///e:/Qingtou_V6/apps/frontend/src/shared/components/EmptyState.vue) — 空状态组件
  - [x] [LoadingSpinner.vue](file:///e:/Qingtou_V6/apps/frontend/src/shared/components/LoadingSpinner.vue) — 加载动画组件
  - [x] 所有组件均有对应测试文件
- [x] 后端基础设施：
  - [x] [logger.py](file:///e:/Qingtou_V6/apps/server/app/core/logger.py) — 日志工具（控制台+文件双输出）
  - [x] [exceptions.py](file:///e:/Qingtou_V6/apps/server/app/core/exceptions.py) — 业务异常类
  - [x] [exception_handlers.py](file:///e:/Qingtou_V6/apps/server/app/core/exception_handlers.py) — 全局异常处理器
  - [x] 所有模块均有对应测试文件
- [x] 模块导出规范：
  - [x] [frontend/src/shared/index.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/index.ts) — 前端统一导出
  - [x] [server/app/core/__init__.py](file:///e:/Qingtou_V6/apps/server/app/core/__init__.py) — 后端统一导出
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅

### Phase 1.3：核心业务 — auth 用户认证 ✅

- [x] 需求文档：[specs/features/auth/requirements.md](file:///e:/Qingtou_V6/specs/features/auth/requirements.md)
- [x] 设计文档：[specs/features/auth/design.md](file:///e:/Qingtou_V6/specs/features/auth/design.md)
- [x] 任务规划：[specs/features/auth/tasks.md](file:///e:/Qingtou_V6/specs/features/auth/tasks.md)
- [x] T-101：后端 JWT 安全模块 — [core/security.py](file:///e:/Qingtou_V6/apps/server/app/core/security.py)（11 tests）
- [x] T-102：后端登录 API — [api/v1/auth.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/auth.py) + [auth_service.py](file:///e:/Qingtou_V6/apps/server/app/services/auth_service.py)（8 tests）
- [x] T-103：前端认证 Store + API 服务 — [modules/auth/](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/)（16 tests）
- [x] T-104：前端登录页面 — [LoginForm.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/components/LoginForm.vue)（6 tests）
- [x] T-105：路由守卫 + 角色权限 — [router/index.ts](file:///e:/Qingtou_V6/apps/frontend/src/router/index.ts)（3 tests）
- [x] T-106：集成验证 — type-check ✅ / lint ✅ / test ✅（14 files, 102 tests）

### Phase 1.3：核心业务 — fleet 车队管理（阶段 0 + 阶段 1）✅

**阶段 0：基础设施** ✅
- [x] T-001 ~ T-010：数据库模型、Pydantic Schema、验证器、服务层、API 路由骨架
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅（56 tests）

**阶段 1：车辆管理** ✅
- [x] T-101：车辆类型定义 — [types/vehicle.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/vehicle.ts)
- [x] T-102：前端车辆 API 服务 — [services/fleetService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/services/fleetService.ts)
- [x] T-103：后端车辆 CRUD API — [api/v1/fleet_vehicles.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_vehicles.py)
- [x] T-104：前端车辆 Store — [stores/useFleetStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/stores/useFleetStore.ts)
- [x] T-105：车辆管理组件 — [components/VehicleManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/VehicleManagement.vue)
- [x] T-106：车辆表单弹窗 — [components/VehicleFormDialog.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/VehicleFormDialog.vue)
- [x] T-107：StatusTag 状态标签 — [components/StatusTag.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/StatusTag.vue)
- [x] T-108：前端单元测试 — [__tests__/](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/__tests__/)（17 tests）
- [x] T-109：后端 API 测试 — [tests/test_fleet_vehicles.py](file:///e:/Qingtou_V6/apps/server/tests/test_fleet_vehicles.py)（17 tests）
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅（前端 115 tests + 后端 73 tests）

**阶段 2：司机管理** ✅
- [x] T-201：司机类型定义 — [types/driver.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/driver.ts)
- [x] T-202：前端司机 API 服务 — [services/fleetService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/services/fleetService.ts)
- [x] T-203：后端司机 CRUD API — [api/v1/fleet_drivers.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_drivers.py)
- [x] T-204：前端司机 Store — [stores/useFleetStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/stores/useFleetStore.ts)
- [x] T-205：司机管理组件 — [components/DriverManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/DriverManagement.vue)
- [x] T-206：司机表单弹窗 — [components/DriverFormDialog.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/DriverFormDialog.vue)
- [x] T-207：前端单元测试 — [__tests__/](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/__tests__/)（26 tests）
- [x] T-208：后端 API 测试 — [tests/test_fleet_drivers.py](file:///e:/Qingtou_V6/apps/server/tests/test_fleet_drivers.py)（15 tests）
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅（前端 141 tests + 后端 88 tests）

**阶段 3：证照管理** ✅
- [x] T-301：证照类型定义 — [types/certificate.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/certificate.ts)
- [x] T-302：前端证照 API 服务 — [services/fleetService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/services/fleetService.ts)
- [x] T-303：后端证照 CRUD API — [api/v1/fleet_certificates.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_certificates.py)
- [x] T-304：前端证照 Store — [stores/useFleetStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/stores/useFleetStore.ts)
- [x] T-305：证照管理组件 — [components/CertificateManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/CertificateManagement.vue)
- [x] T-306：证照表单弹窗 — [components/CertificateFormDialog.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/CertificateFormDialog.vue)
- [x] T-307：前端单元测试 — [__tests__/](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/__tests__/)（44 tests）
- [x] T-308：后端 API 测试 — [tests/test_fleet_certificates.py](file:///e:/Qingtou_V6/apps/server/tests/test_fleet_certificates.py)（14 tests）
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅（前端 185 tests + 后端 102 tests）

**阶段 4：运输流水** ✅
- [x] T-401：运输流水类型定义 — [types/transport-record.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/transport-record.ts)
- [x] T-402：前端运输流水 API 服务 — [services/fleetService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/services/fleetService.ts)
- [x] T-403：后端运输流水 API — [api/v1/fleet_transport_records.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_transport_records.py)
- [x] T-404：前端运输流水 Store — [stores/useFleetStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/stores/useFleetStore.ts)
- [x] T-405：运输流水管理组件（含导入） — [components/TransportRecordManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/TransportRecordManagement.vue)
- [x] T-406：导入弹窗组件 — 🔀 已合并至 T-405（ImportDialog.vue 已删除，功能集成到 TransportRecordManagement）
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅（前端 140 tests + 后端 102 tests）

**阶段 5：车队统计** ✅
- [x] T-501：统计类型定义 — [types/statistics.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/statistics.ts)
- [x] T-502：前端统计 API 服务 — [services/fleetService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/services/fleetService.ts)
- [x] T-503：后端统计 API — [api/v1/fleet_statistics.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_statistics.py)
- [x] T-504：前端统计 Store — [stores/useFleetStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/stores/useFleetStore.ts)
- [x] T-505：统计概览 Tab 页面 — [components/StatisticsTab.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/StatisticsTab.vue)
- [x] T-506：Fleet 主页面（5 Tab 整合） — [pages/FleetPage.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/pages/FleetPage.vue)
- [x] T-507：模块公共 API 导出 — [index.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/index.ts)
- [x] 验证通过：type-check ✅ / lint ✅ / test ✅（前端 243 tests + 后端 124 tests）

### 技能迁移 ✅

- [x] 从 V4 迁移 4 个新技能：完成前验证、分支收尾、重构计划、界面设计
- [x] 增强 2 个现有技能：bug-fix（根因追溯+多层防护）、testing（浏览器测试+测试策略）
- [x] 技能总数：17 → 21
- [x] 相关文档已同步更新

### Phase 1.3：核心业务 — driver 司机端 ✅

- [x] 需求文档：[specs/features/driver-mobile/requirements.md](file:///e:/Qingtou_V6/specs/features/driver-mobile/requirements.md)
- [x] 设计文档：[specs/features/driver-mobile/design.md](file:///e:/Qingtou_V6/specs/features/driver-mobile/design.md)
- [x] 任务规划：[specs/features/driver-mobile/tasks.md](file:///e:/Qingtou_V6/specs/features/driver-mobile/tasks.md)
- [x] 后端 API：[api/v1/driver.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/driver.py) — 司机端专用接口（任务列表/开始运输/标记完成）
- [x] 前端页面：DriverWorkbench.vue + DriverHistory.vue + DriverProfile.vue
- [x] 前端 Store：useDriverStore.ts
- [x] 前端 Service：driverService.ts
- [x] 前端组件：DriverOrderCard.vue
- [x] 前端类型：types/index.ts
- [x] 前端测试：__tests__/useDriverStore.test.ts
- [x] 路由配置：`/driver`、`/driver/history`、`/driver/profile`（roles=['driver']）
- [x] 登录跳转：按角色动态跳转（driver → /driver，其他 → /fleet）

### Phase 1.3：核心业务 — dispatch 调度中心 ✅

- [x] 需求文档：[specs/features/dispatch/requirements.md](file:///e:/Qingtou_V6/specs/features/dispatch/requirements.md)（42 条 AC）
- [x] 技术设计文档：[specs/features/dispatch/design.md](file:///e:/Qingtou_V6/specs/features/dispatch/design.md)
  - Order 模型迁移：5 字段改 NULL + 3 新字段 + 3 个 relationship
  - 新建 DispatchAddress 模型 + BusinessTypeRoute 模型
  - 14 个 API 接口
  - 前端组件结构 + Pinia Store
  - 核心逻辑：任务创建/分配事务/状态流转/超时检测/删除流程
  - AC 覆盖：42/42 ✅
- [x] 后端 API：[api/v1/dispatch.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/dispatch.py) — 14 个端点
- [x] 后端 Service：[services/dispatch_service.py](file:///e:/Qingtou_V6/apps/server/app/services/dispatch_service.py) — 17 个函数
- [x] 后端 Model：[models/dispatch_address.py](file:///e:/Qingtou_V6/apps/server/app/models/dispatch_address.py) + [models/business_type_route.py](file:///e:/Qingtou_V6/apps/server/app/models/business_type_route.py)
- [x] 前端 Page：[pages/DispatchPage.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/dispatch/pages/DispatchPage.vue)
- [x] 前端 Store：[stores/useDispatchStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/dispatch/stores/useDispatchStore.ts)
- [x] 前端 Service：[services/dispatchService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/dispatch/services/dispatchService.ts)
- [x] 前端 Types：[types/order.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/dispatch/types/order.ts)
- [x] 前端 Components：OrderFormDialog、OrderTable、AssignDialog、AddressDialog、RouteTemplateDialog + 5 个 section 组件
- [x] 前端 Composables：[composables/useOrderForm.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/dispatch/composables/useOrderForm.ts)
- [x] 前端测试：[__tests__/OrderFormDialog.test.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/dispatch/__tests__/OrderFormDialog.test.ts)（9 tests）

---

## 下一步

### Phase 2.1：业务补齐 — warehouse 仓库管理 ⬜

后续模块：warehouse 仓库管理

---

## 已完成

### Phase 1.3：核心业务 — dispatch-fleet-linkage 联动 ✅

- [x] 需求文档：[specs/features/dispatch-fleet-linkage/requirements.md](file:///e:/Qingtou_V6/specs/features/dispatch-fleet-linkage/requirements.md)（24 条 AC）
- [x] 技术设计：[specs/features/dispatch-fleet-linkage/design.md](file:///e:/Qingtou_V6/specs/features/dispatch-fleet-linkage/design.md)（四轮审查通过）
- [x] 任务规划：[specs/features/dispatch-fleet-linkage/tasks.md](file:///e:/Qingtou_V6/specs/features/dispatch-fleet-linkage/tasks.md)（9 个任务，6 个阶段）

| 阶段 | 任务范围 | 任务数 | 状态 | 说明 |
|------|---------|--------|------|------|
| 阶段 0: 数据库迁移 | Task-01 | 1 | ✅ | Order + TransportRecord 加 container_status 字段 |
| 阶段 1: 调度端空重箱 | Task-02 ~ Task-03 | 2 | ✅ | 后端 Schema + 前端 dispatch 侧（ContainerSection.vue）+ fleet 侧（transport-record.ts + TransportRecordManagement.vue 空重箱列） |
| 阶段 2: 完成→流水联动 | Task-04 | 1 | ✅ | complete_order 自动创建运输流水 |
| 阶段 3: 删除→流水同步删除 | Task-05 | 1 | ✅ | delete_order 同步删除关联流水 |
| 阶段 4: 司机账号联动 | Task-06 | 1 | ✅ | 创建/修改/删除司机同步处理 User |
| 阶段 5: 导入格式升级 | Task-07 | 1 | ✅ | 7/8 列兼容 + container_status 校验 |
| 阶段 6: 司机工作台 | Task-08 ~ Task-09 | 2 | ✅ | 司机端 API + 前端工作台页面 |

---

### dispatch 模块技术债（待修复）

- [ ] 文件超行拆分（OrderFormDialog 561 行、OrderTable 358 行、dispatch_service.py 419 行）
- [ ] ESLint error 修复（11 个 vue/no-mutating-props）
- [ ] 后端测试补充
- [ ] 任务规划文档 tasks.md 待创建

---

## 使用说明

新开会话时，AI 应：
1. 读取本文件了解当前进度
2. 扫描实际代码目录交叉验证
3. 主动建议下一步操作
4. 任务完成后更新本文件
