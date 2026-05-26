# V6 开发规范

> **版本**：v1.2  
> **创建日期**：2026-05-03  
> **更新日期**：2026-05-24  
> **用途**：AI 写代码前必须遵守的规则，每次开发前扫一眼  

---

## 一、零容忍规则（9 条，违反立即重写）

### 1. 禁止 `any` 类型

```typescript
// ❌ 禁止
function getData(id: any): any { }

// ✅ 正确
function getData(id: string): UserData { }
```

### 2. 禁止 `console.log`

```typescript
// ❌ 禁止
console.log('调试', data)

// ✅ 正确：用日志系统
import { logger } from '@/shared/utils/logger'
logger.debug('调试', data)
```

### 3. 文件行数分级限制

| 阈值 | 级别 | 说明 |
|------|------|------|
| > 300 行 | warn | 建议拆分，code review 时关注职责是否单一 |
| > 500 行 | error | 必须拆分，硬底线 |

**例外**：测试文件（`__tests__/`）豁免行数限制。测试文件天然偏长（AAA 模式每个 it 约 7 行），拆分反而降低凝聚力。

**自动检查**：ESLint `max-lines` 规则 warn 级别提示，`code-quality-check.js` 在 500 行时报 error。

### 4. 函数行数分级限制

| 阈值 | 级别 | 说明 |
|------|------|------|
| > 50 行 | warn | 建议提取子函数 |
| > 80 行 | error | 必须提取子函数，硬底线 |

**例外**：测试文件豁免函数长度限制。

**自动检查**：ESLint `max-lines-per-function` 规则 warn 级别提示，`code-quality-check.js` 在 80 行时报 error。

### 5. 组件必须处理三种状态

每个展示数据的组件，必须处理：

| 状态 | 表现 |
|------|------|
| loading | 显示加载动画或骨架屏 |
| empty | 显示"暂无数据"提示 |
| error | 显示错误信息 + 重试按钮 |

### 6. 异步操作必须有 try-catch

```typescript
// ✅ 正确
async function fetchTasks() {
  isLoading.value = true
  try {
    const res = await taskService.getList()
    tasks.value = res.data
  } catch (e) {
    ElMessage.error('加载失败，请重试')
  } finally {
    isLoading.value = false
  }
}
```

### 7. 样式必须 scoped

```vue
<!-- ✅ 正确 -->
<style scoped>
.header { padding: 16px; }
</style>

<!-- ❌ 禁止 -->
<style>
.header { padding: 16px; }
</style>
```

### 8. 模块间只能通过 index.ts 引用

```typescript
// ✅ 正确
import { useDispatchStore } from '@/modules/dispatch'

// ❌ 禁止：直接引用模块内部文件
import { useDispatchStore } from '@/modules/dispatch/stores/useDispatchStore'
```

### 9. 禁止 Store 混入 Mock 数据

Mock 数据统一放 `__mocks__/` 目录，通过环境变量 `VITE_USE_MOCK` 控制。

---

## 二、命名约定

| 类型 | 风格 | 正确 | 错误 |
|------|------|------|------|
| Vue 组件文件 | PascalCase | `TaskList.vue` | `taskList.vue` |
| TS 工具文件 | camelCase | `formatDate.ts` | `format-date.ts` |
| 目录名 | kebab-case | `help-center/` | `helpCenter/` |
| 类型/接口 | PascalCase | `TaskItem` | `task_item` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY` | `maxRetry` |
| Store 函数 | `use` + PascalCase + `Store` | `useTaskStore` | `taskStore` |
| 事件处理函数 | `handle` / `on` 前缀 | `handleSubmit` | `submit` |
| Python 文件 | snake_case | `task_service.py` | `taskService.py` |

---

## 三、组件结构模板

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue'

// 2. Props
interface Props {
  taskId: string
  readonly?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// 3. Emits
const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

// 4. 状态
const isLoading = ref(false)

// 5. 计算属性
const displayText = computed(() => `任务 #${props.taskId}`)

// 6. 方法
function handleClick() {
  emit('update', props.taskId)
}
</script>

<template>
  <div v-loading="isLoading" class="component">
    <span>{{ displayText }}</span>
    <button @click="handleClick">操作</button>
  </div>
</template>

<style scoped>
.component { padding: 16px; }
</style>
```

---

## 四、API 规范

### 响应格式（保持 V4）

```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

### 分页

```
GET /api/v1/tasks?page=1&page_size=20
```

### 文件下载（Blob 响应）

前端 API 客户端会对所有响应数据进行 `camelcaseKeys` 转换，但 **Blob 响应必须跳过转换**，否则会破坏 Blob 对象结构导致 `URL.createObjectURL()` 失败。

```typescript
// ✅ 正确：下载文件时指定 responseType
export async function downloadTemplate(): Promise<Blob> {
  const response = await apiClient.get<Blob>('/v1/fleet/transport-records/template', {
    responseType: 'blob'
  })
  return response
}

// ✅ 正确：处理 Blob 响应
async function handleDownload() {
  const blob = await downloadTemplate()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'template.txt'
  link.click()
  window.URL.revokeObjectURL(url)
}
```

**注意**：`handleResponseSuccess` 函数已内置 Blob 响应检测，检测到 `responseType: 'blob'` 时会直接返回原始数据。

### 错误码

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 五、Store 结构模板

```typescript
export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)

  // Getters
  const pendingTasks = computed(() =>
    tasks.value.filter(t => t.status === 'pending')
  )

  // Actions
  async function fetchTasks() {
    isLoading.value = true
    try {
      const res = await taskService.getList()
      tasks.value = res.data
    } finally {
      isLoading.value = false
    }
  }

  function resetState() {
    tasks.value = []
    isLoading.value = false
  }

  return { tasks, isLoading, pendingTasks, fetchTasks, resetState }
})
```

---

## 六、Git 提交规范

一个人开发，极简即可：

```
提交信息：做了什么写什么
"添加 OCR 箱号识别"
"修复任务列表分页 BUG"
```

提交前自动运行：

```bash
pnpm lint        # ESLint 检查
pnpm type-check  # TypeScript 类型检查
pnpm test        # 运行测试
```

---

## 七、AI 代码生成自检清单

AI 每次生成代码前，必须确认：

- [ ] 没有 `any` 类型
- [ ] 没有 `console.log`
- [ ] 声明"完成"前已运行 `verification-before-completion` 验证门禁
- [ ] 文件 ≤ 300 行（warn），≤ 500 行（error）
- [ ] 函数 ≤ 50 行（warn），≤ 80 行（error）
- [ ] 组件处理了 loading / empty / error
- [ ] 异步操作有 try-catch
- [ ] 样式用了 scoped
- [ ] 模块引用走 index.ts
- [ ] 没有混入 Mock 数据

AI 每次写测试前，额外确认：

- [ ] 已读被测源码的类型定义文件
- [ ] 已确认被测组件的 `defineExpose` 列表
- [ ] 测试中没有 `any` / `as unknown as` 类型断言
- [ ] 没有访问未 expose 的组件内部属性
- [ ] 没有 mock 被测逻辑本身（只 mock 外部依赖）
- [ ] 枚举值用了枚举成员，不是字符串字面量
- [ ] 每个测试至少验证一个用户可见的行为
- [ ] 测试名称描述行为，不描述实现细节

---

## 八、测试规范

> **原则**：测试是为了发现 Bug，不是为了覆盖率数字。一个能发现真实问题的测试，胜过十个只验证 mock 调用的测试。

### 8.1 写测试前必须做的事

| 步骤 | 做什么 | 为什么 |
|------|--------|--------|
| 1 | 读被测源码的类型定义（types/*.ts） | 避免用字符串字面量代替枚举/联合类型 |
| 2 | 读被测组件的 `defineExpose` | 确认哪些属性是公开的，哪些是内部的 |
| 3 | 确认被测逻辑的依赖边界 | 区分"外部依赖"（应 mock）和"被测逻辑"（不应 mock） |

### 8.2 禁止的测试写法

#### 禁止 1：用 `any` / `as unknown as` 绕过类型检查

```typescript
// ❌ 禁止
const vm = wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
const getVM = (wrapper: { vm: any }) => wrapper.vm

// ✅ 正确：通过 defineExpose 暴露需要测试的接口
// 组件中：
defineExpose({ handleSubmit, form })

// 测试中：
await wrapper.vm.handleSubmit()
```

**规则**：测试代码和业务代码一样禁止 `any`。如果需要访问组件内部，先在组件中 `defineExpose`，再在测试中通过 `wrapper.vm` 访问。

**注意**：不要为了测试而给组件加 `defineExpose`。如果组件当前没有 expose，优先用行为验证（方式 A）。只有当行为验证无法覆盖时，才考虑加 expose。

#### 禁止 2：访问未 expose 的组件内部

```typescript
// ❌ 禁止：直接访问组件内部属性
wrapper.vm.dialogTitle
wrapper.vm.formRef
wrapper.vm.submitting

// ✅ 正确方式 A（优先）：通过渲染结果和事件测试行为
expect(wrapper.text()).toContain('创建订单')  // 测渲染结果
expect(wrapper.emitted('success')).toBeTruthy()  // 测事件

// ✅ 正确方式 B（备选）：expose 后再访问
// 组件中：
defineExpose({ form, handleSubmit })
// 测试中：
await wrapper.vm.handleSubmit()
```

**规则**：`wrapper.vm` 只能访问 `defineExpose` 暴露的属性。其他内部状态通过渲染结果和事件间接验证。

**优先级**：方式 A > 方式 B。方式 B 只在方式 A 无法覆盖时使用（如需要调用某个方法触发副作用，但该方法没有对应的 UI 入口）。

#### 禁止 3：mock 掉被测逻辑本身

```typescript
// ❌ 禁止：mock 组件自身的业务逻辑
const mockCalculate = vi.fn().mockReturnValue(100)
wrapper.vm.calculateTotal = mockCalculate  // 这是被测逻辑本身

// ✅ 正确：只 mock 外部依赖
vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => ({
    createOrder: mockCreateOrder,  // mock Store（外部依赖）
  }),
}))
// 组件自身的 calculateTotal 真实执行
```

**规则**：只 mock 外部依赖（API、Store、Router）。组件自身的验证、计算、格式化等逻辑必须真实执行。

**ElForm.validate 的特殊处理**：Element Plus 的 `ElForm.validate()` 是第三方库内部实现，在 `@vue/test-utils` 中难以可靠触发真实验证流程。允许 mock `formRef.validate`，但必须遵守以下约束：

| 约束 | 说明 |
|------|------|
| 必须测试验证失败场景 | 不能只 mock `true`，至少有一个测试 mock `false` 并验证阻止提交 |
| mock 值必须有意义 | `mockResolvedValue(true)` 和 `mockResolvedValue(false)` 都要测，不能只测 `true` |
| 注释说明原因 | mock 处加注释 `// mock ElForm.validate: 第三方库内部实现，test-utils 无法可靠触发` |

```typescript
// ✅ 允许：mock ElForm.validate，但测试了失败场景
it('验证失败时不调用 createOrder', async () => {
  wrapper.vm.formRef = {
    validate: vi.fn().mockResolvedValue(false),  // mock 验证失败
  }
  await wrapper.vm.handleSubmit()
  expect(mockCreateOrder).not.toHaveBeenCalled()
})

it('验证通过时调用 createOrder', async () => {
  wrapper.vm.formRef = {
    validate: vi.fn().mockResolvedValue(true),  // mock 验证通过
  }
  await wrapper.vm.handleSubmit()
  expect(mockCreateOrder).toHaveBeenCalled()
})
```

#### 禁止 4：用字符串字面量代替枚举值

```typescript
// ❌ 禁止
status: 'pending'
containerType: '40GP'
businessType: 'heavy_transport'

// ✅ 正确：使用枚举成员
import { OrderStatus, ContainerType, BusinessType } from '../types/order'
status: OrderStatus.PENDING
containerType: ContainerType.GP40
businessType: BusinessType.HEAVY_TRANSPORT
```

**规则**：如果类型定义用了 `enum`，测试必须用枚举成员。如果类型定义用了字符串联合类型（如 `'heavy' | 'empty'`），则字符串字面量是正确的。

**判断方法**：看 `types/*.ts` 源码。有 `export enum` → 用枚举成员。有 `status: 'xxx' | 'yyy'` → 用字符串字面量。

#### 禁止 5：组件测试中只验证 mock 被调用，不验证行为结果

```typescript
// ❌ 禁止（组件测试）：只验证 mock 调用——这只能证明 mock 工作了
expect(mockCreateOrder).toHaveBeenCalled()

// ✅ 正确（组件测试）：验证行为结果
expect(wrapper.emitted('success')).toBeTruthy()
expect(wrapper.emitted('update:visible')![0]).toEqual([false])
expect(wrapper.text()).toContain('创建成功')
```

**规则**：组件测试中，每个测试至少有一个断言验证用户可见的行为（渲染结果、emit 事件、DOM 状态）。

**例外**：Service 测试和 Store 测试中，验证 mock 调用是合理的——这是在验证"委托关系"（Service 正确调用了 API，Store 正确调用了 Service）。但应同时验证返回值或状态变化。

```typescript
// ✅ Service 测试：验证调用参数 + 返回值
expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/orders', { params: { page: 1 } })
expect(result).toEqual(expectedResponse)

// ✅ Store 测试：验证状态变化 + 委托关系
expect(store.orders).toHaveLength(2)
expect(mockFetchOrders).toHaveBeenCalled()
```

### 8.3 测试分层与 mock 边界

```
┌─────────────────────────────────────────────────────┐
│  组件测试（最外层）                                    │
│  mock: Store、API Service、Router                    │
│  不 mock: 组件自身的验证/计算/格式化逻辑                │
│  验证: 渲染结果、emit 事件、DOM 交互                   │
├─────────────────────────────────────────────────────┤
│  Composable 测试                                     │
│  mock: Store、API Service                            │
│  不 mock: composable 自身的计算/监听逻辑               │
│  验证: 返回值、响应式状态变化、watch 副作用             │
├─────────────────────────────────────────────────────┤
│  Store 测试（中间层）                                  │
│  mock: API Service                                   │
│  不 mock: Store 自身的状态变更逻辑                     │
│  验证: state 变化、getter 计算、action 副作用          │
├─────────────────────────────────────────────────────┤
│  Service 测试（最内层）                                │
│  mock: apiClient（HTTP 请求）                         │
│  不 mock: Service 自身的参数转换/错误处理逻辑           │
│  验证: 调用参数、返回值结构、错误处理                   │
└─────────────────────────────────────────────────────┘
```

**核心原则**：mock 向外不向内。只 mock 比被测单元更外层的依赖，永远不 mock 被测单元自身的逻辑。

**Composable 测试方法**：使用 `@vue/test-utils` 的 `mount` 配合宿主组件，或直接在 `setup` 函数中调用 composable：

```typescript
// 方式 A：用宿主组件
const wrapper = mount({
  setup() {
    const result = useOrderForm(props)
    return { ...result }
  },
})

// 方式 B：直接测试（简单 composable）
const { result } = setupComposable(() => useOrderFormHelpers())
```

### 8.4 测试命名规范

```typescript
// ✅ 正确：描述行为和预期
it('验证失败时不调用 createOrder')
it('点击提交按钮后显示加载状态')
it('空关键词时返回全部数据')

// ❌ 禁止：描述实现细节
it('handleSubmit 被调用')
it('form.validate 返回 true')
it('mockCreateOrder 被调用')
```

### 8.5 工厂函数规范

```typescript
// ✅ 正确：工厂函数基于类型定义构建，使用枚举/联合类型值
import { OrderStatus, ContainerType } from '../types/order'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    status: OrderStatus.PENDING,
    containerType: ContainerType.GP40,
    // ...其他必填字段使用合法默认值
    ...overrides,
  }
}

// ❌ 禁止：凭猜测写字符串字面量
function makeOrder(overrides = {}) {
  return {
    status: 'pending',      // 如果 OrderStatus 是枚举，这是类型不安全的
    containerType: '40GP',  // 同上
    ...overrides,
  }
}
```

**规则**：写工厂函数前必须先读对应的类型定义文件，确保默认值与类型完全匹配。

### 8.6 测试自检清单

AI 每次写测试前，必须确认：

- [ ] 已读被测源码的类型定义文件
- [ ] 已确认被测组件的 `defineExpose` 列表
- [ ] 没有 `any` / `as unknown as` 类型断言
- [ ] 没有访问未 expose 的组件内部属性
- [ ] 没有 mock 被测逻辑本身（只 mock 外部依赖）
- [ ] 枚举值用了枚举成员，不是字符串字面量
- [ ] 每个测试至少验证一个用户可见的行为
- [ ] 测试名称描述行为，不描述实现细节

---

## 九、关联文档

- 技术栈：[tech-stack.md](tech-stack.md)
- 项目结构：[project-structure.md](project-structure.md)
- 产品概述：[product-overview.md](product-overview.md)
