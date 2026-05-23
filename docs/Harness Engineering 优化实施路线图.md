# Harness Engineering 优化实施路线图

> **版本**：v1.0  
> **创建日期**：2026-05-22  
> **依据**：[Harness Engineering 优化建议.md](Harness%20Engineering%20优化建议.md)  
> **目标**：将 V6 项目的 Harness 从"建议驱动"升级为"工具强制"

---

## 一、总体目标

### 1.1 核心目标

将 V6 项目的 Harness（约束机制）从**"建议驱动"升级为"工具强制"**，实现：

> **从"靠自觉"到"靠工具"，从"软约束"到"硬拦截"**

### 1.2 预期收益

| 维度 | 当前状态 | 目标状态 | 预期收益 |
|------|---------|---------|---------|
| **代码质量** | 依赖 AI 自觉遵守规则 | 工具强制拦截违规代码 | 减少 80% 的代码质量问题 |
| **开发效率** | 返工率高（测试失败后才发现问题） | 问题前置发现 | 减少 50% 的返工时间 |
| **Harness 可靠性** | 无度量，不知道约束是否有效 | 数据驱动优化 | 持续改进，ROI 可量化 |
| **上下文一致性** | 存在"幽灵引用" | 引用完整性检查 | 消除误导性文档 |

---

## 二、实施阶段划分

### 阶段 0：准备阶段（本周内完成）

**目标**：建立基础设施，为后续优化铺路

**任务清单**：
- [ ] 安装 husky + lint-staged
- [ ] 配置 Git pre-commit hook
- [ ] 创建失败模式记录模板
- [ ] 清理遗留代码（create-v6-skills.js、pre-development-checklist.js）

**验收标准**：
- ✅ `pnpm commit` 时自动运行 ESLint + type-check
- ✅ AGENTS.md 中新增"失败模式记录"章节
- ✅ 删除所有失效脚本

---

### 阶段 1：P0 优化实施（Week 1-2）

#### 1.1 优化 2：引入 Physical Blocking 层

**实施步骤**：

**Step 1：安装依赖**
```bash
pnpm add -D husky lint-staged
npx husky init
```

**Step 2：配置 lint-staged**
```json
// package.json
{
  "lint-staged": {
    "*.{ts,vue}": ["eslint --max-warnings=0", "vue-tsc --noEmit"],
    "*.py": ["ruff check"]
  }
}
```

**Step 3：配置 pre-commit hook**
```bash
echo "pnpm lint-staged" > .husky/pre-commit
```

**Step 4：建立"完成声明三锁"机制**
- 在 `verification-before-completion` Skill 中增加三锁检查
- 创建验证报告模板：`docs/开发记录/验证_<功能>_<日期>.md`

**验收标准**：
- ✅ 提交包含 `console.log` 的代码时，git commit 被拦截
- ✅ 提交包含 `any` 类型的代码时，git commit 被拦截
- ✅ 任务完成时，必须生成验证报告文件

**风险与缓解**：
| 风险 | 缓解措施 |
|------|---------|
| Git hook 影响开发效率 | 只对 staged 文件检查，使用缓存 |
| 开发者绕过 hook | 在 CI 中也运行相同检查 |

---

#### 1.2 优化 1：建立"失败模式→约束"闭环

**实施步骤**：

**Step 1：在 AGENTS.md 中新增"失败模式记录"章节**
```markdown
## 失败模式记录

| # | 失败模式 | 发现日期 | 约束措施 | 状态 |
|---|---------|---------|---------|------|
| 1 | driver 直接引用 dispatch/types/order | 2026-05-21 | architecture-check.js 增加深层路径检测 | ⬜ 待实施 |
| 2 | ESLint warn 文件从未被修复 | 2026-05-21 | 建立 warn 追踪清单 + 每周回顾 | ⬜ 待实施 |
```

**Step 2：修复 architecture-check.js 的检测盲区**
- 当前只检测 `from '@/modules/X/Y'` 格式
- 扩展为检测所有跨模块的深层引用（包括 `@/modules/X/types/Y`）

**Step 3：建立"warn 债务清单"**
- 在 `PROGRESS.md` 中记录所有 ESLint warn 文件
- 设定修复期限（每个文件 2 周内修复）

**验收标准**：
- ✅ AGENTS.md 中有至少 3 条失败模式记录
- ✅ architecture-check.js 能检测深层路径引用
- ✅ PROGRESS.md 中有 warn 债务清单

---

### 阶段 2：P1 优化实施（Week 3-4）

#### 2.1 优化 4：精简工具面

**实施步骤**：

**Step 1：合并检查脚本**
```bash
# 创建统一的 v6-check.js
node scripts/v6-check.js --mode=pre-dev    # 开发前检查
node scripts/v6-check.js --mode=quality    # 代码质量检查
node scripts/v6-check.js --mode=full       # 完整验证
```

**Step 2：删除失效脚本**
- 删除 `pre-development-checklist.js`（引用不存在的文档）
- 删除 `development-validation.js`（空壳检查）

**Step 3：精简 Skills 触发入口**
- 在 AGENTS.md 中增加"场景→Skill"快速映射表

**验收标准**：
- ✅ 只保留 1 个检查脚本 `v6-check.js`
- ✅ AGENTS.md 中有快速映射表
- ✅ 删除所有失效脚本

---

#### 2.2 优化 3：实现 Computational/Inferential 分层

**实施步骤**：

**Step 1：建立前置计算型检查清单**
```markdown
计算型检查（每步必跑）：
├── ESLint（语法 + 类型 + 风格）
├── vue-tsc --noEmit（类型安全）
└── architecture-check.js（架构约束）
```

**Step 2：在 feature-implementation Skill 中集成**
- 在 GREEN 阶段，每写完一个函数/组件后立即运行计算型检查

**Step 3：将推断型检查结构化**
- code-review Skill 的输出必须包含"通过/不通过"裁决

**验收标准**：
- ✅ feature-implementation Skill 中有计算型检查步骤
- ✅ code-review Skill 输出包含明确裁决

---

### 阶段 3：P2 优化实施（Phase 2.1 启动前）

#### 3.1 优化 6：强化 PEV 循环

**实施步骤**：

**Step 1：在 feature-implementation Skill 中增加"Plan 输出"步骤**
```markdown
任务：T-101 车辆类型定义
执行计划：
1. 创建 types/vehicle.ts，定义 Vehicle/VehicleForm/VehicleFilter 类型
2. 编写类型测试（RED）
3. 实现类型定义（GREEN）
4. 验证：type-check 通过
预期影响：新增 1 个文件，无现有文件变更
```

**Step 2：利用 Git 作为 Checkpoint 机制**
```bash
git add -A && git commit -m "T-101: 车辆类型定义 - TDD GREEN"
```

**Step 3：增加"回退点"标记**
- 在 PROGRESS.md 中记录每个任务的 git commit hash

**验收标准**：
- ✅ feature-implementation Skill 中有 Plan 输出步骤
- ✅ PROGRESS.md 中有回退点记录

---

#### 3.2 优化 5：实现 Rippable Architecture

**实施步骤**：

**Step 1：在 development-standards.md 中增加来源标注**
```markdown
### 3. 文件不超过 300 行
**来源假设**：AI 倾向于在单文件中堆砌逻辑（V4: dispatch.ts 665行）
**可剥离条件**：当 AI 能自动识别职责边界并主动拆分时
**例外**：测试文件可豁免（见 S1 分析）
```

**Step 2：建立"Harness 版本"概念**
- 在 ai-constraints.md 头部增加版本号和变更日志

**Step 3：定期评估约束必要性**
- 在 entropy-fighter Skill 中增加"约束有效性评估"维度

**验收标准**：
- ✅ development-standards.md 中所有零容忍规则都有来源标注
- ✅ ai-constraints.md 中有版本号和变更日志

---

### 阶段 4：P3 优化实施（M2 阶段）

#### 4.1 优化 7：建立 Harness 效果度量

**实施步骤**：

**Step 1：建立"约束触发日志"**
```markdown
| 约束 | 本期触发次数 | 阻止的错误类型 |
|------|------------|--------------|
| no-explicit-any | 3 | 类型安全漏洞 |
| max-lines:300 | 2 | 文件膨胀 |
| architecture-check | 1 | 跨模块引用 |
| no-console | 0 | — |
```

**Step 2：建立"首次通过率"指标**
- 追踪 AI 在 TDD GREEN 阶段一次通过测试的比例

**Step 3：定期 A/B 测试**
- 调整 Harness 配置时，记录前后对比数据

**验收标准**：
- ✅ entropy-fighter Skill 输出包含约束触发日志
- ✅ 有首次通过率统计数据
- ✅ 有至少 1 次 A/B 测试记录

---

## 三、时间表

```
2026-05-22 ~ 2026-05-26（Week 1）
├── 阶段 0：准备阶段
│   ├── 安装 husky + lint-staged
│   ├── 配置 pre-commit hook
│   └── 清理遗留代码
└── 阶段 1：P0 优化
    ├── 优化 2：Physical Blocking 层
    └── 优化 1：失败模式闭环

2026-05-27 ~ 2026-06-02（Week 2）
├── 阶段 1：P0 优化（续）
│   ├── 修复 architecture-check.js 检测盲区
│   └── 建立 warn 债务清单
└── 阶段 2：P1 优化
    ├── 优化 4：精简工具面
    └── 优化 3：分层检查

2026-06-03 ~ 2026-06-09（Week 3）
├── 阶段 2：P1 优化（续）
│   ├── 合并检查脚本
│   └── 精简 Skills 触发入口
└── Phase 2.1 开发启动

Phase 2.1 启动前
└── 阶段 3：P2 优化
    ├── 优化 6：强化 PEV 循环
    └── 优化 5：Rippable Architecture

M2 阶段
└── 阶段 4：P3 优化
    └── 优化 7：效果度量
```

---

## 四、验收标准总览

### 4.1 阶段性验收标准

| 阶段 | 验收标准 | 验收方式 |
|------|---------|---------|
| **阶段 0** | Git hook 生效 + 遗留代码清理 | 提交测试代码验证拦截 |
| **阶段 1** | Physical Blocking + 失败闭环 | 检查 AGENTS.md + architecture-check.js |
| **阶段 2** | 工具精简 + 分层检查 | 检查脚本数量 + Skill 文档 |
| **阶段 3** | PEV 循环 + Rippable | 检查 PROGRESS.md + development-standards.md |
| **阶段 4** | 效果度量 | 检查约束触发日志 + 首次通过率 |

### 4.2 最终验收标准

- ✅ **硬拦截生效**：不合规代码无法提交
- ✅ **自我进化机制**：失败模式能转化为新约束
- ✅ **工具精简**：检查脚本从 4 个减少到 1 个
- ✅ **效果可度量**：有约束触发日志和首次通过率数据
- ✅ **约束可剥离**：每条约束都有来源假设和可剥离条件

---

## 五、风险与缓解措施

| 风险 | 影响 | 概率 | 缓解措施 | 负责人 |
|------|------|------|---------|--------|
| Git hook 影响开发效率 | 中 | 高 | 只对 staged 文件检查，使用缓存 | 开发团队 |
| 硬约束过于严格 | 高 | 中 | 建立例外申请机制，定期评估约束必要性 | 项目负责人 |
| 工具合并引入新 Bug | 中 | 低 | 保留旧脚本作为备份，渐进式迁移 | 开发团队 |
| 效果度量成本高 | 低 | 高 | 从简单日志开始，逐步完善 | 开发团队 |
| 开发者抵触新流程 | 高 | 中 | 提供培训，解释收益，逐步推进 | 项目负责人 |

---

## 六、后续维护

### 6.1 定期回顾

- **每周回顾**：检查本周优化实施进度，调整下周计划
- **每月回顾**：评估 Harness 效果，调整约束配置
- **每季度回顾**：评估约束必要性，剥离不再需要的约束

### 6.2 持续改进

- **失败模式记录**：每次发现新失败模式时，追加到 AGENTS.md
- **约束触发日志**：每次 entropy-fighter 扫描时，记录约束触发情况
- **效果度量**：每月统计首次通过率，评估 Harness 效果

---

## 七、参考文档

- [Harness Engineering 优化建议.md](Harness%20Engineering%20优化建议.md)
- [Harness Engineering 研究報告.md](Harness%20Engineering%20研究報告.md)
- [development-standards.md](../specs/development-standards.md)
- [ai-constraints.md](../.trae/rules/ai-constraints.md)
- [AGENTS.md](../AGENTS.md)

---

*本路线图将根据实施情况动态调整，最新版本见项目 docs/ 目录。*
