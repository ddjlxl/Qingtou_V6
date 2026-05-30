# 车载北斗定位接入 — 任务规划

> **版本**：v1.0
> **创建日期**：2026-05-29
> **技术方案**：[design.md](./design.md)
> **需求文档**：[requirements.md](./requirements.md)
> **策略**：垂直切片 — 任务按依赖顺序排列，每个任务交付可独立验证的完整功能

---

## ⚠️ TDD 开发流程

**每个任务必须按 RED → GREEN → REFACTOR 循环执行。**

```
┌─────────────────────────────────────────────────────────────┐
│  任务执行流程（每个任务内部）                                   │
├─────────────────────────────────────────────────────────────┤
│  1. RED 阶段：先写失败的测试                                   │
│  2. GREEN 阶段：写最小实现让测试通过                            │
│  3. REFACTOR 阶段：重构优化，保持测试通过                       │
└─────────────────────────────────────────────────────────────┘
```

**项目零容忍规则**（详见 [development-standards.md](../../development-standards.md)）：
- 禁止 `any` 类型
- 禁止 `console.log`
- 文件不超过 500 行
- 函数不超过 80 行
- 禁止写未被请求的功能

---

## 任务概览

| 任务编号 | 任务名称 | 复杂度 | 耗时估计 | 对应 AC |
|---------|---------|:------:|:-------:|---------|
| Task-GPS-01 | 数据接入层 + GpsRecord 模型 | L | 2-3天 | AC-001, AC-007 |
| Task-GPS-02 | 实时位置 WebSocket 推送 + 前端集成 | M | 2天 | AC-002, AC-006 |
| Task-GPS-03 | 离线检测 + 状态降级 | S | 1天 | AC-003, AC-006 |
| Task-GPS-04 | 数据清理 + 存储优化 | S | 0.5天 | AC-005 |

**前置条件**（编码开始前必须完成）：
- [ ] 确认厂商 API 或数据转发方案（决定走方案 A/B/C）
- [ ] 获取厂商 API Key 或配置好 TCP 转发目标 IP:端口
- [ ] apps 目录变更：需新建 `apps/server/app/gps/` 模块

---

## Task-GPS-01：数据接入层 + GpsRecord 模型

- **复杂度**：L
- **Depends On**：前置条件完成（API 或转发方案确认）
- **对应 AC**：AC-001, AC-007
- **通俗解释**：搭建北斗数据接入的"水管"——不管数据从哪来（厂商 API 拉取/TCP 接收/MQTT 订阅），都能流进系统数据库。

### 涉及文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `apps/server/app/gps/models.py` | 新建 | GpsRecord SQLAlchemy 模型 |
| `apps/server/app/gps/updater.py` | 新建 | 核心更新函数 `process_gps_data` |
| `apps/server/app/gps/__init__.py` | 新建 | 模块导出 |
| `apps/server/app/models/vehicle.py` | 修改 | 新增 `device_id`、`last_gps_time` 字段 |
| `apps/server/alembic/versions/xxxx_gps_tracking.py` | 新建 | 数据库迁移（gps_records 表 + vehicles 字段） |
| `apps/server/app/gps/receiver.py` | 新建 | 数据接收入口（根据最终选择的方案实现） |
| `apps/server/app/gps/protocols/__init__.py` | 新建 | 协议解析模块入口 |
| `apps/server/app/gps/protocols/vendor_api.py` | 新建 | 厂商 HTTP API 客户端（方案 A） |
| `apps/server/app/gps/protocols/jtt808.py` | 新建 | JT/T 808 协议解析（方案 B） |

### 验证标准

- [ ] **TDD 测试通过**：`process_gps_data` 单元测试覆盖正常写入、异常坐标过滤、未绑定设备跳过
- [ ] 执行迁移后 `gps_records` 表创建成功，`vehicles` 表新增 `device_id`/`last_gps_time` 字段
- [ ] 调用 `process_gps_data` 后，`gps_records` 写入一条记录，`vehicles.current_lat/lng` 更新
- [ ] 无效坐标（0,0 或超出中国范围）被过滤，不写入数据库
- [ ] 未绑定车辆（device_id 无对应 vehicle）被记录日志，不崩溃

---

## Task-GPS-02：实时位置 WebSocket 推送 + 前端集成

- **复杂度**：M
- **Depends On**：Task-GPS-01（数据已能写入数据库）
- **对应 AC**：AC-002, AC-006
- **通俗解释**：车辆位置更新后，后端一秒内推送到前端地图，车子在地图上动起来。

### 涉及文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `apps/server/app/gps/websocket_manager.py` | 新建 | WebSocket 连接管理器 |
| `apps/server/app/main.py` | 修改 | 注册 `/ws/gps` WebSocket 路由 |
| `apps/frontend/src/modules/dashboard/composables/useGpsWebSocket.ts` | 新建 | WebSocket 连接 composable |
| `apps/frontend/src/modules/dashboard/components/MapArea.vue` | 修改 | 集成 WebSocket，监听位置更新 |

### 验证标准

- [ ] **TDD 测试通过**：`useGpsWebSocket` composable 单元测试覆盖连接、接收消息、断线重连
- [ ] 后端有 GPS 数据推入时，所有连接的 WebSocket 客户端收到 `vehicle_location` 消息
- [ ] 前端接收消息后，地图对应车辆 Marker 调用 `setLatLng` 移动到新位置
- [ ] WebSocket 断开后，前端 5 秒内自动重连
- [ ] WebSocket 不可用时，前端降级为现有 30 秒轮询，不影响正常显示

---

## Task-GPS-03：离线检测 + 状态降级

- **复杂度**：S
- **Depends On**：Task-GPS-02（前端已集成 WebSocket）
- **对应 AC**：AC-003, AC-006
- **通俗解释**：车辆断电或断网超过 5 分钟，地图上标记变灰半透明，调度员一看就知道"这车掉线了"。

### 涉及文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `apps/server/app/gps/offline_checker.py` | 新建 | 离线检测定时任务 |
| `apps/frontend/src/modules/dashboard/components/MapArea.vue` | 修改 | 根据离线状态调整 Marker 透明度 |
| `apps/frontend/src/modules/dashboard/composables/useGpsWebSocket.ts` | 修改 | 支持 `is_offline` 状态处理 |

### 验证标准

- [ ] **TDD 测试通过**：离线检测逻辑单元测试覆盖正常离线、恢复在线、从未上报数据
- [ ] 车辆 GPS 上报停止超过 5 分钟后，前端 Marker 变为灰色半透明（opacity: 0.4）
- [ ] 车辆恢复上报后，Marker 恢复正常透明度
- [ ] 从未上报过 GPS 的车辆（`last_gps_time` 为 NULL）不显示为离线

---

## Task-GPS-04：数据清理 + 存储优化

- **复杂度**：S
- **Depends On**：Task-GPS-01（数据已开始写入 `gps_records`）
- **对应 AC**：AC-008
- **通俗解释**：GPS 轨迹数据只保留 90 天，避免数据库无限膨胀。

### 涉及文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `apps/server/app/gps/cleanup.py` | 新建 | 数据清理定时任务 |

### 验证标准

- [ ] **TDD 测试通过**：清理逻辑单元测试覆盖清理旧数据、保留新数据、无数据时不受影响
- [ ] 清理任务执行后，90 天前的 `gps_records` 记录被删除
- [ ] 清理任务不影响 `vehicles` 表的实时位置数据

---

## 执行建议

### 按方案分组

| 方案 | 需要执行的任务 | 总耗时 |
|------|--------------|:------:|
| 方案 A（厂商 API） | Task-GPS-01 ~ 04 | **约 5.5 天** |
| 方案 B（TCP 转发） | Task-GPS-01 ~ 04 + 额外 1 天调试 | **约 6.5 天** |
| 方案 C（更换终端） | 等硬件到位后，同方案 A | **约 5.5 天** |

### 执行顺序

| 阶段 | 任务 | 说明 |
|------|------|------|
| 第一阶段 | Task-GPS-01 | 必须最先做，打通数据流 |
| 第二阶段（并行） | Task-GPS-02 + Task-GPS-04 | 前端集成 + 数据清理可同时进行 |
| 第三阶段 | Task-GPS-03 | 依赖 Task-GPS-02 |
