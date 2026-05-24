# 任务箱号封号补充编辑 技术方案

> **版本**：v1.0
> **创建日期**：2026-05-23
> **需求文档**：[requirements.md](./requirements.md)
> **设计目标**：放宽任务编辑限制，允许已分配/运输中/已超时状态的任务编辑箱号和封号

---

## 一、功能概述
- **功能名称**：任务箱号封号补充编辑
- **需求文档**：[requirements.md](./requirements.md)
- **设计目标**：修改现有编辑逻辑，使已分配/运输中/已超时状态的任务可编辑箱号和封号，复用现有编辑弹窗，非待分配状态时禁用其他字段

---

## 二、现有代码分析

### 技术栈合规检查
- [x] UI 组件：仅使用 Element Plus（`el-button`、`el-input`、`el-select`、`el-dialog`、`el-form` 等）
- [x] 样式方案：仅使用 `<style scoped>`
- [x] 日期处理：仅使用 dayjs
- [x] 已用 Glob 工具审计 `shared/components/` 和 `shared/utils/`，本功能不引入新的共享组件

### 涉及模块

| 模块 | 文件 | 改动类型 |
|------|------|---------|
| 后端 Service | `apps/server/app/services/dispatch_service.py` | 修改 `update_order` |
| 前端表格逻辑 | `apps/frontend/src/modules/dispatch/components/useOrderTable.ts` | 修改 `canEdit` |
| 前端编辑弹窗 | `apps/frontend/src/modules/dispatch/components/OrderFormDialog.vue` | 传入编辑模式标识 |
| 前端表单 | `apps/frontend/src/modules/dispatch/composables/useOrderForm.ts` | 新增 `isLimitedEdit` 计算属性 |
| 前端集装箱区域 | `apps/frontend/src/modules/dispatch/components/sections/ContainerSection.vue` | 接收 disabled 属性 |
| 前端其他区域 | `BusinessSection.vue`、`RouteSection.vue`、`CustomerSection.vue` | 接收 disabled 属性 |

### 可复用抽象（已审计）

| 组件/工具 | 文件路径 | 验证状态 |
|-----------|---------|---------|
| OrderFormDialog | `components/OrderFormDialog.vue` | ✅ 已验证，复用现有弹窗 |
| ContainerSection | `components/sections/ContainerSection.vue` | ✅ 已验证，需加 disabled |
| useOrderForm | `composables/useOrderForm.ts` | ✅ 已验证，需加 isLimitedEdit |
| canEdit 函数 | `components/useOrderTable.ts` | ✅ 已验证，需修改判断逻辑 |
| update_order | `services/dispatch_service.py` | ✅ 已验证，需放宽状态限制 |

### 影响范围
- 现有"待分配"状态的编辑行为**不受影响**（AC-008）
- 现有箱号唯一性校验、格式校验、自动转大写逻辑**完全复用**，无需修改

---

## 三、数据模型设计

**无数据库变更**。`container_no` 和 `seal_no` 字段已是 `nullable=True`，无需新增字段或迁移。

---

## 四、API 设计

**无新增接口**。复用现有 `PUT /api/v1/dispatch/orders/{id}` 接口。

### 现有接口行为变更

| 方法 | 路径 | 变更前 | 变更后 | 对应 AC |
|------|------|--------|--------|---------|
| PUT | `/dispatch/orders/{id}` | 仅待分配状态可编辑 | 待分配可编辑全部字段；已分配/运输中/已超时仅可编辑 container_no 和 seal_no | → AC-001, AC-007 |

### 后端校验逻辑变更

`dispatch_service.py` — `update_order` 函数：

```python
# 变更前
if order.status != OrderStatus.PENDING.value:
    raise AppException(code=422, message="仅待分配状态的任务可编辑")

# 变更后
EDITABLE_STATUSES = {
    OrderStatus.PENDING.value,
    OrderStatus.ASSIGNED.value,
    OrderStatus.TRANSITING.value,
    OrderStatus.OVERDUE.value,
}

if order.status not in EDITABLE_STATUSES:
    raise AppException(code=422, message="该状态的任务不可编辑")

# 根据状态决定可更新字段
if order.status == OrderStatus.PENDING.value:
    # 待分配：可编辑全部字段（现有逻辑不变）
    updatable_fields = [
        "customer_name", "customer_phone", "origin_name",
        "dest_name", "container_type", "business_type",
        "container_status", "remark",
    ]
    # container_no, seal_no, waypoints, documents 也正常处理
else:
    # 已分配/运输中/已超时：仅允许 container_no 和 seal_no
    updatable_fields = []
    # container_no 和 seal_no 单独处理（已有逻辑）
```

→ AC-007：非待分配状态仅允许编辑箱号和封号
→ AC-008：待分配状态编辑行为不变

---

## 五、前端设计

### 5.1 编辑按钮显示逻辑

**文件**：`useOrderTable.ts` — `canEdit` 函数

```typescript
// 变更前
export function canEdit(order: Order): boolean {
  return order.status === OrderStatus.PENDING
}

// 变更后
export function canEdit(order: Order): boolean {
  return order.status !== OrderStatus.COMPLETED
}
```

→ AC-001：已分配/运输中/已超时显示编辑按钮
→ AC-004：已完成不显示编辑按钮

### 5.2 有限编辑模式标识

**文件**：`useOrderForm.ts`

新增计算属性 `isLimitedEdit`，表示当前是"有限编辑模式"（仅箱号+封号可编辑）：

```typescript
const isLimitedEdit = computed(() => {
  return isEditMode.value
    && options.order.value !== null
    && options.order.value !== undefined
    && options.order.value.status !== OrderStatus.PENDING
})
```

### 5.3 编辑弹窗字段禁用

**文件**：`OrderFormDialog.vue`

将 `isLimitedEdit` 传递给各 Section 组件，非待分配状态时禁用除箱号/封号外的所有字段：

| Section | 禁用字段 | 可编辑字段 |
|---------|---------|-----------|
| BusinessSection | 全部（业务类型、空重箱、单证） | 无 |
| RouteSection | 全部（起运地、目的地、途径点） | 无 |
| ContainerSection | 箱型、空重箱 | 箱号、封号 |
| CustomerSection | 全部（客户名称、联系电话） | 无 |
| 备注 | 禁用 | 无 |

→ AC-001：箱号和封号可编辑，其他字段禁用
→ AC-007：仅允许编辑箱号和封号

### 5.4 ContainerSection 改动

**文件**：`ContainerSection.vue`

新增 `disabled` prop，控制箱型和空重箱下拉框的禁用状态：

```vue
<el-select v-model="containerType" :disabled="disabled" ...>
<el-select v-model="containerStatus" :disabled="disabled" ...>
```

箱号和封号的 `el-input` 不受 `disabled` 影响，始终可编辑。

### 5.5 其他 Section 改动

`BusinessSection.vue`、`RouteSection.vue`、`CustomerSection.vue` 各自新增 `disabled` prop，传入后对内部所有表单控件设置 `:disabled="disabled"`。

---

## 六、核心逻辑

### 6.1 后端 update_order 改造

**文件**：`apps/server/app/services/dispatch_service.py`

核心变更点：

1. **状态校验放宽**：从"仅待分配"改为"待分配/已分配/运输中/已超时"
2. **字段过滤**：非待分配状态时，忽略请求中除 `container_no` 和 `seal_no` 以外的所有字段
3. **校验逻辑复用**：箱号唯一性校验（`validate_container_no_unique`）、格式校验、自动转大写逻辑完全复用，无需修改

```python
async def update_order(db, order_id, data):
    # ... 查询 order ...

    if order.status not in EDITABLE_STATUSES:
        raise AppException(code=422, message="该状态的任务不可编辑")

    # 箱号/封号处理（所有可编辑状态通用）
    container_no = data.get("container_no")
    if container_no is not None:
        container_no = container_no.upper() if container_no else None
        if container_no:
            await validate_container_no_unique(db, container_no, exclude_order_id=order_id)

    seal_no = data.get("seal_no")
    if seal_no is not None:
        seal_no = seal_no.upper() if seal_no else None

    # 仅待分配状态可更新其他字段
    if order.status == OrderStatus.PENDING.value:
        origin_name = data.get("origin_name")
        dest_name = data.get("dest_name")
        if origin_name is not None and dest_name is not None and origin_name == dest_name:
            raise AppException(code=422, message="起运地和目的地不能相同")

        updatable_fields = [
            "customer_name", "customer_phone", "origin_name",
            "dest_name", "container_type", "business_type",
            "container_status", "remark",
        ]
        for field in updatable_fields:
            if field in data and data[field] is not None:
                setattr(order, field, data[field])

        if "waypoints" in data:
            order.waypoints = json.dumps(data["waypoints"], ensure_ascii=False) if data["waypoints"] else None
        if "documents" in data:
            order.documents = json.dumps(data["documents"], ensure_ascii=False) if data["documents"] else None

    # 箱号/封号更新（所有可编辑状态通用）
    if container_no is not None:
        order.container_no = container_no
    if seal_no is not None:
        order.seal_no = seal_no

    await db.commit()
    await db.refresh(order)
    return order
```

→ AC-002：箱号自动转大写并保存
→ AC-003：封号自动转大写并保存
→ AC-005：箱号唯一性校验
→ AC-006：箱号格式校验（由 Schema 层 `pattern` 规则保证）
→ AC-007：非待分配状态仅允许编辑箱号和封号
→ AC-008：待分配状态编辑行为不变

### 6.2 前端编辑弹窗改造

**关键决策**：复用现有 `OrderFormDialog.vue`，通过 `isLimitedEdit` 计算属性控制字段禁用状态，不新建弹窗。

**弹窗标题**：有限编辑模式下，标题改为"补充箱号封号"，让调度员明确知道只能编辑这两个字段。

```typescript
const dialogTitle = computed(() => {
  if (isLimitedEdit.value) return '补充箱号封号'
  return isEditMode.value ? '编辑任务' : '新建任务'
})
```

→ AC-001：弹出编辑弹窗，箱号和封号可编辑，其他字段禁用

---

## 七、AC 覆盖汇总表

| AC 编号 | AC 描述 | 技术实现点 | 状态 |
|---------|---------|-----------|------|
| AC-001 | 已分配/运输中/已超时点击编辑→弹窗仅箱号封号可编辑 | `canEdit` 放宽 + `isLimitedEdit` 控制字段禁用 | ✅ 已覆盖 |
| AC-002 | 编辑箱号→自动转大写保存 | 后端 `update_order` 已有转大写逻辑，复用 | ✅ 已覆盖 |
| AC-003 | 编辑封号→自动转大写保存 | 后端 `update_order` 已有转大写逻辑，复用 | ✅ 已覆盖 |
| AC-004 | 已完成状态不显示编辑按钮 | `canEdit` 返回 `status !== COMPLETED` | ✅ 已覆盖 |
| AC-005 | 箱号重复→提示错误 | `validate_container_no_unique` 复用 | ✅ 已覆盖 |
| AC-006 | 箱号格式错误→提示错误 | Schema `pattern` 校验复用 | ✅ 已覆盖 |
| AC-007 | 非待分配仅允许编辑箱号封号 | 后端字段过滤 + 前端字段禁用 | ✅ 已覆盖 |
| AC-008 | 待分配编辑行为不变 | 后端 `if status == PENDING` 走原逻辑 | ✅ 已覆盖 |

---

## 八、设计决策记录

### 决策1：复用现有编辑弹窗 vs 新建"补箱号"弹窗
- **选项 A**：复用现有 `OrderFormDialog.vue`，通过 `isLimitedEdit` 控制字段禁用 → 优点：改动小，不增加新组件；缺点：弹窗中有大量禁用字段
- **选项 B**：新建 `ContainerEditDialog.vue`，只含箱号和封号 → 优点：弹窗简洁；缺点：新增组件，逻辑重复
- **选择**：A
- **理由**：改动最小化原则，禁用字段在视觉上明确告知调度员"只能改这两个"，且弹窗标题改为"补充箱号封号"进一步明确意图

### 决策2：后端字段过滤 vs 前端字段过滤
- **选项 A**：后端在 `update_order` 中根据状态过滤可更新字段 → 优点：安全性高，绕过前端也能保证数据安全
- **选项 B**：仅前端禁用字段，后端不做限制 → 优点：后端改动更小；缺点：API 可被直接调用绕过
- **选择**：A
- **理由**：后端必须做字段过滤，这是数据安全的基本要求。前端禁用只是 UX 层面的辅助

---

## 九、关联文档
- 需求文档：[requirements.md](./requirements.md)
- 调度中心需求：[../dispatch/requirements.md](../dispatch/requirements.md)
- 调度中心设计：[../dispatch/design.md](../dispatch/design.md)
- 联动需求：[../dispatch-fleet-linkage/requirements.md](../dispatch-fleet-linkage/requirements.md)
