# Skills 速查卡

> 一句话：在对话框里敲 `/命令` 就能用，别跳步就行。

---

## 新项目（按顺序来，只用一次）

```
/project-requirements-clarification 我想做XXX系统
/project-product-overview
/project-tech-stack
/project-structure
/project-dev-standards
/project-roadmap-planning
/project-init
```

---

## 开发功能（每个功能走一遍）

```
/feature-requirements-clarification 功能名
/feature-design 功能名
/task-planning 功能名
/feature-implementation 完成功能名的阶段1
```

---

## 日常操作（随时用）

| 想干嘛 | 敲这个 |
|--------|--------|
| 修 Bug | `/bug-fix 登录报500` |
| 审查代码 | `/code-review 订单模块` |
| 跑测试 | `/testing 登录模块` |
| 优化性能 | `/performance-optimization 首页慢` |
| 改已有功能 | `/feature-iteration 功能名 — 要改啥` |
| 重构代码 | `/refactor-plan 拆分大文件` |
| 设计页面 | `/frontend-design 订单列表页` |
| 合并分支 | `/finishing-a-development-branch` |

---

## 记住三条线

1. **不能跳步** — 没澄清需求就别想写代码，AI 会拦你
2. **只有 `/feature-implementation` 能写代码** — 其他阶段只产出文档
3. **代码质量红线** — 不准用 `any`、不准留 `console.log`、文件别超 300 行
