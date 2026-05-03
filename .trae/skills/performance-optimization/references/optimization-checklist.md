# 性能优化检查清单

> 本文档为 `performance-optimization` Skill 的参考检查清单。

---

## 一、加载性能

- [ ] 首屏加载时间 < 3 秒（LCP）
- [ ] 首次内容绘制（FCP）< 1.5 秒
- [ ] 可交互时间（TTI）< 3.5 秒
- [ ] 累积布局偏移（CLS）< 0.1

### 优化手段
- 代码分割（动态 import）
- 路由懒加载
- 第三方库按需引入
- 图片懒加载 + WebP 格式
- 静态资源 CDN
- Gzip/Brotli 压缩
- 关键 CSS 内联

## 二、渲染性能

- [ ] 列表渲染使用虚拟滚动（> 100 条）
- [ ] 大组件使用 `v-memo` 或 `React.memo`
- [ ] 计算属性无副作用
- [ ] 避免在模板中使用复杂表达式
- [ ] 事件处理函数避免频繁创建

### 优化手段
- `computed` 代替模板内计算
- `v-once` 用于静态内容
- `v-show` vs `v-if` 选择正确
- `key` 属性正确使用
- `requestAnimationFrame` 用于动画

## 三、网络性能

- [ ] API 请求有缓存策略
- [ ] 列表接口支持分页
- [ ] 避免重复请求（防抖/节流）
- [ ] 请求合并（批量接口）
- [ ] 预加载关键数据

### 优化手段
- SWR/React Query 缓存
- 请求去重
- 乐观更新
- 预取（prefetch）
- 接口响应压缩

## 四、包体积

- [ ] 主包 < 500KB（gzip 后）
- [ ] 无重复依赖
- [ ] Tree-shaking 生效
- [ ] 无未使用的导入

### 优化手段
- `vite-plugin-visualizer` 分析
- 替换大型库（dayjs → date-fns）
- 按需引入 UI 组件
- 移除 polyfill（不需要的）
- 动态导入大型模块

## 五、数据库查询（后端）

- [ ] 查询有索引覆盖
- [ ] 无 N+1 查询
- [ ] 大表查询有分页
- [ ] 避免 `SELECT *`
- [ ] 复杂查询使用 EXPLAIN 分析

### 优化手段
- 添加缺失索引
- 使用 `select_related` / `prefetch_related`
- 查询结果缓存（Redis）
- 读写分离
- 慢查询日志监控
