# 根因追溯方法

## 什么时候用

Bug 往往出现在调用链的深处，但根因在入口处。比如：页面显示错误，表面是组件渲染问题，实际是接口返回了空数据，根因是数据库查询条件写错了。

**核心原则**：从报错位置沿着调用链往回追，直到找到最初触发点，在源头修复。

## 追溯步骤

### 1. 观察表面现象

```
报错：订单列表显示为空
位置：OrderList.vue 第 45 行
```

### 2. 找到直接原因

什么代码直接导致了这个现象？

```typescript
// OrderList.vue
const orders = computed(() => store.orders)
// orders 是空数组 []
```

### 3. 往上追：谁调用了这里？

```
store.orders 为空
  → 来自 orderStore.fetchOrders()
  → 调用 OrderService.getOrders()
  → 调用 GET /api/v1/orders
  → 后端返回 { data: [] }
```

### 4. 继续追：数据从哪来？

```
后端返回空数组
  → 数据库查询：SELECT * FROM orders WHERE status = ?
  → 传入的 status 参数是 undefined
  → 前端请求时没传 status 参数
```

### 5. 找到最初触发点

```
前端请求没传 status 参数
  → 筛选条件组件 FilterBar.vue 的 status 字段未绑定
  → 根因：FilterBar.vue 缺少 status 字段的双向绑定
```

## 多模块问题排查

当问题涉及多个模块（前端 → API → 数据库），逐层打日志定位边界：

```typescript
// 前端：打印请求参数
console.error('DEBUG 请求参数:', { status: filter.status })

// 后端 API：打印接收到的参数
print(f"DEBUG 接收到参数: status={status}")

// 数据库：打印实际 SQL
print(f"DEBUG 执行 SQL: {query}")
```

**关键**：找到"数据在哪一层变错的"——如果前端传的是对的，后端收到是错的，问题在传输层；如果后端收到是对的，数据库查到是错的，问题在查询层。

## 找哪个测试导致了污染

如果测试套件中某个测试污染了全局状态，导致后续测试失败：

```bash
# 逐个运行测试文件，找到出问题的那一个
npx vitest run --reporter=verbose 2>&1 | grep "FAIL"
```

## 底线

- 不要在报错位置直接修，要追溯到根因
- 多模块问题必须逐层排查，不跳步
- 找到根因后，在源头修复，同时在关键位置加防护
