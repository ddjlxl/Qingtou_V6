import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


def empty_str_to_none(v):
    """将空字符串转换为 None"""
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


class OrderCreate(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=20)
    origin_name: Optional[str] = Field(None, max_length=200)
    dest_name: Optional[str] = Field(None, max_length=200)
    waypoints: Optional[list[str]] = None
    container_no: Optional[str] = Field(None, max_length=20)
    container_type: Optional[str] = Field(None, pattern="^(20GP|40GP|40HQ|45HQ)$")
    seal_no: Optional[str] = Field(None, max_length=20)
    business_type: Optional[str] = Field(
        None, pattern="^(heavy_transport|empty_transport|short_haul)$"
    )
    container_status: Optional[str] = Field(
        None, pattern="^(heavy|empty)$"
    )
    documents: Optional[list[str]] = None
    driver_id: Optional[uuid.UUID] = None
    vehicle_id: Optional[uuid.UUID] = None
    remark: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="before")
    @classmethod
    def convert_empty_strings_to_none(cls, data):
        """将所有空字符串字段转换为 None"""
        if isinstance(data, dict):
            return {k: empty_str_to_none(v) for k, v in data.items()}
        return data

    @model_validator(mode="after")
    def check_driver_vehicle_pair(self) -> "OrderCreate":
        has_driver = self.driver_id is not None
        has_vehicle = self.vehicle_id is not None
        if has_driver != has_vehicle:
            raise ValueError("司机和车辆必须同时选择或同时留空")
        return self


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=20)
    origin_name: Optional[str] = Field(None, max_length=200)
    dest_name: Optional[str] = Field(None, max_length=200)
    waypoints: Optional[list[str]] = None
    container_no: Optional[str] = Field(None, max_length=20)
    container_type: Optional[str] = Field(None, pattern="^(20GP|40GP|40HQ|45HQ)$")
    seal_no: Optional[str] = Field(None, max_length=20)
    business_type: Optional[str] = Field(
        None, pattern="^(heavy_transport|empty_transport|short_haul)$"
    )
    container_status: Optional[str] = Field(None, pattern="^(heavy|empty)$")
    documents: Optional[list[str]] = None
    remark: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="before")
    @classmethod
    def convert_empty_strings_to_none(cls, data):
        """将所有空字符串字段转换为 None"""
        if isinstance(data, dict):
            return {k: empty_str_to_none(v) for k, v in data.items()}
        return data


class OrderAssign(BaseModel):
    driver_id: uuid.UUID
    vehicle_id: uuid.UUID


class OrderResponse(BaseModel):
    id: str
    order_no: str
    status: str
    customer_name: str | None = None
    customer_phone: str | None = None
    origin_name: str | None = None
    dest_name: str | None = None
    waypoints: list[str] | None = None
    container_no: str | None = None
    container_type: str | None = None
    seal_no: str | None = None
    business_type: str | None = None
    container_status: str | None = None
    documents: list[str] | None = None
    driver_id: str | None = None
    driver_name: str | None = None
    vehicle_id: str | None = None
    vehicle_plate_no: str | None = None
    dispatcher_id: str
    dispatcher_name: str | None = None
    remark: str | None = None
    assigned_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusCounts(BaseModel):
    pending: int = 0
    assigned: int = 0
    transiting: int = 0
    completed: int = 0
    overdue: int = 0


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    page_size: int
    status_counts: OrderStatusCounts


class AvailableDriver(BaseModel):
    id: str
    name: str
    phone: str
    bound_vehicle_plate_no: str | None = None


class AvailableVehicle(BaseModel):
    id: str
    plate_no: str
    bound_driver_name: str | None = None


class AvailableResourcesResponse(BaseModel):
    drivers: list[AvailableDriver]
    vehicles: list[AvailableVehicle]


class DispatchAddressCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class DispatchAddressResponse(BaseModel):
    id: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DispatchAddressListResponse(BaseModel):
    items: list[DispatchAddressResponse]


class RouteTemplateResponse(BaseModel):
    origin_name: str | None = None
    waypoints: list[str] | None = None
    dest_name: str | None = None
    documents: list[str] | None = None
    container_status: str | None = None


class RouteTemplateUpdate(BaseModel):
    origin_name: str | None = Field(None, max_length=200)
    waypoints: list[str] | None = None
    dest_name: str | None = Field(None, max_length=200)
    documents: list[str] | None = None
    container_status: str | None = None

    @model_validator(mode="before")
    @classmethod
    def convert_empty_strings_to_none(cls, data):
        """将所有空字符串字段转换为 None"""
        if isinstance(data, dict):
            return {k: empty_str_to_none(v) for k, v in data.items()}
        return data


class RouteTemplateItem(BaseModel):
    business_type: str
    origin_name: str | None = None
    waypoints: list[str] | None = None
    dest_name: str | None = None
    documents: list[str] | None = None
    container_status: str | None = None

    model_config = {"from_attributes": True}


class RouteTemplateListResponse(BaseModel):
    items: list[RouteTemplateItem]