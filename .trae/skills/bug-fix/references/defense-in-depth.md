# 多层防护方法

## 什么时候用

修完一个 Bug 后，只在修的位置加一层检查是不够的。不同的代码路径、未来的重构、测试中的模拟数据，都可能绕过这一层检查。

**核心原则**：在数据经过的每一层都加验证，让 Bug 在结构上不可能再出现。

## 四层防护

### 第一层：入口验证

在数据进入系统的地方，拒绝明显无效的输入。

```typescript
// API 请求验证
async function createOrder(data: CreateOrderRequest) {
  if (!data.warehouseId || data.warehouseId.trim() === '') {
    throw new Error('仓库 ID 不能为空')
  }
  if (data.quantity <= 0) {
    throw new Error('数量必须大于 0')
  }
  // 继续处理
}
```

### 第二层：业务逻辑验证

在核心业务逻辑中，确保数据在当前场景下是合理的。

```typescript
// 业务逻辑验证
function calculateStorageFee(order: Order, slot: StorageSlot) {
  if (order.warehouseId !== slot.warehouseId) {
    throw new Error('订单和库位不属于同一仓库')
  }
  // 继续计算
}
```

### 第三层：环境保护

在特定环境下（测试、开发、生产），防止危险操作。

```python
# 环境保护：测试环境下禁止操作生产数据库
def get_database_url():
    url = settings.DATABASE_URL
    if settings.ENV == "test" and "production" in url:
        raise RuntimeError("测试环境不能连接生产数据库")
    return url
```

### 第四层：调试日志

当上面三层都没拦住时，日志帮你快速定位。

```typescript
// 调试日志
async function processOrder(orderId: string) {
  logger.debug('开始处理订单', {
    orderId,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
  })
  // 处理逻辑
}
```

## 实际应用

发现一个 Bug 后：

1. **追踪数据流向**：坏数据从哪来？经过了哪些地方？
2. **标记所有检查点**：列出数据经过的每一层
3. **在每一层加验证**：入口、业务、环境、日志
4. **测试每一层**：试着绕过第一层，看第二层能不能拦住

## 例子

Bug：订单创建时仓库 ID 为空，导致数据库写入失败。

**数据流向**：
```
前端表单 → API 请求 → 业务逻辑 → 数据库写入
```

**防护方案**：
- 第一层：前端表单提交前检查仓库 ID 不为空
- 第二层：API 入口检查请求参数中仓库 ID 不为空
- 第三层：业务逻辑中检查仓库 ID 对应的仓库确实存在
- 第四层：数据库写入前打印完整 SQL 日志

这样即使前端检查被绕过，API 层也能拦住；API 层被绕过，业务层也能拦住。

## 底线

- 一层检查不够，多层才能让 Bug 不可能再出现
- 每层检查的内容可以不同（入口查格式，业务查合理性，环境保护上下文）
- 不要因为"加了入口检查就够了"而跳过其他层
