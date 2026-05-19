# 青投供应链V6

> **版本**：v6.0.0  
> **技术栈**：Vue 3 + FastAPI + PostgreSQL  
> **项目类型**：物流运输调度管理系统  
> **创建日期**：2026-04-30  

---

## 📋 项目简介

青投供应链V6是一个现代化的物流运输调度管理系统，基于V4项目经验重构，旨在提供更稳定、更易维护的物流管理解决方案。

### 核心功能
- 🚚 运输任务调度管理
- 👨‍💼 司机和车辆资源管理  
- 🏭 仓库库存管理
- 📊 运营数据统计分析
- 🔐 多角色权限控制

---

## 🛠️ 技术栈

### 前端技术
- **框架**：Vue 3 + Composition API
- **UI组件**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router
- **构建工具**：Vite
- **样式**：scoped CSS
- **语言**：TypeScript

### 后端技术
- **框架**：FastAPI
- **数据库**：PostgreSQL
- **ORM**：SQLAlchemy
- **数据校验**：Pydantic V2
- **认证**：JWT Token

### 开发工具
- **包管理**：pnpm
- **代码检查**：ESLint + Prettier
- **测试框架**：Vitest（前端） + pytest（后端）

---

## 📁 项目结构

```
Qingtou_V6/
├── docs/                    # 项目文档
│   ├── V6需求文档.md        # 功能需求说明
│   └── V6开发规则.md        # 开发规范
├── apps/                    # 应用代码
│   ├── frontend/           # 前端应用（Vue 3 + Element Plus）
│   └── server/             # 后端 API 服务（FastAPI）
│       ├── alembic/        # 数据库迁移
│       ├── app/            # 应用代码
│       └── tests/          # 后端测试
├── specs/                  # 技术规范文档
├── docker/                 # Docker 配置
│   └── init-db.sql         # 数据库初始化脚本
├── docker-compose.yml      # 本地 PostgreSQL 一键启动
├── .trae/                  # AI 开发工具配置
└── README.md               # 项目说明
```

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+（或 Docker Desktop）
- pnpm 9+

### 方式一：Docker 启动 PostgreSQL（推荐）

```bash
# 1. 启动 PostgreSQL（自动创建 qingtou_v6 和 qingtou_v6_test 库）
docker compose up -d

# 2. 安装后端依赖 + 运行数据库迁移
cd apps/server
pip install -r requirements.txt
alembic upgrade head

# 3. 验证：运行测试
pytest
```

### 方式二：手动安装 PostgreSQL

```bash
# 1. 手动创建数据库
createdb -U postgres qingtou_v6
createdb -U postgres qingtou_v6_test

# 2. 配置连接信息（复制 .env.example 并修改）
cd apps/server
cp .env.example .env
# 编辑 .env 中的数据库用户名和密码
```

### 启动开发服务器

```bash
# 前端（项目根目录）
pnpm dev

# 后端（推荐，项目根目录）
pnpm dev:server

# 或手动启动后端
cd apps/server
uvicorn app.main:app --host 0.0.0.0 --port 9528 --reload

# 交互式启动脚本（双击根目录 start.bat，按菜单选择）
```

访问 http://localhost:9527 查看前端页面，http://localhost:9528/docs 查看 API 文档。

---

## 📖 开发文档

### 核心文档
- [需求文档](specs/requirements-clarification.md) - 功能需求和业务规则
- [数据库设计](specs/features/database-model/design.md) - 数据库结构和字段定义
- [开发规则](specs/development-standards.md) - 代码规范和最佳实践

### API文档
- 后端启动后访问：http://localhost:9528/docs
- OpenAPI规范，支持在线测试

---

## 🧪 测试

### 前端测试
```bash
cd apps/frontend
pnpm test           # 运行测试
pnpm test:coverage  # 生成覆盖率报告
```

### 后端测试
```bash
cd apps/server
pytest              # 运行测试
pytest --cov        # 生成覆盖率报告
```

---

## 📈 项目规划

### 第一阶段（基础框架）
- [ ] 用户认证系统
- [ ] 基础页面布局
- [ ] 数据库初始化
- [ ] API基础框架

### 第二阶段（核心功能）
- [ ] 运输任务管理
- [ ] 司机车辆管理
- [ ] 仓库库存管理
- [ ] 权限控制系统

### 第三阶段（增强功能）
- [ ] 数据统计分析
- [ ] 移动端适配
- [ ] 性能优化
- [ ] 部署配置

---

## 🔧 配置说明

### 环境变量
创建 `.env` 文件：
```bash
# 前端环境变量
VITE_API_BASE_URL=http://localhost:9528/api

# 后端环境变量
DATABASE_URL=postgresql+asyncpg://qingtou_dev:qingtou_dev_password_2026@127.0.0.1:5432/qingtou_v6
JWT_SECRET=your-secure-jwt-secret-here
```

### 数据库迁移
```bash
cd apps/server
# 初始化数据库
python -m alembic upgrade head
```

---

## 🤝 贡献指南

### 代码规范
- 遵循 [V6开发规则](docs/V6开发规则.md)
- 使用TypeScript严格模式
- 所有代码必须有测试用例
- 提交前运行代码检查

### 提交信息格式
```
类型: 描述

feat: 新增功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/配置相关
```

---

## 📞 技术支持

### 常见问题
1. **前端启动失败**：检查Node.js版本和pnpm安装
2. **后端启动失败**：检查Python版本和依赖安装
3. **数据库连接失败**：检查 PostgreSQL 服务是否启动、连接串配置是否正确

### 问题反馈
- 创建Issue描述问题
- 提供错误日志和复现步骤
- 标注环境信息

---

## 📄 许可证

本项目基于MIT许可证开源。

---

*青投供应链V6 - 让物流管理更简单*