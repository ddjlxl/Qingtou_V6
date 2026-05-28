# AGENTS.md — V6 项目 AI 入口索引

> 版本：v1.5 | 更新：2026-05-27
> 这是 AI 智能体的入口地图，约 100 行，引导按需深入

---

## 快速导航

| 我想知道 | 去看 |
|---------|------|
| 项目是什么 | [specs/product-overview.md](specs/product-overview.md) |
| 用什么技术 | [specs/tech-stack.md](specs/tech-stack.md) |
| 代码放哪里 | [specs/project-structure.md](specs/project-structure.md) |
| 怎么写代码 | [specs/development-standards.md](specs/development-standards.md) |
| 现在做到哪 | [PROGRESS.md](PROGRESS.md) |
| 下一步做什么 | [specs/development-roadmap.md](specs/development-roadmap.md) |

---

## 当前状态

- **里程碑**：M2 完整版（进行中）
- **已完成**：Phase 1.1 骨架 ✅ / 1.2 基础设施 ✅ / 1.3 auth 认证 ✅ / 1.3 fleet 车队管理 ✅ / 1.3 dispatch 调度中心 ✅ / 1.3 driver 司机端 ✅ / 1.3 dispatch-fleet-linkage 联动 ✅ / 1.3 dispatch-container-edit 补充箱号封号 ✅ / 2.1 warehouse 仓库管理 ✅
- **下一步**：Phase 2.1 dashboard 运营看板 ⬜
- **数据库**：PostgreSQL（2026-05-17 从 SQLite 迁移完成，前端 899 个测试通过，后端 334 个测试）
- **本地开发**：`docker compose up -d` 一键启动 PostgreSQL（含 `docker-compose.yml`）
- **健康检查**：`GET /api/health` 返回数据库连通状态 + 连接池实时指标

---

## 模块地图

| 模块 | 前端位置 | 后端位置 | 状态 |
|------|---------|---------|------|
| auth | `apps/frontend/src/modules/auth/` | `apps/server/app/api/v1/auth.py` | ✅ |
| fleet | `apps/frontend/src/modules/fleet/` | `apps/server/app/api/v1/fleet*.py` | ✅ |
| dispatch | `apps/frontend/src/modules/dispatch/` | `apps/server/app/api/v1/dispatch.py` | ✅ |
| driver | `apps/frontend/src/modules/driver/` | `apps/server/app/api/v1/driver.py` | ✅ |
| warehouse | `apps/frontend/src/modules/warehouse/` | `apps/server/app/api/v1/warehouse.py` | ✅ |
| dashboard | `apps/frontend/src/modules/dashboard/` | `apps/server/app/api/v1/dashboard.py` | ⬜ |
| settings | `apps/frontend/src/modules/settings/` | `apps/server/app/api/v1/settings.py` | ⬜ |
| help-center | `apps/frontend/src/modules/help-center/` | `apps/server/app/api/v1/help_center.py` | ⬜ |

---

## 开发流程

```
功能需求澄清 → 功能技术设计 → 任务规划 → TDD编码实现 → 测试验证
```

每个功能走一遍，不能跳步。只有 `feature-implementation` 阶段能写代码。

---

## 架构约束

```
Types → Config → Repo → Service → Runtime → UI
（严格单向依赖，违规会被 architecture-check.js 拦截）
```

模块间只能通过 `index.ts` 引用，禁止直接引用模块内部文件。

---

## 零容忍规则

| 规则 | 强制执行方式 |
|------|-------------|
| 禁止 `any` 类型 | ESLint `no-explicit-any: error` |
| 禁止 `console.log` | ESLint `no-console: error` |
| 文件 ≤ 300 行 warn / ≤ 500 行 error | `code-quality-check.js` |
| 函数 ≤ 50 行 warn / ≤ 80 行 error | `code-quality-check.js` |
| 样式必须 `scoped` | ESLint |
| 异步必须有 try-catch | code-review |
| 组件处理 loading/empty/error | code-review |

---

## 常用命令

```bash
pnpm dev          # 启动前端开发服务器
pnpm dev:server   # 启动后端开发服务器
pnpm lint         # ESLint 检查
pnpm type-check   # TypeScript 类型检查
pnpm test         # 运行测试
```

---

## 文档体系

| 文档 | 路径 |
|------|------|
| 入口索引（本文档） | `AGENTS.md` |
| 项目上下文协议 | `.trae/rules/project-context.md` |
| 阶段边界守卫 | `.trae/rules/guardrails.md` |
| 开发规则速查 | `.trae/rules/project_rules.md` |
| V4 教训详解 | `.trae/rules/ai-constraints.md` |
| Skills 使用指南 | `.trae/README.md` |
| Skills 速查卡 | `.trae/QUICK-REFERENCE.md` |
