# V6 开发规范

> **版本**：v1.0  
> **创建日期**：2026-05-03  
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

### 3. 文件不超过 300 行

超过就拆。一个文件只做一件事。

### 4. 函数不超过 50 行

超过就提取子函数。

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
- [ ] 文件 ≤ 300 行
- [ ] 函数 ≤ 50 行
- [ ] 组件处理了 loading / empty / error
- [ ] 异步操作有 try-catch
- [ ] 样式用了 scoped
- [ ] 模块引用走 index.ts
- [ ] 没有混入 Mock 数据

---

## 八、关联文档

- 技术栈：[tech-stack.md](tech-stack.md)
- 项目结构：[project-structure.md](project-structure.md)
- 产品概述：[product-overview.md](product-overview.md)
