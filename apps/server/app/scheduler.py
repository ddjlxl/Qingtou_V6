from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.dispatch_service import check_order_overdue
from app.services.fleet_service import check_certificate_expiry

scheduler = AsyncIOScheduler()


def init_scheduler() -> None:
    scheduler.add_job(
        check_certificate_expiry,
        "cron",
        hour=0,
        id="check_cert_expiry",
    )
    scheduler.add_job(
        check_order_overdue,
        "interval",
        minutes=1,
        id="check_order_overdue",
    )
    scheduler.start()


def shutdown_scheduler() -> None:
    scheduler.shutdown()