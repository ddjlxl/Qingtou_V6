# 青投供应链V6

> **版本**：v6.0.0  
> **技术栈**：Vue 3 + FastAPI + SQLite  
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
- **样式**：Tailwind CSS
- **语言**：TypeScript

### 后端技术
- **框架**：FastAPI
- **数据库**：SQLite（开发） / PostgreSQL（生产）
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
│   ├── V6数据库设计.md      # 数据库结构设计
│   └── V6开发规则.md        # 开发规范
├── apps/                    # 应用代码
│   ├── frontend/           # 前端应用（待创建）
│   └── server/             # 后端API服务（待创建）
├── .trae/                  # AI开发工具配置
│   └── rules/              # 项目规则
└── README.md               # 项目说明
```

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.10+
- pnpm 8+

### 开发准备
1. **克隆项目**（待创建Git仓库后）
2. **安装依赖**：
   ```bash
   # 前端依赖
   cd apps/frontend
   pnpm install
   
   # 后端依赖
   cd apps/server
   pip install -r requirements.txt
   ```

3. **启动开发服务器**：
   ```bash
   # 启动前端
   cd apps/frontend
   pnpm dev
   
   # 启动后端
   cd apps/server
   python -m uvicorn src.main:app --reload
   ```

---

## 📖 开发文档

### 核心文档
- [需求文档](docs/V6需求文档.md) - 功能需求和业务规则
- [数据库设计](docs/V6数据库设计.md) - 数据库结构和字段定义
- [开发规则](docs/V6开发规则.md) - 代码规范和最佳实践

### API文档
- 后端启动后访问：http://localhost:8000/docs
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
VITE_API_BASE_URL=http://localhost:8000/api

# 后端环境变量
DATABASE_URL=sqlite:///./qingtou_v6.db
JWT_SECRET=your-secret-key
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
3. **数据库连接失败**：检查数据库文件权限

### 问题反馈
- 创建Issue描述问题
- 提供错误日志和复现步骤
- 标注环境信息

---

## 📄 许可证

本项目基于MIT许可证开源。

---

*青投供应链V6 - 让物流管理更简单*