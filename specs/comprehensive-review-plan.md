# V6 项目全面审查计划

> **版本**：v1.2（精简版）  
> **创建日期**：2026-05-15  
> **更新日期**：2026-05-15  
> **执行阶段**：M1 MVP Phase 1.3 核心业务（auth ✅ / fleet ✅ / dispatch 📐）  
> **审查目标**：确保代码质量、架构一致性、安全性和可维护性

**v1.2 更新内容**（精简版）：
- ✅ 精简审查维度（9 个 → 6 个核心维度，3 个延后到 M2）
- ✅ 精简检查项（225 个 → 44 个核心检查项，-80%）
- ✅ 精简审查时间（4 小时 → 2 小时，-50%）
- ✅ 简化审查报告模板（只保留核心字段）
- ✅ 简化问题追踪机制（15 个标签 → 5 个标签）
- ✅ 删除过度工程化内容（审查历史记录、周报、统计报表）
- ✅ 明确 M1 和 M2 审查范围分离

---

## 一、审查背景

### 1.1 项目当前状态

**里程碑进度**：
- ✅ Phase 1.1：项目骨架
- ✅ Phase 1.2：基础设施（数据库模型 + shared 公共模块）
- ✅ Phase 1.3：核心业务
  - ✅ auth 用户认证（102 tests）
  - ✅ fleet 车队管理（前端 243 tests + 后端 124 tests）
  - 📐 dispatch 调度中心（技术设计完成，待任务规划）

**代码规模**：
- 前端：243 个测试用例
- 后端：124 个测试用例
- 数据库：11 张表
- 模块：auth + fleet（2 个核心业务模块）

### 1.2 V4 教训回顾

| 问题类型 | V4 后果 | V6 预防措施 |
|---------|---------|-----------|
| 257 处 `any` 类型 | 运行时错误、重构困难 | 类型安全审查 |
| 92 处 `console.log` 遗留 | 生产环境泄露信息 | 调试代码扫描 |
| 665 行大文件 | 维护困难、不敢改 | 文件大小限制 ≤ 300 行 |
| Store 混入 Mock 数据 | 开发/生产行为不一致 | 环境分离审查 |
| 设计文档引用不存在的组件 | 任务规划基于错误假设 | 审计现有代码 |

### 1.3 审查目标

1. **代码质量**：确保符合 TypeScript 严格模式、无调试代码遗留
2. **架构一致性**：确保设计文档与实际代码一致
3. **安全性**：确保认证、权限、数据验证无漏洞
4. **可维护性**：确保测试覆盖、文档完整、代码规范

### 1.4 审查范围

**前端文件**（69 个 TypeScript/Vue 文件）：

**auth 模块**（7 个文件）：
- [stores/useAuthStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/stores/useAuthStore.ts)
- [services/authService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/services/authService.ts)
- [types/index.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/types/index.ts)
- [components/LoginForm.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/components/LoginForm.vue)
- [__tests__/useAuthStore.test.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/__tests__/useAuthStore.test.ts)
- [__tests__/LoginForm.test.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/__tests__/LoginForm.test.ts)
- [index.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/auth/index.ts)

**fleet 模块**（39 个文件）：
- **Store**：[stores/useFleetStore.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/stores/useFleetStore.ts)
- **Service**：[services/fleetService.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/services/fleetService.ts)
- **Types**：[types/vehicle.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/vehicle.ts)、[types/driver.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/driver.ts)、[types/certificate.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/certificate.ts)、[types/transport-record.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/transport-record.ts)、[types/statistics.ts](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/types/statistics.ts)
- **Components**：[components/VehicleManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/VehicleManagement.vue)、[components/VehicleFormDialog.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/VehicleFormDialog.vue)、[components/DriverManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/DriverManagement.vue)、[components/DriverFormDialog.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/DriverFormDialog.vue)、[components/CertificateManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/CertificateManagement.vue)、[components/CertificateFormDialog.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/CertificateFormDialog.vue)、[components/TransportRecordManagement.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/TransportRecordManagement.vue)、[components/StatisticsTab.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/StatisticsTab.vue)、[components/StatusTag.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/components/StatusTag.vue)、[pages/FleetPage.vue](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/pages/FleetPage.vue)
- **Tests**：[__tests__/](file:///e:/Qingtou_V6/apps/frontend/src/modules/fleet/__tests__/)（17 个测试文件）

**shared 模块**（21 个文件）：
- [api/client.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/api/client.ts)
- [utils/format.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/format.ts)、[utils/validate.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/validate.ts)、[utils/permission.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/permission.ts)、[utils/logger.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/logger.ts)、[utils/typeGuards.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/utils/typeGuards.ts)
- [components/EmptyState.vue](file:///e:/Qingtou_V6/apps/frontend/src/shared/components/EmptyState.vue)、[components/LoadingSpinner.vue](file:///e:/Qingtou_V6/apps/frontend/src/shared/components/LoadingSpinner.vue)
- [index.ts](file:///e:/Qingtou_V6/apps/frontend/src/shared/index.ts)

**router**（2 个文件）：
- [router/index.ts](file:///e:/Qingtou_V6/apps/frontend/src/router/index.ts)
- [router/__tests__/guard.test.ts](file:///e:/Qingtou_V6/apps/frontend/src/router/__tests__/guard.test.ts)

**后端文件**（42 个 Python 文件）：

**auth 模块**（5 个文件）：
- [api/v1/auth.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/auth.py)
- [services/auth_service.py](file:///e:/Qingtou_V6/apps/server/app/services/auth_service.py)
- [core/security.py](file:///e:/Qingtou_V6/apps/server/app/core/security.py)
- [schemas/auth.py](file:///e:/Qingtou_V6/apps/server/app/schemas/auth.py)
- [models/user.py](file:///e:/Qingtou_V6/apps/server/app/models/user.py)

**fleet 模块**（15 个文件）：
- **API**：[api/v1/fleet_vehicles.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_vehicles.py)、[api/v1/fleet_drivers.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_drivers.py)、[api/v1/fleet_certificates.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_certificates.py)、[api/v1/fleet_transport_records.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_transport_records.py)、[api/v1/fleet_statistics.py](file:///e:/Qingtou_V6/apps/server/app/api/v1/fleet_statistics.py)
- **Service**：[services/fleet_service.py](file:///e:/Qingtou_V6/apps/server/app/services/fleet_service.py)
- **Schema**：[schemas/fleet.py](file:///e:/Qingtou_V6/apps/server/app/schemas/fleet.py)
- **Models**：[models/vehicle.py](file:///e:/Qingtou_V6/apps/server/app/models/vehicle.py)、[models/driver.py](file:///e:/Qingtou_V6/apps/server/app/models/driver.py)、[models/certificate.py](file:///e:/Qingtou_V6/apps/server/app/models/certificate.py)、[models/transport_record.py](file:///e:/Qingtou_V6/apps/server/app/models/transport_record.py)
- **Validators**：[core/validators/fleet_validator.py](file:///e:/Qingtou_V6/apps/server/app/core/validators/fleet_validator.py)

**core 模块**（7 个文件）：
- [core/database.py](file:///e:/Qingtou_V6/apps/server/app/core/database.py)
- [core/config.py](file:///e:/Qingtou_V6/apps/server/app/core/config.py)
- [core/logger.py](file:///e:/Qingtou_V6/apps/server/app/core/logger.py)
- [core/exceptions.py](file:///e:/Qingtou_V6/apps/server/app/core/exceptions.py)
- [core/exception_handlers.py](file:///e:/Qingtou_V6/apps/server/app/core/exception_handlers.py)

**models 基础**（16 个文件）：
- [models/order.py](file:///e:/Qingtou_V6/apps/server/app/models/order.py)、[models/warehouse.py](file:///e:/Qingtou_V6/apps/server/app/models/warehouse.py)、[models/storage_slot.py](file:///e:/Qingtou_V6/apps/server/app/models/storage_slot.py)、[models/common_address.py](file:///e:/Qingtou_V6/apps/server/app/models/common_address.py)、[models/operation_log.py](file:///e:/Qingtou_V6/apps/server/app/models/operation_log.py)、[models/system_config.py](file:///e:/Qingtou_V6/apps/server/app/models/system_config.py)、[models/help_article.py](file:///e:/Qingtou_V6/apps/server/app/models/help_article.py)、[models/business_type_route.py](file:///e:/Qingtou_V6/apps/server/app/models/business_type_route.py)、[models/dispatch_address.py](file:///e:/Qingtou_V6/apps/server/app/models/dispatch_address.py)

**总计**：111 个文件（前端 69 + 后端 42）

---

## 二、审查维度

### 2.1 维度总览

**M1 核心审查维度**（立即执行）：

| 维度 | 审查内容 | 优先级 | 预计时间 | 执行阶段 |
|------|---------|--------|---------|---------|
| 1. 代码质量 | TypeScript 类型安全、调试代码、文件大小 | 🔴 高 | 30 分钟 | 第一阶段 |
| 2. 熵增对抗 | 文档不一致、架构违规、死代码 | 🔴 高 | 20 分钟 | 第一阶段 |
| 3. 测试覆盖 | 覆盖率、测试盲区、边界条件 | 🟡 中 | 15 分钟 | 第一阶段 |
| 4. 文档一致性 | 设计文档 vs 实际代码 | 🟡 中 | 25 分钟 | 第二阶段 |
| 5. 安全审查 | JWT、权限、SQL 注入、XSS | 🔴 高 | 20 分钟 | 第二阶段 |
| 6. 依赖安全 | npm audit、pip audit | 🟡 中 | 10 分钟 | 第二阶段 |

**M1 总计**：约 2 小时

**M2 延后审查维度**（M1 完成后执行）：

| 维度 | 审查内容 | 优先级 | 预计时间 | 执行阶段 |
|------|---------|--------|---------|---------|
| 7. 性能优化 | 加载时间、包体积、查询效率 | 🟢 低 | 30 分钟 | M2 阶段 |
| 8. 开发规范 | 命名、风格、Git 提交 | 🟢 低 | 15 分钟 | M2 阶段 |
| 9. 前端设计 | UI 一致性、响应式、无障碍 | 🟢 低 | 20 分钟 | M2 阶段 |

**M2 总计**：约 1 小时 5 分钟

---

## 三、第一阶段：代码健康度审查

> **执行时机**：立即执行（dispatch 开发前）  
> **预计时间**：65 分钟

### 3.1 熵增对抗审查（20 分钟）

**目标**：发现文档不一致、架构违规、死代码、测试覆盖盲区

**核心检查项**：
- [ ] 设计文档中引用的组件/函数是否真实存在
- [ ] API 文档与实现是否一致
- [ ] 数据库模型与迁移脚本是否同步
- [ ] 死代码检测（未使用的导入、函数、组件）
- [ ] 测试覆盖盲区（核心业务逻辑是否有测试）

**执行方式**：
```bash
# 调用 entropy-fighter Skill
```

**产出物**：熵增对抗报告（问题列表 + 修复建议）

---

### 3.2 代码质量审查（30 分钟）

**目标**：确保代码符合 TypeScript 严格模式、无调试代码遗留

**核心检查项**：

**TypeScript 类型安全**：
- [ ] 无 `any` 类型使用（除非有充分理由 + 注释说明）
- [ ] 无 `@ts-ignore` 或 `@ts-expect-error`（除非有充分理由）
- [ ] 所有函数参数和返回值都有类型注解
- [ ] 无隐式 `any`（启用 `noImplicitAny`）

**调试代码遗留**：
- [ ] 无 `console.log`、`console.debug`、`console.warn`（生产环境）
- [ ] 无 `debugger` 语句
- [ ] 无测试用的硬编码数据

**文件大小与函数长度**：
- [ ] 所有文件 ≤ 300 行（V4 教训：dispatch.ts 665 行）
- [ ] 所有函数 ≤ 50 行
- [ ] 单个组件 ≤ 200 行（Vue SFC）

**其他代码质量**：
- [ ] computed 中无副作用（V4 教训：Math.random）
- [ ] Store 中无 Mock 数据混入（V4 教训：真实/Mock 混杂）

**检查命令**：
```bash
# 检查 any 类型
grep -r ": any" apps/frontend/src apps/server/app --include="*.ts" --include="*.vue"

# 检查 console.log
grep -r "console\." apps/frontend/src apps/server/app --include="*.ts" --include="*.vue" --include="*.py"

# 文件行数检查
find apps/frontend/src apps/server/app -name "*.ts" -o -name "*.vue" | xargs wc -l | sort -rn | head -20
```

**执行方式**：
```bash
# 调用 code-review Skill
```

**产出物**：代码质量报告（问题列表 + 修复建议）

---

### 3.3 测试覆盖审查（15 分钟）

**目标**：确保核心业务逻辑有测试覆盖

**检查项**：
- [ ] 前端测试覆盖率报告
- [ ] 后端测试覆盖率报告
- [ ] 核心业务逻辑是否有测试
- [ ] 边界条件是否覆盖
- [ ] 错误处理是否覆盖

**检查命令**：
```bash
# 前端覆盖率
cd apps/frontend && pnpm test:coverage

# 后端覆盖率
cd apps/server && pytest --cov=app --cov-report=html
```

**覆盖率目标**：
- 前端：≥ 80%
- 后端：≥ 80%
- 核心业务逻辑：100%

**执行方式**：
```bash
# 调用 testing Skill
```

**产出物**：测试覆盖率报告 + 盲区分析

---

## 四、第二阶段：架构与安全审查

> **执行时机**：dispatch 开发前  
> **预计时间**：55 分钟

### 4.1 文档一致性审查（25 分钟）

**目标**：确保设计文档与实际代码一致

**核心检查项**：
- [ ] 设计文档中引用的组件/函数是否真实存在
- [ ] API 文档与实现是否一致

**执行方式**：手动检查 + SearchCodebase 工具

**产出物**：文档一致性报告（不一致项列表）

---

### 4.2 安全审查（20 分钟）

**目标**：确保认证、权限、数据验证无漏洞

**核心检查项**：

**认证安全**：
- [ ] JWT token 过期时间合理（建议 2-24 小时）
- [ ] JWT 签名算法安全（HS256 或 RS256）
- [ ] 密码使用 bcrypt 加密（cost factor ≥ 10）
- [ ] 登录失败次数限制（防暴力破解）
- [ ] Token 刷新机制

**权限控制**：
- [ ] 路由守卫正确实现
- [ ] 角色权限检查完善
- [ ] API 级别的权限验证
- [ ] 敏感操作需要管理员权限

**数据验证**：
- [ ] SQL 注入防护（使用 ORM 参数化查询）
- [ ] XSS 防护（Vue 自动转义 + v-html 使用检查）
- [ ] CSRF 防护（如果使用 cookie）
- [ ] 输入验证（Pydantic Schema）
- [ ] 输出编码

**敏感信息保护**：
- [ ] 日志中无敏感信息（密码、token）
- [ ] 错误信息不暴露系统细节
- [ ] 配置文件中的密钥使用环境变量
- [ ] .env 文件不在 Git 中

**执行方式**：手动检查 + code-review Skill

**产出物**：安全审查报告（漏洞列表 + 修复建议）

---

### 4.3 依赖安全审查（10 分钟）

**目标**：确保依赖无已知漏洞

**核心检查项**：
- [ ] 前端依赖安全检查（`pnpm audit`）
- [ ] 后端依赖安全检查（`pip-audit`）

**检查命令**：
```bash
# 前端依赖检查
pnpm audit

# 后端依赖检查
pip-audit
```

**产出物**：依赖安全报告

---

## 五、M2 延后审查：性能与规范

> **执行时机**：M1 完成后，M2 阶段执行  
> **预计时间**：1 小时 5 分钟

### 5.1 审查维度

| 维度 | 审查内容 | 优先级 | 预计时间 |
|------|---------|--------|---------|
| 性能优化 | 加载时间、包体积、查询效率 | 🟢 低 | 30 分钟 |
| 开发规范 | 命名、风格、Git 提交 | 🟢 低 | 15 分钟 |
| 前端设计 | UI 一致性、响应式、无障碍 | 🟢 低 | 20 分钟 |

### 5.2 核心检查项

**性能优化**：
- [ ] 首页加载时间 < 3 秒
- [ ] API 响应时间 < 500ms
- [ ] 包体积 < 2MB

**开发规范**：
- [ ] ESLint 无错误
- [ ] TypeScript 严格模式通过
- [ ] 提交信息符合规范

**前端设计**：
- [ ] Element Plus 组件使用规范
- [ ] UI 一致性检查通过

### 5.3 执行方式

```bash
# 性能检查
pnpm build --analyze

# 规范检查
pnpm lint
pnpm type-check
```

**产出物**：M2 审查报告

---

## 六、执行计划

### 6.0 审查前置条件

> **重要**：在执行任何审查前，必须先验证以下前置条件。不满足前置条件可能导致审查结果不准确或审查失败。

#### 6.0.1 必须满足的前置条件

**环境检查**：
- [ ] Node.js 版本 ≥ 18.0（运行 `node -v` 验证）
- [ ] Python 版本 ≥ 3.10（运行 `python --version` 验证）
- [ ] pnpm 已安装（运行 `pnpm -v` 验证）
- [ ] 数据库已启动并可连接

**代码质量检查**：
- [ ] 所有测试通过（运行 `pnpm test` 验证）
- [ ] TypeScript 类型检查通过（运行 `pnpm type-check` 验证）
- [ ] ESLint 检查通过（运行 `pnpm lint` 验证）
- [ ] 后端类型检查通过（运行 `mypy app` 验证）

**数据库检查**：
- [ ] 数据库迁移已执行（运行 `alembic current` 验证）
- [ ] 数据库模型与迁移脚本同步

**配置检查**：
- [ ] 环境变量配置完整（检查 `.env` 文件）
- [ ] JWT_SECRET 已配置
- [ ] DATABASE_URL 已配置

#### 6.0.2 建议满足的前置条件

**文档检查**：
- [ ] 已阅读相关 specs 文档
- [ ] 已理解当前任务所属阶段
- [ ] 已阅读 V4 教训文档

**工具检查**：
- [ ] Vue DevTools 已安装（浏览器扩展）
- [ ] 数据库管理工具已安装（如 pgAdmin、DBeaver）

#### 6.0.3 前置条件验证命令

```bash
# 一键验证所有前置条件
echo "=== 环境检查 ==="
node -v
python --version
pnpm -v

echo "=== 代码质量检查 ==="
pnpm test
pnpm type-check
pnpm lint

echo "=== 数据库检查 ==="
cd apps/server
alembic current

echo "=== 配置检查 ==="
test -f .env && echo "✅ .env 文件存在" || echo "❌ .env 文件不存在"
grep -q "JWT_SECRET" .env && echo "✅ JWT_SECRET 已配置" || echo "❌ JWT_SECRET 未配置"
grep -q "DATABASE_URL" .env && echo "✅ DATABASE_URL 已配置" || echo "❌ DATABASE_URL 未配置"
```

#### 6.0.4 前置条件失败处理

| 失败项 | 处理方式 |
|--------|---------|
| 测试失败 | 先修复测试，再执行审查 |
| 类型检查失败 | 先修复类型错误，再执行审查 |
| Lint 检查失败 | 先修复 Lint 错误，再执行审查 |
| 数据库迁移未执行 | 先执行迁移，再执行审查 |
| 环境变量缺失 | 先配置环境变量，再执行审查 |

**阻塞条件**：如果任何"必须满足的前置条件"未通过，**禁止执行审查**，必须先修复问题。

---

### 6.1 审查退出条件

> **重要**：审查完成后，必须验证以下退出条件。只有满足退出条件，才能宣布审查通过。

#### 6.1.1 必须满足的退出条件

**代码质量退出条件**：
- [ ] 无 🔴 高优先级问题未修复
- [ ] 无 `any` 类型使用（除非有充分理由 + 注释说明）
- [ ] 无 `console.log`、`debugger` 遗留
- [ ] 所有文件 ≤ 300 行
- [ ] 所有函数 ≤ 50 行

**安全退出条件**：
- [ ] 无高危安全漏洞
- [ ] JWT token 过期时间合理
- [ ] 密码使用 bcrypt 加密
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 风险

**测试退出条件**：
- [ ] 前端测试覆盖率 ≥ 80%
- [ ] 后端测试覆盖率 ≥ 80%
- [ ] 核心业务逻辑测试覆盖率 100%
- [ ] 所有测试通过

**文档退出条件**：
- [ ] 设计文档与实际代码一致
- [ ] API 文档与实现一致
- [ ] 数据库模型与迁移脚本同步

#### 6.1.2 建议满足的退出条件

**性能退出条件**：
- [ ] 首页加载时间 < 3 秒
- [ ] 包体积 < 2MB
- [ ] API 响应时间 < 500ms
- [ ] 无 N+1 查询问题

**规范退出条件**：
- [ ] 无 🟡 中优先级问题
- [ ] ESLint 无错误
- [ ] TypeScript 严格模式通过
- [ ] 提交信息符合规范

**用户体验退出条件**：
- [ ] UI 一致性检查通过
- [ ] 响应式设计验证通过
- [ ] 无障碍访问检查通过

#### 6.1.3 退出条件验证清单

**第一阶段退出验证**：
```markdown
- [ ] 熵增对抗审查完成，无阻塞问题
- [ ] 代码质量审查完成，无 `any`/`console.log`
- [ ] 测试覆盖率 ≥ 80%
- [ ] 所有测试通过
```

**第二阶段退出验证**：
```markdown
- [ ] 文档一致性审查完成，无不一致项
- [ ] 安全审查完成，无高危漏洞
- [ ] 依赖安全审查完成，无已知漏洞
```

**第三阶段退出验证**：
```markdown
- [ ] 性能优化审查完成，性能指标达标
- [ ] 开发规范审查完成，无规范违规
- [ ] 前端设计审查完成，UI 一致性通过
```

#### 6.1.4 退出条件失败处理

| 失败项 | 处理方式 | 阻塞级别 |
|--------|---------|---------|
| 高优先级问题未修复 | 必须修复后才能通过 | 🔴 阻塞 |
| 安全漏洞未修复 | 必须修复后才能通过 | 🔴 阻塞 |
| 测试覆盖率不达标 | 建议补充测试 | 🟡 警告 |
| 性能指标不达标 | 建议优化，不阻塞发布 | 🟢 建议 |
| 文档不一致 | 建议更新文档 | 🟡 警告 |

**审查通过标准**：
- ✅ **通过**：所有"必须满足的退出条件"全部满足
- ⚠️ **有条件通过**：必须满足项全部满足，建议满足项有部分未满足
- ❌ **不通过**：任何一项"必须满足的退出条件"未满足

---

### 6.2 时间安排

| 阶段 | 执行时间 | 审查维度 | 预计耗时 | 缓冲时间 | 总计 |
|------|---------|---------|---------|---------|------|
| 第一阶段 | 立即执行 | 熵增对抗 + 代码质量 + 测试覆盖 | 65 分钟 | +20 分钟 | 85 分钟 |
| 第二阶段 | dispatch 开发前 | 文档一致性 + 安全审查 + 依赖安全 | 55 分钟 | +15 分钟 | 70 分钟 |
| 第三阶段 | M1 完成后 | 性能优化 + 开发规范 + 前端设计 | 65 分钟 | +20 分钟 | 85 分钟 |

**总计**：4 小时（含缓冲时间）

**时间估算说明**：
- 基础时间：108 个文件的审查工作量
- 缓冲时间：处理意外问题、深入分析、报告撰写
- 实际时间可能因问题数量而变化

### 6.3 执行顺序

```
第一阶段（立即执行）
  ├─ 1. 熵增对抗审查（20 分钟）
  ├─ 2. 代码质量审查（30 分钟）
  └─ 3. 测试覆盖审查（15 分钟）

第二阶段（dispatch 开发前）
  ├─ 4. 文档一致性审查（25 分钟）
  ├─ 5. 安全审查（20 分钟）
  └─ 6. 依赖安全审查（10 分钟）

第三阶段（M1 完成后）
  ├─ 7. 性能优化审查（30 分钟）
  ├─ 8. 开发规范审查（15 分钟）
  └─ 9. 前端设计审查（20 分钟）
```

### 6.4 责任人

- **执行者**：AI 助手（调用相关 Skills）
- **审核者**：项目负责人（审查报告确认）
- **修复者**：开发团队（根据报告修复问题）

### 6.5 审查工具

**前端工具**：
| 工具 | 用途 | 命令 |
|------|------|------|
| ESLint | 代码风格检查 | `pnpm lint` |
| TypeScript | 类型检查 | `pnpm type-check` |
| Vitest | 测试运行 + 覆盖率 | `pnpm test:coverage` |
| Vue DevTools | 组件调试 | 浏览器扩展 |

**后端工具**：
| 工具 | 用途 | 命令 |
|------|------|------|
| mypy | 类型检查 | `mypy app` |
| ruff | 代码风格检查 | `ruff check .` |
| pytest | 测试运行 + 覆盖率 | `pytest --cov=app` |
| pip-audit | 依赖安全检查 | `pip-audit` |

**通用工具**：
| 工具 | 用途 |
|------|------|
| Git | 代码历史查看、差异对比 |
| VS Code | 代码审查、问题定位 |
| GitHub | Issue 追踪、PR 审查 |
| grep/rg | 代码搜索 |

**AI Skills**：
| Skill | 用途 |
|------|------|
| `entropy-fighter` | 熵增对抗扫描 |
| `code-review` | 代码质量审查 |
| `testing` | 测试覆盖分析 |
| `performance-optimization` | 性能优化审查 |
| `frontend-design` | 前端设计审查 |

### 6.6 审查人员分工

**AI 负责**（自动化部分）：
- ✅ 自动化检查（类型、风格、测试覆盖率）
- ✅ 代码模式识别（console.log、any 类型、大文件）
- ✅ 文档一致性检查（设计文档 vs 实际代码）
- ✅ 生成审查报告
- ✅ 问题分类和优先级建议

**人工负责**（需要判断的部分）：
- ✅ 业务逻辑正确性验证
- ✅ 安全漏洞深度分析
- ✅ 用户体验评估
- ✅ 审查报告确认
- ✅ 问题修复优先级决策
- ✅ 审查范围调整

**协作流程**：
```
AI 执行自动化审查
  ↓
生成审查报告
  ↓
人工审查报告
  ↓
确认问题严重程度
  ↓
分配修复优先级
  ↓
开发团队修复
  ↓
AI 验证修复
```

### 6.7 审查报告存储

**存储位置**：
- 目录：`specs/reviews/`
- 命名规则：`YYYY-MM-DD_<stage>_<dimension>_review.md`
- 示例：
  - `2026-05-15_stage1_code-quality_review.md`
  - `2026-05-15_stage1_entropy-fighter_review.md`
  - `2026-05-15_stage2_security_review.md`

**报告索引**：
在 `specs/reviews/README.md` 中维护报告索引：
```markdown
# 审查报告索引

## 2026-05

- [2026-05-15 第一阶段代码质量审查](2026-05-15_stage1_code-quality_review.md)
- [2026-05-15 第一阶段熵增对抗审查](2026-05-15_stage1_entropy-fighter_review.md)
- [2026-05-16 第二阶段安全审查](2026-05-16_stage2_security_review.md)
```

**报告归档**：
- 每月归档一次
- 归档目录：`specs/reviews/archive/YYYY-MM/`
- 保留最近 3 个月的报告在主目录

### 6.8 审查频率

**定期审查**：
| 频率 | 审查维度 | 触发条件 |
|------|---------|---------|
| 每周 | 熵增对抗扫描 | 自动触发 |
| 每个模块完成后 | 全面审查 | 手动触发 |
| 每月 | 安全审查 | 手动触发 |
| 每个里程碑前 | 全面审查 | 手动触发 |

**触发式审查**：
| 触发事件 | 审查维度 | 优先级 |
|---------|---------|--------|
| 发现 Bug | 相关模块审查 | 🔴 高 |
| 性能问题 | 性能优化审查 | 🟡 中 |
| 安全事件 | 安全审查 | 🔴 高 |
| 用户投诉 | 相关功能审查 | 🟡 中 |

**里程碑审查**：
| 里程碑 | 审查时机 | 审查范围 |
|--------|---------|---------|
| M1 MVP 完成前 | Phase 1.3 全部完成后 | 全面审查（9 个维度） |
| M2 完整版完成前 | Phase 2.1 全部完成后 | 全面审查（9 个维度） |
| M3 增强版完成前 | Phase 3.1 全部完成后 | 全面审查（9 个维度） |

**审查日历**：
```
每周一：熵增对抗扫描（自动）
每月 1 日：安全审查（手动）
每个模块完成后：全面审查（手动）
每个里程碑前：全面审查（手动）
```

### 6.9 审查结果追踪机制

> **重要**：审查发现的问题必须追踪到底，确保所有问题都得到处理。

#### 6.9.1 问题追踪流程

```
审查发现问题
    ↓
创建 GitHub Issue
    ↓
添加标签和优先级
    ↓
修复问题
    ↓
验证修复
    ↓
关闭 Issue
```

#### 6.9.2 简化标签体系

**优先级标签**：
- `P0-critical`：🔴 阻塞发布，必须立即修复
- `P1-high`：🔴 高优先级，本周内修复
- `P2-medium`：🟡 中优先级，两周内修复

**状态标签**：
- `status:open`：待处理
- `status:closed`：已关闭

#### 6.9.3 GitHub Issue 模板

```markdown
## 问题描述

**严重程度**：🔴 高 / 🟡 中 / 🟢 低
**影响范围**：<模块名>

## 问题详情

<详细描述问题>

## 修复建议

<修复建议>
```

**说明**：
- 只保留核心字段：问题描述、严重程度、修复建议
- 使用简化的标签体系（3 个优先级 + 2 个状态）
- 不需要复杂的看板配置和统计报表

---

## 七、审查报告模板

### 7.1 简化审查报告模板

```markdown
# 审查报告 - YYYY-MM-DD

**审查阶段**：第 X 阶段
**审查维度**：代码质量 / 安全审查 / 测试覆盖
**审查范围**：auth + fleet 模块

## 问题列表

| 文件 | 问题 | 严重程度 | 修复建议 |
|------|------|---------|---------|
| ... | ... | 🔴 高 / 🟡 中 / 🟢 低 | ... |

## 总结

- 发现问题：X 个
- 高优先级：X 个
- 中优先级：X 个
- 低优先级：X 个

## 修复优先级

1. [高] ...
2. [中] ...
3. [低] ...
```

**说明**：
- 只保留核心字段：问题描述、严重程度、修复建议
- 其他信息可选填写
- 报告存储在 `specs/reviews/` 目录

## 总结

- 发现漏洞：X 个
- 高危：X 个
- 中危：X 个
- 低危：X 个

## 修复优先级

1. [高危] ...
2. [高危] ...
3. [中危] ...
```

---

## 八、审查结果处理

### 8.1 问题分类

| 严重程度 | 定义 | 处理时限 |
|---------|------|---------|
| 🔴 高 | 会导致 Bug、安全漏洞、数据不一致 | 立即修复 |
| 🟡 中 | 影响可维护性、性能、用户体验 | 1 周内修复 |
| 🟢 低 | 代码风格、文档完善 | 可延后处理 |

### 8.2 修复流程

```
发现问题 → 记录到报告 → 评估严重程度 → 分配修复优先级 → 执行修复 → 验证修复 → 关闭问题
```

### 8.3 审查三道筛子

根据 [ai-constraints.md](../.trae/rules/ai-constraints.md) 1.9，每个问题在报告前过三道筛子：

| 筛子 | 问题 | 通过条件 |
|------|------|---------|
| 第一道 | 会导致 Bug 或数据不一致吗？ | 是 → 报告 |
| 第二道 | 会导致线上故障（崩溃/白屏/安全漏洞）吗？ | 是 → 报告 |
| 第三道 | 不修复的话，三个月后的开发者会骂吗？ | 是 → 报告 |

**三道都不过 → 闭嘴，不报告。**

### 8.4 审查失败处理

**阻塞条件**（发现以下问题立即停止开发）：
- 🔴 发现安全漏洞（SQL 注入、XSS、认证绕过等）
- 🔴 发现数据一致性问题（数据丢失、数据错误）
- 🔴 发现会导致系统崩溃的问题
- 🔴 测试覆盖率 < 60%
- 🔴 发现超过 10 个高严重程度问题

**处理流程**：
```
发现阻塞问题
  ↓
立即停止当前开发工作
  ↓
创建 GitHub Issue 追踪（标签：review:blocker）
  ↓
分配修复责任人 + 截止时间
  ↓
修复问题
  ↓
重新审查
  ↓
通过审查 → 继续开发
```

**通知机制**：
- 阻塞问题：立即通知项目负责人
- 高严重问题：当日通知
- 中严重问题：周报通知

---

## 九、关联文档

| 文档 | 定位 | 关系 |
|------|------|------|
| [ai-constraints.md](../.trae/rules/ai-constraints.md) | V4 教训 + 开发约束 | 审查依据 |
| [development-standards.md](development-standards.md) | 详细开发规范 | 审查标准 |
| [guardrails.md](../.trae/rules/guardrails.md) | 阶段边界定义 | 流程控制 |
| [PROGRESS.md](../PROGRESS.md) | 开发进度 | 审查范围 |
| [development-roadmap.md](development-roadmap.md) | 开发路线图 | 审查时机 |

---

*本审查计划基于 V4 项目的深刻教训制定，旨在确保 V6 项目的代码质量和可维护性。*
