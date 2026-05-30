# 车载北斗定位接入 — 技术方案

> **版本**：v1.0
> **创建日期**：2026-05-29
> **需求文档**：[requirements.md](./requirements.md)
> **设计目标**：将 5 台自有车辆的北斗定位数据接入 V6 系统，实现 Dashboard 实时位置展示

---

## 目录

- [一、架构总览](#一架构总览)
- [二、接入方案对比](#二接入方案对比)
- [三、数据模型设计](#三数据模型设计)
- [四、后端设计](#四后端设计)
- [五、前端设计](#五前端设计)
- [六、核心逻辑](#六核心逻辑)
- [七、AC 覆盖汇总表](#七ac-覆盖汇总表)
- [八、设计决策记录](#八设计决策记录)

---

## 一、架构总览

### 整体数据流

```
┌────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  车载北斗终端    │ ──→ │  数据接入层        │ ──→ │  PostgreSQL           │
│  (5 台车已安装)  │     │                  │     │  ├─ vehicles          │
│                │     │  方案A: 厂商 API   │     │  │  └─ current_lat/lng │
│  协议:          │     │  方案B: TCP/JT808  │     │  └─ gps_records       │
│  JT/T 808 或    │     │  方案C: 中间件     │     └──────────┬───────────┘
│  厂商自定义      │     └────────┬─────────┘                │
└────────────────┘              │  WebSocket 推送            │
                                │  (实时)                    │
                                ▼                           ▼
                        ┌────────────────┐
                        │  前端 Dashboard │
                        │  (实时位置更新)  │
                        └────────────────┘
```

### 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 后端数据接收 | Python asyncio + asyncio.start_server / httpx | TCP 接收终端数据 或 HTTP 调用厂商 API |
| 协议解析 | 自定义 JT/T 808 解析（最小实现） | 解析终端上报的二进制数据包 |
| 数据存储 | PostgreSQL + gps_records 表 | 存储 GPS 轨迹记录 |
| 实时推送 | FastAPI WebSocket (starlette.websockets) | 向前端推送实时坐标 |
| 后台定时任务 | APScheduler（复用 fleet 现有框架） | 定时拉取厂商 API / 检查离线状态 |
| 前端实时更新 | 浏览器原生 WebSocket + Leaflet 增量更新 API | 接收推送后局部更新 Marker 位置 |

---

## 二、接入方案对比

### 方案 A：厂商 API 拉取（优先）

```
定时任务(10秒) → HTTP GET 厂商API → 解析JSON → 更新数据库 → WebSocket推前端
```

| 条件 | 要求 |
|------|------|
| 厂商提供 HTTP API | 返回 JSON 格式的车辆经纬度、速度、时间 |
| 认证方式 | API Key / Token / 账号密码 |
| 后端改动 | 新增定时任务，调用 httpx 发起 HTTP 请求 |

**判断标准**：厂商有开放 API 文档 → 选此方案

### 方案 B：TCP 数据转发

```
终端 → 4G → 厂商服务器 → 同时转发到你服务器:端口
                                              ↓
                                      你的TCP接收服务
                                      (asyncio.start_server)
                                              ↓
                                      解析 JT/T 808 二进制协议
                                              ↓
                                      更新数据库 + WebSocket
```

| 条件 | 要求 |
|------|------|
| 厂商支持数据转发 | 在平台后台配置目标 IP:端口 |
| 需要公网服务器 | 接收 TCP 连接（云服务器或固定公网 IP） |
| 后端改动 | 新增 TCP 服务 + 协议解析模块 |

**判断标准**：厂商说"没有 API 但支持转发" → 选此方案

### 方案 C：自建 MQTT 中间件（兜底）

```
终端 → 4G → 厂商服务器
         ↓  (如果厂商什么都不给)
   换支持 MQTT 的终端 / 加 MQTT 网关
         ↓
   自建 MQTT Broker (EMQX / Mosquitto)
         ↓
   后端订阅 MQTT Topic → 处理数据
```

| 条件 | 要求 |
|------|------|
| 终端支持 MQTT | 市面上大部分 4G 北斗终端都支持 |
| 需要 MQTT Broker | 可选 EMQX（云服务）或自建 Mosquitto |
| 后端改动 | 新增 MQTT 订阅模块 |

**判断标准**：方案 A/B 都走不通 → 选此方案

### 方案决策树

```
厂商有没有 API？
  ├── 有 → 方案 A（1-2天开发）
  └── 没有
        └── 厂商支持 TCP 数据转发？
              ├── 支持 → 方案 B（3-5天开发）
              └── 不支持
                    └── 换支持 MQTT 的终端（几百元/个，1天配置）
                          └── 方案 C（2-3天开发）
```

---

## 三、数据模型设计

### 3.1 新增：gps_records 轨迹表

```sql
CREATE TABLE gps_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    lat         NUMERIC(10,8) NOT NULL,
    lng         NUMERIC(11,8) NOT NULL,
    speed       NUMERIC(5,1),              -- 当前速度，单位 km/h，可为 NULL
    direction   SMALLINT,                  -- 行驶方向，0-359 度，可为 NULL
    recorded_at TIMESTAMPTZ NOT NULL,       -- 终端上报的 GPS 时间
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 按车辆+时间快速查询轨迹
CREATE INDEX ix_gps_records_vehicle_time ON gps_records(vehicle_id, recorded_at DESC);

-- 定期清理用：按 recorded_at 分区（可选）
-- CREATE INDEX ix_gps_records_cleanup ON gps_records(recorded_at);
```

### 3.2 修改：vehicles 表

```sql
ALTER TABLE vehicles ADD COLUMN device_id     VARCHAR(50)  NULL;  -- 北斗终端设备 ID
ALTER TABLE vehicles ADD COLUMN last_gps_time  TIMESTAMPTZ  NULL;  -- 最近一次 GPS 上报时间
```

### 3.3 vehicles 实时位置 vs gps_records 轨迹记录分工

| | vehicles.current_lat/lng | gps_records |
|--|------------------------|-------------|
| 用途 | 实时位置（当前在哪） | 历史轨迹（去过哪） |
| 更新方式 | 覆盖写（始终最新值） | 追加写（保留所有历史） |
| 数据量 | 5 行（每辆车一行） | 随时间增长 |
| 查询场景 | Dashboard 实时地图 | 轨迹回放 / 报表 |
| 清理策略 | 永不清理 | 超过 90 天自动清理 |

### 3.4 新增：device_bindings 车辆-终端绑定表（可选）

如需灵活管理终端更换（同一设备换车、同车换设备），可增加绑定表：

```sql
CREATE TABLE device_bindings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id    VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id   UUID NOT NULL REFERENCES vehicles(id),
    bound_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unbound_at   TIMESTAMPTZ,              -- 解绑时间，NULL 表示当前绑定中
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX ix_device_bindings_active ON device_bindings(is_active);
```

**简化方案**：小团队 5 台车，直接在 `vehicles.device_id` 做 1:1 绑定，不建单独表。

---

## 四、后端设计

### 4.1 模块结构

```
apps/server/app/
├── gps/                              # 北斗定位模块（新增）
│   ├── __init__.py
│   ├── receiver.py                   # 数据接收入口（根据方案选实现）
│   ├── protocols/
│   │   ├── __init__.py
│   │   ├── jtt808.py                 # JT/T 808 协议解析
│   │   └── vendor_api.py             # 厂商 HTTP API 客户端
│   ├── updater.py                    # 坐标更新逻辑（写入 DB + 推 WebSocket）
│   └── models.py                     # GpsRecord 模型
├── api/
│   └── v1/
│       ├── __init__.py
│       └── ...                    # 轨迹查询预留
├── models/
│   └── vehicle.py                    # 现有，新增 device_id/last_gps_time 字段
└── main.py                           # 注册 WebSocket 路由 + 启动后台任务
```

### 4.2 实时更新流程

```
北斗终端上报数据
        ↓
[receiver.py] 接收原始数据
  方案A: httpx 定时 GET 厂商 API
  方案B: asyncio TCP server 接收
  方案C: MQTT 订阅
        ↓
[protocols/jtt808.py 或 vendor_api.py]
  解析出: vehicle_id, lat, lng, speed, direction, recorded_at
        ↓
[updater.py] 核心更新函数
  1. 通过 device_id → vehicle_id 映射表找到对应车辆
  2. 更新 vehicles 表: current_lat, current_lng, current_location,
     last_gps_time = now()
  3. 插入 gps_records 表: 新增一条轨迹记录
  4. 推 WebSocket: 广播给所有连接的 Dashboard 客户端
```

### 4.3 WebSocket 推送协议

```python
# 后端推送格式（JSON）
{
    "type": "vehicle_location",
    "data": {
        "vehicle_id": "uuid",
        "plate_no": "川AKW761",
        "lat": 30.83984,
        "lng": 104.32910,
        "status": "transiting",       # 车辆当前业务状态
        "speed": 45.5,                 # 当前速度 km/h
        "direction": 180,              # 行驶方向
        "gps_time": "2026-05-29T14:30:00Z",  # GPS 时间
        "is_offline": false            # 是否离线（超过 5 分钟未上报）
    }
}

# 前端连接
ws = new WebSocket("ws://localhost:8000/ws/gps")
```

### 4.4 离线检测逻辑

```python
# 后台定时任务，每 60 秒执行一次
async def check_offline_vehicles():
    threshold = datetime.utcnow() - timedelta(minutes=5)
    result = await db.execute(
        update(Vehicle)
        .where(Vehicle.last_gps_time < threshold)
        .where(Vehicle.last_gps_time.isnot(None))
        .values(is_offline=True)
    )
    # 推送离线状态变化给前端
```

### 4.5 逆地理编码（可选）

将经纬度转为可读的地点描述，用于填充 `vehicles.current_location`：

```python
# 方法1：调用高德/百度逆地理编码 API（推荐，精度高但需要 API Key）
async def reverse_geocode(lat: float, lng: float) -> str | None:
    url = f"https://restapi.amap.com/v3/geocode/regeo?location={lng},{lat}&key={AMAP_KEY}"
    resp = await httpx.get(url)
    if resp.status_code == 200:
        data = resp.json()
        return data.get("regeocode", {}).get("formatted_address")

# 方法2：本地计算最近已知作业点位（不依赖外部 API）
KNOWN_POINTS = [
    ("文汉物流", 30.839840, 104.329095),
    ("陆海联捷", 30.821542, 104.359265),
    ("骏鸿达", 30.83152, 104.332608),
    # ... 19 个点位
]

def nearest_known_point(lat: float, lng: float) -> str | None:
    """如果车辆在已知作业点位 200 米范围内，返回点位名称"""
    for name, plon, plat in KNOWN_POINTS:
        if haversine_distance(lat, lng, plat, plon) < 0.2:  # 200米
            return name
    return None  # 不在已知点位范围内，返回空
```

### 4.6 数据清理策略

```python
# 定时任务，每天凌晨执行一次
async def cleanup_old_gps_records():
    threshold = datetime.utcnow() - timedelta(days=90)  # 保留 90 天
    await db.execute(
        delete(GpsRecord).where(GpsRecord.recorded_at < threshold)
    )
    await db.commit()
```

**存储估算**：

| 项目 | 计算 | 结果 |
|------|------|------|
| 每车每天 | 24h × 3600s / 30s = 2880 条 | ~2.9K 条 |
| 5 车每天 | 2880 × 5 = 14,400 条 | ~1.4 万条 |
| 5 车 30 天 | 14,400 × 30 = 432,000 条 | ~43 万条 |
| 单条大小 | 约 150 字节 | 约 150B |
| 30 天总量 | 432,000 × 150B | **≈ 65MB** |
| 按 90 天清理 | 65MB × 3 | **≈ 195MB** |

结论：存储开销极低，无需额外优化。

---

## 五、前端设计

### 5.1 文件结构

```
apps/frontend/src/modules/dashboard/
├── components/
│   ├── MapArea.vue              # 修改：新增 WebSocket 连接
│   └── ...
├── composables/                  # 新增目录
│   └── useGpsWebSocket.ts       # WebSocket 连接管理
```

### 5.2 WebSocket 连接管理

```typescript
// composables/useGpsWebSocket.ts
import { ref, onUnmounted } from 'vue'
import type { VehicleLocation } from '../types'

export function useGpsWebSocket(
  onLocationUpdate: (data: VehicleLocationGps) => void,
) {
  const connected = ref(false)
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    ws = new WebSocket(`${protocol}//${location.host}/ws/gps`)

    ws.onopen = () => {
      connected.value = true
      // 心跳：每 30 秒发一次
      heartbeatTimer = setInterval(() => {
        ws?.send(JSON.stringify({ type: 'ping' }))
      }, 30000)
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'vehicle_location') {
        onLocationUpdate(msg.data)
      }
    }

    ws.onclose = () => {
      connected.value = false
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      // 自动重连：5 秒后重试
      reconnectTimer = setTimeout(connect, 5000)
    }

    ws.onerror = () => {
      ws?.close()
    }
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    ws?.close()
    ws = null
    connected.value = false
  }

  // 组件卸载时断开
  // 由调用方在 onUnmounted 中调用 disconnect()

  return { connect, disconnect, connected }
}
```

### 5.3 MapArea 集成 WebSocket

```typescript
// MapArea.vue — 新增 WebSocket 集成（改动量极小）
import { useGpsWebSocket } from '../composables/useGpsWebSocket'

// 已有：增量更新 Marker 的函数
function updateMarkers(vehicles: VehicleLocation[]) { ... }

// 新增：处理单辆车实时位置推送
function handleGpsUpdate(data: {
  vehicleId: string
  lat: number
  lng: number
  speed: number
  isOffline: boolean
}) {
  const marker = markerMap.get(data.vehicleId)
  if (marker) {
    marker.setLatLng([data.lat, data.lng])
    // 可选：根据 isOffline 改变透明度
  }
}

onMounted(() => {
  // ... 创建地图、添加瓦片层 ...

  // 建立 WebSocket 连接
  const ws = useGpsWebSocket(handleGpsUpdate)
  ws.connect()
})

onUnmounted(() => {
  // 已有：map.remove()
  // 新增：断开 WebSocket
  // ws.disconnect()  （需要保存 ws 引用）
})
```

**现有增量更新逻辑完全可复用**：`markerMap` 已缓存所有 `L.Marker` 实例，`setLatLng` 方法直接可用。WebSocket 推送过来时，只需要一行代码就能更新位置。

### 5.4 离线状态判定（前端兜底）

```typescript
// 如果 WebSocket 断开或未实现，前端仍可基于轮询数据进行降级判断
// 在 updateMarkers 中增加：
function updateMarkers(vehicles: VehicleLocation[]) {
  for (const v of vehiclesWithCoords) {
    const marker = markerMap.get(v.id)
    if (marker) {
      marker.setLatLng([lat, lng])
      marker.setIcon(getStatusIcon(v.status))

      // 新增：判断是否离线（如果后端未推离线状态，前端兜底）
      if (v.lastGpsTime) {
        const minutesSinceUpdate = (Date.now() - new Date(v.lastGpsTime).getTime()) / 60000
        const isOffline = minutesSinceUpdate > 5
        // 离线时调低透明度
        const opacity = isOffline ? 0.4 : 1
        marker.setOpacity(opacity)
      }
    }
  }
}
```

### 5.4 离线状态判定（前端兜底）

```python
# WebSocket 连接管理器（在 app/gps/ 中）

from fastapi import WebSocket
from typing import Set


class GpsWebSocketManager:
    def __init__(self):
        self.connections: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.add(ws)

    def disconnect(self, ws: WebSocket):
        self.connections.discard(ws)

    async def broadcast(self, message: dict):
        """广播给所有连接的客户端"""
        dead = set()
        for ws in self.connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.connections.discard(ws)


# 全局单例
gps_ws_manager = GpsWebSocketManager()
```



## 六、核心逻辑

### 6.1 数据接收与处理

```python
# updater.py — 核心更新函数

async def process_gps_data(
    db: AsyncSession,
    device_id: str,
    lat: float,
    lng: float,
    speed: float | None,
    direction: int | None,
    recorded_at: datetime,
) -> None:
    """处理单条 GPS 上报数据"""

    # 1. 数据校验
    if not validate_coords(lat, lng):
        logger.warning(f"无效坐标: device={device_id}, lat={lat}, lng={lng}")
        return

    # 2. 查设备绑定
    vehicle = await get_vehicle_by_device(db, device_id)
    if not vehicle:
        logger.warning(f"未绑定车辆: device_id={device_id}")
        return

    # 3. 写入轨迹记录
    record = GpsRecord(
        vehicle_id=vehicle.id,
        lat=lat,
        lng=lng,
        speed=speed,
        direction=direction,
        recorded_at=recorded_at,
    )
    db.add(record)

    # 4. 更新车辆实时位置
    location_text = await get_location_description(lat, lng)
    vehicle.current_lat = lat
    vehicle.current_lng = lng
    vehicle.current_location = location_text
    vehicle.last_gps_time = datetime.utcnow()

    await db.commit()

    # 5. 推送给前端（通过 WebSocket 管理器）
    await broadcast_location(VehicleLocationMessage(
        vehicle_id=str(vehicle.id),
        plate_no=vehicle.plate_no,
        lat=lat,
        lng=lng,
        status=vehicle.status,
        speed=speed or 0,
        direction=direction or 0,
        gps_time=recorded_at.isoformat(),
        is_offline=False,
    ))


def validate_coords(lat: float, lng: float) -> bool:
    """中国境内坐标范围校验"""
    if lat == 0 and lng == 0:
        return False
    if not (18 <= lat <= 54):
        return False
    if not (73 <= lng <= 136):
        return False
    return True
```

### 6.2 降级策略

| 场景 | 表现 |
|------|------|
| WebSocket 连接断开 | 前端自动重连（5 秒间隔），重连期间位置不更新 |
| 厂商 API 不可用 | 后端日志告警，前端显示最后已知位置，标记为"数据过期" |
| 数据库写入失败 | 记录异常日志，不下发错误给前端 |
| 前端 WebSocket 不可用 | 降级为 30 秒轮询 `GET /api/v1/dashboard`（已有逻辑，无需修改） |

---

## 七、AC 覆盖汇总表

| AC 编号 | AC 描述 | 技术实现点 | 覆盖任务 |
|---------|---------|-----------|---------|
| AC-001 | 北斗终端数据成功接入系统 | `gps/receiver.py` + `gps/protocols/` 协议解析 → 写入 `gps_records` | Task-GPS-01 |
| AC-002 | Dashboard 地图显示实时位置 | WebSocket 推送到前端 → `useGpsWebSocket` → `marker.setLatLng` | Task-GPS-02 |
| AC-003 | 车辆离线状态可识别 | `check_offline_vehicles` 定时任务 + 前端 Marker 透明度变化 | Task-GPS-03 |
| AC-004 | 不因定位数据影响其他业务 | `gps` 模块独立于 `dispatch`/`fleet` 模块，只写 `gps_records` 和 `vehicles` 坐标字段 | 架构层面 |
| AC-005 | 系统在无定位数据时正常降级 | WebSocket 自动重连 + 前端兜底轮询 + 离线 Marker 灰色显示 | Task-GPS-03 |
| AC-006 | 终端数据异常处理 | `validate_coords` 过滤异常经纬度 + 速度异常值日志记录 | Task-GPS-01 |
| AC-007 | 数据存储容量控制 | 90 天清理定时任务 + 存储估算 ≤200MB | Task-GPS-04 |

---

## 八、设计决策记录

### 决策 1：WebSocket 推送 vs 前端轮询

- **选项 A**：WebSocket 实时推送 — 后端有数据就推，前端被动接收
- **选项 B**：前端高频轮询（5 秒一次 `GET /api/v1/dashboard`）
- **选择**：**A + B 降级**
- **理由**：WebSocket 延迟更低（毫秒级）、服务器压力更小；前端同时保留现有 30 秒轮询作为 WebSocket 断开时的降级方案。

### 决策 2：实时位置与历史数据分离存储

- **选项 A**：实时位置和历史数据都用 `gps_records` 表，查询最新一条作为实时位置
- **选项 B**：实时位置用 `vehicles.current_lat/lng`，历史数据用 `gps_records`
- **选择**：**B**
- **理由**：Dashboard 展示需要最快速度获取最新位置，从 `vehicles` 表查比在 `gps_records` 上做 `ORDER BY DESC LIMIT 1` 快 10-100 倍。`gps_records` 用于数据记录和清理管理，职责分离更清晰。

### 决策 3：前端 WebSocket 管理用 composable 模式

- **选择**：封装成 `useGpsWebSocket` composable，而不是全局 store
- **理由**：WebSocket 连接只在 Dashboard 页面的 MapArea 组件中使用，不需要全局共享状态。composable 模式生命周期跟随组件，组件卸载时自动断开。

### 决策 4：不依赖第三方地图 API 做逆地理编码

- **选项 A**：调用高德地图逆地理编码 API
- **选项 B**：本地维护 19 个作业点位坐标，计算最近距离
- **选择**：**先做 B，必要时加 A**
- **理由**：公司所有作业集中在青白江片区的 19 个固定点位，车辆要么在这些点位附近，要么在路上。本地计算 19 个点位的最近距离已覆盖 95% 场景，不需要额外申请高德 API Key。如果后续需要显示"成都市青白江区 XX路"这种街道级地址，再加高德 API。

### 决策 5：设备-车辆绑定简化

- **选项 A**：建 `device_bindings` 表，支持历史解绑记录
- **选项 B**：`vehicles.device_id` 字段直接绑定
- **选择**：**B**（当前简化方案）
- **理由**：5 台车固定对应 5 个终端，几乎不会换绑。如果后续扩展到外协车或终端替换频繁，再升级为独立绑定表。

---

## 附录：JT/T 808 协议最小解析（方案 B 参考）

```python
# jtt808.py — 最小实现，只解析位置上报包（0x0200）

import struct
from datetime import datetime


def parse_jtt808_location(packet: bytes) -> dict | None:
    """解析 JT/T 808 位置上报消息包"""
    if len(packet) < 20:
        return None

    # 消息体起始位置（跳过消息头）
    # 消息头：2(标识) + 2(属性) + 6(手机号) + 2(流水号) = 12 字节
    body = packet[12:]

    if len(body) < 20:
        return None

    # 位置信息：4(报警) + 4(状态) + 4(纬度) + 4(经度) + 2(高度) + 2(速度) + 2(方向) + 6(GPS时间)
    lat_raw = struct.unpack('>I', body[4:8])[0]  # 纬度，以百万分之一度为单位
    lng_raw = struct.unpack('>I', body[8:12])[0]  # 经度
    speed_raw = struct.unpack('>H', body[14:16])[0]  # 速度，0.1km/h

    lat = lat_raw / 1000000
    lng = lng_raw / 1000000

    # 时间解析：BCD 编码 YYMMDDhhmmss
    time_bytes = body[16:22]
    gps_time = datetime(
        2000 + bcd_to_int(time_bytes[0]),
        bcd_to_int(time_bytes[1]),
        bcd_to_int(time_bytes[2]),
        bcd_to_int(time_bytes[3]),
        bcd_to_int(time_bytes[4]),
        bcd_to_int(time_bytes[5]),
    )

    return {
        "lat": lat,
        "lng": lng,
        "speed": speed_raw / 10,
        "direction": struct.unpack('>H', body[16:18])[0],
        "recorded_at": gps_time,
    }


def bcd_to_int(b: int) -> int:
    return ((b >> 4) * 10) + (b & 0x0F)
```
