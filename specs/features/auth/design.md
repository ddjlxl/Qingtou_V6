# auth 用户认证 — 技术设计方案

> **版本**：v1.0
> **创建日期**：2026-05-04
> **需求文档**：[requirements.md](./requirements.md)
> **设计目标**：实现 JWT 认证、登录页面、路由守卫、角色权限控制

---

## 一、现有代码分析

- **涉及模块**：`apps/server/app/core/`、`apps/frontend/src/router/`、`apps/frontend/src/modules/auth/`
- **可复用**：users 表已存在（含 username/password/role/status 字段）
- **影响范围**：所有后续业务模块依赖 auth 的登录态和权限判断

---

## 二、目录结构

```
apps/server/app/
├── api/v1/
│   ├── __init__.py
│   └── auth.py                  # 新增：登录/获取用户 API
├── core/
│   ├── __init__.py
│   ├── config.py                # 已有，需新增 JWT_SECRET 配置
│   ├── database.py              # 已有
│   ├── security.py              # 新增：JWT 生成/验证 + 密码哈希
│   ├── logger.py                # shared 模块产出
│   └── exceptions.py            # shared 模块产出
├── schemas/
│   └── auth.py                  # 新增：请求/响应 Pydantic 模型
├── services/
│   └── auth_service.py          # 新增：登录业务逻辑
└── main.py                      # 已有，需注册 auth 路由

apps/frontend/src/
├── modules/
│   └── auth/
│       ├── components/
│       │   └── LoginForm.vue    # 新增：登录表单组件
│       ├── stores/
│       │   └── useAuthStore.ts  # 新增：认证状态管理
│       ├── services/
│       │   └── authService.ts   # 新增：登录 API 调用
│       ├── types/
│       │   └── index.ts         # 新增：前端认证类型
│       ├── index.ts             # 新增：模块导出入口
│       └── __tests__/
│           ├── LoginForm.test.ts
│           └── useAuthStore.test.ts
├── router/
│   └── index.ts                 # 已有，需新增路由守卫 + /login 路由
└── shared/                      # shared 模块产出
    └── index.ts
```

---

## 三、后端设计

### 3.1 JWT 安全模块（`core/security.py`）

```python
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str, expires_hours: int = 24) -> str:
    expire = datetime.utcnow() + timedelta(hours=expires_hours)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
```

→ AC-001: 密码 bcrypt 哈希/验证
→ AC-001: JWT 24 小时有效期

### 3.2 配置扩展（`core/config.py`）

```python
class Settings(BaseSettings):
    # ... 已有配置 ...
    JWT_SECRET: str = "change-me-in-production"
```

### 3.3 Pydantic Schema（`schemas/auth.py`）

```python
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class UserInfo(BaseModel):
    id: str
    username: str
    name: str
    role: str

class LoginResponse(BaseModel):
    token: str
    user: UserInfo
```

### 3.4 认证服务（`services/auth_service.py`）

```python
from app.core.security import verify_password, create_token
from app.core.exceptions import AppException
from app.models.user import User

class AuthService:
    @staticmethod
    def login(db, username: str, password: str) -> dict:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise AppException(code=401, message="用户名或密码错误")
        if user.status == "disabled":
            raise AppException(code=403, message="账号已被禁用")
        if not verify_password(password, user.password):
            raise AppException(code=401, message="用户名或密码错误")

        user.last_login_at = datetime.utcnow()
        db.commit()

        token = create_token(str(user.id))
        return {
            "token": token,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "name": user.name,
                "role": user.role,
            }
        }
```

### 3.5 API 路由（`api/v1/auth.py`）

```python
from fastapi import APIRouter, Depends
from app.schemas.auth import LoginRequest
from app.services.auth_service import AuthService
from app.core.database import get_db

router = APIRouter(prefix="/auth", tags=["认证"])

@router.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    result = AuthService.login(db, req.username, req.password)
    return {"code": 200, "message": "登录成功", "data": result}

@router.get("/me")
def get_current_user(user=Depends(get_current_user)):
    return {"code": 200, "data": user}
```

### 3.6 Token 依赖注入

```python
# core/security.py 中追加
from fastapi import Header, Depends
from app.core.exceptions import AppException

def get_current_user(authorization: str = Header(...), db=Depends(get_db)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise AppException(code=401, message="用户不存在")
        return user
    except jwt.ExpiredSignatureError:
        raise AppException(code=401, message="Token 已过期")
    except Exception:
        raise AppException(code=401, message="认证失败")
```

---

## 四、前端设计

### 4.1 认证 Store（`stores/useAuthStore.ts`）

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/authService'
import type { UserInfo } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')

  async function login(username: string, password: string) {
    const res = await authService.login(username, password)
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isLoggedIn, userRole, login, logout }
})
```

→ AC-004: Token 存入 localStorage + Pinia Store

### 4.2 登录 API 服务（`services/authService.ts`）

```typescript
import { http } from '@/shared'
import type { ApiResponse } from '@qingtou/shared-types'
import type { LoginResult } from '../types'

export const authService = {
  login(username: string, password: string) {
    return http.post<ApiResponse<LoginResult>>('/api/v1/auth/login', { username, password })
  },
  getMe() {
    return http.get<ApiResponse<LoginResult['user']>>('/api/v1/auth/me')
  },
}
```

### 4.3 路由守卫（`router/index.ts` 扩展）

```typescript
import { useAuthStore } from '@/modules/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/modules/auth/components/LoginForm.vue'),
      meta: { guest: true },
    },
    // 业务路由后续添加...
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.guest && authStore.isLoggedIn) {
    return next('/')
  }

  if (!to.meta.guest && !authStore.isLoggedIn) {
    return next('/login')
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    return next('/')
  }

  next()
})
```

→ AC-005: 路由守卫拦截未登录
→ AC-006: 角色权限路由拦截

### 4.4 登录页面组件（`components/LoginForm.vue`）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/useAuthStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(form.value.username, form.value.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
```

→ AC-003: 登录页面含 loading 状态和错误提示

---

## 五、类型定义

### 前端类型（`modules/auth/types/index.ts`）

```typescript
export interface UserInfo {
  id: string
  username: string
  name: string
  role: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}
```

---

## 六、依赖关系

```
shared-types（已有）
    ↓
shared 公共模块（T-001~T-005）
    ↓
auth 用户认证（本次）
    ├── 后端：security.py → auth_service.py → auth.py (API)
    └── 前端：authService.ts → useAuthStore.ts → LoginForm.vue → router
```

---

## 七、AC 覆盖矩阵

| AC | 后端文件 | 前端文件 |
|----|---------|---------|
| AC-001 登录 API | `api/v1/auth.py`, `services/auth_service.py`, `core/security.py` | - |
| AC-002 获取用户 API | `api/v1/auth.py`, `core/security.py` (get_current_user) | - |
| AC-003 登录页面 | - | `LoginForm.vue` |
| AC-004 Token 存储 | - | `useAuthStore.ts` |
| AC-005 路由守卫 | - | `router/index.ts` |
| AC-006 角色权限 | - | `router/index.ts` (meta.roles) |
| AC-007 登出 | - | `useAuthStore.ts` |
