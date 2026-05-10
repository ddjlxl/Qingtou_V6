import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    plate_no: str = Field(..., min_length=1, max_length=20)
    ownership: str = Field(..., pattern="^(own|external)$")


class VehicleUpdate(BaseModel):
    ownership: Optional[str] = Field(None, pattern="^(own|external)$")
    bound_driver_id: Optional[uuid.UUID] = None


class VehicleBindDriver(BaseModel):
    driver_id: uuid.UUID
    confirmed: bool = False


class VehicleResponse(BaseModel):
    id: str
    plate_no: str
    ownership: str
    bound_driver_id: str | None
    bound_driver_name: str | None
    status: str
    is_disabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VehicleListResponse(BaseModel):
    items: list[VehicleResponse]
    total: int
    page: int
    page_size: int


class BindDriverResponse(BaseModel):
    need_confirm: bool
    message: str
    old_vehicle_id: str | None = None
    old_vehicle_plate_no: str | None = None


class VehicleAvailabilityResponse(BaseModel):
    available: bool
    status: str
    message: str


class DriverCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=1, max_length=20, pattern=r"^1\d{10}$")


class DriverUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, min_length=1, max_length=20, pattern=r"^1\d{10}$")


class DriverResponse(BaseModel):
    id: str
    name: str
    phone: str
    bound_vehicle_id: str | None
    bound_vehicle_plate_no: str | None
    is_disabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DriverListResponse(BaseModel):
    items: list[DriverResponse]
    total: int
    page: int
    page_size: int