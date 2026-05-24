import uuid
from datetime import date, datetime
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


class CertificateCreate(BaseModel):
    owner_id: uuid.UUID
    owner_type: str = Field(..., pattern="^(vehicle|driver)$")
    cert_type: str = Field(..., min_length=1, max_length=50)
    cert_name: str = Field(..., min_length=1, max_length=100)
    issue_date: date
    expiry_date: date
    remark: Optional[str] = Field(None, max_length=500)


class CertificateUpdate(BaseModel):
    cert_type: Optional[str] = Field(None, min_length=1, max_length=50)
    cert_name: Optional[str] = Field(None, min_length=1, max_length=100)
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    remark: Optional[str] = Field(None, max_length=500)


class CertificateResponse(BaseModel):
    id: str
    owner_id: str
    owner_type: str
    owner_name: str | None = None
    cert_type: str
    cert_name: str
    issue_date: date
    expiry_date: date
    attachment: str | None = None
    remark: str | None = None
    is_expiring_soon: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CertificateListResponse(BaseModel):
    items: list[CertificateResponse]
    total: int
    page: int
    page_size: int


class CertificateWarningCountResponse(BaseModel):
    count: int


class TransportRecordResponse(BaseModel):
    id: str
    order_no: str
    customer_info: str
    container_status: str | None = None
    origin: str
    destination: str
    waypoints: list[str] | None = None
    container_no: str
    vehicle_id: str
    vehicle_plate_no: str | None = None
    driver_id: str
    driver_name: str | None = None
    business_date: date | None = None
    imported_at: datetime

    model_config = {"from_attributes": True}


class TransportRecordListResponse(BaseModel):
    items: list[TransportRecordResponse]
    total: int
    page: int
    page_size: int


class TransportRecordStatisticsResponse(BaseModel):
    by_driver: list[dict]
    by_vehicle: list[dict]


class ImportResultResponse(BaseModel):
    total_rows: int
    success_count: int
    duplicate_count: int
    error_count: int
    errors: list[dict] | None = None


class FleetStatisticsResponse(BaseModel):
    certificate_warning_count: int
    month_task_count: int