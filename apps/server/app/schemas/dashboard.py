from pydantic import BaseModel


class DashboardStats(BaseModel):
    today_task_count: int
    completion_rate: float
    overdue_count: int
    avg_transport_minutes: float | None = None


class VehicleLocationItem(BaseModel):
    id: str
    plate_no: str
    status: str
    lat: float | None = None
    lng: float | None = None
    location: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None


class StatusCounts(BaseModel):
    pending: int = 0
    assigned: int = 0
    transiting: int = 0
    completed: int = 0
    overdue: int = 0


class DashboardResponse(BaseModel):
    stats: DashboardStats
    status_counts: StatusCounts
    vehicles: list[VehicleLocationItem]
