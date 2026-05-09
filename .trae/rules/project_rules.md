# V6 项目开发规则速查表

> **版本**：v1.1  
> **适用范围**：青投供应链V6项目开发  
> **最后更新**：2026-05-04  
> **定位**：AI 开发行为的一页式速查规则，详细规范见引用文档

---

## 一、硬性规则（零容忍）

### 1.1 代码提交规则
1. **禁止未经用户确认的自动提交**：AI 不得在未获得用户明确批准的情况下提交代码
2. **提交信息规范**：必须使用详细中文描述（如"添加 OCR 箱号识别功能"）
3. **操作范围锁定**：严格限制在 `E:\Qingtou_V6` 目录内

### 1.2 测试与验证规则
1. **日常开发**：代码完成后静默报告，不自动运行测试
2. **完成声明前**：声称"完成"、"通过"、"修好了"之前，**必须**运行 `verification-before-completion` 验证门禁
3. **测试覆盖率**：核心功能必须达到 80% 以上

### 1.3 文档更新规则
1. **代码变更必须更新文档**：API 变更、数据库变更必须同步更新 specs 目录下对应文档
2. **文档版本控制**：所有文档必须有版本号和更新日期
3. **分支收尾时检查**：`finishing-a-development-branch` 会自动检查文档一致性

---

## 二、参考文档优先级

| 优先级 | 文件 | 内容 | 何时参考 |
|--------|------|------|---------|
| 1 | [specs/development-standards.md](../../specs/development-standards.md) | 零容忍规则、命名约定、组件模板 | 编写代码时 |
| 2 | [specs/tech-stack.md](../../specs/tech-stack.md) | 技术栈选型、版本要求、关键决策 | 技术选型时 |
| 3 | [specs/product-overview.md](../../specs/product-overview.md) | 功能需求、验收标准、业务规则 | 涉及功能开发时 |
| 4 | [specs/requirements-clarification.md](../../specs/requirements-clarification.md) | 需求澄清、约束条件、成功标准 | 需求不明确时 |
| 5 | [specs/features/database-model/design.md](../../specs/features/database-model/design.md) | 数据库模型、字段定义 | 涉及数据操作时 |
| 6 | [CLAUDE.md](../../CLAUDE.md) | 通用编码行为准则 | 编写代码时 |

---

## 三、技术栈白名单（设计/编码时必须对照）

> 详细选型理由见 [specs/tech-stack.md](../../specs/tech-stack.md)

### 3.1 前端技术栈

| 类别 | ✅ 允许使用 | ❌ 禁止使用 |
|------|------------|------------|
| 框架 | Vue 3.5 (Composition API) | React、Angular、Nuxt |
| 构建 | Vite 6 | Webpack |
| 类型 | TypeScript 5.8 (strict) | — |
| UI 组件库 | **Element Plus 2** (`el-button`、`el-input`、`el-table`、`el-select`、`el-dialog`、`el-tabs`、`el-tag`、`el-upload`、`el-form`、`el-pagination` 等) | shadcn/ui、Ant Design、Naive UI、Vuetify、自定义 Base* 组件 |
| 样式 | `<style scoped>` | Tailwind CSS、全局样式、CSS Modules |
| 状态管理 | Pinia 3 | Vuex |
| 路由 | Vue Router 4 | — |
| HTTP | Axios 1 | fetch（直接使用） |
| 地图 | Leaflet 1.9（原生 API，不使用 Vue 封装层） | 高德地图 SDK、百度地图 SDK、Google Maps |
| 日期 | dayjs 1 | moment.js、date-fns、luxon |
| Excel | xlsx 0.18 | — |
| 公共组件 | EmptyState.vue、LoadingSpinner.vue（`shared/components/`） | 自定义 BaseButton、BaseInput、BaseTable 等 |

### 3.2 后端技术栈

| 类别 | ✅ 允许使用 | ❌ 禁止使用 |
|------|------------|------------|
| 框架 | FastAPI 0.115+ | Django、Flask |
| 语言 | Python 3.11+ | — |
| ORM | SQLAlchemy 2 (async) | 原生 SQL（除非必要） |
| 迁移 | Alembic 1.13 | — |
| 校验 | Pydantic 2 | — |
| 认证 | python-jose 3 (JWT) + bcrypt 4 | — |
| 服务器 | uvicorn 0.30 | gunicorn |

### 3.3 数据库

| 类别 | ✅ 允许使用 | ❌ 禁止使用 |
|------|------------|------------|
| 数据库 | **SQLite**（开发+生产统一，aiosqlite 异步驱动） | PostgreSQL、MySQL、MongoDB |

### 3.4 开发工具

| 类别 | ✅ 允许使用 | ❌ 禁止使用 |
|------|------------|------------|
| 包管理 | pnpm | npm、yarn |
| 测试 | Vitest + @vue/test-utils + jsdom | Jest |
| 代码检查 | ESLint + Prettier | — |
| 类型检查 | vue-tsc | — |

### 3.5 引入新依赖的规则

1. **设计阶段**：如需引入白名单外的依赖，必须在设计文档的"设计决策记录"中说明理由并等待用户批准
2. **编码阶段**：禁止在编码时临时引入设计文档未列出的依赖
3. **审查阶段**：`code-review` 会检查 `package.json` / `requirements.txt` 是否与设计文档一致

---

## 四、Skills 体系与阶段边界

V6 项目采用 **21 个 Skills + 11 阶段** 的规范驱动开发流程。详见 [guardrails.md](guardrails.md)。

### 核心工作流

```
项目级（一次性）：
  需求澄清 → 产品规划 → 技术设计 → 路线图规划 → 项目初始化

功能级（循环使用）：
  功能需求澄清 → 功能技术设计 → 任务规划 → TDD编码实现 → 测试验证
                                                            ↓
                                                      功能迭代 ←┘
```

### 常用 Skills 速查

| 场景 | Skill | 说明 |
|------|-------|------|
| 新功能开发 | `/feature-requirements-clarification` | 澄清功能需求，产出 AC |
| 技术方案设计 | `/feature-design` | 设计 DB/API/组件结构 |
| 任务拆分 | `/task-planning` | 垂直切片，定义验收标准 |
| 编码实现 | `/feature-implementation` | TDD 驱动，穿透所有技术层 |
| 代码审查 | `/code-review` | 检查质量、TDD 合规性 |
| BUG 修复 | `/bug-fix` | 系统化修复，根因追溯 |
| 功能变更 | `/feature-iteration` | 影响分析 → 更新设计 → 实施 |

### 阶段边界约束

**每个阶段只能做该阶段的事**，详见 [guardrails.md](guardrails.md)。关键边界：

| 阶段 | 允许 | 禁止 |
|------|------|------|
| 需求澄清 | 提问、讨论、生成描述 | 写代码、设计 |
| 技术设计 | 设计 DB/API/组件 | 写实现代码、创建文件 |
| 任务规划 | 拆分任务、定义 AC | 写代码、创建文件 |
| 编码实现 | 写代码、创建文件 | 修改需求/设计文档 |
| 测试验证 | 测试、审查、修复 | 跳过失败的测试 |

---

## 五、零容忍代码规则

> 详细规范见 [development-standards.md](../../specs/development-standards.md) 和 [ai-constraints.md](ai-constraints.md)

### 4.1 必须遵守

| 规则 | 说明 |
|------|------|
| 禁止 `any` 类型 | 使用具体类型或泛型 |
| 禁止 `console.log` | 使用 `logger.debug()` 或条件编译 |
| 文件 ≤ 300 行 | 超过就拆分 |
| 函数 ≤ 50 行 | 超过就提取子函数 |
| 样式必须 `scoped` | 防止样式污染 |
| 异步必须有 try-catch | 错误处理不能省 |

### 4.2 组件必须处理三种状态

每个展示数据的组件，必须处理：

| 状态 | 表现 |
|------|------|
| loading | 显示加载动画或骨架屏 |
| empty | 显示"暂无数据"提示 |
| error | 显示错误信息 + 重试按钮 |

### 4.3 模块引用规则

```typescript
// ✅ 正确：通过 index.ts 引用
import { useDispatchStore } from '@/modules/dispatch'

// ❌ 禁止：直接引用模块内部文件
import { useDispatchStore } from '@/modules/dispatch/stores/useDispatchStore'
```

---

## 五、开发流程规范

### 5.1 功能开发流程（匹配 Skills 工作流）

```
1. 功能需求澄清 → 2. 功能技术设计 → 3. 任务规划 → 4. TDD编码实现 → 5. 测试验证
```

| 步骤 | Skill | 产出物 |
|------|-------|--------|
| 功能需求澄清 | `/feature-requirements-clarification` | `specs/features/<name>/requirements.md` |
| 功能技术设计 | `/feature-design` | `specs/features/<name>/design.md` |
| 任务规划 | `/task-planning` | `specs/features/<name>/tasks.md` |
| TDD编码实现 | `/feature-implementation` | 可运行代码 + 完成报告 |
| 测试验证 | `/testing` 或 `/code-review` | 测试报告、审查报告 |

### 5.2 数据库变更流程

```
1. 更新 specs/features/database-model/design.md → 2. 编写 Alembic 迁移 → 3. 测试迁移 → 4. 部署验证
```

**关键命令**：
```bash
alembic revision --autogenerate -m "描述变更内容"
alembic upgrade head
```

### 5.3 问题修复流程

使用 `/bug-fix` Skill，遵循系统化修复流程：

```
1. 问题分级 → 2. 根因追溯 → 3. 编写复现测试 → 4. 实施修复 → 5. 多层防护验证
```

详见 [bug-fix Skill](../skills/bug-fix/SKILL.md) 和 [defense-in-depth.md](../skills/bug-fix/references/defense-in-depth.md)。

---

## 六、质量指标要求

### 6.1 代码质量指标

| 指标 | 目标值 |
|------|--------|
| `any` 类型使用率 | 0% |
| 函数长度 | ≤ 50 行 |
| 文件长度 | ≤ 300 行 |
| 测试覆盖率 | 核心功能 > 80% |
| ESLint 错误数 | 0 |

### 6.2 性能指标

| 指标 | 目标值 |
|------|--------|
| 首屏加载 | < 3 秒 |
| API 响应 | < 2 秒 |
| 内存泄漏 | 无 |

---

## 七、问题处理快速指南

| 问题类型 | 处理方式 |
|----------|---------|
| 需求不明确 | 暂停开发，使用 `/feature-requirements-clarification` 澄清 |
| 技术问题 | 先查阅 specs 文档，参考 V4 类似实现，无法解决时向用户说明 |
| 性能问题 | 使用 `/performance-optimization` 分析优化 |
| 代码质量问题 | 使用 `/code-review` 审查 |
| BUG | 使用 `/bug-fix` 系统化修复 |

---

## 八、文档更新对照表

| 变更类型 | 需更新的文档 |
|----------|-------------|
| 新增功能模块 | `specs/features/<name>/` 目录下所有文档 |
| 修改数据库结构 | `specs/features/database-model/design.md` + Alembic 迁移 |
| 变更 API 接口 | `specs/features/<name>/design.md` |
| 修改技术栈 | `specs/tech-stack.md` |
| 修改开发规范 | `specs/development-standards.md` |
| 发现重要问题 | 更新相关文档，记录解决方案 |

---

*本文档基于 V4 开发经验总结，配合 Skills 体系和 guardrails 边界守卫使用，确保 V6 项目质量*
