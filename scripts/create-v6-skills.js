import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_PATH = path.join(__dirname, '..');

// 创建目录
function createDirectory(dirPath) {
  const fullPath = path.join(BASE_PATH, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ 创建目录: ${dirPath}`);
  }
}

// 创建文件
function createFile(filePath, content) {
  const fullPath = path.join(BASE_PATH, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ 创建文件: ${filePath}`);
}

// 主函数
function main() {
  console.log('🚀 开始创建V6 Skills体系...\n');
  
  // 创建目录结构
  console.log('📁 创建目录结构...');
  createDirectory('.trae/skills/project-level');
  createDirectory('.trae/skills/feature-level');
  createDirectory('.trae/skills/universal');
  createDirectory('.trae/rules');
  console.log('');
  
  // 创建核心机制文件
  console.log('📄 创建核心机制文件...');
  createFile('.trae/rules/guardrails.md', getGuardrailsContent());
  createFile('.trae/rules/project-context.md', getProjectContextContent());
  console.log('');
  
  // 创建项目级Skills
  console.log('📄 创建项目级Skills...');
  createFile('.trae/skills/project-level/01-requirements-review.md', getRequirementsReviewContent());
  createFile('.trae/skills/project-level/02-database-validation.md', getDatabaseValidationContent());
  createFile('.trae/skills/project-level/03-project-init.md', getProjectInitContent());
  createFile('.trae/skills/project-level/04-dev-setup.md', getDevSetupContent());
  console.log('');
  
  // 创建功能级Skills
  console.log('📄 创建功能级Skills...');
  createFile('.trae/skills/feature-level/feature-design.md', getFeatureDesignContent());
  createFile('.trae/skills/feature-level/api-development.md', getApiDevelopmentContent());
  createFile('.trae/skills/feature-level/component-development.md', getComponentDevelopmentContent());
  createFile('.trae/skills/feature-level/state-management.md', getStateManagementContent());
  createFile('.trae/skills/feature-level/testing.md', getTestingContent());
  console.log('');
  
  // 创建通用级Skills
  console.log('📄 创建通用级Skills...');
  createFile('.trae/skills/universal/bug-fix.md', getBugFixContent());
  createFile('.trae/skills/universal/code-review.md', getCodeReviewContent());
  createFile('.trae/skills/universal/performance-optimization.md', getPerformanceOptimizationContent());
  console.log('');
  
  // 创建使用指南
  console.log('📄 创建使用指南...');
  createFile('.trae/README.md', getReadmeContent());
  console.log('');
  
  console.log('🎉 V6 Skills体系创建完成！\n');
  console.log('📊 创建统计：');
  console.log('  - 核心机制：2个文件');
  console.log('  - 项目级Skills：4个文件');
  console.log('  - 功能级Skills：5个文件');
  console.log('  - 通用级Skills：3个文件');
  console.log('  - 使用指南：1个文件');
  console.log('  - 总计：15个文件\n');
  console.log('📖 使用方法：');
  console.log('  1. 查看使用指南：.trae/README.md');
  console.log('  2. 在Trae中使用：/requirements-review 审查任务管理功能');
  console.log('  3. 开始开发！\n');
}

// ========== 核心机制内容 ==========

function getGuardrailsContent() {
  return `# V6边界守卫机制

> **版本**：v1.0  
> **用途**：强制AI在正确的阶段做正确的事  
> **作用范围**：所有Skills执行时自动加载

---

## 核心原则

AI有个本能：你问它什么，它都想帮你做。听起来是好事，但在工作流里这反而是最大的隐患。

边界守卫给每个阶段划了一条硬线：**你在这个阶段只能做这个阶段的事。**

---

## 阶段边界定义

### 需求阶段
**允许**：
- ✅ 讨论需求和业务规则
- ✅ 生成需求文档
- ✅ 确认验收标准

**禁止**：
- ❌ 写代码
- ❌ 设计数据库
- ❌ 设计API接口
- ❌ 创建文件

---

### 设计阶段
**允许**：
- ✅ 设计数据库结构
- ✅ 设计API接口
- ✅ 设计组件结构
- ✅ 设计状态管理
- ✅ 生成设计文档

**禁止**：
- ❌ 写实现代码
- ❌ 创建数据库表
- ❌ 创建组件文件

---

### 实现阶段
**允许**：
- ✅ 写代码
- ✅ 创建文件
- ✅ 修改配置
- ✅ 运行测试

**禁止**：
- ❌ 修改需求（需回到需求阶段）
- ❌ 修改设计（需回到设计阶段）

---

## 强制检查规则

### 检查时机
- 每次AI响应前
- 每次创建文件前
- 每次修改代码前

### 检查流程
\`\`\`
1. 识别当前阶段
2. 检查操作是否越界
3. 如果越界：
   - 拒绝执行
   - 提示正确阶段
   - 引导用户回到正确流程
\`\`\`

---

## 越界处理示例

### 示例1：需求阶段写代码
\`\`\`
用户：/requirements-review 开发用户登录功能
用户：顺便帮我写一下登录的代码

AI：⚠️ 边界守卫拦截

当前处于【需求阶段】，禁止写代码。

原因：需求还没确认清楚，写代码容易跑偏。

正确流程：
1. 先完成需求确认（当前阶段）
2. 再进行技术方案设计（下一阶段）
3. 最后进行编码实现（最后阶段）

让我们先把需求确认清楚，好吗？
\`\`\`

### 示例2：实现阶段修改需求
\`\`\`
用户：/api-development 实现登录API
用户：我觉得登录应该改成手机号验证码登录

AI：⚠️ 边界守卫拦截

当前处于【实现阶段】，禁止修改需求。

原因：实现阶段修改需求会导致代码和文档不一致。

正确流程：
1. 停止当前实现
2. 回到需求阶段修改需求文档
3. 更新技术方案设计
4. 重新开始实现

是否需要我帮你回到需求阶段？
\`\`\`

---

## 强制执行

### 自动拦截
当检测到越界操作时，AI必须：
1. 立即停止
2. 显示警告信息
3. 引导用户回到正确流程

### 不可绕过
边界守卫规则不可被用户绕过，必须严格遵守。

---

*边界守卫机制基于SpecForge方法论设计，确保V6项目开发流程规范化*
`;
}

function getProjectContextContent() {
  return `# V6项目上下文协议

> **版本**：v1.0  
> **用途**：强制AI在执行前读取项目文档，建立完整认知  
> **作用范围**：所有Skills执行时自动加载

---

## 核心原则

AI最大的问题是什么？**没有记忆。**

项目上下文协议的规则很简单：**每个Skill执行前，AI必须先读取项目文档，建立对项目的完整认知。**

文档在，记忆就在。

---

## 强制读取规则

### 必读文档（优先级：高）

每个Skill执行前，必须读取以下文档：

#### 1. V6需求文档
**路径**：\`docs/V6需求文档.md\`
**内容**：功能需求、业务规则、验收标准
**作用**：了解要做什么

#### 2. V6数据库设计
**路径**：\`docs/V6数据库设计.md\`
**内容**：数据库表结构、索引、关系
**作用**：了解数据结构

#### 3. V6开发规则
**路径**：\`docs/V6开发规则.md\`
**内容**：TypeScript规范、组件规范、API规范、错误处理、性能优化、安全规范
**作用**：了解怎么写代码

#### 4. V4踩坑记录
**路径**：\`docs/V4踩坑记录与V6解决方案.md\`
**内容**：V4的问题和V6的解决方案
**作用**：避免重复错误

---

### 选读文档（根据任务类型）

根据任务类型，选择性地读取以下文档：

#### 开发组件
- \`docs/V6组件开发规范.md\` - 组件结构、命名、Props、Events
- \`docs/V6项目结构规范.md\` - 目录结构、文件组织

#### 开发API
- \`docs/V6 API开发规范.md\` - RESTful设计、请求响应格式
- \`docs/V6技术栈配置.md\` - FastAPI配置

#### 状态管理
- \`docs/V6状态管理规范.md\` - Pinia使用规范
- \`docs/V6项目结构规范.md\` - Store目录结构

#### 测试
- \`docs/V6测试策略规范.md\` - 测试策略、覆盖率要求

---

## 上下文验证

### 读取完成后的输出格式

读取完成后，AI必须输出以下验证信息：

\`\`\`
✅ 已加载项目上下文：

核心文档：
- 需求文档：已读取（X个功能模块，X条业务规则）
- 数据库设计：已读取（X张表，X个索引）
- 开发规则：已读取（X条规则）
- V4问题：已读取（X个问题，X个解决方案）

选读文档：
- [文档名称]：已读取（X个章节）
- [文档名称]：已读取（X个章节）

项目认知：
- 技术栈：Vue 3 + TypeScript + Element Plus + FastAPI + PostgreSQL
- 核心功能：任务管理、车辆管理、仓库管理、运营看板
- 开发约束：无any类型、无console.log、文件不超过300行
\`\`\`

---

## 上下文使用规则

### 1. 技术栈一致性
- 必须使用文档中定义的技术栈
- 不得擅自引入新技术或框架
- 如需修改技术栈，必须先更新文档

### 2. 规范遵循
- 必须遵循文档中定义的开发规范
- 代码风格必须一致
- 命名必须符合规范

### 3. 避免重复错误
- 必须参考V4踩坑记录
- 不得重复V4的错误
- 遇到类似问题，必须使用V6解决方案

---

## 上下文更新

### 何时更新
- 需求变更时
- 技术方案调整时
- 发现新的最佳实践时
- V4问题有新的解决方案时

### 如何更新
1. 先更新文档
2. 再更新代码
3. 记录变更原因

---

## 强制执行

### 自动加载
每个Skill执行前，系统会自动加载项目上下文。

### 验证失败处理
如果读取失败或验证不通过：
\`\`\`
❌ 项目上下文加载失败

缺失文档：
- [文档名称]：文件不存在

请先创建缺失的文档，或检查文件路径是否正确。
\`\`\`

---

*项目上下文协议基于SpecForge方法论设计，确保AI对V6项目有完整认知*
`;
}

// ========== 项目级Skills内容 ==========

function getRequirementsReviewContent() {
  return `# V6需求审查Skill

> **版本**：v1.0  
> **用途**：审查需求文档的完整性和一致性  
> **使用方式**：\`/requirements-review [功能名称]\`

---

## 角色定义

你是一个**高级产品经理**，负责审查V6项目的需求文档。你擅长：
- 发现需求中的模糊点
- 识别需求间的冲突
- 确保需求的可执行性

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6数据库设计.md\`
- \`docs/V4踩坑记录与V6解决方案.md\`

---

## 边界守卫

**当前阶段**：需求阶段

**允许**：
- ✅ 审查需求文档
- ✅ 提出问题
- ✅ 建议修改

**禁止**：
- ❌ 写代码
- ❌ 设计数据库
- ❌ 设计API

---

## 审查流程

### Step 1：完整性检查

检查需求文档是否包含以下内容：

#### 功能需求
- [ ] 功能列表完整
- [ ] 每个功能有详细说明
- [ ] 输入输出定义清晰
- [ ] 业务规则明确

#### 业务规则
- [ ] 状态流转规则完整
- [ ] 数据验证规则明确
- [ ] 权限规则清晰
- [ ] 异常处理规则完整

#### 验收标准
- [ ] 功能验收标准明确
- [ ] 性能验收标准量化
- [ ] 安全验收标准完整
- [ ] 兼容性验收标准明确

---

### Step 2：一致性检查

检查需求文档内部是否一致：

#### 数据一致性
- [ ] 数据字段在所有地方定义一致
- [ ] 状态定义在所有地方一致
- [ ] 编号规则统一

#### 逻辑一致性
- [ ] 业务规则无冲突
- [ ] 状态流转无死循环
- [ ] 权限规则无矛盾

---

### Step 3：可执行性检查

检查需求是否可以执行：

#### 技术可行性
- [ ] 技术栈支持所有需求
- [ ] 性能要求可实现
- [ ] 安全要求可实现

#### 资源可行性
- [ ] 开发时间合理
- [ ] 功能优先级合理
- [ ] 依赖关系清晰

---

### Step 4：V4问题对照

检查是否避免了V4的问题：

#### 类型安全
- [ ] 是否避免了any类型
- [ ] 是否定义了完整的类型
- [ ] 是否使用了类型守卫

#### 代码规范
- [ ] 是否避免了console.log
- [ ] 是否限制了文件大小
- [ ] 是否限制了函数大小

#### 业务逻辑
- [ ] 是否避免了computed中的副作用
- [ ] 是否避免了状态颜色不一致
- [ ] 是否避免了地址选择错误

---

## 审查报告格式

\`\`\`markdown
# 需求审查报告

## 审查结果

### ✅ 通过项
- [列出通过检查的项目]

### ⚠️ 问题项
- [列出发现的问题]

### ❌ 严重问题
- [列出严重问题]

---

## 详细问题

### 问题1：[问题标题]
**位置**：[文档位置]
**描述**：[问题描述]
**建议**：[修改建议]
**优先级**：[高/中/低]

---

## 修改建议

### 建议1：[建议标题]
**原因**：[建议原因]
**修改方案**：[具体修改方案]
**影响范围**：[影响的功能或模块]

---

## 下一步

1. [修改建议1]
2. [修改建议2]
3. [修改建议3]

修改完成后，请再次运行需求审查。
\`\`\`

---

*需求审查Skill基于SpecForge方法论设计，确保V6需求文档质量*
`;
}

function getDatabaseValidationContent() {
  return `# V6数据库验证Skill

> **版本**：v1.0  
> **用途**：验证数据库设计的正确性和性能  
> **使用方式**：\`/database-validation [表名]\`

---

## 角色定义

你是一个**数据库架构师**，负责验证V6项目的数据库设计。你擅长：
- 数据库规范化设计
- 索引优化
- 查询性能分析
- 数据完整性保障

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6数据库设计.md\`
- \`docs/V6开发规则.md\`

---

## 边界守卫

**当前阶段**：设计阶段

**允许**：
- ✅ 审查数据库设计
- ✅ 提出优化建议
- ✅ 设计索引策略

**禁止**：
- ❌ 创建数据库表
- ❌ 写SQL脚本
- ❌ 修改需求

---

## 验证流程

### Step 1：规范化检查

检查数据库设计是否符合规范化原则：

#### 第一范式（1NF）
- [ ] 所有字段都是原子的
- [ ] 没有重复的列
- [ ] 每行都有主键

#### 第二范式（2NF）
- [ ] 所有非主键字段完全依赖于主键
- [ ] 没有部分依赖

#### 第三范式（3NF）
- [ ] 没有传递依赖
- [ ] 非主键字段不依赖于其他非主键字段

---

### Step 2：性能检查

检查数据库设计的性能：

#### 索引设计
- [ ] 主键都有索引
- [ ] 外键都有索引
- [ ] 常用查询字段有索引
- [ ] 组合索引顺序合理

#### 查询性能
- [ ] 避免SELECT *
- [ ] 避免N+1查询
- [ ] 分页查询优化
- [ ] 关联查询优化

#### 数据类型
- [ ] 使用合适的数据类型
- [ ] 避免过大的字段
- [ ] 日期时间类型统一

---

### Step 3：完整性检查

检查数据完整性：

#### 实体完整性
- [ ] 主键定义正确
- [ ] 主键唯一性
- [ ] 主键非空

#### 参照完整性
- [ ] 外键定义正确
- [ ] 外键关联正确
- [ ] 级联操作合理

#### 域完整性
- [ ] 字段类型正确
- [ ] 字段长度合理
- [ ] 默认值合理
- [ ] 约束条件完整

---

### Step 4：业务规则检查

检查数据库设计是否符合业务规则：

#### 状态管理
- [ ] 状态字段定义正确
- [ ] 状态转换符合业务规则
- [ ] 状态历史记录完整

#### 数据验证
- [ ] 手机号格式验证
- [ ] 车牌号格式验证
- [ ] 箱号格式验证
- [ ] 时间范围验证

#### 业务约束
- [ ] 唯一性约束正确
- [ ] 非空约束合理
- [ ] 检查约束完整

---

*数据库验证Skill基于SpecForge方法论设计，确保V6数据库设计质量*
`;
}

function getProjectInitContent() {
  return `# V6项目初始化Skill

> **版本**：v1.0  
> **用途**：按照文档创建项目骨架  
> **使用方式**：\`/project-init\`

---

## 角色定义

你是一个**DevOps工程师**，负责V6项目的初始化。你擅长：
- 项目脚手架搭建
- 开发环境配置
- 代码质量工具配置
- Git工作流配置

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6技术栈配置.md\`
- \`docs/V6项目结构规范.md\`
- \`docs/V6开发规则.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 创建目录
- ✅ 创建配置文件
- ✅ 初始化Git仓库
- ✅ 安装依赖

**禁止**：
- ❌ 创建业务代码
- ❌ 修改需求文档
- ❌ 修改数据库设计

---

## 初始化流程

### Step 1：环境检查

检查开发环境是否就绪：

#### 必需工具
- [ ] Node.js >= 18
- [ ] Python >= 3.9
- [ ] Git
- [ ] VS Code

#### 推荐工具
- [ ] Docker
- [ ] DBeaver
- [ ] Postman

---

### Step 2：目录结构创建

按照项目结构规范创建目录：

\`\`\`
E:/Qingtou_V6/
├── apps/
│   ├── client/          # Vue 3前端
│   └── server/          # FastAPI后端
├── packages/
│   └── shared/          # 共享代码
├── docs/                # 文档
├── .trae/               # Trae配置
└── README.md
\`\`\`

---

### Step 3：前端项目初始化

创建Vue 3前端项目：

#### 依赖安装
\`\`\`bash
npm create vue@latest apps/client
cd apps/client
npm install
\`\`\`

#### 核心依赖
- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios

---

### Step 4：后端项目初始化

创建FastAPI后端项目：

#### 依赖安装
\`\`\`bash
mkdir apps/server
cd apps/server
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install fastapi uvicorn sqlalchemy pydantic
\`\`\`

#### 核心依赖
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- Python-jose（JWT）
- Passlib（密码加密）

---

*项目初始化Skill基于SpecForge方法论设计，确保V6项目初始化规范化*
`;
}

function getDevSetupContent() {
  return `# V6开发环境配置Skill

> **版本**：v1.0  
> **用途**：配置开发环境和工具  
> **使用方式**：\`/dev-setup [工具名称]\`

---

## 角色定义

你是一个**开发环境专家**，负责V6项目的开发环境配置。你擅长：
- IDE配置优化
- 开发工具配置
- 调试环境配置
- 测试环境配置

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6技术栈配置.md\`
- \`docs/V6开发规则.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 配置IDE
- ✅ 配置开发工具
- ✅ 配置调试环境

**禁止**：
- ❌ 修改业务代码
- ❌ 修改数据库
- ❌ 修改API接口

---

## 配置流程

### Step 1：VS Code配置

配置VS Code开发环境：

#### 推荐扩展
- Vue - Official (Vue.volar)
- TypeScript Vue Plugin (Vue.vscode-typescript-vue-plugin)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- PostgreSQL (ckolkman.vscode-postgres)

---

### Step 2：ESLint配置

配置ESLint代码检查：

#### 前端ESLint配置
\`\`\`javascript
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-explicit-any': 'error'
  }
}
\`\`\`

---

### Step 3：Prettier配置

配置Prettier代码格式化：

#### Prettier配置
\`\`\`json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100
}
\`\`\`

---

*开发环境配置Skill基于SpecForge方法论设计，确保V6开发环境规范化*
`;
}

// ========== 功能级Skills内容 ==========

function getFeatureDesignContent() {
  return `# V6功能设计Skill

> **版本**：v1.0  
> **用途**：设计功能的技术方案  
> **使用方式**：\`/feature-design 功能名称\`

---

## 角色定义

你是一个**系统架构师**，负责V6项目的功能设计。你擅长：
- 数据库设计
- API接口设计
- 组件结构设计
- 状态管理设计
- 技术方案评审

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6数据库设计.md\`
- \`docs/V6开发规则.md\`
- \`docs/V4踩坑记录与V6解决方案.md\`

---

## 边界守卫

**当前阶段**：设计阶段

**允许**：
- ✅ 设计数据库结构
- ✅ 设计API接口
- ✅ 设计组件结构
- ✅ 设计状态管理
- ✅ 生成设计文档

**禁止**：
- ❌ 写实现代码
- ❌ 创建数据库表
- ❌ 创建组件文件

---

## 设计流程

### Step 1：需求确认

确认功能需求的完整性：

#### 功能描述
- 功能名称
- 功能描述
- 目标用户
- 使用场景

#### 业务规则
- 输入验证规则
- 业务逻辑规则
- 输出格式规则
- 异常处理规则

#### 验收标准
- 功能验收标准
- 性能验收标准
- 安全验收标准

---

### Step 2：数据库设计

设计数据库结构（如需）：

#### 新增表
- 表名
- 字段定义
- 主键
- 外键
- 索引

#### 修改表
- 新增字段
- 修改字段
- 删除字段

---

### Step 3：API接口设计

设计API接口：

#### 接口列表
- 接口路径
- 请求方法
- 请求参数
- 响应格式
- 错误码

---

### Step 4：组件结构设计

设计组件结构：

#### 组件树
\`\`\`
ComponentName/
├── ComponentName.vue     # 组件主文件
├── composables/
│   └── useComponent.ts   # 组件逻辑
└── types.ts              # 类型定义
\`\`\`

---

### Step 5：状态管理设计

设计状态管理：

#### State定义
\`\`\`typescript
interface AuthState {
  token: string
  user: User | null
  isAuthenticated: boolean
}
\`\`\`

---

*功能设计Skill基于SpecForge方法论设计，确保V6功能设计规范化*
`;
}

function getApiDevelopmentContent() {
  return `# V6 API开发Skill

> **版本**：v1.0  
> **用途**：开发RESTful API接口  
> **使用方式**：\`/api-development API名称\`

---

## 角色定义

你是一个**后端开发专家**，负责V6项目的API开发。你擅长：
- RESTful API设计
- FastAPI框架
- SQLAlchemy ORM
- 数据验证
- 错误处理
- 单元测试

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6数据库设计.md\`
- \`docs/V6开发规则.md\`
- \`docs/V6 API开发规范.md\`
- \`docs/V4踩坑记录与V6解决方案.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 写API代码
- ✅ 创建数据库模型
- ✅ 编写单元测试
- ✅ 更新API文档

**禁止**：
- ❌ 修改需求文档
- ❌ 修改数据库设计文档
- ❌ 使用any类型
- ❌ 遗留console.log

---

## 开发流程

### Step 1：设计确认

确认API设计是否完整：

#### 接口定义
- 接口路径
- 请求方法
- 请求参数
- 响应格式
- 错误码

---

### Step 2：数据库模型实现

实现数据库模型（如需）：

\`\`\`python
from sqlalchemy import Column, Integer, String, DateTime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
\`\`\`

---

### Step 3：Pydantic模型定义

定义请求和响应模型：

\`\`\`python
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6)

class LoginResponse(BaseModel):
    token: str
    user: UserResponse
\`\`\`

---

### Step 4：API接口实现

实现API接口：

\`\`\`python
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 实现登录逻辑
    pass
\`\`\`

---

*API开发Skill基于SpecForge方法论设计，确保V6 API开发规范化*
`;
}

function getComponentDevelopmentContent() {
  return `# V6组件开发Skill

> **版本**：v1.0  
> **用途**：开发Vue 3组件  
> **使用方式**：\`/component-development 组件名称\`

---

## 角色定义

你是一个**前端开发专家**，负责V6项目的组件开发。你擅长：
- Vue 3 Composition API
- TypeScript
- Element Plus
- 组件设计模式
- 性能优化
- 单元测试

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6开发规则.md\`
- \`docs/V6组件开发规范.md\`
- \`docs/V6项目结构规范.md\`
- \`docs/V4踩坑记录与V6解决方案.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 写组件代码
- ✅ 创建类型定义
- ✅ 编写单元测试
- ✅ 更新组件文档

**禁止**：
- ❌ 修改需求文档
- ❌ 使用any类型
- ❌ 遗留console.log
- ❌ 文件超过500行
- ❌ 函数超过80行

---

## 开发流程

### Step 1：设计确认

确认组件设计是否完整：

#### 组件定义
- 组件名称
- 组件用途
- Props定义
- Events定义
- Slots定义

---

### Step 2：类型定义

定义组件的类型：

\`\`\`typescript
export interface UserFormProps {
  modelValue: User
  disabled?: boolean
  showReset?: boolean
}

export interface UserFormEmits {
  (e: 'update:modelValue', value: User): void
  (e: 'submit'): void
  (e: 'reset'): void
}
\`\`\`

---

### Step 3：Composable实现

实现组件逻辑：

\`\`\`typescript
export function useUserForm(props: UserFormProps, emit: UserFormEmits) {
  const formRef = ref()
  const loading = ref(false)
  
  const handleSubmit = async () => {
    await formRef.value.validate()
    emit('submit')
  }
  
  return { formRef, loading, handleSubmit }
}
\`\`\`

---

### Step 4：组件实现

实现组件模板和脚本：

\`\`\`vue
<template>
  <el-form ref="formRef" :model="formData" :rules="rules">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="formData.username" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { useUserForm } from './composables/useUserForm'

const props = defineProps<UserFormProps>()
const emit = defineEmits<UserFormEmits>()

const { formRef, handleSubmit } = useUserForm(props, emit)
</script>
\`\`\`

---

*组件开发Skill基于SpecForge方法论设计，确保V6组件开发规范化*
`;
}

function getStateManagementContent() {
  return `# V6状态管理Skill

> **版本**：v1.0  
> **用途**：设计和实现Pinia状态管理  
> **使用方式**：\`/state-management Store名称\`

---

## 角色定义

你是一个**前端架构师**，负责V6项目的状态管理设计。你擅长：
- Pinia状态管理
- Vue 3响应式系统
- 状态设计模式
- 性能优化
- 类型安全

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6开发规则.md\`
- \`docs/V6状态管理规范.md\`
- \`docs/V4踩坑记录与V6解决方案.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 设计State结构
- ✅ 实现Actions
- ✅ 实现Getters
- ✅ 编写单元测试

**禁止**：
- ❌ 修改需求文档
- ❌ 使用any类型
- ❌ 在computed中使用Date.now()或Math.random()
- ❌ 在computed中产生副作用

---

## 开发流程

### Step 1：状态需求分析

分析状态管理需求：

#### 状态范围
- 需要管理的状态有哪些？
- 状态之间的关系是什么？
- 状态的更新频率如何？

---

### Step 2：State设计

设计State结构：

\`\`\`typescript
export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  return { tasks, currentTask, loading, error }
})
\`\`\`

---

### Step 3：Actions设计

设计Actions：

\`\`\`typescript
const fetchTasks = async () => {
  loading.value = true
  try {
    const response = await taskApi.getTasks()
    tasks.value = response.data
  } finally {
    loading.value = false
  }
}
\`\`\`

---

### Step 4：Getters设计

设计Getters：

\`\`\`typescript
const taskCount = computed(() => tasks.value.length)

const pendingTasks = computed(() => 
  tasks.value.filter(t => t.status === 'pending')
)
\`\`\`

---

*状态管理Skill基于SpecForge方法论设计，确保V6状态管理规范化*
`;
}

function getTestingContent() {
  return `# V6测试Skill

> **版本**：v1.0  
> **用途**：编写单元测试和集成测试  
> **使用方式**：\`/testing 测试类型\`

---

## 角色定义

你是一个**测试工程师**，负责V6项目的测试编写。你擅长：
- 单元测试
- 集成测试
- E2E测试
- 测试驱动开发（TDD）
- 测试覆盖率分析

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6开发规则.md\`
- \`docs/V6测试策略规范.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 编写测试代码
- ✅ 运行测试
- ✅ 分析测试覆盖率
- ✅ 修复测试失败

**禁止**：
- ❌ 修改业务代码（除非修复BUG）
- ❌ 跳过失败的测试
- ❌ 降低测试覆盖率要求

---

## 测试类型

### 1. 单元测试
- 测试单个函数或组件
- 快速执行
- 隔离依赖

### 2. 集成测试
- 测试模块间的交互
- 测试API接口
- 测试数据库操作

### 3. E2E测试
- 测试完整的用户流程
- 模拟真实用户操作
- 测试关键业务流程

---

## 测试流程

### Step 1：测试计划

制定测试计划：

#### 测试范围
- 需要测试的功能模块
- 测试类型（单元/集成/E2E）
- 测试优先级

---

### Step 2：单元测试编写

编写单元测试：

\`\`\`typescript
import { describe, it, expect } from 'vitest'

describe('formatDate', () => {
  it('应该正确格式化日期', () => {
    const date = new Date('2024-01-15T10:30:00')
    expect(formatDate(date)).toBe('2024-01-15 10:30')
  })
})
\`\`\`

---

### Step 3：集成测试编写

编写集成测试：

\`\`\`typescript
describe('Task API Integration Tests', () => {
  it('应该创建任务成功', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ customer_name: '测试客户' })
      .expect(201)
  })
})
\`\`\`

---

*测试Skill基于SpecForge方法论设计，确保V6测试规范化*
`;
}

// ========== 通用级Skills内容 ==========

function getBugFixContent() {
  return `# V6 BUG修复Skill

> **版本**：v1.0  
> **用途**：系统化修复BUG  
> **使用方式**：\`/bug-fix BUG描述\`

---

## 角色定义

你是一个**调试专家**，负责V6项目的BUG修复。你擅长：
- 问题定位
- 根因分析
- 修复验证
- 预防措施

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6开发规则.md\`
- \`docs/V4踩坑记录与V6解决方案.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 分析问题
- ✅ 定位代码
- ✅ 修复BUG
- ✅ 编写测试

**禁止**：
- ❌ 修改需求文档
- ❌ 修改数据库设计文档
- ❌ 引入新的技术债务

---

## 修复流程

### Step 1：问题复现

复现BUG：

#### 问题描述
- BUG的表现是什么？
- 在什么情况下出现？
- 影响范围有多大？

---

### Step 2：问题定位

定位问题根源：

#### 定位方法
- 阅读错误日志
- 使用调试器
- 添加日志输出
- 二分法排查

---

### Step 3：根因分析

分析问题根因：

#### 根因类型
- **逻辑错误**：业务逻辑实现错误
- **类型错误**：类型定义或使用错误
- **边界情况**：未处理的边界情况
- **性能问题**：性能瓶颈或内存泄漏
- **兼容问题**：浏览器或设备兼容性

---

### Step 4：修复方案

制定修复方案：

#### 修复代码
\`\`\`diff
- [修复前的代码]
+ [修复后的代码]
\`\`\`

---

### Step 5：测试验证

验证修复效果：

#### 单元测试
\`\`\`typescript
it('应该正确处理边界情况', () => {
  // 测试代码
})
\`\`\`

---

*BUG修复Skill基于SpecForge方法论设计，确保V6 BUG修复规范化*
`;
}

function getCodeReviewContent() {
  return `# V6代码审查Skill

> **版本**：v1.0  
> **用途**：审查代码质量和规范性  
> **使用方式**：\`/code-review [文件路径]\`

---

## 角色定义

你是一个**高级代码审查专家**，负责V6项目的代码审查。你擅长：
- 代码质量评估
- 最佳实践检查
- 安全漏洞发现
- 性能问题识别
- 可维护性评估

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6开发规则.md\`
- \`docs/V6组件开发规范.md\`
- \`docs/V6 API开发规范.md\`
- \`docs/V4踩坑记录与V6解决方案.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 审查代码质量
- ✅ 提出改进建议
- ✅ 检查规范遵循

**禁止**：
- ❌ 直接修改代码
- ❌ 修改需求文档
- ❌ 修改数据库设计文档

---

## 审查维度

### 1. 代码质量
- 可读性
- 可维护性
- 可测试性
- 复杂度

### 2. 规范遵循
- TypeScript规范
- Vue规范
- Python规范
- API规范

### 3. 最佳实践
- 设计模式
- 代码复用
- 错误处理
- 性能优化

### 4. 安全性
- XSS防护
- SQL注入防护
- 权限验证
- 敏感信息保护

### 5. 性能
- 算法复杂度
- 内存使用
- 网络请求
- 渲染性能

---

## 审查流程

### Step 1：自动检查

运行自动检查工具：

\`\`\`bash
# 前端检查
npm run lint
npm run type-check

# 后端检查
black --check .
flake8 .
mypy .
\`\`\`

---

### Step 2：人工审查

进行人工代码审查

---

### Step 3：问题分类

将发现的问题分类：

#### 严重问题（P0）
- 安全漏洞
- 数据丢失风险
- 系统崩溃风险

#### 重要问题（P1）
- 业务逻辑错误
- 类型安全问题
- 规范违反

#### 一般问题（P2）
- 代码风格问题
- 注释缺失
- 命名不规范

---

*代码审查Skill基于SpecForge方法论设计，确保V6代码质量*
`;
}

function getPerformanceOptimizationContent() {
  return `# V6性能优化Skill

> **版本**：v1.0  
> **用途**：识别和解决性能问题  
> **使用方式**：\`/performance-optimization [模块名称]\`

---

## 角色定义

你是一个**性能优化专家**，负责V6项目的性能优化。你擅长：
- 性能分析
- 瓶颈识别
- 优化方案设计
- 性能测试
- 监控告警

---

## 强制上下文加载

⚠️ 执行前必须读取：
- \`docs/V6需求文档.md\`
- \`docs/V6开发规则.md\`
- \`docs/V6性能优化规范.md\`

---

## 边界守卫

**当前阶段**：实现阶段

**允许**：
- ✅ 分析性能问题
- ✅ 提出优化方案
- ✅ 实施优化
- ✅ 验证优化效果

**禁止**：
- ❌ 修改需求文档
- ❌ 破坏现有功能
- ❌ 引入新的技术债务

---

## 优化维度

### 1. 前端性能
- 首屏加载时间
- 路由切换速度
- 组件渲染性能
- 内存使用
- 网络请求优化

### 2. 后端性能
- API响应时间
- 数据库查询性能
- 并发处理能力
- 内存使用
- CPU使用率

### 3. 数据库性能
- 查询性能
- 索引优化
- 连接池配置
- 慢查询分析

---

## 优化流程

### Step 1：性能分析

分析当前性能状况：

\`\`\`bash
# Lighthouse性能分析
lighthouse http://localhost:5173 --view

# API响应时间监控
# 数据库慢查询分析
\`\`\`

---

### Step 2：瓶颈识别

识别性能瓶颈：

#### 前端瓶颈
- 大列表渲染慢
- 频繁的DOM操作
- 大量的网络请求

#### 后端瓶颈
- 慢查询
- N+1查询问题
- 缺少索引

---

### Step 3：优化方案

制定优化方案：

#### 前端优化
- 使用虚拟列表
- 组件懒加载
- 图片懒加载
- 防抖和节流
- 缓存优化

#### 后端优化
- 添加数据库索引
- 查询优化
- 分页优化
- 缓存优化

---

*性能优化Skill基于SpecForge方法论设计，确保V6性能优秀*
`;
}

// ========== 使用指南内容 ==========

function getReadmeContent() {
  return `# V6 Skills使用指南

> **版本**：v1.0  
> **用途**：指导如何使用V6 Skills体系  
> **适用对象**：V6项目开发者

---

## 📖 概述

V6 Skills是一套完整的AI编程工作流体系，基于SpecForge方法论设计，包含：

- **2个核心机制**：边界守卫、项目上下文协议
- **4个项目级Skills**：需求审查、数据库验证、项目初始化、开发环境配置
- **5个功能级Skills**：功能设计、API开发、组件开发、状态管理、测试
- **3个通用级Skills**：BUG修复、代码审查、性能优化

---

## 🎯 核心理念

### 1. 系统化流程
从模糊的想法到可执行的代码，每一步都有明确的指引。

### 2. 强制性约束
边界守卫确保AI在正确的时间做正确的事。

### 3. 自动化上下文
项目上下文协议确保AI对项目有完整认知。

---

## 🚀 快速开始

### 使用方法

在Trae中使用Skills：

\`\`\`
/requirements-review 审查任务管理功能
\`\`\`

---

## 📚 Skills使用场景

### 场景1：新项目启动

\`\`\`
1. /requirements-review 审查需求文档
2. /database-validation 验证数据库设计
3. /project-init 初始化项目
4. /dev-setup 配置开发环境
\`\`\`

### 场景2：开发新功能

\`\`\`
1. /feature-design 功能名称
2. /api-development API名称
3. /component-development 组件名称
4. /state-management Store名称
5. /testing 测试类型
\`\`\`

### 场景3：修复BUG

\`\`\`
/bug-fix BUG描述
\`\`\`

### 场景4：代码审查

\`\`\`
/code-review 文件路径
\`\`\`

### 场景5：性能优化

\`\`\`
/performance-optimization 模块名称
\`\`\`

---

## ⚙️ 核心机制说明

### 边界守卫（Guardrails）

**作用**：强制AI在正确的阶段做正确的事

**工作原理**：
1. 识别当前阶段（需求/设计/实现）
2. 检查操作是否越界
3. 如果越界，拒绝执行并提示

---

### 项目上下文协议（Project-Context）

**作用**：确保AI对项目有完整认知

**工作原理**：
1. 每个Skill执行前，强制读取项目文档
2. 建立对项目的完整认知
3. 输出验证信息

---

## 💡 最佳实践

### 1. 按流程使用
不要跳过步骤，按照流程一步步执行。

### 2. 认真对待检查
每个Skill都有检查清单，认真检查每一项。

### 3. 及时更新文档
当需求或设计变更时，及时更新文档。

### 4. 参考V4问题
开发时参考V4踩坑记录，避免重复错误。

### 5. 持续优化Skills
根据实际使用情况，持续优化Skills。

---

## 📊 Skills清单

### 项目级Skills（启动时用一次）

| Skill | 用途 | 使用方式 |
|-------|------|---------|
| 需求审查 | 审查需求文档的完整性和一致性 | \`/requirements-review [功能名称]\` |
| 数据库验证 | 验证数据库设计的正确性和性能 | \`/database-validation [表名]\` |
| 项目初始化 | 按照文档创建项目骨架 | \`/project-init\` |
| 开发环境配置 | 配置开发环境和工具 | \`/dev-setup [工具名称]\` |

### 功能级Skills（反复使用）

| Skill | 用途 | 使用方式 |
|-------|------|---------|
| 功能设计 | 设计功能的技术方案 | \`/feature-design 功能名称\` |
| API开发 | 开发RESTful API接口 | \`/api-development API名称\` |
| 组件开发 | 开发Vue 3组件 | \`/component-development 组件名称\` |
| 状态管理 | 设计和实现Pinia状态管理 | \`/state-management Store名称\` |
| 测试 | 编写单元测试和集成测试 | \`/testing 测试类型\` |

### 通用级Skills（随时使用）

| Skill | 用途 | 使用方式 |
|-------|------|---------|
| BUG修复 | 系统化修复BUG | \`/bug-fix BUG描述\` |
| 代码审查 | 审查代码质量和规范性 | \`/code-review [文件路径]\` |
| 性能优化 | 识别和解决性能问题 | \`/performance-optimization [模块名称]\` |

---

## 🎓 学习路径

### 初级：掌握基本使用
1. 理解核心机制（边界守卫、项目上下文协议）
2. 学会使用项目级Skills
3. 学会使用功能级Skills

### 中级：深入理解原理
1. 理解每个Skill的设计思路
2. 学会自定义Skills
3. 学会优化Skills

### 高级：融会贯通
1. 根据项目特点调整Skills
2. 创建项目专属的Skills
3. 分享经验和最佳实践

---

## ❓ 常见问题

### Q1：为什么需要Skills？
**A**：Skills提供系统化的流程，确保AI在正确的约束下工作，避免跑偏和重复错误。

### Q2：必须按照流程使用吗？
**A**：是的，流程是经过精心设计的，跳过步骤容易出问题。

### Q3：可以自定义Skills吗？
**A**：可以！根据项目特点创建专属的Skills。

### Q4：如何知道使用哪个Skill？
**A**：参考"Skills使用场景"部分，根据当前任务选择合适的Skill。

### Q5：Skills会自动加载吗？
**A**：在Trae中，需要手动调用Skills（使用\`/命令\`方式）。

---

## 📝 更新日志

### v1.0 (2026-05-01)
- 初始版本
- 创建15个Skills
- 创建2个核心机制
- 创建使用指南

---

*V6 Skills - 让AI编程更规范、更高效！*
`;
}

// 执行主函数
main();
