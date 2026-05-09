#!/usr/bin/env node

/**
 * V6项目初始化脚本
 * 一键创建完整的V6项目结构
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class ProjectInitializer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..')
    this.frontendDir = path.join(this.projectRoot, 'apps', 'frontend')
    this.serverDir = path.join(this.projectRoot, 'apps', 'server')
  }

  /**
   * 创建目录结构
   */
  createDirectories() {
    console.log('📁 创建目录结构...')

    const directories = [
      // 前端目录
      'apps/frontend/src/api',
      'apps/frontend/src/assets/styles',
      'apps/frontend/src/assets/images',
      'apps/frontend/src/components/business',
      'apps/frontend/src/components/layout',
      'apps/frontend/src/components/dashboard',
      'apps/frontend/src/components/dispatch',
      'apps/frontend/src/components/fleet',
      'apps/frontend/src/components/warehouse',
      'apps/frontend/src/components/map',
      'apps/frontend/src/composables',
      'apps/frontend/src/config',
      'apps/frontend/src/domain/rules',
      'apps/frontend/src/domain/validators',
      'apps/frontend/src/pages',
      'apps/frontend/src/router',
      'apps/frontend/src/services',
      'apps/frontend/src/stores/auth',
      'apps/frontend/src/stores/orders',
      'apps/frontend/src/stores/vehicles',
      'apps/frontend/src/stores/drivers',
      'apps/frontend/src/stores/warehouses',
      'apps/frontend/src/stores/dashboard',
      'apps/frontend/src/types',
      'apps/frontend/src/utils',
      'apps/frontend/public/images',

      // 后端目录
      'apps/server/src/config',
      'apps/server/src/database/models',
      'apps/server/src/database/migrations/versions',
      'apps/server/src/routers',
      'apps/server/src/schemas',
      'apps/server/src/services',
      'apps/server/src/utils',
      'apps/server/src/middleware',
      'apps/server/src/dependencies',
      'apps/server/tests/unit',
      'apps/server/tests/integration',

      // 脚本和文档
      'scripts',
      'docs',
      '.trae/rules',
      '.vscode',
      '.husky'
    ]

    directories.forEach(dir => {
      const fullPath = path.join(this.projectRoot, dir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
        console.log(`  ✅ ${dir}`)
      }
    })
  }

  /**
   * 创建基础文件
   */
  createBaseFiles() {
    console.log('\n📄 创建基础文件...')

    // 前端入口文件
    this.writeFile('apps/frontend/src/main.ts', this.getMainTs())
    this.writeFile('apps/frontend/src/App.vue', this.getAppVue())
    this.writeFile('apps/frontend/src/vite-env.d.ts', this.getViteEnvD())
    this.writeFile('apps/frontend/index.html', this.getIndexHtml())

    // 后端入口文件
    this.writeFile('apps/server/src/main.py', this.getMainPy())
    this.writeFile('apps/server/src/__init__.py', '')

    // 配置文件
    this.writeFile('.gitignore', this.getGitignore())
    this.writeFile('pnpm-workspace.yaml', this.getPnpmWorkspace())
    this.writeFile('.vscode/settings.json', this.getVSCodeSettings())
    this.writeFile('.vscode/extensions.json', this.getVSCodeExtensions())

    console.log('  ✅ 基础文件创建完成')
  }

  /**
   * 创建类型定义文件
   */
  createTypeFiles() {
    console.log('\n📝 创建类型定义文件...')

    const types = {
      'apps/frontend/src/types/index.ts': this.getTypesIndex(),
      'apps/frontend/src/types/auth.ts': this.getAuthTypes(),
      'apps/frontend/src/types/order.ts': this.getOrderTypes(),
      'apps/frontend/src/types/vehicle.ts': this.getVehicleTypes(),
      'apps/frontend/src/types/common.ts': this.getCommonTypes()
    }

    Object.entries(types).forEach(([file, content]) => {
      this.writeFile(file, content)
    })

    console.log('  ✅ 类型定义文件创建完成')
  }

  /**
   * 创建工具函数文件
   */
  createUtilsFiles() {
    console.log('\n🔧 创建工具函数文件...')

    const utils = {
      'apps/frontend/src/utils/index.ts': this.getUtilsIndex(),
      'apps/frontend/src/utils/logger.ts': this.getLoggerUtil(),
      'apps/frontend/src/utils/dateUtils.ts': this.getDateUtils(),
      'apps/frontend/src/utils/formatUtils.ts': this.getFormatUtils()
    }

    Object.entries(utils).forEach(([file, content]) => {
      this.writeFile(file, content)
    })

    console.log('  ✅ 工具函数文件创建完成')
  }

  /**
   * 创建API客户端
   */
  createApiClient() {
    console.log('\n🌐 创建API客户端...')

    this.writeFile('apps/frontend/src/api/client.ts', this.getApiClient())
    this.writeFile('apps/frontend/src/api/types.ts', this.getApiTypes())

    console.log('  ✅ API客户端创建完成')
  }

  /**
   * 创建Store示例
   */
  createStoreExample() {
    console.log('\n🏪 创建Store示例...')

    this.writeFile('apps/frontend/src/stores/auth/index.ts', this.getAuthStore())
    this.writeFile('apps/frontend/src/stores/auth/types.ts', this.getAuthStoreTypes())
    this.writeFile('apps/frontend/src/stores/auth/state.ts', this.getAuthStoreState())
    this.writeFile('apps/frontend/src/stores/auth/actions.ts', this.getAuthStoreActions())
    this.writeFile('apps/frontend/src/stores/index.ts', this.getStoresIndex())

    console.log('  ✅ Store示例创建完成')
  }

  /**
   * 创建服务层示例
   */
  createServiceExample() {
    console.log('\n🔌 创建服务层示例...')

    this.writeFile('apps/frontend/src/services/authService.ts', this.getAuthService())
    this.writeFile('apps/frontend/src/services/index.ts', this.getServicesIndex())

    console.log('  ✅ 服务层示例创建完成')
  }

  /**
   * 写入文件
   */
  writeFile(filePath, content) {
    const fullPath = path.join(this.projectRoot, filePath)
    const dir = path.dirname(fullPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(fullPath, content, 'utf8')
  }

  /**
   * 获取文件内容
   */
  getMainTs() {
    return `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
`
  }

  getAppVue() {
    return `<template>
  <router-view />
</template>

<script setup lang="ts">
// 根组件
</script>

<style>
/* 全局样式 */
</style>
`
  }

  getViteEnvD() {
    return `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`
  }

  getIndexHtml() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>青投供应链V6</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`
  }

  getMainPy() {
    return `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="青投供应链V6 API",
    description="物流运输调度管理系统后端API",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
`
  }

  getGitignore() {
    return `# 依赖
node_modules/
__pycache__/
*.pyc
.pytest_cache/

# 构建产物
dist/
build/
*.egg-info/

# 环境变量
.env
.env.local
.env.*.local

# 日志
*.log
logs/

# 数据库
*.db
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo

# 测试覆盖率
coverage/
.nyc_output/

# 临时文件
tmp/
temp/
*.tmp
`
  }

  getPnpmWorkspace() {
    return `packages:
  - 'apps/*'
  - 'packages/*'
`
  }

  getVSCodeSettings() {
    return `{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
`
  }

  getVSCodeExtensions() {
    return `{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.vscode-pylance"
  ]
}
`
  }

  getTypesIndex() {
    return `export type { User, UserRole } from './auth'
export type { Order, OrderStatus, Priority } from './order'
export type { Vehicle, VehicleStatus } from './vehicle'
export type { ApiResponse, ApiError, PaginationParams, PaginatedResponse } from './common'
`
  }

  getAuthTypes() {
    return `export type UserRole = 'admin' | 'dispatcher' | 'warehouse'

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  phone?: string
  email?: string
  avatar?: string
  status: 'enabled' | 'disabled'
  lastLoginTime?: string
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
`
  }

  getOrderTypes() {
    return `export type OrderStatus = 'pending' | 'assigned' | 'transit' | 'completed' | 'exception'
export type Priority = 'normal' | 'urgent' | 'high'

export interface Order {
  id: string
  orderNo: string
  status: OrderStatus
  priority: Priority
  customerName: string
  customerPhone?: string
  origin: string
  destination: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  customerName: string
  customerPhone?: string
  origin: string
  destination: string
  priority?: Priority
}
`
  }

  getVehicleTypes() {
    return `export type VehicleStatus = 'idle' | 'assigned' | 'transit' | 'maintenance'

export interface Vehicle {
  id: string
  plateNumber: string
  status: VehicleStatus
  driverId?: string
  driverName?: string
  capacity: number
  createdAt: string
}
`
  }

  getCommonTypes() {
    return `export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface ApiError {
  code: number
  message: string
  details?: string[]
  path: string
  timestamp: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  code: number
  message: string
  data: {
    list: T[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }
  timestamp: string
}
`
  }

  getUtilsIndex() {
    return `export { logger } from './logger'
export { formatDate, parseDate } from './dateUtils'
export { formatNumber, formatPhone } from './formatUtils'
`
  }

  getLoggerUtil() {
    return `export const logger = {
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.debug('[DEBUG]', ...args)
    }
  },
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.PROD) {
      // 发送到日志服务
      console.error('[ERROR]', ...args)
    } else {
      console.error('[ERROR]', ...args)
    }
  }
}
`
  }

  getDateUtils() {
    return `import dayjs from 'dayjs'

export function formatDate(date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}

export function parseDate(dateStr: string): Date {
  return dayjs(dateStr).toDate()
}

export function getRelativeTime(date: Date | string): string {
  return dayjs(date).fromNow()
}
`
  }

  getFormatUtils() {
    return `export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals)
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\\d{3})(\\d{4})(\\d{4})/, '$1****$3')
}
`
  }

  getApiClient() {
    return `import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@stores/auth'
import { logger } from '@utils/logger'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    
    if (authStore.token) {
      config.headers.Authorization = \`Bearer \${authStore.token}\`
    }
    
    logger.debug('API Request', {
      method: config.method,
      url: config.url
    })
    
    return config
  },
  (error: AxiosError) => {
    logger.error('API Request Error', error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url
    })
    
    return response.data
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
`
  }

  getApiTypes() {
    return `export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface ApiError {
  code: number
  message: string
  details?: string[]
  path: string
  timestamp: string
}
`
  }

  getAuthStore() {
    return `import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import type { AuthState, AuthGetters, AuthActions } from './types'
import { createAuthState } from './state'
import { createAuthGetters } from './getters'
import { createAuthActions } from './actions'

export const useAuthStore = defineStore('auth', () => {
  const state = reactive<AuthState>(createAuthState())
  const getters = createAuthGetters(state)
  const actions = createAuthActions(state)

  return {
    ...state,
    ...getters,
    ...actions
  }
})
`
  }

  getAuthStoreTypes() {
    return `import type { User } from '@types'

export interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
}

export interface AuthGetters {
  isLoggedIn: boolean
  isAdmin: boolean
}

export interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchUserInfo: () => Promise<void>
}
`
  }

  getAuthStoreState() {
    return `import type { AuthState } from './types'

export const createAuthState = (): AuthState => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null
})
`
  }

  getAuthStoreActions() {
    return `import type { AuthState } from './types'
import { authService } from '@services'
import { logger } from '@utils/logger'

export const createAuthActions = (state: AuthState) => ({
  async login(username: string, password: string): Promise<void> {
    state.loading = true
    state.error = null

    try {
      const response = await authService.login({ username, password })
      state.token = response.data.token
      state.user = response.data.user
      localStorage.setItem('token', response.data.token)
    } catch (error) {
      state.error = error instanceof Error ? error.message : '登录失败'
      logger.error('登录失败', error)
      throw error
    } finally {
      state.loading = false
    }
  },

  logout(): void {
    state.token = null
    state.user = null
    localStorage.removeItem('token')
  },

  async fetchUserInfo(): Promise<void> {
    try {
      const response = await authService.getUserInfo()
      state.user = response.data
    } catch (error) {
      logger.error('获取用户信息失败', error)
    }
  }
})
`
  }

  getStoresIndex() {
    return `export { useAuthStore } from './auth'
// 其他store将在后续添加
`
  }

  getAuthService() {
    return `import apiClient from '@api/client'
import type { LoginRequest, LoginResponse, ApiResponse } from '@types'

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/auth/login', data)
  },

  async getUserInfo(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/user')
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/logout')
  }
}
`
  }

  getServicesIndex() {
    return `export { authService } from './authService'
`
  }

  /**
   * 运行初始化
   */
  async init() {
    console.log('🚀 开始初始化V6项目...\n')

    try {
      this.createDirectories()
      this.createBaseFiles()
      this.createTypeFiles()
      this.createUtilsFiles()
      this.createApiClient()
      this.createStoreExample()
      this.createServiceExample()

      console.log('\n✅ V6项目初始化完成！')
      console.log('\n下一步：')
      console.log('  1. 安装前端依赖: cd apps/frontend && npm install')
      console.log('  2. 安装后端依赖: cd apps/server && pip install -r requirements.txt')
      console.log('  3. 启动开发服务器: npm run dev')

    } catch (error) {
      console.error('❌ 初始化失败:', error)
      process.exit(1)
    }
  }
}

// 命令行接口
if (require.main === module) {
  const initializer = new ProjectInitializer()
  initializer.init()
}

module.exports = ProjectInitializer
