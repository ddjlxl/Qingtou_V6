import uuid

import pytest
from httpx import AsyncClient


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


class TestCreateDriver:
    @pytest.mark.asyncio
    async def test_create_driver_success(self, client: AsyncClient, db_session, auth_headers):
        response = await client.post(
            "/api/v1/fleet/drivers",
            json={"name": "张三", "phone": "13800138000"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "张三"
        assert data["phone"] == "13800138000"
        assert data["is_disabled"] is False

    @pytest.mark.asyncio
    async def test_create_driver_duplicate_phone(self, client: AsyncClient, db_session, auth_headers):
        await create_test_driver(db_session, "张三", "13800138000")

        response = await client.post(
            "/api/v1/fleet/drivers",
            json={"name": "李四", "phone": "13800138000"},
            headers=auth_headers,
        )

        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_create_driver_invalid_phone(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/fleet/drivers",
            json={"name": "张三", "phone": "12345"},
            headers=auth_headers,
        )

        assert response.status_code == 422


class TestListDrivers:
    @pytest.mark.asyncio
    async def test_list_drivers_empty(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/fleet/drivers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_list_drivers_with_data(self, client: AsyncClient, db_session, auth_headers):
        await create_test_driver(db_session, "张三", "13800138000")
        await create_test_driver(db_session, "李四", "13900139000")

        response = await client.get("/api/v1/fleet/drivers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_list_drivers_shows_bound_vehicle(self, client: AsyncClient, db_session, auth_headers):
        from app.models.vehicle import Vehicle

        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = Vehicle(
            id=uuid.uuid4(),
            plate_no="粤A12345",
            ownership="own",
            bound_driver_id=driver.id,
        )
        db_session.add(vehicle)
        await db_session.commit()

        response = await client.get("/api/v1/fleet/drivers", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        driver_item = data["items"][0]
        assert driver_item["bound_vehicle_plate_no"] == "粤A12345"
        assert driver_item["bound_vehicle_id"] is not None


class TestGetDriver:
    @pytest.mark.asyncio
    async def test_get_driver_success(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")

        response = await client.get(
            f"/api/v1/fleet/drivers/{driver.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "张三"
        assert data["phone"] == "13800138000"

    @pytest.mark.asyncio
    async def test_get_driver_not_found(self, client: AsyncClient, auth_headers):
        fake_id = uuid.uuid4()

        response = await client.get(
            f"/api/v1/fleet/drivers/{fake_id}",
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestUpdateDriver:
    @pytest.mark.asyncio
    async def test_update_driver_success(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")

        response = await client.put(
            f"/api/v1/fleet/drivers/{driver.id}",
            json={"name": "张三三"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "张三三"

    @pytest.mark.asyncio
    async def test_update_driver_not_found(self, client: AsyncClient, auth_headers):
        fake_id = uuid.uuid4()

        response = await client.put(
            f"/api/v1/fleet/drivers/{fake_id}",
            json={"name": "张三"},
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_driver_duplicate_phone(self, client: AsyncClient, db_session, auth_headers):
        await create_test_driver(db_session, "张三", "13800138000")
        driver2 = await create_test_driver(db_session, "李四", "13900139000")

        response = await client.put(
            f"/api/v1/fleet/drivers/{driver2.id}",
            json={"phone": "13800138000"},
            headers=auth_headers,
        )

        assert response.status_code == 409


class TestDeleteDriver:
    @pytest.mark.asyncio
    async def test_delete_driver_no_history(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")

        response = await client.delete(
            f"/api/v1/fleet/drivers/{driver.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200

    @pytest.mark.asyncio
    async def test_delete_driver_not_found(self, client: AsyncClient, auth_headers):
        fake_id = uuid.uuid4()

        response = await client.delete(
            f"/api/v1/fleet/drivers/{fake_id}",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_driver_with_history(self, client: AsyncClient, db_session, auth_headers):
        from app.models.transport_record import TransportRecord
        from app.models.vehicle import Vehicle

        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = Vehicle(
            id=uuid.uuid4(),
            plate_no="粤A12345",
            ownership="own",
        )
        db_session.add(vehicle)
        await db_session.commit()

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
            f"/api/v1/fleet/drivers/{driver.id}",
            headers=auth_headers,
        )

        assert response.status_code == 409
        data = response.json()
        assert data["code"] == 409


class TestDisableDriver:
    @pytest.mark.asyncio
    async def test_disable_driver_success(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")

        response = await client.put(
            f"/api/v1/fleet/drivers/{driver.id}/disable",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200

    @pytest.mark.asyncio
    async def test_disable_driver_not_found(self, client: AsyncClient, auth_headers):
        fake_id = uuid.uuid4()

        response = await client.put(
            f"/api/v1/fleet/drivers/{fake_id}/disable",
            headers=auth_headers,
        )

        assert response.status_code == 404