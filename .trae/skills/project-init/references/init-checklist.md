# 项目初始化检查清单

> 本文档为 `project-init` Skill 的参考检查清单，初始化过程中逐项确认。

---

## 目录结构

- [ ] 前端目录结构完整（`src/`、`public/`、`tests/` 等）
- [ ] 后端目录结构完整（如有）
- [ ] 所有子目录已创建（`components/`、`stores/`、`utils/`、`types/` 等）
- [ ] 目录命名符合 kebab-case 规范

## 前端项目

- [ ] 脚手架项目创建成功
- [ ] `package.json` 中项目名称正确
- [ ] `index.html` 标题正确
- [ ] 入口文件（`main.ts`）存在

## 后端项目（如有）

- [ ] 后端项目结构创建成功
- [ ] 依赖文件（`requirements.txt` / `package.json`）存在
- [ ] 入口文件（`main.py` / `index.ts`）存在

## 依赖安装

- [ ] 前端核心依赖安装完成（Vue/React 等）
- [ ] UI 组件库安装完成
- [ ] 状态管理库安装完成
- [ ] 路由库安装完成
- [ ] HTTP 客户端安装完成
- [ ] 开发依赖安装完成（ESLint、Prettier、TypeScript、Vitest 等）
- [ ] 后端依赖安装完成（如有）

## 工具链配置

- [ ] ESLint 配置完成，规则符合开发规范
- [ ] Prettier 配置完成
- [ ] TypeScript 配置为严格模式（`strict: true`）
- [ ] `tsconfig.json` 路径别名配置正确
- [ ] Vite 配置完成（如有）
- [ ] Husky + lint-staged 配置完成
- [ ] 测试框架配置完成

## Git

- [ ] `git init` 完成
- [ ] `.gitignore` 创建完成，包含必要忽略项
- [ ] 初始提交完成

## 验证

- [ ] `npm run dev` — 开发服务器正常启动
- [ ] `npm run lint` — ESLint 正常运行
- [ ] `npm run type-check` — TypeScript 类型检查正常运行
- [ ] `npm run test` — 测试框架正常运行
- [ ] 浏览器能访问开发服务器页面
