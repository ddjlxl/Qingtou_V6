# V6 项目 AI 开发约束机制

> **版本**：v1.0  
> **创建日期**：2026-05-04  
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
