# Dashboard 运营看板 阶段0 完成报告（Task-DB-01）

## 阶段信息
- **阶段名称**：阶段 0: 基础设施 — 后端 Dashboard API + Service
- **完成日期**：2026-05-29
- **执行任务数**：1 / 2（Task-DB-01 已完成，Task-DB-02 待前端实现）

## 任务完成情况

| 任务编号 | 任务名称 | TDD 状态 | 验收状态 | 备注 |
|---------|---------|---------|---------|------|
| Task-DB-01 | 后端 Dashboard API + Service | ✅ 24 测试通过 | ✅ 全部验证标准通过 | |

## AC 覆盖验证

| AC 编号 | AC 描述 | 覆盖任务 | 验证方式 | 状态 |
|---------|---------|---------|---------|------|
| AC-001 | 核心指标数据与实际任务数据一致（任务数、完成率、超时数） | Task-DB-01（后端聚合查询） | 单元测试 16 用例 + API 测试 8 用例 | 🟡 后端完成，前端展示待 Task-DB-03 |

## 实现文件清单

### 新建文件
| 文件 | 说明 |
|------|------|
| `apps/server/app/schemas/dashboard.py` | DashboardStats, VehicleLocationItem, StatusCounts, DashboardResponse Pydantic 模型 |
| `apps/server/app/services/dashboard_service.py` | `get_dashboard(db)` 聚合查询函数 |
| `apps/server/app/api/v1/dashboard.py` | GET `/api/v1/dashboard` FastAPI 路由 |
| `apps/server/tests/test_dashboard_service.py` | Service 层 16 个测试用例 |
| `apps/server/tests/test_dashboard_api.py` | API 层 8 个测试用例 |

### 修改文件
| 文件 | 变更说明 |
|------|---------|
| `apps/server/app/main.py` | 注册 `dashboard_router` |
| `apps/server/tests/conftest.py` | client fixture 添加 dashboard_router |

## 关键实现细节

### API 端点
- `GET /api/v1/dashboard` — 需要认证（`get_current_user`），返回 `DashboardResponse`

### 响应结构
```json
{
  "stats": {
    "today_task_count": 12,
    "completion_rate": 0.85,
    "overdue_count": 2,
    "avg_transport_minutes": 32.5
  },
  "status_counts": {
    "pending": 5,
    "assigned": 3,
    "transiting": 8,
    "completed": 123,
    "overdue": 2
  },
  "vehicles": [
    {
      "id": "uuid",
      "plate_no": "沪A12345",
      "status": "idle",
      "lat": 31.23,
      "lng": 121.47,
      "location": "上海港",
      "driver_name": "张三",
      "driver_phone": "13800138000"
    }
  ]
}
```

### 设计决策
1. **使用 `func.current_date()` 替代 Python 端日期**：避免数据库时区与 Python UTC 时区不一致导致日期比较失败
2. **复用 `get_order_status_counts(db)`**：与调度中心共享同一状态统计逻辑，确保数据一致性
3. **Vehicle LEFT JOIN Driver**：使用 SQLAlchemy `outerjoin` 实现车辆与司机的左连接，无绑定司机时 driver_name/driver_phone 为 null

## 设计偏差记录
- **日期查询方式**：设计文档使用 `datetime.now(timezone.utc).date()` 做日期比较，实际改用 `func.current_date()` 在数据库端完成日期比较，避免时区不一致问题。功能行为不变。

## 遗留问题
无

## 交接信息（供下一个对话窗口使用）

### 下一个任务
**Task-DB-02: 前端骨架 + 路由菜单**

### 前置条件
- ✅ 后端 API 已就绪：`GET /api/v1/dashboard` 可用
- ✅ API 响应格式已确认（见上方响应结构）

### 前端需要创建的文件
- `apps/frontend/src/modules/dashboard/index.ts`
- `apps/frontend/src/modules/dashboard/types/index.ts`
- `apps/frontend/src/modules/dashboard/services/dashboardService.ts`
- `apps/frontend/src/modules/dashboard/stores/useDashboardStore.ts`
- `apps/frontend/src/modules/dashboard/pages/DashboardPage.vue`

### 前端需要修改的文件
- `apps/frontend/src/router/index.ts` — 新增 `/dashboard` 路由
- `apps/frontend/src/shared/components/AppLayout.vue` — 新增"运营看板"菜单项

### 测试命令
```bash
cd apps/server && python -m pytest tests/test_dashboard_service.py tests/test_dashboard_api.py -v
```
