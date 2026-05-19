# auth 用户认证 — 开发执行计划

> **版本**：v1.0
> **创建日期**：2026-05-05
> **依赖文档**：[requirements.md](./requirements.md)、[design.md](./design.md)、[tasks.md](./tasks.md)
> **当前阶段**：Phase 1.3 核心业务（M1 MVP）
> **策略**：TDD 驱动，RED → GREEN → REFACTOR，每个任务独立可验证

---

## 一、前置条件确认

| 条件 | 状态 |
|------|------|
| users 表已存在（username/password/role/status） | ✅ |
| shared 公共模块已完成（http client、工具函数、UI 组件） | ✅ |
| 后端 core 基础设施就绪（config、database、logger、exceptions） | ✅ |
| 前端 router 已初始化 | ✅ |
| Pinia 已安装 | ✅ |

---

## 二、原子任务执行顺序

```
T-101 (后端 JWT 安全)
    │  产出: core/security.py
    │  验证: pytest tests/test_security.py
    ↓
T-102 (后端登录 API)
    │  产出: schemas/auth.py, services/auth_service.py, api/v1/auth.py
    │  验证: pytest tests/test_auth_api.py
    ↓
T-103 (前端 Store + Service)
    │  产出: modules/auth/types/, services/, stores/
    │  验证: vitest modules/auth/
    ↓
    ├──→ T-104 (登录页面 UI)
    │       产出: modules/auth/components/LoginForm.vue
    │       验证: vitest LoginForm.test.ts
    │
    └──→ T-105 (路由守卫)
            产出: router/index.ts 扩展
            验证: vitest router guard
            
    T-104 + T-105 都完成后:
    ↓
T-106 (集成验证)
    验证: type-check + lint + test 全通过 + 手动登录闭环
```

---

## 三、任务详情

### T-101：后端 JWT 安全模块

| 属性 | 值 |
|------|-----|
| 覆盖 AC | AC-001 |
| 新增文件 | `apps/server/app/core/security.py` |
| 修改文件 | `apps/server/app/core/config.py`（追加 JWT_SECRET） |
| 依赖安装 | `python-jose[cryptography]`、`passlib[bcrypt]`、`bcrypt` |
| 测试文件 | `apps/server/tests/test_security.py` |

**TDD 步骤**：
1. RED：编写测试 — `hash_password` 返回 bcrypt 哈希、`verify_password` 正确/错误比对、`create_token` 生成有效 JWT、`decode_token` 解析、过期 Token 抛异常
2. GREEN：实现 4 个函数
3. REFACTOR：提取算法/过期时间常量

---

### T-102：后端登录 API

| 属性 | 值 |
|------|-----|
| 覆盖 AC | AC-001, AC-002 |
| 新增文件 | `schemas/auth.py`、`services/auth_service.py`、`api/v1/auth.py` |
| 修改文件 | `main.py`（注册路由） |
| 测试文件 | `apps/server/tests/test_auth_api.py` |

**TDD 步骤**：
1. RED：编写 API 集成测试 — 正确登录、错误密码、禁用用户、无 Token 访问 /me
2. GREEN：实现 Schema → Service → API 三层
3. REFACTOR：提取错误消息常量

---

### T-103：前端认证 Store + API 服务

| 属性 | 值 |
|------|-----|
| 覆盖 AC | AC-004, AC-007 |
| 新增文件 | `modules/auth/types/index.ts`、`modules/auth/services/authService.ts`、`modules/auth/stores/useAuthStore.ts`、`modules/auth/index.ts` |
| 测试文件 | `modules/auth/__tests__/useAuthStore.test.ts` |

**TDD 步骤**：
1. RED：编写 Store 测试 — login 调用 API 并存储 token、isLoggedIn 状态、logout 清除
2. GREEN：实现 types → service → store
3. REFACTOR：提取 localStorage key 常量

---

### T-104：前端登录页面

| 属性 | 值 |
|------|-----|
| 覆盖 AC | AC-003 |
| 新增文件 | `modules/auth/components/LoginForm.vue` |
| 测试文件 | `modules/auth/__tests__/LoginForm.test.ts` |

**TDD 步骤**：
1. RED：编写组件测试 — 表单渲染、按钮 loading、成功跳转、失败提示
2. GREEN：实现模板 + 逻辑
3. REFACTOR：调用 `frontend-design` 优化视觉品质

---

### T-105：路由守卫 + 角色权限

| 属性 | 值 |
|------|-----|
| 覆盖 AC | AC-005, AC-006 |
| 修改文件 | `router/index.ts` |

**TDD 步骤**：
1. RED：编写守卫测试 — 未登录跳转 /login、已登录放行、角色拦截
2. GREEN：实现 beforeEach 守卫
3. REFACTOR：提取守卫为独立函数

---

### T-106：集成验证

| 属性 | 值 |
|------|-----|
| 覆盖 AC | 全部 AC-001 ~ AC-007 |

**验证清单**：
- [ ] `pnpm type-check` 零错误
- [ ] `pnpm lint` 零警告
- [ ] `pnpm test` 全部通过
- [ ] 手动验证：`pnpm dev:server` 启动后端，`pnpm dev` 启动前端 → 访问首页 → 自动跳转登录页 → 登录成功 → 刷新保持登录 → 登出清除状态

---

## 四、检查点

| 检查点 | 位置 | 验证命令 |
|--------|------|----------|
| T-101 完成 | 后端 JWT 可用 | `cd apps/server && pytest tests/test_security.py -v` |
| T-102 完成 | 登录 API 可用 | `cd apps/server && pytest tests/test_auth_api.py -v` |
| T-103 完成 | 前端 Store 可用 | `cd apps/frontend && pnpm test modules/auth/` |
| T-104 完成 | 登录页面可用 | `cd apps/frontend && pnpm test modules/auth/` |
| T-105 完成 | 路由守卫生效 | `cd apps/frontend && pnpm test` |
| T-106 完成 | 全链路通过 | `pnpm type-check && pnpm lint && pnpm test` |

---

## 五、风险与注意事项

1. **python-jose 依赖**：需确认 `python-jose[cryptography]` 在 Windows 下正常安装
2. **bcrypt 兼容性**：passlib 的 bcrypt 后端可能需要 `bcrypt` 包
3. **测试数据库隔离**：API 集成测试需要使用独立测试数据库，避免污染开发数据
4. **Pinia 测试**：`@vue/test-utils` + `jsdom` 已安装，Store 测试需要 `setActivePinia`
