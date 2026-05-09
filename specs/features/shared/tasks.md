# shared 公共模块 — 任务规划

> **版本**：v1.0
> **创建日期**：2026-05-04
> **依赖文档**：[requirements.md](./requirements.md)
> **策略**：垂直切片，每个任务穿透「类型定义 → 实现 → 测试」三层

---

## 一、任务总览

| 编号 | 任务 | 覆盖 AC | 预估复杂度 | 依赖 |
|------|------|---------|-----------|------|
| T-001 | 前端 Axios 客户端 | AC-001 | 中 | 无 |
| T-002 | 前端工具函数 | AC-002 | 低 | 无 |
| T-003 | 前端通用 UI 组件 | AC-003 | 中 | 无 |
| T-004 | 后端日志 + 异常处理 | AC-004, AC-005 | 低 | 无 |
| T-005 | 模块导出 + 集成验证 | AC-006 | 低 | T-001~T-004 |

---

## 二、原子任务详情

### T-001：前端 Axios 客户端

**目标**：创建类型安全的 HTTP 客户端

**文件**：
- `apps/frontend/src/shared/api/client.ts`

**TDD 步骤**：
1. RED：编写测试，验证拦截器行为（token 注入、401 处理）
2. GREEN：实现 Axios 实例 + 请求/响应拦截器
3. REFACTOR：提取常量（超时时间、错误消息）

**验收标准**：
- [x] 请求自动携带 `Authorization: Bearer <token>` 头
- [x] 401 响应自动清除 token 并跳转 `/login`
- [x] 网络异常时返回统一错误格式
- [x] 导出 `http` 实例，支持 `http.get<T>()` / `http.post<T>()` 泛型调用

---

### T-002：前端工具函数

**目标**：创建日期格式化、数据验证、权限检查工具

**文件**：
- `apps/frontend/src/shared/utils/format.ts`
- `apps/frontend/src/shared/utils/validate.ts`
- `apps/frontend/src/shared/utils/permission.ts`
- `apps/frontend/src/shared/utils/index.ts`

**TDD 步骤**：
1. RED：为每个工具函数编写测试用例
2. GREEN：实现函数逻辑
3. REFACTOR：提取公共常量（正则表达式等）

**验收标准**：
- [x] `formatDate('2026-05-04', 'yyyy-MM-dd')` → `'2026-05-04'`
- [x] `formatDate('2026-05-04T10:30:00', 'HH:mm')` → `'10:30'`
- [x] `formatMoney(1234.5)` → `'1,234.50'`
- [x] `isPhone('13800138000')` → `true`
- [x] `isPhone('123')` → `false`
- [x] `isRequired('')` → `false`
- [x] `isRequired('hello')` → `true`
- [x] `hasRole('admin')` 从 localStorage 读取角色并判断
- [x] `isAdmin()` 等价于 `hasRole('admin')`

---

### T-003：前端通用 UI 组件

**目标**：创建 EmptyState 和 LoadingSpinner 组件

**文件**：
- `apps/frontend/src/shared/components/EmptyState.vue`
- `apps/frontend/src/shared/components/LoadingSpinner.vue`

**TDD 步骤**：
1. RED：编写组件渲染测试（验证 props 渲染、插槽内容）
2. GREEN：实现组件模板 + 样式
3. REFACTOR：调用 `frontend-design` 优化视觉品质

**验收标准**：
- [x] EmptyState 默认显示"暂无数据"
- [x] EmptyState 支持自定义 icon/title/description
- [x] LoadingSpinner 默认局部加载动画
- [x] LoadingSpinner `fullscreen` 模式覆盖全屏
- [x] 两个组件样式均为 `scoped`

---

### T-004：后端日志 + 异常处理

**目标**：补充后端基础设施

**文件**：
- `apps/server/app/core/logger.py`
- `apps/server/app/core/exceptions.py`
- `apps/server/app/core/__init__.py`（更新导出）
- `apps/server/app/main.py`（注册异常处理器）

**TDD 步骤**：
1. RED：编写测试验证日志输出和异常处理
2. GREEN：实现 logger 和 AppException
3. REFACTOR：提取日志格式配置

**验收标准**：
- [x] logger 支持 DEBUG/INFO/WARNING/ERROR 四个级别
- [x] logger 同时输出到控制台和 `logs/app.log` 文件
- [x] `AppException(code=400, message="参数错误")` 可正常抛出
- [x] FastAPI 全局异常处理器捕获 AppException 并返回 JSON

---

### T-005：模块导出 + 集成验证

**目标**：统一导出入口，验证所有子模块可正常引用

**文件**：
- `apps/frontend/src/shared/index.ts`

**验收标准**：
- [x] `import { http } from '@/shared'` 可用
- [x] `import { formatDate, isPhone, hasRole } from '@/shared'` 可用
- [x] `import { EmptyState, LoadingSpinner } from '@/shared'` 可用
- [x] 后端 `from app.core import logger, AppException` 可用
- [x] `pnpm type-check` 通过
- [x] `pnpm lint` 通过

---

## 三、执行顺序

```
T-001 (Axios)  ──┐
T-002 (Utils)  ──┼──→ T-005 (导出+验证)
T-003 (UI组件) ──┤
T-004 (后端)   ──┘
```

T-001~T-004 可并行执行（互不依赖），T-005 在所有子模块完成后执行。

---

## 四、完成标准

- [x] 5 个任务全部完成
- [x] 所有 AC（AC-001 ~ AC-006）通过
- [x] `pnpm type-check` 零错误
- [x] `pnpm lint` 零警告
- [x] `pnpm test` 全部通过
