# shared 公共模块需求与技术方案

> **版本**：v1.0
> **创建日期**：2026-05-04
> **状态**：草稿
> **定位**：基础设施模块，合并 requirements + design（轻量）

---

## 一、模块定位

shared 是 V6 项目的**运行时公共层**，与 shared-types（类型定义层）互补：

| 层 | 包/目录 | 内容 | 运行时 |
|----|---------|------|--------|
| 类型定义层 | `packages/shared-types/` | 枚举、API 接口类型 | ❌ 纯类型 |
| 运行时公共层 | `apps/frontend/src/shared/` | Axios 客户端、工具函数、UI 组件 | ✅ 有逻辑 |

shared 模块是所有业务模块（auth、fleet、dispatch 等）的地基，必须先于业务模块完成。

---

## 二、功能范围

### 2.1 前端 shared（`apps/frontend/src/shared/`）

| 子模块 | 内容 | 优先级 |
|--------|------|--------|
| Axios 客户端 | 请求/响应拦截器、错误处理、token 注入 | P0 |
| 工具函数 | 日期格式化、数据验证、权限检查 | P0 |
| 通用 UI 组件 | EmptyState、LoadingSpinner | P1 |

### 2.2 后端 shared（`apps/server/app/core/`）

| 子模块 | 内容 | 优先级 |
|--------|------|--------|
| 日志工具 | logger 封装 | P1 |
| 异常处理 | 全局异常处理器 | P1 |

> 后端已有 `config.py` 和 `database.py`，本次仅补充 logger 和异常处理。

---

## 三、验收标准（AC）

### AC-001：Axios 客户端
- 创建 `apps/frontend/src/shared/api/client.ts`
- 支持请求拦截器：自动注入 Authorization token
- 支持响应拦截器：统一错误处理（401 跳转登录、网络异常提示）
- 导出类型安全的请求方法（get/post/put/delete）
- 与 `shared-types` 的 `ApiResponse<T>` 类型配合

### AC-002：工具函数
- 创建 `apps/frontend/src/shared/utils/` 目录
- `format.ts`：日期格式化（`yyyy-MM-dd HH:mm`）、金额格式化
- `validate.ts`：手机号验证、必填校验
- `permission.ts`：角色权限检查函数（`hasRole`、`isAdmin`）

### AC-003：通用 UI 组件
- `EmptyState.vue`：空状态组件，支持自定义图标和文案
- `LoadingSpinner.vue`：加载动画组件，支持全屏/局部两种模式
- 组件必须处理三种状态（loading/empty/error）中的对应状态

### AC-004：后端日志工具
- 创建 `apps/server/app/core/logger.py`
- 基于 Python logging 封装，支持 DEBUG/INFO/WARNING/ERROR 级别
- 支持控制台 + 文件双输出

### AC-005：后端异常处理
- 创建 `apps/server/app/core/exceptions.py`
- 定义业务异常类 `AppException`
- 注册 FastAPI 全局异常处理器，统一返回 `{"code": xxx, "message": "xxx"}`

### AC-006：模块导出规范
- 前端 shared 通过 `index.ts` 统一导出
- 后端 core 通过 `__init__.py` 统一导出
- 其他模块只能通过入口文件引用

---

## 四、技术设计

### 4.1 目录结构

```
apps/frontend/src/shared/
├── index.ts                  # 统一导出入口
├── api/
│   └── client.ts             # Axios 客户端
├── components/
│   ├── EmptyState.vue        # 空状态组件
│   └── LoadingSpinner.vue    # 加载动画组件
└── utils/
    ├── index.ts              # 工具函数导出
    ├── format.ts             # 日期/金额格式化
    ├── validate.ts           # 数据验证
    └── permission.ts         # 权限检查

apps/server/app/core/
├── __init__.py               # 已有，需更新导出
├── config.py                 # 已有
├── database.py               # 已有
├── logger.py                 # 新增：日志工具
└── exceptions.py             # 新增：异常处理
```

### 4.2 Axios 客户端设计

```typescript
// client.ts
import axios from 'axios'
import type { ApiResponse } from '@qingtou/shared-types'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

// 请求拦截器：注入 token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一错误处理
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
```

### 4.3 通用组件 API 设计

**EmptyState**：
```typescript
interface Props {
  icon?: string        // 图标名称，默认 'empty-box'
  title?: string       // 标题，默认 '暂无数据'
  description?: string // 描述文字
}
```

**LoadingSpinner**：
```typescript
interface Props {
  fullscreen?: boolean // 是否全屏，默认 false
  text?: string        // 加载文字，默认 '加载中...'
}
```

### 4.4 工具函数设计

```typescript
// format.ts
export function formatDate(date: string | Date, pattern?: string): string
export function formatMoney(amount: number, decimals?: number): string

// validate.ts
export function isPhone(phone: string): boolean
export function isRequired(value: unknown): boolean

// permission.ts
export function hasRole(role: string): boolean
export function isAdmin(): boolean
```

### 4.5 后端异常处理设计

```python
# exceptions.py
class AppException(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message

# main.py 中注册
@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=200,
        content={"code": exc.code, "message": exc.message}
    )
```

---

## 五、与 shared-types 的关系

```
packages/shared-types/          apps/frontend/src/shared/
├── enums.ts (TaskStatus 等)    ├── api/client.ts
├── api.ts (ApiResponse<T>)     │   └── 使用 ApiResponse<T> 作为返回类型
└── index.ts                    ├── utils/permission.ts
                                    └── 使用 UserRole 枚举做权限判断
```

shared 依赖 shared-types 的类型定义，不重复定义枚举和接口类型。

---

## 六、依赖关系

```
shared-types（已有）
    ↓
shared 公共模块（本次）
    ↓
auth / fleet / dispatch / ...（后续）
```

---

## 七、风险与约束

| 风险 | 应对 |
|------|------|
| Axios 客户端与 auth 模块的 token 存储方式耦合 | token 统一用 `localStorage.getItem('token')`，auth 模块负责写入 |
| 通用组件样式与业务组件冲突 | 全部使用 `scoped` 样式 |
| 后端 logger 与前端 logger 不统一 | 各自独立实现，不强制统一 |
