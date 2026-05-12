from fastapi import APIRouter

from app.api.v1.fleet_certificates import router as certificates_router
from app.api.v1.fleet_drivers import router as drivers_router
from app.api.v1.fleet_statistics import router as statistics_router
from app.api.v1.fleet_transport_records import router as transport_records_router
from app.api.v1.fleet_vehicles import router as vehicles_router

router = APIRouter(prefix="/fleet", tags=["车队管理"])

router.include_router(vehicles_router)
router.include_router(drivers_router)
router.include_router(certificates_router)
router.include_router(transport_records_router)
router.include_router(statistics_router)