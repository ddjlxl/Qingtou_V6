# Qingtou V6 Skills

基于规范驱动开发（Spec-Driven Development）的 AI 协作 Skills 架构

## 目录结构

```
skills/
├── bug-fix/
│   ├── SKILL.md
│   └── references/
├── code-review/
│   ├── SKILL.md
│   └── references/
├── feature-design/
│   ├── SKILL.md
│   └── references/
├── feature-implementation/
│   ├── SKILL.md
│   └── references/
├── feature-iteration/
│   ├── SKILL.md
│   └── references/
├── feature-requirements-clarification/
│   ├── SKILL.md
│   └── references/
├── performance-optimization/
│   ├── SKILL.md
│   └── references/
├── project-dev-standards/
│   ├── SKILL.md
│   └── references/
├── project-init/
│   ├── SKILL.md
│   └── references/
├── project-product-overview/
│   ├── SKILL.md
│   └── references/
├── project-requirements-clarification/
│   ├── SKILL.md
│   └── references/
├── project-roadmap-planning/
│   ├── SKILL.md
│   └── references/
├── project-structure/
│   ├── SKILL.md
│   └── references/
├── project-tech-stack/
│   ├── SKILL.md
│   └── references/
├── task-planning/
│   ├── SKILL.md
│   └── references/
└── testing/
    ├── SKILL.md
    └── references/
```

## 阶段架构（16个Skills）

Skills 按 [guardrails.md](../rules/guardrails.md) 定义的 11 个阶段组织，形成完整的工作流链条。

---

### 阶段一：项目需求澄清阶段

| # | Skill | 说明 |
|---|-------|------|
| 1 | `project-requirements-clarification` | 引导式需求澄清 |

**产出物**：`specs/requirements-clarification.md`

---

### 阶段二：产品规划阶段

| # | Skill | 说明 |
|---|-------|------|
| 2 | `project-product-overview` | 生成结构化产品文档 |

**产出物**：`specs/product-overview.md`

---

### 阶段三：项目技术设计阶段（3个Skills）

| # | Skill | 说明 |
|---|-------|------|
| 3 | `project-tech-stack` | 技术栈选型推荐（CTO 角色） |
| 4 | `project-structure` | 目录结构设计（系统架构师角色） |
| 5 | `project-dev-standards` | 开发规范与 AI 协作协议 |

**产出物**：`specs/tech-stack.md`、`specs/project-structure.md`、`specs/development-standards.md`

---

### 阶段四：路线图规划阶段

| # | Skill | 说明 |
|---|-------|------|
| 6 | `project-roadmap-planning` | 开发路线图规划（技术产品经理角色） |

**产出物**：`specs/development-roadmap.md`

---

### 阶段五：项目初始化阶段

| # | Skill | 说明 |
|---|-------|------|
| 7 | `project-init` | 项目脚手架初始化 |

**产出物**：可运行的项目骨架

---

### 阶段六：功能需求澄清阶段

| # | Skill | 说明 |
|---|-------|------|
| 8 | `feature-requirements-clarification` | 功能级需求澄清 |

**产出物**：`specs/features/<feature-name>/requirements.md`

---

### 阶段七：功能技术设计阶段

| # | Skill | 说明 |
|---|-------|------|
| 9 | `feature-design` | 技术方案设计（DB/API/组件） |

**产出物**：`specs/features/<feature-name>/design.md`

---

### 阶段八：任务规划阶段

| # | Skill | 说明 |
|---|-------|------|
| 10 | `task-planning` | 拆分开发任务（垂直切片策略） |

**产出物**：`specs/features/<feature-name>/tasks.md`

---

### 阶段九：编码实现阶段（1个统一Skill）

| # | Skill | 说明 |
|---|-------|------|
| 11 | `feature-implementation` | 统一 TDD 执行器，穿透所有技术层（数据库 → API → Store → UI）一口气完成垂直切片 |

**产出物**：可运行的代码 + 阶段完成报告

---

### 阶段十：测试验证阶段（4个Skills）

| # | Skill | 说明 |
|---|-------|------|
| 12 | `testing` | 测试编写与执行 |
| 13 | `code-review` | 代码质量审查 |
| 14 | `bug-fix` | BUG 系统化修复（含问题分级、Bug 判断） |
| 15 | `performance-optimization` | 性能分析与优化 |

**产出物**：测试报告、审查报告

---

### 阶段十一：功能迭代阶段

| # | Skill | 说明 |
|---|-------|------|
| 16 | `feature-iteration` | 功能迭代变更（含 CR 编号、开发中场景支持） |

**产出物**：更新后的设计文档、迭代记录

---

## 使用方式

### 新项目启动（一次性）
```
/project-requirements-clarification 开发一个任务管理系统
/project-product-overview
/project-tech-stack
/project-structure
/project-dev-standards
/project-roadmap-planning
/project-init
```

### 功能开发（循环使用）
```
/feature-requirements-clarification 用户登录
/feature-design 用户登录
/task-planning 用户登录
/feature-implementation 完成用户登录的阶段1
/testing 用户登录模块
```

### 功能迭代（需要时）
```
/feature-iteration 用户登录 — 增加手机号验证码登录
```

### 通用问题（随时使用）
```
/bug-fix 页面白屏
/code-review 订单模块
/performance-optimization 首页加载慢
```

## Skill 规范

### 文件格式
- `SKILL.md` 使用 YAML frontmatter + Markdown body
- 必须包含 `name`、`description`、`version`、`tags`
- 内容包含 `# 你是谁` 身份定义、前置条件、工作流程、底线规则

### 命名规范
- 目录名使用 kebab-case
- `name` 字段与目录名一致
- `description` 包含功能描述和触发条件

### 架构特点
- **编码实现层统一**：`feature-implementation` 合并了原来的 `api-development`、`component-development`、`state-management`，在一个垂直切片内穿透所有技术层
- **项目级 Skills 强化**：`project-tech-stack`、`project-structure`、`project-roadmap-planning` 均增加了角色定义和交互准则
- **Bug 修复增强**：`bug-fix` 增加了问题分级（P0-P3）和 Bug 判断机制
- **迭代管理增强**：`feature-iteration` 增加了 CR 编号和开发中场景支持
