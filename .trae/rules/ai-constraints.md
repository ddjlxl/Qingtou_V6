# V6项目AI开发约束机制

> **版本**：v1.0  
> **创建日期**：2026-04-30  
> **目的**：基于V4教训，制定严格的AI开发约束  
> **约束级别**：零容忍  

---

## 一、零容忍约束（违反立即停止）

### 1.1 TypeScript类型安全
**约束**：**禁止使用`any`类型**

**V4问题**：257处`any`类型，TypeScript形同虚设

**替代方案**：
```typescript
// ❌ 禁止
function processData(data: any): any {
  return data
}

// ✅ 必须使用具体类型
function processData<T>(data: T): T {
  return data
}

// ✅ 或使用unknown + 类型守卫
function processData(data: unknown): SomeType {
  if (isValidData(data)) {
    return data as SomeType
  }
  throw new Error('Invalid data')
}
```

**检查机制**：每次提交代码前必须运行`tsc --noEmit`检查

### 1.2 调试代码清理
**约束**：**禁止遗留`console.log`等调试代码**

**V4问题**：92处调试代码遗留生产环境

**替代方案**：
```typescript
// ❌ 禁止
console.log('调试信息', data)

// ✅ 使用日志系统
import { logger } from '@/utils/logger'
logger.debug('调试信息', data)

// ✅ 或使用条件编译
if (import.meta.env.DEV) {
  console.log('调试信息', data)
}
```

**检查机制**：ESLint规则禁止`console`使用

### 1.3 文件大小限制
**约束**：**单个文件不超过300行，单个函数不超过50行**

**V4问题**：`dispatch.ts` 665行，维护困难

**拆分标准**：
```
# 超过300行的文件必须拆分
store/dispatch.ts (665行)
    ├── store/dispatch/actions.ts (处理异步操作)
    ├── store/dispatch/state.ts (状态定义)
    ├── store/dispatch/getters.ts (计算属性)
    └── store/dispatch/mutations.ts (同步操作)
```

**检查机制**：代码审查时检查文件大小

---

## 二、开发前强制检查清单

### 2.1 每次开发前必须检查

```markdown
# AI开发前检查清单

## 文档检查
- [ ] 已阅读并理解 `V6需求文档.md`
- [ ] 已阅读并理解 `V6数据库设计.md`
- [ ] 已阅读并理解 `V6开发规则.md`

## 技术约束检查
- [ ] 确认不使用 `any` 类型
- [ ] 确认不使用 `console.log`
- [ ] 确认文件大小符合限制
- [ ] 确认函数长度符合限制

## 业务规则检查
- [ ] 确认理解相关业务规则
- [ ] 确认数据验证规则
- [ ] 确认权限控制要求
```

### 2.2 代码生成约束

**约束**：AI生成代码必须包含以下内容

```typescript
// 1. 必须有完整的类型定义
interface User {
  id: string
  name: string
  role: UserRole
}

// 2. 必须有错误处理
try {
  const result = await someOperation()
  return result
} catch (error) {
  logger.error('操作失败', error)
  throw new Error('操作失败，请重试')
}

// 3. 必须有清晰的注释
/**
 * 创建用户
 * @param userData - 用户数据
 * @returns 创建的用户信息
 * @throws 当数据无效或创建失败时抛出错误
 */
async function createUser(userData: CreateUserRequest): Promise<User> {
  // 实现
}
```

---

## 三、代码质量强制检查

### 3.1 ESLint配置（零容忍规则）

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error', // 禁止any类型
    'no-console': 'error', // 禁止console
    'max-lines': ['error', 300], // 文件最大300行
    'max-lines-per-function': ['error', 50], // 函数最大50行
    'complexity': ['error', 10], // 圈复杂度限制
  }
}
```

### 3.2 TypeScript配置（严格模式）

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 3.3 提交前检查脚本

```json
// package.json
{
  "scripts": {
    "pre-commit": "npm run lint && npm run type-check && npm run test",
    "lint": "eslint src --ext .ts,.vue",
    "type-check": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

---

## 四、业务逻辑约束

### 4.1 状态管理约束

**约束**：禁止在Store中混入Mock数据和API逻辑

**V4问题**：`dispatch.ts`中Mock数据和API逻辑混杂

**解决方案**：
```typescript
// ❌ 禁止：混用模式
async function initTasks() {
  try {
    const res = await fetchTasksApi() // 真实API
    if (res.code === 200) {
      // 用真实数据
    } else {
      fallbackToMock() // 失败了用假数据
    }
  } catch {
    fallbackToMock() // 出错了用假数据
  }
}

// ✅ 必须：环境分离
// store/orders.ts - 只处理真实数据
export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  
  const fetchOrders = async () => {
    const response = await OrderService.getOrders()
    orders.value = response.data
  }
  
  return { orders, fetchOrders }
})

// __mocks__/orders.ts - Mock数据
export const mockOrders: Order[] = [
  // Mock数据
]

// 通过环境变量控制
if (import.meta.env.VITE_USE_MOCK === 'true') {
  // 使用Mock数据
} else {
  // 使用真实API
}
```

### 4.2 组件设计约束

**约束**：禁止在`computed`中使用副作用操作

**V4问题**：`ZoneCard.vue`中`computed`内使用`Math.random()`

**解决方案**：
```typescript
// ❌ 禁止：computed中有副作用
const trend = computed(() => {
  const randomTrend = Math.random() // 副作用！
  if (randomTrend > 0.6) return 'up'
  return 'neutral'
})

// ✅ 必须：纯函数
const trend = computed(() => {
  return props.subZone.trend || 'neutral'
})
```

---

## 五、开发流程强制验证

### 5.1 分阶段验证流程

```markdown
# 功能开发验证流程

## 阶段1：设计验证
- [ ] 接口设计符合API规范
- [ ] 数据类型定义完整
- [ ] 业务规则实现方案明确

## 阶段2：实现验证  
- [ ] 代码通过ESLint检查
- [ ] 代码通过TypeScript类型检查
- [ ] 单元测试编写完成
- [ ] 单元测试全部通过

## 阶段3：集成验证
- [ ] 功能集成测试通过
- [ ] 与其他模块兼容性验证
- [ ] 性能影响评估

## 阶段4：部署验证
- [ ] 生产环境构建成功
- [ ] 功能在生产环境验证
- [ ] 监控指标正常
```

### 5.2 问题处理流程

**约束**：遇到问题必须立即停止并报告

```markdown
# 问题处理流程

1. **发现问题**：立即停止当前开发
2. **分析原因**：深入分析问题根源
3. **制定方案**：提出至少2种解决方案
4. **获得批准**：向用户说明问题并获得解决方案批准
5. **实施修复**：按照批准的方案实施修复
6. **验证修复**：验证修复效果
7. **更新文档**：更新相关文档
```

---

## 六、惩罚机制

### 6.1 违反约束的处理

| 违反类型 | 处理措施 |
|----------|----------|
| 使用`any`类型 | **立即停止**，重写相关代码 |
| 遗留`console.log` | **立即清理**，添加日志系统 |
| 文件超过300行 | **立即拆分**，重新设计结构 |
| 函数超过50行 | **立即重构**，提取子函数 |
| 业务逻辑错误 | **立即修复**，补充测试用例 |

### 6.2 质量指标要求

**必须达到的质量指标**：
- **类型安全**：`any`类型使用率 0%
- **代码质量**：ESLint错误数 0
- **测试覆盖**：核心功能覆盖率 > 80%
- **性能指标**：页面加载时间 < 3秒

---

## 七、总结

本约束机制基于V4项目的深刻教训制定，旨在**彻底避免重蹈覆辙**。所有约束都是**零容忍**级别，违反任何一条都必须立即停止并纠正。

**核心原则**：宁可开发慢一些，也要保证代码质量。

*本机制将根据实际开发情况进行调整和优化*