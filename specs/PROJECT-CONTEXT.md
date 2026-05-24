# 项目上下文

> AI 启动时读取本文档建立项目认知。本文档是 20 个 Skill 的前置条件——读完就能干活。
> 详细导航见 [AGENTS.md](../AGENTS.md)

---

## 项目是什么

**青投供应链物流运输调度系统 V6**

一个 B2B 物流运输调度平台，管理车队、司机、订单、仓库。前端 Vue 3 + Element Plus，后端 FastAPI + PostgreSQL（已从 SQLite 迁移），Monorepo 架构（pnpm workspace）。

---

## 技术栈速览

| 层 | 技术 |
|---|------|
| 前端 | Vue 3 + TypeScript + Element Plus + Pinia + Vite |
| 后端 | FastAPI + SQLAlchemy + PostgreSQL |
| 共享 | `@qingtou/shared-types`（枚举 + API 类型） |
| 测试 | Vitest（前端）/ pytest（后端） |
| 包管理 | pnpm workspace（Monorepo） |

---

## 目录速览

```
apps/frontend/src/modules/   # 前端功能模块（auth/fleet/dispatch/driver/warehouse/...）
apps/server/app/             # 后端（models/ api/ core/ schemas/）
specs/features/              # 各功能的设计/需求/任务文档
specs/                       # 产品概述、技术栈、开发规范、路线图
.trae/skills/                # AI Skill 定义（22个）
.trae/rules/                 # AI 行为规则（guardrails/ai-constraints/project_rules）
scripts/                     # 检查脚本（architecture-check/code-quality-check）
```

---

## 当前进度

| 阶段 | 状态 |
|------|------|
| Phase 1.1 骨架 | ✅ |
| Phase 1.2 基础设施（数据库模型） | ✅ |
| Phase 1.3 auth 认证 | ✅ |
| Phase 1.3 fleet 车队管理 | ✅ |
| Phase 1.3 dispatch 调度中心 | ✅ |
| Phase 1.3 driver 司机端 | ✅ |
| Phase 1.3 dispatch-fleet-linkage 联动 | ✅ |
| Phase 1.3 dispatch-container-edit 补充箱号封号 | ✅ |
| **Phase 2.1 warehouse 仓库管理** | **⬜ 下一步** |

---

## 架构约束（零容忍）

```
依赖方向（严格单向）：Types → Config → Repo → Service → Runtime → UI
模块引用：只能通过 index.ts 引用模块，禁止引用模块内部文件
```

| 规则 | 强制执行 |
|------|---------|
| 禁止 `any` 类型 | ESLint `error` |
| 禁止 `console.log` | ESLint `error` |
| 文件 ≤ 300 行 warn / ≤ 500 行 error | ESLint `warn` + code-quality-check `error` |
| 函数 ≤ 50 行 warn / ≤ 80 行 error | ESLint `warn` + code-quality-check `error` |
| 样式必须 `scoped` | ESLint |
| 不写未被请求的功能 | 1.6 外科手术原则 |
| 不顺手重构无关代码 | 1.7 外科手术原则 |

---

## 常用命令

```bash
pnpm dev          # 前端 http://localhost:9527
pnpm dev:server   # 后端
pnpm lint         # ESLint
pnpm type-check   # TS 类型检查
pnpm test         # 全部测试
pnpm arch-check   # 架构约束检查
pnpm quality-check # 代码质量检查
docker compose up -d  # 启动 PostgreSQL
```

---

## 数据库

PostgreSQL，docker compose 管理。健康检查：`GET /api/health`。
模型文件在 `apps/server/app/models/`，每个模型一个文件。