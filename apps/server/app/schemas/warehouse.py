from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SlotResponse(BaseModel):
    id: str
    zone_code: str
    slot_no: str
    row: int
    col: int
    status: str
    container_no: str | None = None
    container_status: str | None = None
    customer_name: str | None = None
    container_type: str | None = None
    seal_no: str | None = None
    stored_at: datetime | None = None
    remark: str | None = None

    model_config = {"from_attributes": True}


class ZoneResponse(BaseModel):
    id: str
    name: str
    zone_code: str
    sort_order: int
    used_count: int
    total_count: int
    slots: list[SlotResponse]

    model_config = {"from_attributes": True}


class ZoneListResponse(BaseModel):
    zones: list[ZoneResponse]


class WarehouseStatistics(BaseModel):
    total_slots: int
    used_slots: int
    available_slots: int
    heavy_count: int
    empty_container_count: int
    utilization_rate: float


class ManualInboundItem(BaseModel):
    container_no: str = Field(pattern=r"^[A-Z]{4}\d{7}$")
    container_status: str | None = Field(default=None, pattern=r"^(heavy|empty)$")
    customer_name: str | None = None
    container_type: str | None = Field(default=None, pattern=r"^(20GP|40GP|40HQ|45HQ)$")
    seal_no: str | None = None


class ManualInboundRequest(BaseModel):
    zone_code: str
    items: list[ManualInboundItem] = Field(min_length=1)


class InboundResultItem(BaseModel):
    slot_no: str
    container_no: str


class ManualInboundResponse(BaseModel):
    stored_count: int
    items: list[InboundResultItem]


class ImportInboundResponse(BaseModel):
    total_rows: int
    stored_count: int
    errors: list[str]


class OutboundItem(BaseModel):
    slot_id: str


class OutboundRequest(BaseModel):
    items: list[OutboundItem] = Field(min_length=1)
    business_type: str | None = Field(None, pattern=r"^(heavy_transport|empty_transport|short_haul)$")


class OutboundResultItem(BaseModel):
    slot_no: str
    container_no: str
    order_no: str


class OutboundResponse(BaseModel):
    outbound_count: int
    items: list[OutboundResultItem]


class MoveRequest(BaseModel):
    source_slot_id: str
    target_slot_id: str

    model_config = {"from_attributes": True}

    def model_post_init(self, __context: object) -> None:
        if self.source_slot_id == self.target_slot_id:
            raise ValueError("源库位和目标库位不能相同")


class MoveResponse(BaseModel):
    source_slot_no: str
    target_slot_no: str


class SlotUpdateRequest(BaseModel):
    customer_name: str | None = None
    remark: str | None = None
    container_status: str | None = Field(default=None, pattern=r"^(heavy|empty)$")


class SlotUpdateResponse(BaseModel):
    slot_no: str
    customer_name: str | None = None
    remark: str | None = None
    container_status: str | None = None


class SearchHighlight(BaseModel):
    slot_id: str
    zone_code: str
    slot_no: str
    container_no: str | None = None
    customer_name: str | None = None
    matched_fields: list[str]


class SearchResponse(BaseModel):
    keyword: str
    total: int
    items: list[SearchHighlight]
    zone_counts: dict[str, int]
