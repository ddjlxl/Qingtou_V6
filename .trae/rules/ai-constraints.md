# V6 项目 AI 开发约束机制

> **版本**：v1.2  
> **创建日期**：2026-05-04  
> **更新日期**：2026-05-13  
> **定位**：记录 V4 踩过的坑，解释"为什么要有这些规则"  
> **详细规则**：见 [development-standards.md](../../specs/development-standards.md)

---

## 核心原则

**宁可开发慢一些，也要保证代码质量。**

本约束机制基于 V4 项目的深刻教训制定。V4 功能完整但代码混乱、BUG 多、不敢改。V6 用严格约束彻底避免重蹈覆辙。

---

## 一、V4 的教训

### 1.1 TypeScript 类型安全

**V4 问题**：257 处 `any` 类型，TypeScript 形同虚设

**后果**：
- 类型错误在运行时才暴露
- 重构时不敢动代码，怕改错
- IDE 智能提示失效

**V6 解决**：
```typescript
// ❌ 禁止
function processData(data: any): any {
  return data
}

// ✅ 使用具体类型
function processData<T>(data: T): T {
  return data
}

// ✅ 或使用 unknown + 类型守卫
function processData(data: unknown): SomeType {
  if (isValidData(data)) {
    return data as SomeType
  }
  throw new Error('Invalid data')
}
```

---

### 1.2 调试代码遗留

**V4 问题**：92 处 `console.log` 遗留生产环境

**后果**：
- 生产环境暴露调试信息
- 控制台刷屏，影响性能
- 敏感数据可能泄露

**V6 解决**：
```typescript
// ❌ 禁止
console.log('调试信息', data)

// ✅ 使用日志系统
import { logger } from '@/shared/utils/logger'
logger.debug('调试信息', data)

// ✅ 或使用条件编译
if (import.meta.env.DEV) {
  console.log('调试信息', data)
}
```

---

### 1.3 文件过大

**V4 问题**：`dispatch.ts` 665 行，维护困难

**后果**：
- 改一处怕影响其他地方
- 代码审查困难
- 新人看不懂

**V6 解决**：超过 300 行必须拆分

```
# 拆分示例
store/dispatch.ts (665行)
    ├── store/dispatch/actions.ts (处理异步操作)
    ├── store/dispatch/state.ts (状态定义)
    ├── store/dispatch/getters.ts (计算属性)
    └── store/dispatch/mutations.ts (同步操作)
```

---

### 1.4 Store 混入 Mock 数据

**V4 问题**：`dispatch.ts` 中 Mock 数据和 API 逻辑混杂

**后果**：
- 开发环境和生产环境行为不一致
- Mock 数据污染真实逻辑
- 出问题时不知道是数据问题还是代码问题

**V6 解决**：
```typescript
// ❌ 禁止：混用模式
async function initTasks() {
  try {
    const res = await fetchTasksApi()
    if (res.code === 200) {
      // 用真实数据
    } else {
      fallbackToMock()
    }
  } catch {
    fallbackToMock()
  }
}

// ✅ 环境分离
// store/orders.ts - 只处理真实数据
export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  
  const fetchOrders = async () => {
    const response = await OrderService.getOrders()
    orders.value = response.data
  }
  
  return { orders, fetchOrders }
})

// 通过环境变量控制
if (import.meta.env.VITE_USE_MOCK === 'true') {
  // 使用 Mock 数据
}
```

---

### 1.5 computed 中使用副作用

**V4 问题**：`ZoneCard.vue` 中 `computed` 内使用 `Math.random()`

**后果**：
- 每次访问 computed 值都不同
- 组件渲染不可预测
- 调试困难

**V6 解决**：
```typescript
// ❌ 禁止：computed 中有副作用
const trend = computed(() => {
  const randomTrend = Math.random()
  if (randomTrend > 0.6) return 'up'
  return 'neutral'
})

// ✅ 纯函数
const trend = computed(() => {
  return props.subZone.trend || 'neutral'
})
```

---

### 1.6 禁止推测性功能（Simplicity First）

**V4 问题**：为"可能的未来需求"提前写代码，导致代码膨胀、维护困难

**后果**：
- 代码复杂度增加，但实际从未使用
- 增加测试负担
- 增加理解成本
- 重构时不敢删除"可能有用"的代码

**V6 解决**：
```typescript
// ❌ 禁止：未被请求的可配置性
let onUnauthorized: () => void = () => { ... }
export function setUnauthorizedHandler(handler: () => void): void { ... }

// ✅ 当前需求就是跳 /login，直接写死
window.location.href = '/login'

// ❌ 禁止：为单次使用创建抽象层
interface IFormatter { format(value: unknown): string }
class DateFormatter implements IFormatter { ... }
class MoneyFormatter implements IFormatter { ... }

// ✅ 简单函数，需要时再抽象
export function formatDate(value: string | Date, pattern?: string): string { ... }
export function formatMoney(amount: number, decimals?: number): string { ... }
```

**自检**：一个高级工程师会说这段代码过度复杂吗？如果是，简化它。

---

### 1.8 设计前必须审计现有代码（Design Audit First）

**V6 问题**：fleet 设计文档列出 `BaseButton`、`BaseInput`、`BaseTable` 为"可复用组件"，但实际 `shared/components/` 下只有 `EmptyState` 和 `LoadingSpinner`，且项目已全局使用 Element Plus，根本不需要这些封装

**后果**：
- 任务规划基于不存在的依赖，编码时才发现缺东西
- 设计文档与实际代码脱节，失去指导意义
- 浪费时间去讨论/创建根本不需要的组件

**V6 解决**：
```
# 设计文档中引用任何"已有"代码前，必须先读文件确认其存在

# ❌ 禁止：凭想象列可复用资源
## 可复用抽象
- 公共组件：EmptyState、LoadingSpinner、BaseButton、BaseInput、BaseTable

# ✅ 正确：只列经过验证的资源
## 可复用抽象（已审计）
- 公共组件：EmptyState.vue、LoadingSpinner.vue（已验证存在于 shared/components/）
- UI 框架：Element Plus（el-button、el-input、el-table、el-select、el-upload 等）
```

**规则**：
- 设计文档中引用任何文件、组件、函数前，必须用 `Read` 或 `Glob` 工具确认其存在
- 声明"可复用"之前，必须确认被复用的东西确实存在且接口匹配
- 不确定的东西宁可少列，不可多列

---

### 1.9 审查必要性过滤器（Review Necessity Filter）

**V6 问题**：代码审查时频繁提出"可以更优雅"的建议（如用 Symbol 替代字符串异常、调整函数命名、调换执行顺序），但这些建议不会导致 Bug、不会引发线上故障、不影响可维护性，属于过度工程化

**后果**：
- 审查报告充斥低价值建议，淹没真正重要的问题
- 开发者被迫在"改还是不改"之间纠结
- 改动引入不必要的风险

**V6 解决**：审查时每个问题在报告前过三道筛子：

| 筛子 | 问题 | 通过条件 |
|------|------|---------|
| 第一道 | 会导致 Bug 或数据不一致吗？ | 是 → 报告 |
| 第二道 | 会导致线上故障（崩溃/白屏/安全漏洞）吗？ | 是 → 报告 |
| 第三道 | 不修复的话，三个月后的开发者会骂吗？ | 是 → 报告 |

**三道都不过 → 闭嘴，不报告。**

```typescript
// ✅ 这种代码不需要在审查中报告：
throw 'cancel'  // 字符串异常做控制流 — 不会导致 Bug，一眼能看懂

// ❌ 这种代码必须报告：
const data: any = await fetchOrders()  // any 类型 — 会导致类型安全漏洞
```

**规则**：
- 审查报告只包含能通过三道筛子中至少一道的问题
- "可以更优雅"不是报告理由
- 如果犹豫要不要报告 → 不报告

---

### 1.7 外科手术式修改（Surgical Changes）

**V4 问题**：修复一个 Bug 时顺手重构了相邻代码，引入新问题

**后果**：
- PR diff 膨胀，审查困难
- 引入与原问题无关的新 Bug
- 改动难以回滚
- 代码风格不一致

**V6 解决**：
```diff
# ❌ 禁止：修复空 email bug 时顺手做了其他事
- if not user_data.get('email'):
+ email = user_data.get('email', '').strip()
+ if not email:
      raise ValueError("Email required")
- if '@' not in user_data['email']:
+ if '@' not in email or '.' not in email.split('@')[1]:  # ← 未被请求的增强
      raise ValueError("Invalid email")
+ # ← 未被请求的用户名验证
+ if len(username) < 3:
+     raise ValueError("Username too short")
```

```diff
# ✅ 只改与空 email bug 相关的行
- if not user_data.get('email'):
+ email = user_data.get('email', '')
+ if not email or not email.strip():
      raise ValueError("Email required")
- if '@' not in user_data['email']:
+ if '@' not in email:
      raise ValueError("Invalid email")
```

**规则**：
- 不"改进"相邻代码、注释或格式
- 不重构没有坏的东西
- 匹配现有代码风格，即使你更习惯另一种写法
- 每行改动都必须能追溯到用户的具体请求
- 如果发现无关的死代码，提出来但不要删除

---

## 二、开发前检查清单

> 详细规范见 [development-standards.md](../../specs/development-standards.md)

### 2.1 每次开发前必须确认

**文档检查**：
- [ ] 已阅读相关 specs 文档（见 [project_rules.md](project_rules.md) 第二节）
- [ ] 已理解当前任务所属阶段（见 [guardrails.md](guardrails.md)）

**技术约束检查**：
- [ ] 确认不使用 `any` 类型
- [ ] 确认不使用 `console.log`
- [ ] 确认文件大小符合限制（≤ 300 行）
- [ ] 确认函数长度符合限制（≤ 50 行）
- [ ] 确认不写未被请求的功能或可配置性（1.6）
- [ ] 确认每行改动都能追溯到用户请求（1.7）

**业务规则检查**：
- [ ] 确认理解相关业务规则
- [ ] 确认数据验证规则
- [ ] 确认权限控制要求

---

## 三、代码质量检查

### 3.1 检查命令

```bash
# ESLint 检查
pnpm lint

# TypeScript 类型检查
pnpm type-check

# 运行测试
pnpm test
```

### 3.2 检查时机

| 时机 | 执行什么 |
|------|---------|
| 编码过程中 | IDE 实时检查 |
| 声明"完成"前 | `verification-before-completion` 验证门禁 |
| 提交代码前 | 用户确认后执行 lint + type-check |

---

## 四、违规处理

| 违规类型 | 处理措施 |
|----------|---------|
| 使用 `any` 类型 | 立即停止，重写相关代码 |
| 遗留 `console.log` | 立即清理，使用日志系统 |
| 文件超过 300 行 | 立即拆分，重新设计结构 |
| 函数超过 50 行 | 立即重构，提取子函数 |
| 业务逻辑错误 | 立即修复，补充测试用例 |
| 写了未被请求的功能 | 立即删除，回归最小实现 |
| 改动了与任务无关的代码 | 立即回滚，只保留必要改动 |

---

## 五、与其他文档的关系

| 文档 | 定位 | 本文档关系 |
|------|------|-----------|
| [project-context.md](project-context.md) | 启动时读什么 | 入口文档 |
| [guardrails.md](guardrails.md) | 什么阶段能做什么 | 流程边界 |
| [project_rules.md](project_rules.md) | 一页速查 | 日常参考 |
| [development-standards.md](../../specs/development-standards.md) | 详细开发规范 | 规则细节 |
| **本文档** | 为什么有这些规则 | V4 教训详解 |

---

*本约束机制基于 V4 项目的深刻教训制定，所有约束都是零容忍级别，违反任何一条都必须立即停止并纠正。*
