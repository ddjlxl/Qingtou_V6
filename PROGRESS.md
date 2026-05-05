# V6 开发进度

> ⚠️ 同一时间只开一个会话进行开发。多开会话可能导致进度文件冲突。
> 最后更新：2026-05-04

---

## 当前状态

| 里程碑 | 阶段 | 状态 |
|--------|------|------|
| M1: MVP | Phase 1.1 项目骨架 | ✅ 已完成 |
| M1: MVP | Phase 1.2 基础设施 | 🔄 进行中 |
| M1: MVP | Phase 1.3 核心业务 | ⬜ 未开始 |
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

- [x] 技术选型确认：SQLite（开发+生产统一）
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
- [x] SQLite 数据库验证通过：11 张表全部创建成功

### 技能迁移 ✅

- [x] 从 V4 迁移 4 个新技能：完成前验证、分支收尾、重构计划、界面设计
- [x] 增强 2 个现有技能：bug-fix（根因追溯+多层防护）、testing（浏览器测试+测试策略）
- [x] 技能总数：17 → 21
- [x] 相关文档已同步更新

---

## 下一步

### Phase 1.2：基础设施（剩余）— 计划已就绪 📋

**1. shared 公共模块**（优先）
- 📄 需求+设计：[specs/features/shared/requirements.md](file:///e:/Qingtou_V6/specs/features/shared/requirements.md)
- 📄 任务规划：[specs/features/shared/tasks.md](file:///e:/Qingtou_V6/specs/features/shared/tasks.md)
- 5 个原子任务：T-001(Axios) → T-002(Utils) → T-003(UI组件) → T-004(后端) → T-005(导出验证)

**2. auth 用户认证**
- 📄 需求：[specs/features/auth/requirements.md](file:///e:/Qingtou_V6/specs/features/auth/requirements.md)
- 📄 设计：[specs/features/auth/design.md](file:///e:/Qingtou_V6/specs/features/auth/design.md)
- 📄 任务规划：[specs/features/auth/tasks.md](file:///e:/Qingtou_V6/specs/features/auth/tasks.md)
- 6 个原子任务：T-101(JWT) → T-102(API) → T-103(Store) → T-104(页面) + T-105(守卫) → T-106(集成)

**执行策略**：先 shared（T-001~T-005），再 auth（T-101~T-106），每个任务 TDD 驱动

---

## 使用说明

新开会话时，AI 应：
1. 读取本文件了解当前进度
2. 扫描实际代码目录交叉验证
3. 主动建议下一步操作
4. 任务完成后更新本文件
