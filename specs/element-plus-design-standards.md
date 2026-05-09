# 青投供应链 Element Plus 设计规范

> 基于 Element Plus 设计语言的完整设计规范文档，用于指导青投供应链 V6 系统的开发
>
> 版本：v3.0.0（V6 适配版）
> 来源：继承自 V4 项目 `docs/technical/2026-03-15-ElementPlus设计规范.md` v2.3.0
> 适配日期：2026-05-07
> 适配说明：移除 Tailwind CSS 引用，更新为 V6 模块化目录结构，保留所有设计 Token 和业务色定义

---

## 目录

### 一、基础规范
- [1. 概述](#1-概述)
- [2. 设计原则](#2-设计原则)
- [3. 色彩规范](#3-色彩规范)
- [4. 字体规范](#4-字体规范)
- [5. 间距规范](#5-间距规范)
- [6. 圆角规范](#6-圆角规范)
- [7. 阴影规范](#7-阴影规范)
- [8. 动画规范](#8-动画规范)

### 二、布局规范
- [9. 栅格系统](#9-栅格系统)
- [10. 响应式断点](#10-响应式断点)
- [11. 容器规范](#11-容器规范)

### 三、组件规范
- [12. 按钮组件](#12-按钮组件)
- [13. 输入框组件](#13-输入框组件)
- [14. 选择器组件](#14-选择器组件)
- [15. 表格组件](#15-表格组件)
- [16. 卡片组件](#16-卡片组件)
- [17. 模态框组件](#17-模态框组件)
- [18. 消息提示](#18-消息提示)
- [19. 标签组件](#19-标签组件)
- [20. 加载状态](#20-加载状态)
- [21. 分页组件](#21-分页组件)
- [22. 标签页](#22-标签页)
- [23. 空状态](#23-空状态)

### 四、业务组件（青投定制）
- [24. 车辆状态](#24-车辆状态)
- [25. 订单状态](#25-订单状态)
- [26. 统计卡片](#26-统计卡片)
- [27. 筛选面板](#27-筛选面板)

### 五、代码规范
- [28. CSS 变量命名](#28-css-变量命名)
- [29. Vue 组件封装](#29-vue-组件封装)
- [30. 样式穿透](#30-样式穿透)

### 六、V6 项目适配说明
- [31. V4 → V6 差异对照](#31-v4--v6-差异对照)

---

## 一、基础规范

### 1. 概述

#### 1.1 设计目标

本设计规范旨在为青投供应链系统提供一套统一、完整、可维护的 UI 设计标准，确保：

- **一致性**：所有页面和组件保持统一的视觉风格
- **效率**：提高开发效率，减少重复设计决策
- **可维护性**：便于后续迭代和扩展
- **专业性**：体现物流供应链行业的专业形象

#### 1.2 适用范围

- 青投供应链 Web 管理系统（Vue 3 + Element Plus）
- 移动端适配页面

#### 1.3 技术栈（V6）

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.32 | 渐进式前端框架 |
| Element Plus | 2.13.5 | Vue 3 组件库 |
| Vite | 8.0.10 | 构建工具 |
| TypeScript | ~6.0.2 | 类型支持 |

> **注意**：V6 不使用 Tailwind CSS，样式通过 Element Plus 原生变量 + scoped CSS 实现。

#### 1.4 术语定义

| 术语 | 定义 |
|------|------|
| Primary | 主色，品牌色，用于主要操作和强调 |
| Success | 成功色，表示完成、正常状态 |
| Warning | 警告色，表示需要注意的状态 |
| Danger | 危险色，表示错误、删除等危险操作 |
| Info | 信息色，用于一般信息提示 |

---

### 2. 设计原则

#### 2.1 一致性（Consistency）

- 相同功能的组件在整个系统中保持相同的外观和行为
- 遵循 Element Plus 的设计规范，不随意创造新样式
- 颜色、字体、间距等使用预定义的 Token

#### 2.2 效率（Efficiency）

- 减少用户操作步骤，提供快捷功能
- 合理使用默认值和智能填充
- 批量操作支持

#### 2.3 青投业务特性

- 突出物流行业的实时性特点
- 强调状态可视化的重要性
- 支持复杂业务场景的展示

---

### 3. 色彩规范

#### 3.1 CSS 变量定义

```css
:root {
  /* ========== 主色 ========== */
  --ep-primary: #409EFF;
  --ep-primary-light-1: #53a8ff;
  --ep-primary-light-2: #66b1ff;
  --ep-primary-light-3: #79bbff;
  --ep-primary-light-4: #8cc5ff;
  --ep-primary-light-5: #a0cfff;
  --ep-primary-light-6: #b3d8ff;
  --ep-primary-light-7: #c6e2ff;
  --ep-primary-light-8: #d9ecff;
  --ep-primary-light-9: #ecf5ff;
  --ep-primary-dark-2: #3375b9;

  /* ========== 功能色 ========== */
  --ep-success: #67C23A;
  --ep-success-light: #95d475;
  --ep-success-dark: #529b2e;

  --ep-warning: #E6A23C;
  --ep-warning-light: #eebe78;
  --ep-warning-dark: #b88230;

  --ep-danger: #F56C6C;
  --ep-danger-light: #f89898;
  --ep-danger-dark: #c45656;

  --ep-info: #909399;
  --ep-info-light: #b1b3b8;
  --ep-info-dark: #73767a;

  /* ========== 背景色 ========== */
  --ep-bg-white: #FFFFFF;
  --ep-bg-black: #000000;
  --ep-bg-page: #F5F7FA;
  --ep-bg-content: #FFFFFF;
  --ep-bg-overlay: rgba(0, 0, 0, 0.8);

  /* ========== 文字色 ========== */
  --ep-text-primary: #303133;
  --ep-text-regular: #606266;
  --ep-text-secondary: #909399;
  --ep-text-placeholder: #C0C4CC;
  --ep-text-disabled: #C0C4CC;

  /* ========== 边框色 ========== */
  --ep-border-base: #DCDFE6;
  --ep-border-light: #E4E7ED;
  --ep-border-lighter: #EBEEF5;
  --ep-border-dark: #D4D7DE;

  /* ========== 青投业务色 ========== */
  /* 订单状态色 */
  --qt-status-pending: #909399;
  --qt-status-assigned: #409EFF;
  --qt-status-transit: #E6A23C;
  --qt-status-completed: #67C23A;
  --qt-status-exception: #F56C6C;
  --qt-status-cancelled: #C0C4CC;
  --qt-status-pending-confirm: #E6A23C;

  /* 车辆状态色 — fleet 模块 StatusTag 组件直接使用 */
  --qt-vehicle-idle: #67C23A;
  --qt-vehicle-transiting: #409EFF;
  --qt-vehicle-overdue: #F56C6C;
}
```

#### 3.2 色彩使用场景

| 颜色 | 使用场景 | 示例 |
|------|----------|------|
| Primary | 主要按钮、链接、选中状态 | 提交按钮、导航选中 |
| Success | 成功操作、正常状态 | 完成状态、启用状态 |
| Warning | 警告提示、需要注意 | 即将过期、库存预警 |
| Danger | 危险操作、错误状态 | 删除按钮、失败状态 |
| Info | 辅助信息、次要内容 | 提示文字、说明信息 |

---

### 4. 字体规范

#### 4.1 字体家族

```css
:root {
  --ep-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
                    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue',
                    Helvetica, Arial, sans-serif;
  --ep-font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,
                         Courier, monospace;
}
```

#### 4.2 字号系统

| 级别 | CSS 变量 | 值 | 使用场景 |
|------|----------|-----|----------|
| 超大 | `--ep-font-size-super` | 20px | 页面标题 |
| 大 | `--ep-font-size-large` | 18px | 卡片标题、模态框标题 |
| 中 | `--ep-font-size-medium` | 16px | 小标题、重要文本 |
| 基础 | `--ep-font-size-base` | 14px | 正文、按钮、输入框 |
| 小 | `--ep-font-size-small` | 13px | 辅助说明、表格内容 |
| 超小 | `--ep-font-size-extra-small` | 12px | 标签、提示文字 |

#### 4.3 字重系统

| 级别 | CSS 变量 | 值 | 使用场景 |
|------|----------|-----|----------|
| 常规 | `--ep-font-weight-regular` | 400 | 正文 |
| 中等 | `--ep-font-weight-medium` | 500 | 按钮、标签 |
| 加粗 | `--ep-font-weight-bold` | 600 | 标题、强调文本 |

---

### 5. 间距规范

#### 5.1 基础间距系统

| Token | 值 | 使用场景 |
|-------|-----|----------|
| `--ep-spacing-xs` | 4px | 图标与文字间距 |
| `--ep-spacing-sm` | 8px | 相关元素间距 |
| `--ep-spacing-md` | 12px | 组件内边距 |
| `--ep-spacing-lg` | 16px | 组件间距 |
| `--ep-spacing-xl` | 20px | 区块间距 |
| `--ep-spacing-2xl` | 24px | 大区块间距 |
| `--ep-spacing-3xl` | 32px | 页面级间距 |

#### 5.2 组件内边距规范

```css
--ep-btn-padding-x: 16px;
--ep-btn-padding-y: 8px;
--ep-card-padding: 20px;
--ep-table-cell-padding: 12px 16px;
--ep-input-padding: 8px 12px;
--ep-form-item-margin-bottom: 22px;
```

---

### 6. 圆角规范

| Token | 值 | 使用场景 |
|-------|-----|----------|
| `--ep-radius-small` | 2px | 标签、小按钮 |
| `--ep-radius-base` | 4px | 按钮、输入框、卡片 |
| `--ep-radius-medium` | 8px | 模态框、下拉菜单 |
| `--ep-radius-large` | 12px | 大卡片、弹窗 |
| `--ep-radius-round` | 9999px | 圆形按钮、头像 |

---

### 7. 阴影规范

```css
:root {
  --ep-shadow-base: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  --ep-shadow-light: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  --ep-shadow-lighter: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --ep-shadow-dark: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  --ep-shadow-focus: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
```

---

### 8. 动画规范

```css
:root {
  --ep-transition-duration-fast: 150ms;
  --ep-transition-duration-base: 300ms;
  --ep-transition-duration-slow: 500ms;
}
```

---

## 二、布局规范

### 9. 栅格系统

采用 24 栏栅格系统，使用 `el-row` 和 `el-col` 组件：

```vue
<el-row :gutter="16">
  <el-col :span="12">左侧内容</el-col>
  <el-col :span="12">右侧内容</el-col>
</el-row>

<!-- 响应式栅格 -->
<el-row>
  <el-col :xs="24" :sm="12" :md="8" :lg="6">响应式内容</el-col>
</el-row>
```

---

### 10. 响应式断点

```css
:root {
  --ep-breakpoint-xs: 480px;
  --ep-breakpoint-sm: 768px;
  --ep-breakpoint-md: 992px;
  --ep-breakpoint-lg: 1200px;
  --ep-breakpoint-xl: 1920px;
}
```

---

### 11. 容器规范

```css
:root {
  --ep-container-max-width: 1200px;
  --ep-container-padding: 20px;
}
```

---

## 三、组件规范

### 12. 按钮组件

```vue
<el-button type="primary">主要按钮</el-button>
<el-button>默认按钮</el-button>
<el-button type="success">成功</el-button>
<el-button type="warning">警告</el-button>
<el-button type="danger">危险</el-button>
<el-button disabled>禁用</el-button>
<el-button :loading="true">加载中</el-button>
```

---

### 13. 输入框组件

```vue
<el-input v-model="value" placeholder="请输入内容" />
<el-input type="password" placeholder="请输入密码" show-password />
<el-input-number :min="1" :max="100" />
<el-input type="textarea" :rows="4" placeholder="请输入描述" />
```

---

### 14. 选择器组件

```vue
<el-select v-model="value" placeholder="请选择">
  <el-option value="1" label="选项 1" />
  <el-option value="2" label="选项 2" />
</el-select>

<el-radio-group v-model="radioValue">
  <el-radio value="1">选项 1</el-radio>
</el-radio-group>

<el-checkbox-group v-model="checkedList">
  <el-checkbox value="1">选项 1</el-checkbox>
</el-checkbox-group>

<el-switch v-model="checked" />
```

---

### 15. 表格组件

```vue
<el-table :data="tableData" stripe border>
  <el-table-column prop="name" label="名称" />
  <el-table-column prop="status" label="状态">
    <template #default="{ row }">
      <StatusTag :status="row.status" />
    </template>
  </el-table-column>
</el-table>
```

---

### 16. 卡片组件

```vue
<el-card header="卡片标题">
  <p>卡片内容</p>
</el-card>
```

---

### 17. 模态框组件

```vue
<el-dialog v-model="visible" title="标题" width="520px">
  <p>内容</p>
  <template #footer>
    <el-button @click="visible = false">取消</el-button>
    <el-button type="primary" @click="handleConfirm">确定</el-button>
  </template>
</el-dialog>
```

---

### 18. 消息提示

```vue
<script setup>
import { ElMessage } from 'element-plus'

ElMessage.success('操作成功')
ElMessage.warning('请注意')
ElMessage.error('操作失败')
ElMessage.info('提示信息')
</script>
```

---

### 19. 标签组件

```vue
<el-tag>标签</el-tag>
<el-tag type="primary">主要</el-tag>
<el-tag type="success">成功</el-tag>
<el-tag type="warning">警告</el-tag>
<el-tag type="danger">危险</el-tag>
```

---

### 20. 加载状态

```vue
<el-loading :loading="loading" text="加载中..." />
```

---

### 21. 分页组件

```vue
<el-pagination
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  :total="total"
  layout="total, sizes, prev, pager, next, jumper"
/>
```

---

### 22. 标签页

```vue
<el-tabs v-model="activeTab">
  <el-tab-pane label="标签 1" name="1">内容 1</el-tab-pane>
  <el-tab-pane label="标签 2" name="2">内容 2</el-tab-pane>
</el-tabs>
```

---

### 23. 空状态

```vue
<el-empty description="暂无数据">
  <el-button type="primary">新建</el-button>
</el-empty>
```

---

## 四、业务组件（青投定制）

### 24. 车辆状态

> **fleet 模块 StatusTag 组件直接使用以下颜色定义**

| 状态码 | 状态名 | 颜色变量 | 颜色值 | 说明 |
|--------|--------|----------|--------|------|
| idle | 空闲 | `--qt-vehicle-idle` | #67C23A | 绿色，车辆可用 |
| transiting | 运输中 | `--qt-vehicle-transiting` | #409EFF | 蓝色，正在执行任务 |
| overdue | 超时 | `--qt-vehicle-overdue` | #F56C6C | 红色，任务超时未完成 |

**StatusTag 组件实现参考**：

```vue
<!-- apps/frontend/src/modules/fleet/components/StatusTag.vue -->
<script setup lang="ts">
import type { VehicleStatus } from '../types/vehicle'

defineProps<{
  status: VehicleStatus
}>()

const statusConfig: Record<VehicleStatus, { label: string; color: string }> = {
  idle: { label: '空闲', color: 'var(--qt-vehicle-idle)' },
  transiting: { label: '运输中', color: 'var(--qt-vehicle-transiting)' },
  overdue: { label: '超时', color: 'var(--qt-vehicle-overdue)' },
}
</script>

<template>
  <el-tag :color="statusConfig[status].color" effect="dark" size="small">
    {{ statusConfig[status].label }}
  </el-tag>
</template>
```

---

### 25. 订单状态

| 状态码 | 状态名 | 颜色变量 | 颜色值 |
|--------|--------|----------|--------|
| pending | 待分配 | `--qt-status-pending` | #909399 |
| assigned | 已分配 | `--qt-status-assigned` | #409EFF |
| transit | 运输中 | `--qt-status-transit` | #E6A23C |
| pending-confirm | 待确认 | `--qt-status-pending-confirm` | #E6A23C |
| completed | 已完成 | `--qt-status-completed` | #67C23A |
| exception | 异常 | `--qt-status-exception` | #F56C6C |
| cancelled | 已取消 | `--qt-status-cancelled` | #C0C4CC |

---

### 26. 统计卡片

```vue
<el-card class="stat-card">
  <div class="stat-title">{{ title }}</div>
  <div class="stat-value">{{ value }}</div>
  <div v-if="trend" class="stat-trend" :class="trend.type">
    {{ trend.type === 'up' ? '↑' : '↓' }} {{ trend.value }}%
  </div>
</el-card>
```

---

### 27. 筛选面板

```vue
<el-form :model="filters" inline>
  <el-form-item label="状态">
    <el-select v-model="filters.status" placeholder="全部" clearable>
      <el-option value="idle" label="空闲" />
      <el-option value="transiting" label="运输中" />
      <el-option value="overdue" label="超时" />
    </el-select>
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="handleSearch">查询</el-button>
    <el-button @click="handleReset">重置</el-button>
  </el-form-item>
</el-form>
```

---

## 五、代码规范

### 28. CSS 变量命名

```css
/* 格式：--{prefix}-{category}-{name} */
:root {
  --ep-primary: #409EFF;
  --qt-status-pending: #909399;
}
```

| 前缀 | 用途 |
|------|------|
| `--ep-` | Element Plus 基础变量 |
| `--qt-` | 青投业务定制变量 |

---

### 29. Vue 组件封装

使用 `<script setup>` 语法：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title: string
}>()

const emit = defineEmits<{
  update: [value: string]
}>()
</script>
```

---

### 30. 样式穿透

```vue
<style scoped>
.custom-table :deep(.el-table__header th) {
  background: #fafafa;
}
</style>
```

---

## 六、V6 项目适配说明

### 31. V4 → V6 差异对照

| 维度 | V4 | V6 | 说明 |
|------|-----|-----|------|
| CSS 框架 | Tailwind CSS + Element Plus | 仅 Element Plus | V6 移除 Tailwind，用 scoped CSS |
| 目录结构 | `src/components/`、`src/pages/` | `src/modules/<name>/components/` | V6 采用模块化特性架构 |
| 共享组件 | `src/components/` | `src/shared/components/` | 跨模块复用组件放 shared |
| 车辆状态 | available/transit/maintenance/repair/offline | idle/transiting/overdue | V6 简化车辆状态，与 dispatch 对齐 |
| 构建工具 | Vite 6.2.0 | Vite 8.0.10 | 版本升级 |
| TypeScript | ~5.8.2 | ~6.0.2 | 版本升级 |

---

## 附录 A：快速参考

| 类别 | Token | 值 |
|------|-------|-----|
| 主色 | `--ep-primary` | #409EFF |
| 成功色 | `--ep-success` | #67C23A |
| 警告色 | `--ep-warning` | #E6A23C |
| 危险色 | `--ep-danger` | #F56C6C |
| 车辆空闲 | `--qt-vehicle-idle` | #67C23A |
| 车辆运输中 | `--qt-vehicle-transiting` | #409EFF |
| 车辆超时 | `--qt-vehicle-overdue` | #F56C6C |
| 基础字号 | `--ep-font-size-base` | 14px |
| 基础间距 | `--ep-spacing-lg` | 16px |
| 基础圆角 | `--ep-radius-base` | 4px |

## 附录 B：资源链接

- [Element Plus 官方文档](https://element-plus.org/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)

---

*文档版本：v3.0.0（V6 适配版） | 来源：V4 v2.3.0 | 适配日期：2026-05-07*
