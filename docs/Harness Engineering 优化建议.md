# V6 项目工作流 Harness Engineering 优化建议

> **版本**：v2.1
> **日期**：2026-05-22
> **依据**：[Harness Engineering 研究報告.md](Harness%20Engineering%20研究報告.md)
> **范围**：基于 Fowler Guides-Sensors 框架、Hashimoto 结构性错误预防、Meta-Harness 量化证据等，对 V6 项目现有工作流进行系统性优化
> **审计深度**：22 Skills（100%）+ 25 References/Assets（28%）+ 4 Rules（100%）+ 6 Scripts（83%）+ 10 Specs（50%）+ 3 Root Docs（100%）
> **v2.1 变更**：补读全部 22 个 Skills 后修正——优化 2 补充「设计-实施断裂」发现；优化 8 补充 project-* 流水线断裂影响；优化 10 补充前置条件链条分析

---

## 一、诊断总览：当前 Harness 的成熟度评估

基于 Fowler 的 Guides-Sensors 框架，对 V6 项目现有 Harness 进行分层评估：

| 维度 | 当前状态 | 成熟度 | 报告对标 |
|------|---------|--------|---------|
| **Guides（前馈控制）** | AGENTS.md + CLAUDE.md + specs 体系 + ESLint 规则 | ★★★★☆ | Fowler 第一层 |
| **Computational Sensors（计算型反馈）** | ESLint + type-check + architecture-check + code-quality-check | ★★★☆☆ | Fowler 第二层 |
| **Inferential Sensors（推断型反馈）** | code-review skill + bug-fix skill | ★★★☆☆ | Fowler 第二层 |
| **Physical Blocking（物理阻断）** | ❌ 缺失 | ★☆☆☆☆ | Fowler 第三层 |
| **PEV 循环** | TDD RED-GREEN-REFACTOR + verification-before-completion | ★★★☆☆ | 报告核心方法论 |
| **Rippable Architecture** | ❌ 缺失 | ★☆☆☆☆ | 报告 2.3 节 |
| **闭环反馈** | entropy-fighter skill（但无失败模式→约束的闭环） | ★★☆☆☆ | 报告 5.3 节 |
| **上下文协议一致性** | PROJECT-CONTEXT.md 指向 AGENTS.md，但 create-v6-skills.js 仍指向旧路径 | ★★☆☆☆ | 报告 ACI 节 |
| **Skill 间约束传播** | bug-fix 多层防护未推广到其他 Skills | ★★☆☆☆ | 报告 Compound AI |
| **遗留代码清理** | create-v6-skills.js 生成 v1.0 旧架构，与当前 v3.0 不匹配 | ★☆☆☆☆ | 报告 Rippable |

**核心诊断**：V6 项目的 Guides 层已经相当成熟，但存在三个系统性问题：
1. **软约束多、硬约束少**——Sensors 层和 Physical Blocking 层几乎空白
2. **上下文协议断裂**——多个文件引用不存在的旧路径，Skill 前置条件形同虚设
3. **约束孤岛**——优秀方法论（如 bug-fix 多层防护）没有跨 Skill 传播

这正好对应了报告的核心洞察——**"建议"升级为"强制"是 Harness Engineering 的关键跃迁**，而**上下文一致性是 Harness 可靠运行的前提**。

---

## 二、七大优化建议

### 优化 1：建立「失败模式→约束」闭环（对标 Hashimoto 结构性错误预防）

**报告依据**：Mitchell Hashimoto 的核心原则——「每次代理犯错时，投入工程资源修改系统，使该错误不再可能再次发生」[7]

**当前问题**：

V6 项目已有大量约束规则，但缺少从**实际失败**到**新增约束**的闭环机制。例如：
- 健康报告 [S2] 发现 driver 直接引用 dispatch 内部类型——这是架构违规，但 `architecture-check.js` **没有检测到它**（因为检查逻辑只扫描 `from '@/modules/` 开头的导入，未覆盖 `from '@/modules/dispatch/types/order'` 这种深层路径）
- 健康报告 [S3] 后端测试失败——但没有任何机制阻止在测试失败时继续开发
- ESLint 对已知违规文件降级为 `warn`（`eslint.config.js` L46-L53），这些 `warn` 从未被追踪和修复

**建议**：

1. **在 AGENTS.md 中新增「失败模式记录」章节**，每次发现新失败模式时追加一条记录：
   ```markdown
   ## 失败模式记录

   | # | 失败模式 | 发现日期 | 约束措施 | 状态 |
   |---|---------|---------|---------|------|
   | 1 | driver 直接引用 dispatch/types/order | 2026-05-21 | architecture-check.js 增加深层路径检测 | ⬜ 待实施 |
   | 2 | ESLint warn 文件从未被修复 | 2026-05-21 | 建立 warn 追踪清单 + 每周回顾 | ⬜ 待实施 |
   ```

2. **修复 architecture-check.js 的检测盲区**——当前只检测 `from '@/modules/X/Y'` 格式，应扩展为检测所有跨模块的深层引用（包括 `@/modules/X/types/Y`）

3. **建立「warn 债务清单」**——ESLint config 中降级为 warn 的文件必须记录在 `PROGRESS.md` 的技术债部分，并设定修复期限

---

### 优化 2：引入 Physical Blocking 层——从「建议」到「强制」（对标三层护栏递进模型）

**报告依据**：三层护栏递进模型——提示层→验证层→物理阻断层

**当前问题**：

V6 项目的约束几乎全部停留在第一层（提示/规则）和第二层（手动检查脚本），**没有任何物理阻断机制**：
- `code-quality-check.js`、`architecture-check.js` 都是手动执行的脚本，AI 可以选择不运行
- `verification-before-completion` 是 Skill 级别的约束，依赖 AI 自觉触发
- 没有预提交钩子、没有 CI 闸门

**⚠️ 关键发现（v2.1 补充）**：`project-init` Skill 的第 5 步已明确设计「**Husky + lint-staged**：配置 Git hooks」，但项目初始化时**从未实际执行**这一步。这不是「缺失」，而是更严重的「**设计-实施断裂**」——约束已经写进了 Skill 文档，但在落地时被跳过了。这说明仅靠 Skill 文档中的文字描述无法保证执行，必须有物理阻断层来兜底。

**建议**：

1. **引入 Git pre-commit hook**（使用 `husky` + `lint-staged`），在物理层面阻止不合规代码提交：
   ```json
   {
     "lint-staged": {
       "*.{ts,vue}": ["eslint --max-warnings=0", "vue-tsc --noEmit"],
       "*.py": ["ruff check"]
     }
   }
   ```

2. **在 verification-before-completion skill 中增加「物理证据」要求**——不仅运行验证命令，还要将输出结果**写入文件**（如 `docs/开发记录/验证_<功能>_<日期>.md`），形成不可篡改的审计轨迹

3. **建立「完成声明三锁」机制**——任何任务标记完成前必须同时满足：
   - 🔒 lint 通过（计算型 Sensor）
   - 🔒 type-check 通过（计算型 Sensor）
   - 🔒 测试通过 + 覆盖率达标（计算型 Sensor）
   - 🔒 AC 逐条验证（推断型 Sensor，需人类确认）

---

### 优化 3：实现 Fowler 的 Computational/Inferential 分层（对标 Guides-Sensors 框架）

**报告依据**：Fowler 将 Sensors 分为计算型（快速、确定性）和推断型（依赖 LLM 判断），计算型应尽可能前置

**当前问题**：

V6 项目的检查工具没有区分这两个层级，导致：
- 计算型检查（lint、type-check）和推断型检查（code-review）混在一起
- 计算型检查没有前置到编码过程中（只在完成时运行）
- 推断型检查缺少结构化输出

**建议**：

1. **建立「前置计算型检查」清单**——在 feature-implementation skill 的 GREEN 阶段，每写完一个函数/组件后立即运行：
   ```
   计算型检查（每步必跑）：
   ├── ESLint（语法 + 类型 + 风格）
   ├── vue-tsc --noEmit（类型安全）
   └── architecture-check.js（架构约束）

   推断型检查（阶段末跑）：
   ├── code-review skill（代码质量）
   ├── AC 逐条验证（功能正确性）
   └── 安全审查（OWASP Top 10）
   ```

2. **在 code-quality-check.js 中增加架构适配性检查**——Fowler 指出架构适配性是中等成熟度的维度，V6 已有 `architecture-check.js` 但只检查模块引用规则，应扩展为检查：
   - 依赖方向（Types → Service → UI）
   - 组件职责单一性
   - Store 与 Service 的边界

3. **将推断型检查结构化**——code-review skill 的输出应包含明确的「通过/不通过」裁决，而非仅列出问题

---

### 优化 4：精简工具面——Vercel「少即是多」原则（对标报告 6.8 节）

**报告依据**：Vercel 将 15 个工具削减为 2 个，准确率从 80% 跃升至 100%，Token 下降 37%

**当前问题**：

V6 项目存在工具/流程冗余：
- 4 个检查脚本功能重叠：`code-quality-check.js`、`architecture-check.js`、`development-validation.js`、`pre-development-checklist.js`
- `pre-development-checklist.js` 引用了不存在的文档（`V6需求文档.md`、`V6数据库设计.md`、`V6开发规则.md`），已经失效
- `development-validation.js` 的集成测试检查和部署验证是空壳（检查 `tests/integration` 目录是否存在、`dist` 目录是否存在）
- 21 个 Skills 可能造成决策疲劳——用户需要记住每个 Skill 的触发条件

**建议**：

1. **合并检查脚本**——将 4 个脚本合并为 1 个统一的 `v6-check.js`，支持不同模式：
   ```bash
   pnpm v6-check --mode=pre-dev    # 开发前检查
   pnpm v6-check --mode=quality    # 代码质量检查
   pnpm v6-check --mode=full       # 完整验证
   ```

2. **删除失效脚本**——`pre-development-checklist.js` 引用了不存在的文档，应删除或重写为基于现有 specs 目录的检查

3. **精简 Skills 触发入口**——在 `AGENTS.md` 中增加「场景→Skill」的快速映射表，减少用户的选择负担：
   ```markdown
   | 我要做什么 | 用这个 |
   |-----------|--------|
   | 开发新功能 | /feature-implementation |
   | 修 Bug | /bug-fix |
   | 改现有功能 | /feature-iteration |
   | 检查代码健康 | /entropy-fighter |
   | 其他 | 看 .trae/QUICK-REFERENCE.md |
   ```

---

### 优化 5：实现 Rippable Architecture——Harness 版本化与可剥离性（对标报告 2.3 节）

**报告依据**：护栏的所有组件都编码了对模型能力不足的假设，当模型进步时，不再需要的组件应可逐步移除

**当前问题**：

V6 项目的约束没有标注「为什么存在」和「何时可以移除」。例如：
- 300 行文件限制——这是基于 V4 的 `dispatch.ts` 665 行教训，但如果 AI 模型未来能更好地组织长文件，这个限制可能需要调整
- `no-explicit-any` 规则——这是基于 V4 的 257 处 `any` 教训，但如果 TypeScript 的类型推断足够好，某些场景可能可以放宽
- 测试文件 300 行限制——健康报告 [S1] 已经指出这个规则对测试文件偏严

**建议**：

1. **在每条约束旁标注「来源假设」**——在 `development-standards.md` 中为每条零容忍规则增加来源标注：
   ```markdown
   ### 3. 文件不超过 300 行
   **来源假设**：AI 倾向于在单文件中堆砌逻辑（V4: dispatch.ts 665行）
   **可剥离条件**：当 AI 能自动识别职责边界并主动拆分时
   **例外**：测试文件可豁免（见 S1 分析）
   ```

2. **建立「Harness 版本」概念**——在 `ai-constraints.md` 头部增加版本号和变更日志，每次调整约束时记录原因

3. **定期评估约束必要性**——在 entropy-fighter skill 的扫描维度中增加「约束有效性评估」：哪些约束从未被触发？哪些约束频繁被降级为 warn？

---

### 优化 6：强化 PEV 循环——增加 Checkpoint 与自动回退（对标报告 2.2 节 + Anthropic C 编译器实验）

**报告依据**：Anthropic 的 C 编译器实验中，每个 Generator 在完成任务后自动创建 git checkpoint，Evaluator 发现严重缺陷时自动回退

**当前问题**：

V6 项目的 TDD 循环（RED-GREEN-REFACTOR）是 PEV 的简化版，但缺少：
- **Plan 阶段的结构化输出**——feature-implementation skill 直接进入 RED，没有先输出执行计划
- **Checkpoint 机制**——没有在关键节点保存状态
- **自动回退**——测试失败时没有自动回退到上一个通过状态

**建议**：

1. **在 feature-implementation skill 中增加「Plan 输出」步骤**——在 RED 之前，先输出结构化的执行计划：
   ```
   任务：T-101 车辆类型定义
   执行计划：
   1. 创建 types/vehicle.ts，定义 Vehicle/VehicleForm/VehicleFilter 类型
   2. 编写类型测试（RED）
   3. 实现类型定义（GREEN）
   4. 验证：type-check 通过
   预期影响：新增 1 个文件，无现有文件变更
   ```

2. **利用 Git 作为 Checkpoint 机制**——在 feature-implementation skill 中，每个任务 GREEN 通过后建议用户创建一个 git stash 或 commit：
   ```bash
   git add -A && git commit -m "T-101: 车辆类型定义 - TDD GREEN"
   ```

3. **增加「回退点」标记**——在 PROGRESS.md 中记录每个任务的 git commit hash，方便回退

---

### 优化 7：建立 Harness 效果度量（对标 Meta-Harness + SWE-bench Pro）

**报告依据**：Meta-Harness 证明同一模型不同 Harness 性能差距可达 6 倍；SWE-bench Pro 证明更弱模型 + 更好 Harness 可击败更强模型

**当前问题**：

V6 项目没有任何机制度量 Harness 的效果。我们不知道：
- 哪些约束真正阻止了错误？
- 哪些约束是无效的（从未被触发）？
- Harness 的整体 ROI 是多少？

**建议**：

1. **建立「约束触发日志」**——在 entropy-fighter skill 的每次扫描中记录：
   ```markdown
   | 约束 | 本期触发次数 | 阻止的错误类型 |
   |------|------------|--------------|
   | no-explicit-any | 3 | 类型安全漏洞 |
   | max-lines:300 | 2 | 文件膨胀 |
   | architecture-check | 1 | 跨模块引用 |
   | no-console | 0 | — |
   ```

2. **建立「首次通过率」指标**——追踪 AI 在 TDD GREEN 阶段一次通过测试的比例：
   - 高首次通过率 → Guides 有效
   - 低首次通过率 → 需要加强 Guides 或简化任务

3. **定期 A/B 测试**——当调整 Harness 配置时（如放宽测试文件行数限制），记录前后对比数据，用数据驱动决策而非直觉

---

## 三、优先级排序与实施路线图

| 优先级 | 优化项 | 预期收益 | 实施难度 | 建议时间 |
|--------|--------|---------|---------|---------|
| **P0** | 优化 2：Physical Blocking 层 | 从根本上阻止不合规代码 | 中 | 本周 |
| **P0** | 优化 1：失败模式→约束闭环 | 让 Harness 自我进化 | 低 | 本周 |
| **P1** | 优化 4：精简工具面 | 减少 Token 消耗 + 决策疲劳 | 中 | 下周 |
| **P1** | 优化 3：Computational/Inferential 分层 | 提高检查效率 | 低 | 下周 |
| **P2** | 优化 6：强化 PEV 循环 | 减少返工 | 中 | Phase 2.1 启动前 |
| **P2** | 优化 5：Rippable Architecture | 长期可维护性 | 低 | 持续 |
| **P3** | 优化 7：Harness 效果度量 | 数据驱动优化 | 高 | M2 阶段 |

---

## 四、与报告核心论点的呼应

| 报告核心论点 | V6 项目现状 | 优化方向 |
|-------------|-----------|---------|
| **Agent = Model + Harness** | 已有 Harness 但偏软 | 硬化约束（Physical Blocking） |
| **决定效果的不是模型，是 Harness** | 无度量，无法验证 | 建立效果度量 |
| **Guides 让代理第一次就做对** | Guides 成熟但无失败闭环 | 失败模式→约束闭环 |
| **Sensors 让代理自我修正** | Sensors 存在但无分层 | Computational/Inferential 分层 |
| **少即是多（Vercel）** | 4 个重叠脚本 + 21 Skills | 精简工具面 |
| **Harness 是可编程的优化空间** | 无版本化、无可剥离性 | Rippable Architecture |
| **NITR：AI 依赖控制成功率仅 4.3%** | architecture-check.js 有盲区 | 修复检测盲区 |

---

### 优化 8：修复上下文协议断裂——消除「幽灵引用」（对标报告 ACI 节 + Princeton SWE-agent）

**报告依据**：Princeton SWE-agent 的 ACI（Agent-Computer Interface）研究证明，代理与环境的接口设计直接决定性能。接口不一致 = 代理行为不可预测。

**当前问题**：

V6 项目存在多处「幽灵引用」——文件引用了不存在的路径，导致 Skill 的前置条件检查形同虚设：

| 文件 | 引用的不存在路径 | 影响 |
|------|----------------|------|
| `create-v6-skills.js` | `docs/V6需求文档.md`、`docs/V6数据库设计.md`、`docs/V6开发规则.md`、`docs/V4踩坑记录.md` | 生成旧版 Skills，与当前 v3.0 不匹配 |
| `project-context.md`（旧版，create-v6-skills.js 生成） | 同上 | Skill 前置条件检查失败 |
| `pre-development-checklist.js` | `V6需求文档.md`、`V6数据库设计.md`、`V6开发规则.md` | 开发前检查脚本失效 |
| `PROJECT-CONTEXT.md`（当前版） | 仅 5 行，指向 AGENTS.md | Skill 读取后无法获得实质性上下文 |

**建议**：

1. **删除 `create-v6-skills.js`**——它是 v1.0 时代的遗留脚本，生成的 Skills 与当前 v3.0 架构完全不同。继续保留只会造成混淆
2. **重写 `PROJECT-CONTEXT.md`**——当前仅 5 行，应包含项目核心信息（技术栈、模块地图、架构约束、当前进度），而非仅指向 AGENTS.md
3. **修复 `pre-development-checklist.js`**——将引用路径从 `docs/V6*.md` 更新为 `specs/` 目录下的实际文件
4. **建立「引用完整性检查」**——在 entropy-fighter skill 中增加扫描维度：检测所有 `.md` 和 `.js` 文件中引用的路径是否存在

---

### 优化 9：跨 Skill 传播约束方法论——从「孤岛」到「网络」（对标报告 Compound AI Systems）

**报告依据**：UC Berkeley BAIR 的 Compound AI Systems 框架论证 SOTA 来自多组件系统的组合，而非单一组件的优化。

**当前问题**：

V6 项目中存在多个优秀的约束方法论，但它们被隔离在各自的 Skill 中，没有形成系统性的约束网络：

| 方法论 | 所在 Skill | 应推广到的 Skills |
|--------|-----------|------------------|
| **多层防护**（入口→业务→环境→日志） | bug-fix | feature-implementation、feature-iteration |
| **根因追溯**（从报错位置沿调用链回追） | bug-fix | code-review、testing |
| **70% 阈值**（变更影响比例判断） | feature-iteration | feature-design、task-planning |
| **三道筛子**（审查必要性过滤器） | code-review | 所有审查类 Skill |
| **垂直切片**（按用户行为拆分任务） | task-planning | feature-design（设计时应考虑切片边界） |
| **三种状态**（loading/empty/error） | frontend-design | feature-implementation（组件开发时强制检查） |

**建议**：

1. **在 AGENTS.md 中建立「跨 Skill 方法论索引」**——列出每个方法论的定义、来源 Skill、适用范围，让所有 Skill 都能引用
2. **在 feature-implementation 中集成多层防护**——GREEN 阶段完成后，自动检查是否在数据入口、业务逻辑、环境保护三个层面都加了验证
3. **在 feature-design 中集成 70% 阈值**——设计阶段评估变更范围时，自动计算影响比例并给出判断
4. **在 testing 中集成根因追溯**——测试失败时，不只报告失败，还要沿调用链追溯根因

---

### 优化 10：Skill 前置条件硬化——从「建议读取」到「强制验证」（对标报告三层护栏递进模型）

**报告依据**：三层护栏递进模型——提示层→验证层→物理阻断层

**当前问题**：

几乎所有 Skill 的前置条件都是「读取 XXX 文档」，但没有验证读取是否成功、内容是否有效：

```markdown
# 当前（软约束）
前置条件：
1. 技术方案就绪：`specs/features/<feature-name>/design.md` 存在
2. 需求文档可查：`specs/features/<feature-name>/requirements.md`
3. 项目认知建立：读取 `specs/PROJECT-CONTEXT.md`
```

问题：
- 「存在」和「可查」没有自动验证——AI 可以声称已读取但实际跳过
- `PROJECT-CONTEXT.md` 只有 5 行，读取了也等于没读
- 没有检查文档内容的时效性（design.md 可能是 3 个版本前的）

**建议**：

1. **在 Skill 执行前增加「前置条件验证」步骤**——不仅检查文件存在，还要验证关键内容：
   ```markdown
   ## 前置条件验证
   - [ ] `design.md` 存在 ✅
   - [ ] `design.md` 包含 AC 覆盖总表 ✅
   - [ ] `design.md` 最后更新日期在 7 天内 ✅
   - [ ] `requirements.md` 的 AC 编号与 `design.md` 的 AC 引用一致 ✅
   - [ ] `PROJECT-CONTEXT.md` 包含技术栈、模块地图、架构约束 ✅
   ```

2. **为关键文档增加「版本戳」**——在 design.md、requirements.md 头部增加版本号和最后更新日期，Skill 执行前检查版本一致性

3. **在 verification-before-completion 中增加「文档一致性验证」**——检查代码变更是否与设计文档一致

---

### 优化 11：清理遗留代码——消除 Harness 的「死代码」（对标报告 Rippable Architecture）

**报告依据**：Rippable Architecture 原则——不再需要的组件应可被识别和移除

**当前问题**：

V6 项目存在多类遗留代码，它们不仅无用，还可能误导 AI：

| 遗留物 | 位置 | 危害 |
|--------|------|------|
| `create-v6-skills.js` | `scripts/` | 生成旧版 v1.0 Skills，与当前 v3.0 不匹配，新开发者可能误用 |
| `pre-development-checklist.js` | `scripts/` | 引用不存在的文档，检查结果无意义 |
| `development-validation.js` | `scripts/` | 集成测试和部署验证是空壳 |
| ESLint `warn` 降级 | `eslint.config.js` L46-L53 | 已知违规文件从未被修复，`warn` 形同虚设 |

**建议**：

1. **删除 `create-v6-skills.js`**——它已被手动维护的 Skills 体系取代，继续保留只会制造混淆
2. **重写或删除 `pre-development-checklist.js`**——如果保留，必须更新引用路径为 `specs/` 目录下的实际文件
3. **为 `development-validation.js` 的空壳检查补充实现**——或删除空壳部分，只保留有效检查
4. **建立「ESLint warn 债务清单」**——在 PROGRESS.md 中记录所有降级为 warn 的文件和规则，设定修复期限

---

## 三、优先级排序与实施路线图（更新版）

| 优先级 | 优化项 | 预期收益 | 实施难度 | 建议时间 |
|--------|--------|---------|---------|---------|
| **P0** | 优化 8：修复上下文协议断裂 | 消除幽灵引用，Skill 前置条件有效化 | 低 | 本周 |
| **P0** | 优化 2：Physical Blocking 层 | 从根本上阻止不合规代码 | 中 | 本周 |
| **P0** | 优化 1：失败模式→约束闭环 | 让 Harness 自我进化 | 低 | 本周 |
| **P1** | 优化 11：清理遗留代码 | 消除误导源 | 低 | 本周 |
| **P1** | 优化 10：Skill 前置条件硬化 | 确保 Skill 读取有效上下文 | 中 | 下周 |
| **P1** | 优化 4：精简工具面 | 减少 Token 消耗 + 决策疲劳 | 中 | 下周 |
| **P1** | 优化 3：Computational/Inferential 分层 | 提高检查效率 | 低 | 下周 |
| **P2** | 优化 9：跨 Skill 传播约束方法论 | 从孤岛到网络 | 中 | 下周 |
| **P2** | 优化 6：强化 PEV 循环 | 减少返工 | 中 | Phase 2.1 启动前 |
| **P2** | 优化 5：Rippable Architecture | 长期可维护性 | 低 | 持续 |
| **P3** | 优化 7：Harness 效果度量 | 数据驱动优化 | 高 | M2 阶段 |

---

## 四、与报告核心论点的呼应（更新版）

| 报告核心论点 | V6 项目现状 | 优化方向 |
|-------------|-----------|---------|
| **Agent = Model + Harness** | 已有 Harness 但偏软 | 硬化约束（Physical Blocking） |
| **决定效果的不是模型，是 Harness** | 无度量，无法验证 | 建立效果度量 |
| **Guides 让代理第一次就做对** | Guides 成熟但无失败闭环 | 失败模式→约束闭环 |
| **Sensors 让代理自我修正** | Sensors 存在但无分层 | Computational/Inferential 分层 |
| **少即是多（Vercel）** | 4 个重叠脚本 + 21 Skills | 精简工具面 |
| **Harness 是可编程的优化空间** | 无版本化、无可剥离性 | Rippable Architecture |
| **NITR：AI 依赖控制成功率仅 4.3%** | architecture-check.js 有盲区 | 修复检测盲区 |
| **ACI：接口一致性决定性能** | 多处幽灵引用、上下文协议断裂 | 修复上下文协议断裂 |
| **Compound AI：系统组合 > 单体优化** | 优秀方法论被隔离在单个 Skill | 跨 Skill 传播约束 |
| **SWE-agent：LM-centric 接口设计** | Skill 前置条件形同虚设 | 前置条件硬化 |

---

**一句话总结**：V6 项目的 Harness 在「告诉 AI 应该怎么做」方面已经做得很好（Guides 层 ★★★★☆），但在三个维度存在系统性缺陷：**① 软约束未硬化**（Physical Blocking ★☆☆☆☆）、**② 上下文协议断裂**（幽灵引用导致 Skill 前置条件失效）、**③ 约束孤岛**（优秀方法论未跨 Skill 传播）。优化的核心方向是**将软约束硬化、将断裂的上下文修复、将孤岛连成网络**。
