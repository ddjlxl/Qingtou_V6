# auth 用户认证 — 任务规划

> **版本**：v1.0
> **创建日期**：2026-05-04
> **依赖文档**：[requirements.md](./requirements.md)、[design.md](./design.md)
> **前置模块**：shared 公共模块（必须完成）
> **策略**：垂直切片，先打通后端认证链路，再搭建前端登录闭环

---

## 一、任务总览

| 编号 | 任务 | 覆盖 AC | 预估复杂度 | 依赖 |
|------|------|---------|-----------|------|
| T-101 | 后端 JWT 安全模块 | AC-001 | 中 | shared (T-004) |
| T-102 | 后端登录 API | AC-001, AC-002 | 中 | T-101 |
| T-103 | 前端认证 Store + API 服务 | AC-004, AC-007 | 中 | shared (T-001) |
| T-104 | 前端登录页面 | AC-003 | 中 | T-103 |
| T-105 | 路由守卫 + 角色权限 | AC-005, AC-006 | 中 | T-103 |
| T-106 | 集成验证 | 全部 AC | 低 | T-101~T-105 |

---

## 二、原子任务详情

### T-101：后端 JWT 安全模块

**目标**：实现密码哈希和 JWT 生成/验证

**文件**：
- `apps/server/app/core/security.py`
- `apps/server/app/core/config.py`（追加 JWT_SECRET）
- `apps/server/requirements.txt`（追加 python-jose、passlib、bcrypt）

**TDD 步骤**：
1. RED：编写测试验证密码哈希和 JWT 生成/验证
2. GREEN：实现 `hash_password`、`verify_password`、`create_token`、`decode_token`
3. REFACTOR：提取常量（算法、过期时间）

**验收标准**：
- [ ] `hash_password("123456")` 返回 bcrypt 哈希字符串
- [ ] `verify_password("123456", hash)` → `True`
- [ ] `verify_password("wrong", hash)` → `False`
- [ ] `create_token("user-id")` 返回有效 JWT 字符串
- [ ] `decode_token(token)` 返回 `{"sub": "user-id", "exp": ...}`
- [ ] 过期 Token 解码抛出异常

---

### T-102：后端登录 API

**目标**：实现登录接口和获取当前用户接口

**文件**：
- `apps/server/app/schemas/auth.py`
- `apps/server/app/services/auth_service.py`
- `apps/server/app/api/v1/auth.py`
- `apps/server/app/main.py`（注册路由）

**TDD 步骤**：
1. RED：编写 API 集成测试（正确登录、错误密码、禁用用户、无 Token）
2. GREEN：实现 Schema → Service → API 三层
3. REFACTOR：提取错误消息常量

**验收标准**：
- [ ] `POST /api/v1/auth/login` 正确凭证返回 token + 用户信息
- [ ] 错误密码返回 `{"code": 401, "message": "用户名或密码错误"}`
- [ ] 禁用用户返回 `{"code": 403, "message": "账号已被禁用"}`
- [ ] 登录成功更新 `last_login_at`
- [ ] `GET /api/v1/auth/me` 有效 Token 返回用户信息
- [ ] `GET /api/v1/auth/me` 无效 Token 返回 401

---

### T-103：前端认证 Store + API 服务

**目标**：实现前端认证状态管理和 API 调用层

**文件**：
- `apps/frontend/src/modules/auth/types/index.ts`
- `apps/frontend/src/modules/auth/services/authService.ts`
- `apps/frontend/src/modules/auth/stores/useAuthStore.ts`
- `apps/frontend/src/modules/auth/index.ts`

**TDD 步骤**：
1. RED：编写 Store 单元测试（登录、登出、状态计算）
2. GREEN：实现 types → service → store
3. REFACTOR：提取 localStorage key 常量

**验收标准**：
- [ ] `authStore.login(username, password)` 调用 API 并存储 token
- [ ] `authStore.isLoggedIn` 在登录后为 `true`
- [ ] `authStore.userRole` 返回当前用户角色
- [ ] `authStore.logout()` 清除 token 和用户信息
- [ ] 页面刷新后 token 从 localStorage 恢复

---

### T-104：前端登录页面

**目标**：实现登录页面 UI

**文件**：
- `apps/frontend/src/modules/auth/components/LoginForm.vue`

**TDD 步骤**：
1. RED：编写组件渲染测试（表单元素、按钮状态）
2. GREEN：实现模板 + 逻辑
3. REFACTOR：调用 `frontend-design` 优化视觉品质

**验收标准**：
- [ ] 用户名和密码输入框正常渲染
- [ ] 登录按钮点击后显示 loading 状态
- [ ] 登录成功跳转 `/`
- [ ] 登录失败显示错误提示
- [ ] 样式为 `scoped`

---

### T-105：路由守卫 + 角色权限

**目标**：实现全局路由守卫和角色权限控制

**文件**：
- `apps/frontend/src/router/index.ts`

**TDD 步骤**：
1. RED：编写路由守卫测试（未登录跳转、已登录放行、角色拦截）
2. GREEN：实现 `beforeEach` 守卫逻辑
3. REFACTOR：提取守卫为独立函数

**验收标准**：
- [ ] 未登录访问 `/` → 跳转 `/login`
- [ ] 已登录访问 `/login` → 跳转 `/`
- [ ] 路由 `meta.roles` 限制角色时，无权限用户被拦截
- [ ] 路由 `meta.guest: true` 时，已登录用户被拦截

---

### T-106：集成验证

**目标**：端到端验证登录闭环

**验收标准**：
- [ ] 启动前后端 → 访问首页 → 自动跳转登录页
- [ ] 输入正确用户名密码 → 登录成功 → 跳转首页
- [ ] 刷新页面 → 仍保持登录状态
- [ ] 点击登出 → 清除状态 → 跳转登录页
- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 通过
- [ ] `pnpm test` 全部通过

---

## 三、执行顺序

```
T-101 (JWT安全)
    ↓
T-102 (登录API)
    ↓
T-103 (前端Store) ──┬──→ T-104 (登录页面)
                    │
                    └──→ T-105 (路由守卫)
                              ↓
                         T-106 (集成验证)
```

T-101 → T-102 必须串行（后端链路）。T-103 完成后，T-104 和 T-105 可并行。

---

## 四、完成标准

- [ ] 6 个任务全部完成
- [ ] 所有 AC（AC-001 ~ AC-007）通过
- [ ] `pnpm type-check` 零错误
- [ ] `pnpm lint` 零警告
- [ ] `pnpm test` 全部通过
- [ ] 登录闭环可手动验证通过
