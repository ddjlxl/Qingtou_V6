import uuid
from datetime import date, timedelta

import pytest
from httpx import AsyncClient


async def create_test_vehicle(db_session, plate_no: str):
    from app.models.vehicle import Vehicle

    vehicle = Vehicle(
        id=uuid.uuid4(),
        plate_no=plate_no,
        ownership="own",
    )
    db_session.add(vehicle)
    await db_session.commit()
    await db_session.refresh(vehicle)
    return vehicle


async def create_test_driver(db_session, name: str, phone: str):
    from app.models.driver import Driver

    driver = Driver(
        id=uuid.uuid4(),
        name=name,
        phone=phone,
    )
    db_session.add(driver)
    await db_session.commit()
    await db_session.refresh(driver)
    return driver


async def create_test_certificate(db_session, owner_id, owner_type: str, expiry_date: date):
    from app.models.certificate import Certificate

    cert = Certificate(
        id=uuid.uuid4(),
        owner_id=owner_id,
        owner_type=owner_type,
        cert_type="vehicle_license",
        cert_name="测试证照",
        issue_date=date.today(),
        expiry_date=expiry_date,
    )
    db_session.add(cert)
    await db_session.commit()
    await db_session.refresh(cert)
    return cert


async def create_test_transport_record(db_session, vehicle_id, driver_id, order_no: str):
    from app.models.transport_record import TransportRecord

    record = TransportRecord(
        id=uuid.uuid4(),
        order_no=order_no,
        customer_info="测试客户",
        origin="广州",
        destination="深圳",
        container_no="CONT123",
        vehicle_id=vehicle_id,
        driver_id=driver_id,
    )
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)
    return record


class TestFleetStatistics:
    @pytest.mark.asyncio
    async def test_get_statistics_empty(self, client: AsyncClient, db_session, auth_headers):
        response = await client.get(
            "/api/v1/fleet/statistics",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["certificate_warning_count"] == 0
        assert data["month_task_count"] == 0

    @pytest.mark.asyncio
    async def test_get_statistics_with_data(self, client: AsyncClient, db_session, auth_headers):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138000")

        await create_test_certificate(
            db_session, vehicle.id, "vehicle",
            date.today() + timedelta(days=15)
        )
        await create_test_certificate(
            db_session, vehicle.id, "vehicle",
            date.today() + timedelta(days=60)
        )

        await create_test_transport_record(db_session, vehicle.id, driver.id, "ORDER-001")
        await create_test_transport_record(db_session, vehicle.id, driver.id, "ORDER-002")

        response = await client.get(
            "/api/v1/fleet/statistics",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["certificate_warning_count"] == 1
        assert data["month_task_count"] == 2

    @pytest.mark.asyncio
    async def test_get_statistics_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/fleet/statistics")

        assert response.status_code == 401