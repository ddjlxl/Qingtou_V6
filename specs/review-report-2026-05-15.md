# V6 项目全面审查报告

> **审查日期**：2026-05-15  
> **审查依据**：comprehensive-review-plan.md v1.2  
> **审查范围**：前端 69 文件 + 后端 42 文件 = 111 文件  
> **审查阶段**：M1 MVP Phase 1.3 核心业务（auth ✅ / fleet ✅ / dispatch 📐）

---

## 一、前置条件验证

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Node.js | ✅ | v24.13.0 (≥ 18.0) |
| Python | ✅ | 3.11.9 (≥ 3.10) |
| pnpm | ✅ | 10.33.3 |
| 测试 (268 tests) | ✅ | 全部通过 |
| ESLint | ✅ | 无错误 |
| type-check | ❌ | VehicleFormDialog.test.ts 有类型错误 |
| .env 配置 | ⚠️ | JWT_SECRET 使用默认值 |

---

## 二、代码质量审查

### ✅ 通过项

| 检查项 | 结果 |
|--------|------|
| `any` 类型 | **0 处** — 前端源码无 `any` |
| `console.log` 遗留 | **0 处** — 仅 logger.ts 中有合法使用 |
| `debugger` 语句 | **0 处** |
| `@ts-ignore` / `@ts-expect-error` | **0 处** |
| `Math.random()` 在 computed 中 | **0 处** |
| Store 混入 Mock 数据 | **0 处** |
| `print()` 后端调试代码 | **0 处** |
| TODO/FIXME/HACK | **0 处** |
| v-html XSS 风险 | **0 处** |

### ❌ 问题项

| 问题 | 严重度 | 文件 | 行数 | 说明 |
|------|--------|------|------|------|
| 文件超 300 行 | 🔴 高 | `apps/frontend/src/modules/dispatch/components/OrderFormDialog.vue` | **561** | 超过限制 87%，需拆分 |
| 文件超 300 行 | 🔴 高 | `apps/frontend/src/modules/fleet/stores/useFleetStore.ts` | **386** | 超过限制 29% |
| 文件超 300 行 | 🔴 高 | `apps/frontend/src/modules/fleet/components/TransportRecordManagement.vue` | **367** | 超过限制 22% |
| 文件超 300 行 | 🔴 高 | `apps/frontend/src/modules/dispatch/components/OrderTable.vue` | **358** | 超过限制 19% |
| 文件超 300 行 | 🟡 中 | `apps/server/app/services/dispatch_service.py` | **419** | 超过限制 40% |
| type-check 失败 | 🟡 中 | `apps/frontend/src/modules/fleet/__tests__/VehicleFormDialog.test.ts` | — | 测试访问组件内部属性导致 TS2339 错误 |

---

## 三、安全审查

### ✅ 通过项

| 检查项 | 结果 |
|--------|------|
| JWT 算法 | HS256 ✅ |
| 密码加密 | bcrypt (passlib) ✅ |
| Token 过期 | 24 小时 ✅ |
| 路由守卫 | 已实现，含角色检查 ✅ |
| API 认证 | 所有 39 个端点均使用 `Depends(get_current_user)` ✅ |
| SQL 注入防护 | SQLAlchemy ORM 参数化查询 ✅ |
| XSS 防护 | 无 `v-html` 使用 ✅ |
| 异常处理 | 不泄露系统细节 ✅ |

### ❌ 问题项

| 问题 | 严重度 | 位置 | 说明 |
|------|--------|------|------|
| 无登录失败限制 | 🔴 高 | `apps/server/app/services/auth_service.py` | 无暴力破解防护，攻击者可无限尝试密码 |
| 后端无角色权限检查 | 🔴 高 | `apps/server/app/api/v1/fleet_*.py` 等 | 所有 API 只验证登录，不验证角色。前端路由有角色检查但后端没有，可被绕过 |
| JWT_SECRET 默认值 | 🟡 中 | `apps/server/app/core/config.py` / `.env` | 使用 `change-me-in-production`，生产部署前必须修改 |

---

## 四、测试覆盖审查

### 前端测试

| 指标 | 数值 |
|------|------|
| 测试文件 | 33 个 |
| 测试用例 | **268 个** |
| 通过率 | **100%** |
| 覆盖率工具 | ❌ 未安装 `@vitest/coverage-v8` |

### 后端测试

| 指标 | 数值 |
|------|------|
| 测试用例 | **135 个** |
| 通过率 | **100%** |
| 总覆盖率 | **67%** (目标 ≥ 80%) |

**覆盖率盲区**（低于 50%）：

| 模块 | 覆盖率 | 风险 |
|------|--------|------|
| `apps/server/app/services/dispatch_service.py` | **20%** | 🔴 核心业务逻辑几乎无测试 |
| `apps/server/app/api/v1/fleet_drivers.py` | **37%** | 🟡 API 层测试不足 |
| `apps/server/app/api/v1/fleet_vehicles.py` | **41%** | 🟡 API 层测试不足 |
| `apps/server/app/services/auth_service.py` | **42%** | 🟡 认证服务测试不足 |
| `apps/server/app/api/v1/fleet_certificates.py` | **45%** | 🟡 API 层测试不足 |
| `apps/server/app/api/v1/dispatch.py` | **49%** | 🟡 API 层测试不足 |

---

## 五、文档一致性审查

| 问题 | 严重度 | 说明 |
|------|--------|------|
| dispatch 模块状态不一致 | 🟡 中 | 审查计划标注 dispatch 为"技术设计完成，待任务规划"，路线图标注为未完成。但实际代码已存在：前端 9 个文件、后端 3 个文件，且前端有 9 个测试通过 |

---

## 六、依赖安全审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| npm audit | ⚠️ 不可用 | 使用 npmmirror.com 镜像，不支持 audit |
| pip-audit | ⚠️ 未安装 | 工具未安装，无法检查 |

---

## 七、审查总结

### 退出条件验证

| 退出条件 | 状态 |
|----------|------|
| 无 🔴 高优先级问题未修复 | ❌ 有 6 个高优先级问题 |
| 无 `any` 类型 | ✅ |
| 无 `console.log` 遗留 | ✅ |
| 所有文件 ≤ 300 行 | ❌ 5 个文件超限 |
| 无高危安全漏洞 | ❌ 缺少登录限制 + 后端角色检查 |
| 前端测试覆盖率 ≥ 80% | ⚠️ 无法验证（工具未安装） |
| 后端测试覆盖率 ≥ 80% | ❌ 67% |
| 所有测试通过 | ✅ |

### 问题汇总

| 严重度 | 数量 | 类型 |
|--------|------|------|
| 🔴 高 | **6** | 文件超限(4) + 无登录限制(1) + 后端无角色检查(1) |
| 🟡 中 | **8** | 文件超限(1) + type-check(1) + JWT_SECRET(1) + 覆盖率不足(4) + 文档不一致(1) |
| ⚠️ 低 | **3** | npm audit 不可用 + pip-audit 未安装 + 前端覆盖率工具未安装 |

---

## 八、修复建议

### 🔴 高优先级（dispatch 开发前必须修复）

#### 1. 添加登录失败次数限制

**位置**：`apps/server/app/services/auth_service.py`

**方案**：
- 使用 Redis 或内存缓存记录失败次数
- 5 次失败后锁定账号 15 分钟
- 返回明确的错误信息（"账号已锁定，请 15 分钟后重试"）

#### 2. 后端 API 添加角色权限检查

**位置**：`apps/server/app/api/v1/auth.py`

**方案**：
```python
from functools import wraps

def require_roles(*roles: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = None, **kwargs):
            if current_user.role not in roles:
                raise AppException(code=403, message="权限不足")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# 使用示例
@router.post("/vehicles")
@require_roles("admin", "dispatcher")
async def create_vehicle(...):
    ...
```

#### 3. 拆分超限文件

| 文件 | 行数 | 拆分建议 |
|------|------|---------|
| OrderFormDialog.vue | 561 | 拆分为表单字段组件、验证逻辑、业务类型处理 |
| useFleetStore.ts | 386 | 按子模块拆分为 vehicleStore、driverStore、certificateStore |
| TransportRecordManagement.vue | 367 | 拆分为筛选组件、表格组件、导入导出逻辑 |
| OrderTable.vue | 358 | 拆分为表格列定义、行操作、状态筛选 |

### 🟡 中优先级（M1 完成前修复）

1. **提升后端测试覆盖率**：重点补充 dispatch_service.py 测试
2. **修复 VehicleFormDialog.test.ts 类型错误**：使用 `defineComponent` 暴露测试所需的属性
3. **更新文档状态**：将 dispatch 标记为"开发中"

---

## 九、结论

**代码质量方面**表现优秀——零 `any` 类型、零调试代码遗留、零 Mock 数据污染，这在 V4 对比下是巨大进步。

**安全方面**存在 2 个高优先级漏洞，必须在 dispatch 开发前修复：
1. 后端缺少登录失败限制（暴力破解风险）
2. 后端 API 缺少角色权限检查（权限绕过风险）

**测试方面**后端覆盖率 67% 低于目标，dispatch_service.py 仅 20% 覆盖率是最大风险点。

**建议**：先修复 2 个安全漏洞，再继续 dispatch 模块开发。文件拆分可以在后续迭代中逐步处理。

---

*审查完成时间：2026-05-15 21:50*
