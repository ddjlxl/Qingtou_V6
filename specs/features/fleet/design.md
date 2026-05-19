# Fleet 车队管理技术方案

> **版本**：v1.1
> **创建日期**：2026-05-06
> **更新日期**：2026-05-07
> **需求文档**：[requirements.md](./requirements.md)
> **设计目标**：实现车辆、司机、证照的完整管理，支持运输流水导入和统计，为调度中心提供车辆资源支持

---

## 目录

- [一、功能概述](#一功能概述)
- [二、现有代码分析](#二现有代码分析)
- [三、数据模型设计](#三数据模型设计)
  - [3.1 修改现有模型](#31-修改现有模型)
  - [3.2 新增模型](#32-新增模型)
  - [3.3 数据库迁移](#33-数据库迁移)
- [四、API 设计](#四api-设计)
  - [4.1 接口列表](#41-接口列表)
  - [4.2 请求/响应类型](#42-请求响应类型)
- [五、前端设计](#五前端设计)
  - [5.1 组件结构](#51-组件结构)
  - [5.2 状态管理](#52-状态管理)
  - [5.3 路由配置](#53-路由配置)
- [六、文件存储方案](#六文件存储方案)
- [七、核心逻辑](#七核心逻辑)
  - [7.1 车辆状态自动更新](#71-车辆状态自动更新)
  - [7.2 证照预警检查](#72-证照预警检查)
  - [7.3 运输流水文件导入](#73-运输流水文件导入)
  - [7.4 删除证照时同步清理附件](#74-删除证照时同步清理附件)
  - [7.5 司机关联车辆冲突处理](#75-司机关联车辆冲突处理)
  - [7.6 定时任务调度](#76-定时任务调度)
  - [7.7 司机手机号格式校验](#77-司机手机号格式校验)
  - [7.8 删除车辆/司机时级联清理证照](#78-删除车辆司机时级联清理证照)
  - [7.9 证照类型与所属对象交叉校验](#79-证照类型与所属对象交叉校验)
- [八、AC 覆盖汇总表](#八ac-覆盖汇总表)
- [九、设计决策记录](#九设计决策记录)
- [十、关联文档](#十关联文档)

---

## 一、功能概述

- **功能名称**：Fleet 车队管理
- **需求文档**：[requirements.md](./requirements.md)
- **设计目标**：实现车辆、司机、证照的完整管理，支持运输流水导入和统计，为调度中心提供车辆资源支持

---

## 二、现有代码分析

### 涉及模块
- `apps/server/app/models/vehicle.py` — 车辆模型（已存在，需调整；现有字段 `vehicle_type`、`current_lat`、`current_lng`、`current_location`、`total_mileage`、`today_mileage`、`month_mileage`、`remark` 保持不变）
- `apps/server/app/models/driver.py` — 司机模型（已存在，需调整）
- `apps/server/app/models/certificate.py` — 证照模型（已存在，需调整）
- `apps/server/app/models/order.py` — 订单模型（已存在，用于查询车辆状态）
- `apps/frontend/src/modules/auth/` — 认证模块（已完成，可复用模式）
- `apps/frontend/src/shared/` — 公共组件和工具（已完成，可复用）

### 可复用抽象（已审计）
- **认证模块模式**：`auth` 模块的目录结构（components/stores/services/types）、API 设计风格、Store 设计模式可直接复用
- **UI 框架**：Element Plus（全局已注册，`el-button`、`el-input`、`el-table`、`el-select`、`el-upload`、`el-dialog`、`el-tabs`、`el-tag` 等直接使用，设计规范见 [element-plus-design-standards.md](../../element-plus-design-standards.md)）
- **公共组件**：EmptyState.vue、LoadingSpinner.vue（已验证存在于 `shared/components/`）
- **公共工具**：formatDate、formatMoney、isPhone、isRequired（已验证存在于 `shared/utils/`）
- **HTTP 客户端**：Axios 实例（`shared/api/client.ts`，含拦截器）
- **异常处理**：AppException、全局异常处理器

### 影响范围
- **dispatch 模块**：分配任务时需要查询车辆状态（AC-020），分配后更新车辆状态（AC-027）
- **dashboard 模块**：可能需要展示车辆状态统计（未来需求）
- **数据库迁移**：需要修改现有表结构（drivers、certificates）并新增表（transport_records）

---

## 三、数据模型设计

### 3.1 修改现有模型

#### Vehicle 模型调整

**新增字段**：
- `is_disabled`：布尔值，默认 false，标记车辆是否停用

**调整字段**：
- `bound_driver_id`：新增，关联 drivers.id，实现车辆与司机的固定绑定

**SQLAlchemy 代码**：
```python
# apps/server/app/models/vehicle.py
class Vehicle(BaseModel):
    __tablename__ = "vehicles"
    __table_args__ = (
        sa.Index("ix_vehicles_status", "status"),
        sa.Index("ix_vehicles_bound_driver", "bound_driver_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    plate_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    ownership: Mapped[str] = mapped_column(String(20), nullable=False, default=Ownership.OWN.value)
    bound_driver_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("drivers.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=VehicleStatus.IDLE.value)
    is_disabled: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    
    vehicle_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_lat: Mapped[float | None] = mapped_column(Numeric(10, 8), nullable=True)
    current_lng: Mapped[float | None] = mapped_column(Numeric(11, 8), nullable=True)
    current_location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    total_mileage: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    today_mileage: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    month_mileage: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
```

→ AC-019：车辆停用状态字段支持"有历史记录的车辆不能删除，只能停用"

#### Driver 模型调整

**移除字段**：
- `user_id`：移除与 users 表的关联（司机不需要登录调度端）
- `bound_vehicle_id`：移除双向绑定，避免数据不一致风险
- `status`：移除司机状态字段（`DriverStatus` 枚举一并移除）。司机状态由关联车辆的状态间接体现——车辆"运输中"则司机也在运输中，无需在司机表冗余维护

**新增字段**：
- `is_disabled`：布尔值，默认 false，标记司机是否停用

**调整字段**：
- `phone`：改为必填（nullable=False）

**设计决策**：移除 `bound_vehicle_id` 字段，只保留 `Vehicle.bound_driver_id` 作为唯一真相来源（source of truth）。司机关联车辆通过查询 vehicles 表获取，避免双向引用导致的数据不一致。

**SQLAlchemy 代码**：
```python
# apps/server/app/models/driver.py
class Driver(BaseModel):
    __tablename__ = "drivers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    is_disabled: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
```

→ AC-005：司机信息包含姓名、手机号
→ AC-021：司机停用状态字段支持"有历史记录的司机不能删除，只能停用"

#### Certificate 模型调整

**调整枚举**：
- 在 `VehicleCertType` 中添加 `VEHICLE_LICENSE = "vehicle_license"`（行驶证）

**调整索引**（统一命名规范，与表名一致）：
- `ix_cert_owner` → `ix_certificates_owner`
- `ix_cert_expiry` → `ix_certificates_expiry`

**调整字段长度**（扩展以支持更长路径和类型值）：
- `cert_type`：`String(30)` → `String(50)`
- `attachment`：`String(255)` → `String(500)`

**SQLAlchemy 代码**：
```python
# apps/server/app/models/certificate.py
class VehicleCertType(str, enum.Enum):
    VEHICLE_LICENSE = "vehicle_license"  # 新增：行驶证
    COMPULSORY_INSURANCE = "compulsory_insurance"
    COMMERCIAL_INSURANCE = "commercial_insurance"
    ANNUAL_INSPECTION = "annual_inspection"
    ROAD_TRANSPORT = "road_transport"

class DriverCertType(str, enum.Enum):
    DRIVING_LICENSE = "driving_license"
    QUALIFICATION = "qualification"

class OwnerType(str, enum.Enum):
    VEHICLE = "vehicle"
    DRIVER = "driver"

class Certificate(BaseModel):
    __tablename__ = "certificates"
    __table_args__ = (
        sa.Index("ix_certificates_owner", "owner_type", "owner_id"),
        sa.Index("ix_certificates_expiry", "expiry_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    owner_type: Mapped[str] = mapped_column(String(20), nullable=False)
    cert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    cert_name: Mapped[str] = mapped_column(String(100), nullable=False)
    issue_date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(sa.Date, nullable=False)
    attachment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
```

→ AC-008：证照类型支持行驶证、道路运输证、交强险、商业险、年审、驾驶证、从业资格证

### 3.2 新增模型

#### TransportRecord 模型（运输流水记录）

**字段设计**：
- `id`：主键，UUID
- `order_no`：任务编号，必填
- `customer_info`：客户信息，必填
- `origin`：起运地，必填
- `destination`：目的地，必填
- `container_no`：箱号，必填
- `vehicle_id`：执行车辆，关联 vehicles.id
- `driver_id`：执行司机，关联 drivers.id
- `imported_at`：导入时间，自动生成

**SQLAlchemy 代码**：
```python
# apps/server/app/models/transport_record.py
import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import String, Uuid, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class TransportRecord(BaseModel):
    __tablename__ = "transport_records"
    __table_args__ = (
        sa.Index("ix_transport_records_imported_at", "imported_at"),
        sa.Index("ix_transport_records_vehicle", "vehicle_id"),
        sa.Index("ix_transport_records_driver", "driver_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    order_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    customer_info: Mapped[str] = mapped_column(String(200), nullable=False)
    origin: Mapped[str] = mapped_column(String(200), nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    container_no: Mapped[str] = mapped_column(String(20), nullable=False)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("vehicles.id"), nullable=False)
    driver_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("drivers.id"), nullable=False)
    imported_at: Mapped[datetime] = mapped_column(sa.DateTime, nullable=False, default=datetime.now)
```

→ AC-012：运输流水记录表支持导入调度中心的已完成任务
→ AC-013：流水列表显示任务编号、客户信息、起运地、目的地、箱号、执行车辆、执行司机
→ AC-015：统计每个司机/车辆的任务数量

### 3.3 数据库迁移

**迁移脚本**：
1. 修改 `vehicles` 表：新增 `bound_driver_id`、`is_disabled` 字段
2. 修改 `drivers` 表：移除 `user_id`、`bound_vehicle_id`、`status` 字段，新增 `is_disabled` 字段，`phone` 改为 NOT NULL
3. 修改 `certificates` 表：更新枚举值，重命名索引（`ix_cert_owner` → `ix_certificates_owner`，`ix_cert_expiry` → `ix_certificates_expiry`）
4. 新增 `transport_records` 表

**索引重命名注意事项**：
- Alembic 的 `autogenerate` 可能不会自动检测索引重命名（取决于数据库方言）
- 对于 PostgreSQL，Alembic 的 `autogenerate` 能自动检测索引变更
- 生成迁移脚本后需人工检查索引变更是否正确

**迁移命令**：
```bash
alembic revision --autogenerate -m "fleet_module_enhancements"
alembic upgrade head
```

---

## 四、API 设计

### 4.1 接口列表

#### 车辆管理

| 方法 | 路径 | 描述 | 对应 AC |
|------|------|------|---------|
| GET | /api/v1/fleet/vehicles | 获取车辆列表（支持状态筛选） | → AC-003, AC-004 |
| GET | /api/v1/fleet/vehicles/{id} | 获取单个车辆详情 | → AC-002 |
| POST | /api/v1/fleet/vehicles | 新增车辆 | → AC-001 |
| PUT | /api/v1/fleet/vehicles/{id} | 编辑车辆 | → AC-002 |
| DELETE | /api/v1/fleet/vehicles/{id} | 删除车辆（检查历史记录） | → AC-019 |
| PUT | /api/v1/fleet/vehicles/{id}/disable | 停用车辆 | → AC-019 |
| POST | /api/v1/fleet/vehicles/{id}/bind-driver | 绑定司机（两步确认） | → AC-030 |
| GET | /api/v1/fleet/vehicles/{id}/availability | 检查车辆可用性（供 dispatch 调用） | → AC-020 |

> **路由注册顺序**：`/availability`、`/bind-driver`、`/disable` 等具体路径必须在 `/{id}` 之前注册，否则 `availability` 会被当作 `{id}` 参数值匹配。

#### 司机管理

| 方法 | 路径 | 描述 | 对应 AC |
|------|------|------|---------|
| GET | /api/v1/fleet/drivers | 获取司机列表 | → AC-007 |
| GET | /api/v1/fleet/drivers/{id} | 获取单个司机详情 | → AC-006 |
| POST | /api/v1/fleet/drivers | 新增司机（手机号格式校验） | → AC-005 |
| PUT | /api/v1/fleet/drivers/{id} | 编辑司机（手机号格式校验） | → AC-006 |
| DELETE | /api/v1/fleet/drivers/{id} | 删除司机（检查历史记录） | → AC-021 |
| PUT | /api/v1/fleet/drivers/{id}/disable | 停用司机 | → AC-021 |

#### 证照管理

| 方法 | 路径 | 描述 | 对应 AC |
|------|------|------|---------|
| GET | /api/v1/fleet/certificates | 获取证照列表（支持预警筛选） | → AC-010, AC-011 |
| POST | /api/v1/fleet/certificates | 新增证照 | → AC-008 |
| PUT | /api/v1/fleet/certificates/{id} | 编辑证照 | → AC-009 |
| DELETE | /api/v1/fleet/certificates/{id} | 删除证照（同步清理附件文件） | → AC-032 |
| GET | /api/v1/fleet/certificates/{id}/attachment | 获取证照附件（受保护端点） | → AC-008 |
| GET | /api/v1/fleet/certificates/warning-count | 获取证照预警数量 | → AC-016, AC-022 |

#### 运输流水

| 方法 | 路径 | 描述 | 对应 AC |
|------|------|------|---------|
| GET | /api/v1/fleet/transport-records | 获取运输流水列表（支持筛选） | → AC-013, AC-014 |
| POST | /api/v1/fleet/transport-records/import | 导入运输流水文件 | → AC-012, AC-024, AC-025, AC-026 |
| GET | /api/v1/fleet/transport-records/statistics | 获取运输流水统计 | → AC-015 |
| GET | /api/v1/fleet/transport-records/template | 下载导入模板 | → AC-012 |

#### 车队统计

| 方法 | 路径 | 描述 | 对应 AC |
|------|------|------|---------|
| GET | /api/v1/fleet/statistics | 获取车队统计数据 | → AC-016, AC-017 |

### 4.2 请求/响应类型

#### 车辆相关类型

```typescript
// apps/frontend/src/modules/fleet/types/vehicle.ts
export enum VehicleStatus {
  IDLE = 'idle',
  TRANSITING = 'transiting',
  OVERDUE = 'overdue'
}

export enum Ownership {
  OWN = 'own',
  EXTERNAL = 'external'
}

export interface Vehicle {
  id: string
  plateNo: string
  ownership: Ownership
  boundDriverId: string | null
  boundDriverName?: string
  status: VehicleStatus
  isDisabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateVehicleRequest {
  plateNo: string
  ownership: Ownership
}

export interface UpdateVehicleRequest {
  ownership?: Ownership
  boundDriverId?: string | null
}

export interface VehicleListParams {
  status?: VehicleStatus
  page?: number
  pageSize?: number
}

export interface BindDriverRequest {
  driverId: string
  confirmed: boolean
}

export interface BindDriverResponse {
  needConfirm: boolean
  message: string
  oldVehicleId?: string
  oldVehiclePlateNo?: string
}
```

**bind-driver 两步确认流程**：
1. 前端首次调用 `POST /api/v1/fleet/vehicles/{id}/bind-driver`，`confirmed: false`
2. 后端检查司机是否已绑定其他车辆：若未绑定则直接绑定成功；若已绑定则返回 `needConfirm: true` + 旧车辆信息
3. 前端收到 `needConfirm: true` 后弹出确认框，展示旧车辆车牌号
4. 用户确认后，前端再次调用同一接口，`confirmed: true`
5. 后端**重新执行完整的冲突检查**（不依赖第一步的缓存结果），清空旧车辆的 `bound_driver_id`，将司机绑定到新车辆

#### 司机相关类型

```typescript
// apps/frontend/src/modules/fleet/types/driver.ts
export interface Driver {
  id: string
  name: string
  phone: string
  boundVehicleId: string | null
  boundVehiclePlateNo?: string
  isDisabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDriverRequest {
  name: string
  phone: string
}

export interface UpdateDriverRequest {
  name?: string
  phone?: string
}

export interface DriverListParams {
  page?: number
  pageSize?: number
}
```

**注意**：`boundVehicleId` 和 `boundVehiclePlateNo` 不是 Driver 表的直接字段，而是通过查询 vehicles 表（`Vehicle.bound_driver_id`）计算得出的。后端 API 返回司机列表时会关联查询并返回这些字段。

#### 证照相关类型

```typescript
// apps/frontend/src/modules/fleet/types/certificate.ts
export enum VehicleCertType {
  VEHICLE_LICENSE = 'vehicle_license',
  ROAD_TRANSPORT = 'road_transport',
  COMPULSORY_INSURANCE = 'compulsory_insurance',
  COMMERCIAL_INSURANCE = 'commercial_insurance',
  ANNUAL_INSPECTION = 'annual_inspection'
}

export enum DriverCertType {
  DRIVING_LICENSE = 'driving_license',
  QUALIFICATION = 'qualification'
}

export type CertType = VehicleCertType | DriverCertType

export enum OwnerType {
  VEHICLE = 'vehicle',
  DRIVER = 'driver'
}

export interface Certificate {
  id: string
  ownerId: string
  ownerType: OwnerType
  ownerName?: string
  certType: CertType
  certName: string
  issueDate: string
  expiryDate: string
  attachment: string | null
  remark: string | null
  isExpiringSoon: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCertificateRequest {
  ownerId: string
  ownerType: OwnerType
  certType: CertType
  certName: string
  issueDate: string
  expiryDate: string
  attachment?: File
  remark?: string
}

export interface UpdateCertificateRequest {
  certType?: CertType
  certName?: string
  issueDate?: string
  expiryDate?: string
  attachment?: File
  remark?: string
}

export interface CertificateListParams {
  ownerType?: OwnerType
  ownerId?: string
  expiringSoon?: boolean
  page?: number
  pageSize?: number
}
```

#### 运输流水相关类型

```typescript
// apps/frontend/src/modules/fleet/types/transport-record.ts
export interface TransportRecord {
  id: string
  orderNo: string
  customerInfo: string
  origin: string
  destination: string
  containerNo: string
  vehicleId: string
  vehiclePlateNo?: string
  driverId: string
  driverName?: string
  importedAt: string
}

export interface TransportRecordListParams {
  startDate?: string
  endDate?: string
  vehicleId?: string
  driverId?: string
  page?: number
  pageSize?: number
}

export interface TransportRecordStatistics {
  byDriver: Array<{ driverId: string; driverName: string; count: number }>
  byVehicle: Array<{ vehicleId: string; vehiclePlateNo: string; count: number }>
}

export interface ImportResult {
  totalRows: number
  successCount: number
  duplicateCount: number
  errorCount: number
  errors?: Array<{ row: number; message: string }>
}
```

#### 统计相关类型

```typescript
// apps/frontend/src/modules/fleet/types/statistics.ts
export interface FleetStatistics {
  certificateWarningCount: number
  monthTaskCount: number
}
```

---

## 五、前端设计

### 5.1 组件结构

```
apps/frontend/src/modules/fleet/
├── components/
│   ├── StatisticsTab.vue                # Tab 1: 统计概览（含统计卡片内联）
│   ├── VehicleManagement.vue            # Tab 2: 车辆管理（含列表表格）
│   ├── VehicleFormDialog.vue            # 新增/编辑车辆弹窗
│   ├── DriverManagement.vue             # Tab 3: 司机管理（含列表表格）
│   ├── DriverFormDialog.vue             # 新增/编辑司机弹窗
│   ├── CertificateManagement.vue        # Tab 4: 证照管理（含列表表格）
│   ├── CertificateFormDialog.vue        # 新增/编辑证照弹窗
│   ├── TransportRecordManagement.vue    # Tab 5: 运输流水（含列表表格、导入）
│   └── StatusTag.vue                    # 状态标签组件（颜色区分）
├── pages/
│   └── FleetPage.vue                    # 主页面（包含5个Tab）
├── stores/
│   └── useFleetStore.ts                 # Fleet 状态管理
├── services/
│   └── fleetService.ts                  # Fleet API 服务
├── types/
│   ├── index.ts                         # 类型导出
│   ├── vehicle.ts                       # 车辆相关类型
│   ├── driver.ts                        # 司机相关类型
│   ├── certificate.ts                   # 证照相关类型
│   ├── transport-record.ts              # 运输流水相关类型
│   └── statistics.ts                    # 统计相关类型
├── index.ts                             # 模块公共 API
└── __tests__/
    ├── VehicleManagement.test.ts
    ├── DriverManagement.test.ts
    ├── CertificateManagement.test.ts
    └── useFleetStore.test.ts
```

### 5.2 状态管理

使用单个 Pinia Store（`useFleetStore`）统一管理 fleet 模块的所有状态，每个实体有独立的 loading/error 状态。

**状态（State）**：

| 状态 | 类型 | 说明 |
|------|------|------|
| `vehicles` | `Vehicle[]` | 车辆列表 |
| `drivers` | `Driver[]` | 司机列表 |
| `certificates` | `Certificate[]` | 证照列表 |
| `transportRecords` | `TransportRecord[]` | 运输流水列表 |
| `statistics` | `FleetStatistics \| null` | 车队统计数据 |
| `vehicleLoading` / `vehicleError` | `boolean` / `string \| null` | 车辆操作状态 |
| `driverLoading` / `driverError` | `boolean` / `string \| null` | 司机操作状态 |
| `certificateLoading` / `certificateError` | `boolean` / `string \| null` | 证照操作状态 |
| `transportRecordLoading` / `transportRecordError` | `boolean` / `string \| null` | 运输流水操作状态 |
| `transportStatsLoading` / `transportStatsError` | `boolean` / `string \| null` | 运输统计操作状态 |
| `statisticsLoading` / `statisticsError` | `boolean` / `string \| null` | 统计操作状态 |

**计算属性（Getters）**：

| Getter | 返回值 | 说明 |
|--------|--------|------|
| `idleVehicles` | `Vehicle[]` | 空闲且未停用的车辆 |
| `transitingVehicles` | `Vehicle[]` | 运输中的车辆 |
| `overdueVehicles` | `Vehicle[]` | 超时的车辆 |

**操作方法（Actions）**：

| Action | 签名 | 说明 |
|--------|------|------|
| `fetchVehicles` | `(params?: VehicleListParams) => Promise<void>` | 获取车辆列表 |
| `createVehicle` | `(data: CreateVehicleRequest) => Promise<Vehicle>` | 新增车辆 |
| `updateVehicle` | `(id: string, data: UpdateVehicleRequest) => Promise<Vehicle>` | 编辑车辆 |
| `disableVehicle` | `(id: string) => Promise<void>` | 停用车辆 |
| `fetchDrivers` | `(params?: DriverListParams) => Promise<void>` | 获取司机列表 |
| `createDriver` | `(data: CreateDriverRequest) => Promise<Driver>` | 新增司机 |
| `updateDriver` | `(id: string, data: UpdateDriverRequest) => Promise<Driver>` | 编辑司机 |
| `disableDriver` | `(id: string) => Promise<void>` | 停用司机 |
| `fetchCertificates` | `(params?: CertificateListParams) => Promise<void>` | 获取证照列表 |
| `createCertificate` | `(data: CreateCertificateRequest) => Promise<Certificate>` | 新增证照 |
| `updateCertificate` | `(id: string, data: UpdateCertificateRequest) => Promise<Certificate>` | 编辑证照 |
| `deleteCertificate` | `(id: string) => Promise<void>` | 删除证照 |
| `fetchTransportRecords` | `(params?: TransportRecordListParams) => Promise<void>` | 获取运输流水列表 |
| `importTransportRecords` | `(file: File) => Promise<ImportResult>` | 导入运输流水 |
| `fetchTransportRecordStatistics` | `() => Promise<TransportRecordStatistics>` | 获取运输统计（实时，不缓存） |
| `fetchStatistics` | `() => Promise<void>` | 获取车队统计数据 |

**设计要点**：
- 每个 action 遵循统一的 try-catch-finally 模式：设置 loading → 调用 service → 更新 state → 捕获错误 → 清除 loading
- `fetchTransportRecordStatistics` 不缓存结果到 state，每次调用直接返回最新数据
- 完整实现代码见 tasks.md 各阶段任务定义

### 5.3 路由配置

```typescript
// apps/frontend/src/router/index.ts
{
  path: '/fleet',
  name: 'Fleet',
  component: () => import('@/modules/fleet/components/FleetPage.vue'),
  meta: {
    requiresAuth: true,
    title: '车队管理'
  }
}
```

---

## 六、文件存储方案

**存储方式**：本地文件系统

**存储路径**：`apps/server/uploads/certificates/`

**访问方式**：数据库 `attachment` 字段存储纯文件名（如 `abc123.jpg`），子目录 `certificates/` 在代码中硬编码。前端通过受保护的 API 端点代理访问（需登录态校验），而非直接暴露静态目录。

**API 端点**：`GET /api/v1/fleet/certificates/{id}/attachment` — 校验登录态后返回证照附件文件流。

**后端实现**：
```python
# apps/server/app/api/v1/fleet.py
from fastapi.responses import FileResponse

@router.get("/certificates/{id}/attachment")
async def get_certificate_attachment(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.id == id))
    cert = result.scalar_one_or_none()
    if not cert or not cert.attachment:
        raise AppException(code=404, message="证照附件不存在")
    full_path = _safe_attachment_path(cert.attachment)
    if not os.path.exists(full_path):
        raise AppException(code=404, message="附件文件不存在")
    return FileResponse(full_path)
```

**文件限制**：
- 格式：仅 JPG/PNG
- 大小：≤ 5MB

**运输流水导入文件限制**：
- 格式：Excel (.xlsx) 或 txt（Tab 分隔）
- 大小：≤ 10MB（`MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024`）

**设计决策**：选择本地存储而非云存储，理由：内部管理系统、访问量低、零成本、备份简单（直接拷贝目录）。未来如需迁移到云存储，只需修改文件写入和读取逻辑，数据库字段不变。

> **注意**：生产环境部署时，`uploads/` 目录需挂载持久卷（Docker volume 或独立磁盘），避免容器重建导致文件丢失。同时需配置定期备份策略。

---

## 七、核心逻辑

### 7.1 车辆状态自动更新

**触发时机**：
1. 调度中心分配任务时（AC-027）
2. 任务完成时
3. 任务超时时（AC-028）

**实现方式**：
- 在 `dispatch` 模块的任务分配、完成、超时逻辑中，调用 `fleet` 模块的服务层函数 `update_vehicle_status` 更新车辆状态（进程内调用）
- 使用后端服务层封装状态更新逻辑，确保一致性

**后端服务代码**：
```python
# apps/server/app/services/fleet_service.py
from app.models.vehicle import Vehicle, VehicleStatus
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def update_vehicle_status(db: AsyncSession, vehicle_id: uuid.UUID, new_status: str):
    """更新车辆状态（供 dispatch 模块调用）"""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if vehicle:
        vehicle.status = new_status
        await db.commit()

async def check_vehicle_availability(db: AsyncSession, vehicle_id: uuid.UUID) -> bool:
    """检查车辆是否可用（空闲且未停用）"""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle or vehicle.is_disabled:
        return False
    return vehicle.status == VehicleStatus.IDLE.value
```

→ AC-020：`check_vehicle_availability` 函数检查车辆是否可用
→ AC-027：`update_vehicle_status` 函数供 dispatch 模块在任务分配/完成/超时时调用，更新车辆状态为"运输中"或"空闲"
→ AC-028：车辆超时检查逻辑归属 dispatch 模块，dispatch 检测到超时后调用 `update_vehicle_status` 更新车辆状态为"超时"

### 7.2 证照预警检查

**触发时机**：
- 每日凌晨自动执行
- 用户访问统计概览 Tab 时实时计算

**实现方式**：
- 后端定时任务检查证照有效期
- 前端访问时实时查询30天内到期的证照数量

**后端服务代码**：
```python
# apps/server/app/services/fleet_service.py
from app.models.certificate import Certificate
from datetime import date, timedelta

async def get_certificate_warning_count(db: AsyncSession) -> int:
    """获取30天内到期的证照数量（不含已过期）"""
    today = date.today()
    thirty_days_later = today + timedelta(days=30)
    result = await db.execute(
        select(Certificate).where(
            Certificate.expiry_date >= today,
            Certificate.expiry_date <= thirty_days_later
        )
    )
    return len(result.scalars().all())
```

→ AC-022：`get_certificate_warning_count` 函数返回30天内到期的证照数量
→ AC-029：定时任务每日检查证照有效期

```python
# 定时任务入口函数（自行管理数据库会话，不依赖外部注入）
async def check_certificate_expiry():
    """定时任务入口：检查证照有效期并记录日志"""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        count = await get_certificate_warning_count(db)
        logger.info(f"证照预警检查完成，30天内到期证照数量：{count}")
```

### 7.3 运输流水文件导入

**导入流程**：

```
用户上传文件
  → 验证文件扩展名（.xlsx / .txt），否则拒绝（AC-024）
  → 验证文件大小（≤ 10MB），否则拒绝
  → 解析文件内容：
      - .xlsx：使用 openpyxl 读取第一个工作表
      - .txt：按 Tab 分隔解析
  → 验证列数（7 列），否则提示下载模板（AC-025）
  → 逐行处理：
      1. 检查 order_no 是否已存在 → 重复则跳过计数（AC-026）
      2. 通过 plate_no 查找 Vehicle → 不存在或已停用则记录错误
      3. 通过 phone 查找 Driver → 不存在或已停用则记录错误
      4. 创建 TransportRecord 并添加到会话
  → 批量提交数据库
  → 返回 ImportResult（totalRows / successCount / duplicateCount / errorCount / errors[:10]）
```

**关键设计选择**：
- "执行车辆"列填写**车牌号**（唯一标识），后端自动匹配转换为 vehicle_id
- "执行司机"列填写**手机号**（唯一标识），后端自动匹配转换为 driver_id
- 列名使用中文硬编码（内部管理系统无需国际化）
- 每行独立处理，单行失败不影响其他行
- 错误详情最多返回前 10 条

→ AC-012：支持 Excel 和 txt 格式导入
→ AC-024：拒绝非 Excel/txt 格式文件
→ AC-025：验证文件列数，格式错误时提示下载模板
→ AC-026：自动跳过重复的任务编号

### 7.4 删除证照时同步清理附件

**触发时机**：调度员删除证照时（AC-032）

**实现逻辑**：
1. 查询证照记录，获取 `attachment` 字段值
2. 删除数据库中的证照记录
3. 如果 `attachment` 不为空，同步删除服务器上的物理文件（`apps/server/uploads/{attachment}`）
4. 文件删除失败时记录日志但不阻断操作（避免因文件系统问题导致数据库操作回滚）

**后端服务代码**：
```python
# apps/server/app/services/fleet_service.py
import os

UPLOAD_BASE_DIR = "uploads"

def _safe_attachment_path(attachment: str) -> str:
    """安全构建附件路径，防止路径遍历攻击
    
    attachment: 纯文件名（如 abc123.jpg）
    返回: uploads/certificates/abc123.jpg
    """
    safe_name = os.path.basename(attachment)
    return os.path.join(UPLOAD_BASE_DIR, "certificates", safe_name)

def delete_certificate_attachment(certificate: Certificate):
    """删除证照的物理附件文件（不操作数据库）"""
    if not certificate.attachment:
        return
    full_path = _safe_attachment_path(certificate.attachment)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError as e:
            logger.warning(f"删除证照附件失败: {full_path}, 错误: {e}")

async def delete_certificate(db: AsyncSession, certificate_id: uuid.UUID):
    result = await db.execute(select(Certificate).where(Certificate.id == certificate_id))
    certificate = result.scalar_one_or_none()
    if not certificate:
        raise AppException(code=404, message="证照不存在")
    
    await db.delete(certificate)
    await db.commit()
    
    delete_certificate_attachment(certificate)
```

→ AC-032：删除证照时同步清理附件文件，避免磁盘空间浪费

### 7.5 司机关联车辆冲突处理

**触发时机**：新增或编辑车辆时，选择关联司机

**实现逻辑**：
1. 检查该司机是否已关联其他车辆
2. 如果已关联，提示用户确认是否更换关联
3. 确认后，清空原车辆的关联司机字段，设置新关联

**后端服务代码**：
```python
# apps/server/app/services/fleet_service.py
async def bind_driver_to_vehicle(
    db: AsyncSession, 
    vehicle_id: uuid.UUID, 
    driver_id: uuid.UUID,
    confirmed: bool = False
) -> dict:
    """绑定司机到车辆（支持两步确认）"""
    result = await db.execute(
        select(Vehicle).where(Vehicle.bound_driver_id == driver_id)
    )
    existing_vehicle = result.scalar_one_or_none()
    
    if existing_vehicle and existing_vehicle.id != vehicle_id:
        if not confirmed:
            return {
                'needConfirm': True,
                'message': f"该司机已关联车辆 {existing_vehicle.plate_no}，是否更换关联？",
                'oldVehicleId': str(existing_vehicle.id),
                'oldVehiclePlateNo': existing_vehicle.plate_no
            }
        existing_vehicle.bound_driver_id = None
    
    if existing_vehicle and existing_vehicle.id == vehicle_id:
        return {'needConfirm': False, 'message': '该司机已绑定到当前车辆'}
    
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise AppException(code=404, message="车辆不存在")
    
    vehicle.bound_driver_id = driver_id
    await db.commit()
    return {'needConfirm': False, 'message': '司机绑定成功'}
```

→ AC-030：司机已关联其他车辆时提示确认，确认后清空原关联

### 7.6 定时任务调度

**调度方案**：使用 APScheduler（AsyncIOScheduler），在 FastAPI 应用启动时注册定时任务。

**fleet 模块任务清单**：

| 任务 | 触发频率 | 对应 AC | 说明 |
|------|---------|---------|------|
| check_certificate_expiry | 每日凌晨 | AC-029 | 检查证照有效期，更新预警状态 |

**dispatch 模块任务清单**（车辆超时检查归属 dispatch）：

| 任务 | 触发频率 | 对应 AC | 说明 |
|------|---------|---------|------|
| check_overdue_vehicles | 每小时 | AC-028 | 检查运输中超过4小时的订单，调用 fleet API 更新车辆状态为"超时" |

**实现方式**：
```python
# apps/server/app/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.fleet_service import check_certificate_expiry

scheduler = AsyncIOScheduler()

def init_scheduler():
    # check_certificate_expiry() 自行管理数据库会话（签名为 async def check_certificate_expiry() -> None）
    scheduler.add_job(check_certificate_expiry, 'cron', hour=0, id='check_cert_expiry')
    scheduler.start()
```

在 FastAPI 的 `lifespan` 中调用 `init_scheduler()`，应用关闭时调用 `scheduler.shutdown()`。

> **注意**：`check_overdue_vehicles` 定时任务归属 dispatch 模块，在 dispatch 模块的调度器中注册。

→ AC-028：dispatch 模块每小时检查超时车辆，调用 fleet API 更新状态
→ AC-029：fleet 模块每日凌晨检查证照有效期

### 7.7 司机手机号格式校验

**触发时机**：新增或编辑司机时（AC-005, AC-006, AC-034, AC-035）

**校验规则**：手机号必须为 11 位数字，以 1 开头，第二位为 3-9

**后端服务代码**：
```python
# apps/server/app/api/v1/fleet.py
import re

PHONE_PATTERN = re.compile(r'^1[3-9]\d{9}$')

def validate_phone(phone: str) -> bool:
    return bool(PHONE_PATTERN.match(phone))

# 在 POST/PUT /api/v1/fleet/drivers 中调用
if not validate_phone(data.phone):
    raise AppException(code=400, message="手机号格式不正确")
```

→ AC-005：新增司机时校验手机号格式
→ AC-006：编辑司机时校验手机号格式
→ AC-034：手机号格式不正确时拒绝保存
→ AC-035：手机号重复时拒绝创建

### 7.8 删除车辆/司机时级联清理证照

**触发时机**：删除无历史记录的车辆或司机时（AC-019, AC-021 允许删除的情况）

**实现逻辑**：
1. 查询该车辆/司机的所有关联证照
2. 逐个删除证照记录及其附件文件（复用 7.4 的删除逻辑）
3. 删除车辆/司机记录

**后端服务代码**：
```python
# apps/server/app/services/fleet_service.py
async def delete_vehicle(db: AsyncSession, vehicle_id: uuid.UUID):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise AppException(code=404, message="车辆不存在")
    
    # 检查历史运输流水记录
    tr_result = await db.execute(
        select(TransportRecord).where(TransportRecord.vehicle_id == vehicle_id).limit(1)
    )
    if tr_result.scalar_one_or_none():
        raise AppException(code=400, message="该车辆有历史记录，无法删除，可标记为停用")
    
    # 级联删除关联证照
    cert_result = await db.execute(
        select(Certificate).where(
            Certificate.owner_type == OwnerType.VEHICLE.value,
            Certificate.owner_id == vehicle_id
        )
    )
    for cert in cert_result.scalars().all():
        await delete_certificate_attachment(cert)
        await db.delete(cert)
    
    await db.delete(vehicle)
    await db.commit()

async def delete_driver(db: AsyncSession, driver_id: uuid.UUID):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise AppException(code=404, message="司机不存在")
    
    tr_result = await db.execute(
        select(TransportRecord).where(TransportRecord.driver_id == driver_id).limit(1)
    )
    if tr_result.scalar_one_or_none():
        raise AppException(code=400, message="该司机有历史记录，无法删除，可标记为停用")
    
    cert_result = await db.execute(
        select(Certificate).where(
            Certificate.owner_type == OwnerType.DRIVER.value,
            Certificate.owner_id == driver_id
        )
    )
    for cert in cert_result.scalars().all():
        await delete_certificate_attachment(cert)
        await db.delete(cert)
    
    await db.delete(driver)
    await db.commit()
```

> **注意**：有历史记录的车辆/司机不允许删除（AC-019, AC-021），因此级联删除仅影响无历史记录的资源。

### 7.9 证照类型与所属对象交叉校验

**触发时机**：新增或编辑证照时（AC-008, AC-009）

**校验规则**：`cert_type` 必须与 `owner_type` 匹配——车辆证照类型只能用于车辆，司机证照类型只能用于司机。

**后端校验代码**：
```python
# apps/server/app/api/v1/fleet.py

VEHICLE_CERT_TYPES = {e.value for e in VehicleCertType}
DRIVER_CERT_TYPES = {e.value for e in DriverCertType}

def validate_cert_type(owner_type: str, cert_type: str):
    if owner_type == OwnerType.VEHICLE.value and cert_type not in VEHICLE_CERT_TYPES:
        raise AppException(code=400, message=f"车辆证照类型无效: {cert_type}")
    if owner_type == OwnerType.DRIVER.value and cert_type not in DRIVER_CERT_TYPES:
        raise AppException(code=400, message=f"司机证照类型无效: {cert_type}")
```

→ AC-008：新增证照时校验证照类型与所属对象匹配
→ AC-009：编辑证照时校验证照类型与所属对象匹配

---

## 八、AC 覆盖汇总表

| AC 编号 | AC 描述 | 技术实现点 | 状态 |
|---------|---------|-----------|------|
| AC-001 | 新增车辆成功 | Vehicle 模型 + POST /api/v1/fleet/vehicles（关联司机可选） | ✅ 已覆盖 |
| AC-002 | 编辑车辆成功 | PUT /api/v1/fleet/vehicles/{id} | ✅ 已覆盖 |
| AC-003 | 查看车辆列表 | GET /api/v1/fleet/vehicles + VehicleManagement.vue | ✅ 已覆盖 |
| AC-004 | 按状态筛选车辆 | VehicleListParams.status + Store 计算属性 | ✅ 已覆盖 |
| AC-005 | 新增司机成功 | Driver 模型 + POST /api/v1/fleet/drivers | ✅ 已覆盖 |
| AC-006 | 编辑司机成功 | PUT /api/v1/fleet/drivers/{id} | ✅ 已覆盖 |
| AC-007 | 查看司机列表 | GET /api/v1/fleet/drivers + DriverManagement.vue | ✅ 已覆盖 |
| AC-008 | 新增证照成功 | Certificate 模型 + POST /api/v1/fleet/certificates | ✅ 已覆盖 |
| AC-009 | 编辑证照成功 | PUT /api/v1/fleet/certificates/{id} | ✅ 已覆盖 |
| AC-010 | 查看证照列表 | GET /api/v1/fleet/certificates + CertificateManagement.vue | ✅ 已覆盖 |
| AC-011 | 预警筛选证照 | CertificateListParams.expiringSoon | ✅ 已覆盖 |
| AC-012 | 导入运输流水 | POST /api/v1/fleet/transport-records/import | ✅ 已覆盖 |
| AC-013 | 查看流水列表 | GET /api/v1/fleet/transport-records + TransportRecordManagement.vue | ✅ 已覆盖 |
| AC-014 | 筛选流水记录 | TransportRecordListParams | ✅ 已覆盖 |
| AC-015 | 流水统计 | GET /api/v1/fleet/transport-records/statistics | ✅ 已覆盖 |
| AC-016 | 证照预警卡片 | GET /api/v1/fleet/statistics + StatisticsTab.vue | ✅ 已覆盖 |
| AC-017 | 本月任务数卡片 | GET /api/v1/fleet/statistics + StatisticsTab.vue | ✅ 已覆盖 |
| AC-018 | 车牌号重复检查 | Vehicle.plate_no unique 约束 | ✅ 已覆盖 |
| AC-019 | 车辆停用功能 | Vehicle.is_disabled + DELETE 检查历史记录 + 级联删除证照 | ✅ 已覆盖 |
| AC-020 | 车辆可用性检查 | check_vehicle_availability 服务函数 | ✅ 已覆盖 |
| AC-021 | 司机停用功能 | Driver.is_disabled + DELETE 检查历史记录 + 级联删除证照 | ✅ 已覆盖 |
| AC-034 | 手机号格式校验 | validate_phone 函数（7.7节） | ✅ 已覆盖 |
| AC-035 | 手机号重复检查 | Driver.phone unique 约束 | ✅ 已覆盖 |
| AC-022 | 证照预警显示 | get_certificate_warning_count 服务函数 | ✅ 已覆盖 |
| AC-023 | 证照上传验证 | 前端文件大小和格式验证 | ✅ 已覆盖 |
| AC-024 | 文件格式验证 | import_transport_records 服务函数 | ✅ 已覆盖 |
| AC-025 | 文件列数验证 | import_transport_records 服务函数 | ✅ 已覆盖 |
| AC-026 | 重复记录跳过 | import_transport_records 服务函数 | ✅ 已覆盖 |
| AC-027 | 车辆状态更新 | update_vehicle_status 服务函数 | ✅ 已覆盖 |
| AC-028 | 车辆超时检查 | dispatch 模块定时任务 + 调用 fleet API 更新状态 | ✅ 已覆盖 |
| AC-029 | 证照预警检查 | get_certificate_warning_count 服务函数 | ✅ 已覆盖 |
| AC-030 | 司机关联冲突 | bind_driver_to_vehicle 服务函数 | ✅ 已覆盖 |
| AC-031 | 权限控制 | 路由守卫 + API 权限校验 | ✅ 已覆盖 |
| AC-032 | 删除证照 | DELETE /api/v1/fleet/certificates/{id} | ✅ 已覆盖 |
| AC-033 | 运输流水分页 | TransportRecordListParams.page/pageSize | ✅ 已覆盖 |

---

## 九、设计决策记录

### 决策1：司机是否关联用户账号
- **选项 A**：移除 user_id 字段，司机信息独立存在
- **选项 B**：保留 user_id 字段，每个司机对应一个 user 记录
- **选择**：A
- **理由**：符合需求文档（司机不需要登录调度端），数据结构简单，不易出错

### 决策2：运输流水导入方式
- **选项 A**：自动同步 dispatch 模块的已完成任务
- **选项 B**：手动触发导入，从 dispatch 导出后导入到 fleet
- **选项 C**：文件中转，导出 dispatch 数据为文件，导入到 fleet
- **选择**：C
- **理由**：最简单实现，两个模块完全解耦，符合"每月底操作一次"的实际场景

### 决策3：车辆状态更新方式
- **选项 A**：在 dispatch 模块直接更新 vehicle 表
- **选项 B**：通过 fleet 模块的 API 更新车辆状态
- **选择**：B
- **理由**：模块职责清晰，fleet 模块负责车辆状态管理，dispatch 模块通过 API 调用

### 决策4：页面布局方式
- **选项 A**：多页面，每个 Tab 一个独立路由
- **选项 B**：单页面 + Tab 切换
- **选择**：B
- **理由**：路由简单，状态管理简单，用户体验好（不用跳转页面）

### 决策5：移除 Driver.user_id 的影响评估
- **现状**：现有 Driver 模型有 `user_id` 字段（NOT NULL FK → users.id）
- **变更**：移除 `user_id` 字段，司机信息独立存在
- **影响评估**：
  1. **dispatch 模块**：如果 dispatch 通过 `driver.user_id` 查询用户信息（如司机姓名、电话），需要改为直接查询 `driver.name` 和 `driver.phone`
  2. **数据迁移**：已有 driver 记录的 `user_id` 列会被删除，需要确认是否有其他模块依赖此关联
  3. **建议**：在迁移脚本中添加检查，确认无其他模块依赖 `driver.user_id` 后再执行删除
- **数据迁移策略**：
  1. 如果数据库中已有 driver 记录，需先确认 `driver.name` 和 `driver.phone` 字段已填充（从关联的 user 记录复制）
  2. 迁移脚本执行顺序：先复制数据 → 再删除外键约束 → 最后删除列
  3. 如果 `driver.phone` 为空，从 `users.phone` 复制；如果 `driver.name` 为空，从 `users.name` 复制
- **风险**：低风险，需求明确司机不需要登录调度端，移除 user_id 符合业务逻辑

### 决策6：前后端字段名转换机制
- **现状**：前端 TypeScript 使用 camelCase（如 `plateNo`），后端 Python 使用 snake_case（如 `plate_no`）
- **转换机制**：在 Axios 拦截器中统一处理
  ```typescript
  // apps/frontend/src/shared/utils/axios.ts
  import camelcaseKeys from 'camelcase-keys'
  import snakecaseKeys from 'snakecase-keys'
  
  axios.interceptors.response.use(response => {
    response.data = camelcaseKeys(response.data, { deep: true })
    return response
  })
  
  axios.interceptors.request.use(config => {
    if (config.data && !(config.data instanceof FormData)) {
      config.data = snakecaseKeys(config.data, { deep: true })
    }
    if (config.params) {
      config.params = snakecaseKeys(config.params, { deep: true })
    }
    return config
  })
  ```
- **依赖**：需要安装 `camelcase-keys` 和 `snakecase-keys` npm 包
- **注意**：文件上传接口（如证照上传）需要跳过转换，避免破坏 FormData

---

## 十、关联文档

- 需求文档：[requirements.md](./requirements.md)
- 产品概述：[../../product-overview.md](../../product-overview.md)
- 开发路线图：[../../development-roadmap.md](../../development-roadmap.md)
- 数据库模型设计：[../database-model/design.md](../database-model/design.md)
- Auth 模块设计：[../auth/design.md](../auth/design.md)
- 开发规范：[../../development-standards.md](../../development-standards.md)
