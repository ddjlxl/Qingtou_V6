# 技术栈选型

> **版本**：v1.2  
> **创建日期**：2026-05-03  
> **更新日期**：2026-05-17  
> **来源**：基于产品概述的技术选型决策，经过度工程化审查后精简  

---

## 一、需求分析摘要

- **项目类型**：Web 应用（调度端 + 司机端），移动端响应式适配
- **预估用户量**：调度员 2 人，司机 5 人，管理员 1 人（外协车辆高峰期临时增加）
- **实时性要求**：中（地图车辆定位 30 秒刷新，消息通知即时提示）
- **开发周期**：正常（质量优先，不赶工期）
- **团队背景**：熟悉 Vue 3 + FastAPI 生态，V4 已验证技术路线可行

---

## 二、推荐方案

### 前端（调度端）

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| Vue | 3.5 | 前端框架 | V4 已验证，Composition API 逻辑复用清晰，生态成熟 |
| Vite | 6 | 构建工具 | 开发服务器秒启动，原生 TS 支持，内置 proxy 无需 Express |
| TypeScript | 5.8 | 类型系统 | strict 模式，零容忍 `any`，编译期拦截类型错误 |
| Pinia | 3 | 状态管理 | Vue 3 官方推荐，API 简洁，支持 Composition API 风格 |
| Vue Router | 4 | 路由 | 标配，懒加载页面，路由守卫做权限控制 |
| Element Plus | 2 | UI 组件库 | 表格/表单/弹窗/标签页全套，专为后台系统设计 |
| Axios | 1 | HTTP 客户端 | 拦截器统一处理 token/错误，取消重复请求 |
| Leaflet | 1.9 | 地图引擎 | 轻量开源（42KB），天地图兼容好，V4 已验证；5 台车直接用原生 API，无需 Vue 封装层 |
| dayjs | 1 | 日期处理 | 2KB 轻量，API 和 moment.js 兼容，链式调用友好 |
| xlsx | 0.18 | Excel 读写 | 批量导出任务列表为 Excel，V4 已验证 |

### 前端（司机端）

> **v1.3 更新**（2026-05-19）：司机端与调度端共享 JWT 认证体系和 API，取消独立原生页面方案，改为复用 Vue 3 架构的独立路由模块。

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| Vue 3 + TypeScript + Pinia | 同调度端 | 独立路由模块 | 复用 authStore 及 Axios 拦截器（JWT 认证零成本），复用 Element Plus 组件保持 UI 一致，共享类型定义避免字段拼写错误 |

### 后端

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|---------|
| FastAPI | 0.115+ | Web 框架 | 异步支持好，自动生成 OpenAPI 文档，Pydantic 集成，V4 已验证 |
| Python | 3.11+ | 运行环境 | 稳定 LTS，FastAPI 最佳支持版本 |
| SQLAlchemy | 2 | ORM | 成熟稳定，异步支持，迁移到不同数据库只需改连接串 |
| Alembic | 1.13 | 数据库迁移 | 版本化管理表结构，回滚/升级可控 |
| Pydantic | 2 | 数据校验 | FastAPI 内置，请求/响应自动校验，类型安全 |
| python-jose | 3 | JWT 认证 | 无状态 token 认证，不需要服务端 session |
| bcrypt | 4 | 密码哈希 | 安全标配，自动加盐，抗彩虹表 |
| uvicorn | 0.30 | ASGI 服务器 | FastAPI 官方推荐，支持热重载开发 |

### 数据库

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| PostgreSQL | 生产数据库 | 行级锁支持 2 名调度同时派单；MVCC 并发性能稳定；WAL 归档支持时间点恢复；`pg_dump` 热备不影响业务；适合服务器部署 |
| asyncpg | PostgreSQL 异步驱动 | FastAPI 异步生态原生支持，性能优于同步驱动 |

> **决策变更**（v1.2）：V6 从 SQLite 迁移到 PostgreSQL。原因：系统需要部署在服务器上面向生产使用，SQLite 的全局写锁会导致 2 名调度同时派单时阻塞，且单文件架构无法满足服务器持久化、备份恢复、远程运维等需求。SQLAlchemy ORM 抽象层已到位，迁移改动仅 5 行代码。

### 包管理

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| pnpm | 前端包管理 | 严格禁止幽灵依赖，环境一致性好，安装速度快 2-3 倍，磁盘空间省一半 |

### 测试

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| Vitest | 单元测试 + 组件测试 | 和 Vite 无缝集成，速度快，API 兼容 Jest，只需一个测试框架 |
| @vue/test-utils | Vue 组件测试 | Vue 官方测试工具，支持 Composition API |
| jsdom | DOM 模拟 | Vitest 默认推荐，兼容性好，无需额外依赖 |

### 代码质量

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| ESLint | 代码规范检查 | 禁止 `console`、禁止 `any`、文件行数限制 |
| Prettier | 代码格式化 | 统一代码风格，保存时自动格式化 |
| vue-tsc | Vue 类型检查 | 检查 `.vue` 文件中的类型错误 |

### OCR 识别

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| Tesseract.js 或云端 OCR API | 集装箱号码识别 | 拍照识别箱号，V4 已有 OCR 服务基础，V6 继承增强 |

---

## 三、备选方案对比

### 地图方案

| | Leaflet（✅ 推荐） | 高德/百度地图 |
|---|---|---|
| 开源 | 完全开源免费 | 商业授权 |
| 体积 | 42KB | 数百 KB |
| 天地图兼容 | 原生支持 | 需适配 |
| V4 验证 | 已验证可行 | 未验证 |
| 离线部署 | 可离线 | 依赖在线 SDK |

---

## 四、关键决策记录

- **决策 1：测试框架** → 只用 Vitest → 理由：V4 同时用 Jest + Vitest 导致配置冲突，V6 统一为一个
- **决策 2：样式方案** → 只用 Element Plus + scoped CSS → 理由：V4 同时用 TailwindCSS 导致样式互相覆盖，V6 砍掉 TailwindCSS
- **决策 3：代理服务** → 用 Vite 内置 proxy → 理由：V4 引入 Express + http-proxy-middleware 做代理完全多余
- **决策 4：包管理器** → pnpm → 理由：杜绝幽灵依赖，确保环境一致性
- **决策 5：数据库** → PostgreSQL → 理由：系统需部署在服务器上面向生产，2 名调度同时派单需要行级锁，服务器部署需要备份恢复和远程运维能力
- **决策 6：依赖精简** → 砍掉 zod、@vue-leaflet、@vueuse/core、happy-dom → 理由：公司实际仅 5 台车 2 名调度员，过度工程化；TS strict + Pydantic 已覆盖类型安全，Leaflet 原生 API 足够，工具函数自写不超过 5 行

---

## 五、不选的技术及原因

| 不选的技术 | V4 是否在用 | 不选的原因 |
|-----------|------------|-----------|
| Jest | ✅ 在用 | 和 Vitest 功能重复，保留 Vitest 一个即可 |
| Express | ✅ 在用 | Vite 内置 proxy，不需要额外 HTTP 服务器 |
| http-proxy-middleware | ✅ 在用 | 同上 |
| TailwindCSS | ✅ 在用 | 和 Element Plus 样式冲突，scoped CSS 够用 |
| @google/genai | ✅ 已安装 | 未看到实际业务使用场景 |
| motion | ✅ 已安装 | Element Plus 内置过渡动画够用 |
| @tanstack/vue-virtual | ✅ 已安装 | 任务列表分页加载，不需要虚拟滚动 |
| dotenv | ✅ 已安装 | Vite 原生支持 `.env` 文件 |
| MongoDB | ❌ | 物流数据结构固定，关系型数据库更合适 |
| Nuxt | ❌ | 后台管理系统不需要 SSR/SEO |
| React / Angular | ❌ | 团队熟悉 Vue，切换成本高且无收益 |

---

## 六、关联文档

- 产品概述：[product-overview.md](product-overview.md)
- 需求澄清：[requirements-clarification.md](requirements-clarification.md)
- 下一步：[项目结构设计](project-structure.md)
