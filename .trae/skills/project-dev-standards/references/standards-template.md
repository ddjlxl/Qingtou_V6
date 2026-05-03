# 开发规范文档模板

> 本文档为 `project-dev-standards` Skill 的参考模板，AI 生成最终规范时以此结构为基准。

---

# [项目名称] 开发规范

## 一、代码风格

### 格式化规则
- **缩进**：[2 空格 / 4 空格]
- **引号**：[单引号 / 双引号]
- **分号**：[必须 / 禁止 / 可选]
- **行宽**：[80 / 100 / 120] 字符

### 配置文件
- Prettier：`.prettierrc`
- ESLint：`.eslintrc.js`

## 二、命名约定

| 元素 | 风格 | 正确示例 | 错误示例 |
|------|------|---------|---------|
| 组件文件 | PascalCase | `UserCard.vue` | `userCard.vue` |
| 工具函数文件 | camelCase | `formatDate.ts` | `format-date.ts` |
| 目录名 | kebab-case | `user-profile/` | `UserProfile/` |
| 类型/接口 | PascalCase | `UserProfile` | `user_profile` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY` | `maxRetry` |
| Store 函数 | `use` 前缀 + PascalCase | `useUserStore` | `userStore` |
| 事件处理函数 | `handle` / `on` 前缀 | `handleSubmit` | `submit` |

## 三、TypeScript 严格规则

### 禁止事项
```typescript
// ❌ 禁止：使用 any
function processData(data: any): any {
  return data
}

// ✅ 正确：使用具体类型
function processData(data: UserData): ProcessedData {
  return transform(data)
}

// ✅ 正确：使用 unknown + 类型守卫
function processData(data: unknown): ProcessedData {
  if (isUserData(data)) {
    return transform(data)
  }
  throw new Error('Invalid data')
}
```

### 必须事项
- 所有函数参数和返回值有显式类型
- Props 使用 TypeScript 接口定义
- Emits 使用 TypeScript 接口定义
- API 请求/响应类型已定义

## 四、组件规范

### 文件结构
```vue
<script setup lang="ts">
// 1. 导入
// 2. Props 定义
// 3. Emits 定义
// 4. 响应式状态
// 5. 计算属性
// 6. 方法
// 7. 生命周期
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped>
/* 样式 */
</style>
```

### 状态处理（必须）
每个数据组件必须处理三种状态：
- **loading**：数据加载中，显示骨架屏或加载动画
- **empty**：数据为空，显示空状态提示
- **error**：加载失败，显示错误信息和重试按钮

### Props 规范
```typescript
interface Props {
  userId: string
  userName?: string
  role?: 'admin' | 'user'
}

const props = withDefaults(defineProps<Props>(), {
  userName: '未命名',
  role: 'user'
})
```

### Emits 规范
```typescript
interface Emits {
  (e: 'update', value: string): void
  (e: 'delete', id: string): void
}

const emit = defineEmits<Emits>()
```

## 五、API 规范

### URL 格式
```
/api/v1/<resource>          # 资源集合
/api/v1/<resource>/<id>     # 单个资源
```

### 请求方法
| 方法 | 用途 |
|------|------|
| GET | 查询（列表/详情） |
| POST | 创建 |
| PUT/PATCH | 更新 |
| DELETE | 删除 |

### 响应格式
```json
// 成功
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 错误
{
  "code": 400,
  "message": "参数错误：手机号不能为空",
  "detail": null
}
```

### 分页
```
GET /api/v1/orders?page=1&page_size=20
```

## 六、Store 规范

### 命名
- Store 函数：`use<Name>Store`
- Store ID：kebab-case

### 结构
```typescript
export const useUserStore = defineStore('user', () => {
  // State（ref）
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters（computed）
  const activeUsers = computed(() => users.value.filter(u => u.isActive))

  // Actions
  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    try {
      const response = await UserService.getUsers()
      users.value = response.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Reset
  function resetState() {
    users.value = []
    isLoading.value = false
    error.value = null
  }

  return { users, isLoading, error, activeUsers, fetchUsers, resetState }
})
```

## 七、Git 工作流

### 分支命名
```
feat/<功能名>       # 新功能
fix/<问题描述>      # Bug 修复
refactor/<模块名>   # 重构
docs/<内容>         # 文档
```

### 提交信息格式
```
<type>(<scope>): <描述>

feat(auth): 添加手机号验证码登录
fix(order): 修复订单金额计算精度问题
refactor(shared): 提取公共表单验证逻辑
```

### 提交前检查
```bash
npm run lint        # ESLint 检查
npm run type-check  # TypeScript 类型检查
npm run test        # 运行测试
```

## 八、错误处理

### 前端
```typescript
try {
  const result = await someAsyncOperation()
  return result
} catch (error) {
  logger.error('操作失败', error)
  // 显示用户友好的错误提示
  showErrorToast('操作失败，请重试')
}
```

### 后端
```python
try:
    result = await some_operation()
    return result
except ValidationError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.error(f"操作失败: {e}")
    raise HTTPException(status_code=500, detail="服务器内部错误")
```

## 九、AI 协作协议

> 详见 `references/ai-collaboration-protocol.md`
