import uuid

import pytest
from httpx import AsyncClient


async def create_test_vehicle(db_session, plate_no: str, ownership: str = "own"):
    from app.models.vehicle import Vehicle

    vehicle = Vehicle(
        id=uuid.uuid4(),
        plate_no=plate_no,
        ownership=ownership,
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


class TestCreateVehicle:
    @pytest.mark.asyncio
    async def test_create_vehicle_success(self, client: AsyncClient, db_session, auth_headers):
        response = await client.post(
            "/api/v1/fleet/vehicles",
            json={"plate_no": "粤A12345", "ownership": "own"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["plate_no"] == "粤A12345"
        assert data["ownership"] == "own"
        assert data["status"] == "idle"
        assert data["is_disabled"] is False

    @pytest.mark.asyncio
    async def test_create_vehicle_duplicate_plate(self, client: AsyncClient, db_session, auth_headers):
        await create_test_vehicle(db_session, "粤A12345")

        response = await client.post(
            "/api/v1/fleet/vehicles",
            json={"plate_no": "粤A12345", "ownership": "own"},
            headers=auth_headers,
        )

        assert response.status_code == 409
        data = response.json()
        assert data["code"] == 409


class TestListVehicles:
    @pytest.mark.asyncio
    async def test_list_vehicles_empty(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/fleet/vehicles", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_list_vehicles_with_data(self, client: AsyncClient, db_session, auth_headers):
        await create_test_vehicle(db_session, "粤A11111")
        await create_test_vehicle(db_session, "粤A22222")

        response = await client.get("/api/v1/fleet/vehicles", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_list_vehicles_filter_by_status(self, client: AsyncClient, db_session, auth_headers):
        await create_test_vehicle(db_session, "粤A11111")
        await create_test_vehicle(db_session, "粤A22222")

        response = await client.get(
            "/api/v1/fleet/vehicles",
            params={"status": "idle"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2

        response = await client.get(
            "/api/v1/fleet/vehicles",
            params={"status": "transiting"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0


class TestGetVehicle:
    @pytest.mark.asyncio
    async def test_get_vehicle_success(self, client: AsyncClient, db_session, auth_headers):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.get(
            f"/api/v1/fleet/vehicles/{vehicle.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["plate_no"] == "粤A12345"

    @pytest.mark.asyncio
    async def test_get_vehicle_not_found(self, client: AsyncClient, auth_headers):
        fake_id = str(uuid.uuid4())

        response = await client.get(
            f"/api/v1/fleet/vehicles/{fake_id}",
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestUpdateVehicle:
    @pytest.mark.asyncio
    async def test_update_vehicle_ownership(self, client: AsyncClient, db_session, auth_headers):
        vehicle = await create_test_vehicle(db_session, "粤A12345", ownership="own")

        response = await client.put(
            f"/api/v1/fleet/vehicles/{vehicle.id}",
            json={"ownership": "external"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["ownership"] == "external"

    @pytest.mark.asyncio
    async def test_update_vehicle_not_found(self, client: AsyncClient, auth_headers):
        fake_id = str(uuid.uuid4())

        response = await client.put(
            f"/api/v1/fleet/vehicles/{fake_id}",
            json={"ownership": "own"},
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestDeleteVehicle:
    @pytest.mark.asyncio
    async def test_delete_vehicle_without_history(self, client: AsyncClient, db_session, auth_headers):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.delete(
            f"/api/v1/fleet/vehicles/{vehicle.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200

    @pytest.mark.asyncio
    async def test_delete_vehicle_with_history(self, client: AsyncClient, db_session, auth_headers):
        from app.models.transport_record import TransportRecord

        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138000")

        record = TransportRecord(
            id=uuid.uuid4(),
            order_no="ORD-001",
            customer_info="测试客户",
            origin="广州",
            destination="深圳",
            container_no="CONT-001",
            vehicle_id=vehicle.id,
            driver_id=driver.id,
        )
        db_session.add(record)
        await db_session.commit()

        response = await client.delete(
            f"/api/v1/fleet/vehicles/{vehicle.id}",
            headers=auth_headers,
        )

        assert response.status_code == 409
        data = response.json()
        assert data["code"] == 409


class TestDisableVehicle:
    @pytest.mark.asyncio
    async def test_disable_vehicle_success(self, client: AsyncClient, db_session, auth_headers):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.put(
            f"/api/v1/fleet/vehicles/{vehicle.id}/disable",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200

        get_response = await client.get(
            f"/api/v1/fleet/vehicles/{vehicle.id}",
            headers=auth_headers,
        )
        vehicle_data = get_response.json()
        assert vehicle_data["is_disabled"] is True

    @pytest.mark.asyncio
    async def test_disable_vehicle_not_found(self, client: AsyncClient, auth_headers):
        fake_id = str(uuid.uuid4())

        response = await client.put(
            f"/api/v1/fleet/vehicles/{fake_id}/disable",
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestVehicleAvailability:
    @pytest.mark.asyncio
    async def test_vehicle_available(self, client: AsyncClient, db_session, auth_headers):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.get(
            f"/api/v1/fleet/vehicles/{vehicle.id}/availability",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["available"] is True

    @pytest.mark.asyncio
    async def test_vehicle_not_found(self, client: AsyncClient, auth_headers):
        fake_id = str(uuid.uuid4())

        response = await client.get(
            f"/api/v1/fleet/vehicles/{fake_id}/availability",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["available"] is False
        assert data["status"] == "not_found"


class TestBindDriver:
    @pytest.mark.asyncio
    async def test_bind_driver_success(self, client: AsyncClient, db_session, auth_headers):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138000")

        response = await client.post(
            f"/api/v1/fleet/vehicles/{vehicle.id}/bind-driver",
            json={"driver_id": str(driver.id), "confirmed": False},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["need_confirm"] is False

    @pytest.mark.asyncio
    async def test_bind_driver_vehicle_not_found(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")
        fake_id = str(uuid.uuid4())

        response = await client.post(
            f"/api/v1/fleet/vehicles/{fake_id}/bind-driver",
            json={"driver_id": str(driver.id), "confirmed": False},
            headers=auth_headers,
        )

        assert response.status_code == 404