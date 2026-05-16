import uuid

import pytest
from httpx import AsyncClient

from app.models.order import Order, OrderStatus
from app.models.vehicle import Vehicle, VehicleStatus


async def create_test_vehicle(db_session, plate_no: str, ownership: str = "own"):
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


async def create_test_order(db_session, dispatcher_id: uuid.UUID, **kwargs):
    from app.services.dispatch_service import generate_order_no

    order_no = await generate_order_no(db_session)
    order_data = {
        "id": uuid.uuid4(),
        "order_no": order_no,
        "status": OrderStatus.PENDING.value,
        "dispatcher_id": dispatcher_id,
    }
    order_data.update(kwargs)
    order = Order(**order_data)
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    return order


class TestCreateOrderAPI:
    @pytest.mark.asyncio
    async def test_create_skeleton_order(self, client: AsyncClient, db_session, auth_headers):
        response = await client.post(
            "/api/v1/dispatch/orders",
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert data["order_no"].startswith("DD")
        assert data["customer_name"] is None
        assert data["origin_name"] is None

    @pytest.mark.asyncio
    async def test_create_order_with_fields(self, client: AsyncClient, db_session, auth_headers):
        response = await client.post(
            "/api/v1/dispatch/orders",
            json={
                "customer_name": "测试客户",
                "customer_phone": "13800138000",
                "origin_name": "上海港",
                "dest_name": "昆山工厂",
                "container_no": "ABCD1234567",
                "container_type": "40GP",
                "business_type": "heavy_transport",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["customer_name"] == "测试客户"
        assert data["origin_name"] == "上海港"
        assert data["dest_name"] == "昆山工厂"
        assert data["container_no"] == "ABCD1234567"

    @pytest.mark.asyncio
    async def test_create_order_empty_strings_to_none(self, client: AsyncClient, db_session, auth_headers):
        response = await client.post(
            "/api/v1/dispatch/orders",
            json={
                "customer_name": "",
                "origin_name": "",
                "container_no": "",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["customer_name"] is None
        assert data["origin_name"] is None
        assert data["container_no"] is None

    @pytest.mark.asyncio
    async def test_create_order_same_origin_dest(self, client: AsyncClient, db_session, auth_headers):
        response = await client.post(
            "/api/v1/dispatch/orders",
            json={
                "origin_name": "上海港",
                "dest_name": "上海港",
            },
            headers=auth_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_order_driver_without_vehicle(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")

        response = await client.post(
            "/api/v1/dispatch/orders",
            json={
                "driver_id": str(driver.id),
            },
            headers=auth_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_order_unauthorized(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/dispatch/orders",
            json={},
        )

        assert response.status_code == 401


class TestListOrdersAPI:
    @pytest.mark.asyncio
    async def test_list_orders_empty(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/dispatch/orders", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["status_counts"]["pending"] == 0

    @pytest.mark.asyncio
    async def test_list_orders_with_data(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_list", "test123", UserRole.DISPATCHER.value)
        await create_test_order(db_session, user.id)
        await create_test_order(db_session, user.id)

        response = await client.get("/api/v1/dispatch/orders", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_list_orders_filter_by_status(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_filter", "test123", UserRole.DISPATCHER.value)
        await create_test_order(db_session, user.id, status=OrderStatus.PENDING.value)
        await create_test_order(db_session, user.id, status=OrderStatus.COMPLETED.value)

        response = await client.get(
            "/api/v1/dispatch/orders",
            params={"status": "pending"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["status"] == "pending"

    @pytest.mark.asyncio
    async def test_list_orders_filter_by_keyword(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_kw", "test123", UserRole.DISPATCHER.value)
        await create_test_order(db_session, user.id, customer_name="张三")
        await create_test_order(db_session, user.id, customer_name="李四")

        response = await client.get(
            "/api/v1/dispatch/orders",
            params={"keyword": "张三"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_list_orders_pagination(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_page", "test123", UserRole.DISPATCHER.value)
        for i in range(5):
            await create_test_order(db_session, user.id)

        response = await client.get(
            "/api/v1/dispatch/orders",
            params={"page": 1, "page_size": 2},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["items"]) == 2
        assert data["total"] == 5

    @pytest.mark.asyncio
    async def test_list_orders_status_counts(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_counts", "test123", UserRole.DISPATCHER.value)
        await create_test_order(db_session, user.id, status=OrderStatus.PENDING.value)
        await create_test_order(db_session, user.id, status=OrderStatus.PENDING.value)
        await create_test_order(db_session, user.id, status=OrderStatus.ASSIGNED.value)

        response = await client.get("/api/v1/dispatch/orders", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["status_counts"]["pending"] == 2
        assert data["status_counts"]["assigned"] == 1

    @pytest.mark.asyncio
    async def test_list_orders_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/dispatch/orders")

        assert response.status_code == 401


class TestGetOrderAPI:
    @pytest.mark.asyncio
    async def test_get_order_success(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_get", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id, customer_name="测试客户")

        response = await client.get(
            f"/api/v1/dispatch/orders/{order.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["customer_name"] == "测试客户"
        assert data["status"] == "pending"

    @pytest.mark.asyncio
    async def test_get_order_not_found(self, client: AsyncClient, auth_headers):
        response = await client.get(
            f"/api/v1/dispatch/orders/{uuid.uuid4()}",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_order_unauthorized(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_get2", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id)

        response = await client.get(f"/api/v1/dispatch/orders/{order.id}")

        assert response.status_code == 401


class TestUpdateOrderAPI:
    @pytest.mark.asyncio
    async def test_update_order_success(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_update", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id)

        response = await client.put(
            f"/api/v1/dispatch/orders/{order.id}",
            json={"customer_name": "新客户名"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["customer_name"] == "新客户名"

    @pytest.mark.asyncio
    async def test_update_order_not_found(self, client: AsyncClient, auth_headers):
        response = await client.put(
            f"/api/v1/dispatch/orders/{uuid.uuid4()}",
            json={"customer_name": "新客户名"},
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_order_not_pending(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_update2", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id, status=OrderStatus.ASSIGNED.value)

        response = await client.put(
            f"/api/v1/dispatch/orders/{order.id}",
            json={"customer_name": "新客户名"},
            headers=auth_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_order_unauthorized(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_update3", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id)

        response = await client.put(
            f"/api/v1/dispatch/orders/{order.id}",
            json={"customer_name": "新客户名"},
        )

        assert response.status_code == 401


class TestDeleteOrderAPI:
    @pytest.mark.asyncio
    async def test_delete_order_success(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_delete", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id)

        response = await client.delete(
            f"/api/v1/dispatch/orders/{order.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "删除成功"

    @pytest.mark.asyncio
    async def test_delete_order_not_found(self, client: AsyncClient, auth_headers):
        response = await client.delete(
            f"/api/v1/dispatch/orders/{uuid.uuid4()}",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_order_unauthorized(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_delete2", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id)

        response = await client.delete(f"/api/v1/dispatch/orders/{order.id}")

        assert response.status_code == 401


class TestAssignOrderAPI:
    @pytest.mark.asyncio
    async def test_assign_order_success(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_assign", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id)
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.post(
            f"/api/v1/dispatch/orders/{order.id}/assign",
            json={
                "driver_id": str(driver.id),
                "vehicle_id": str(vehicle.id),
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "assigned"
        assert data["driver_id"] == str(driver.id)
        assert data["vehicle_id"] == str(vehicle.id)

    @pytest.mark.asyncio
    async def test_assign_order_not_found(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.post(
            f"/api/v1/dispatch/orders/{uuid.uuid4()}/assign",
            json={
                "driver_id": str(driver.id),
                "vehicle_id": str(vehicle.id),
            },
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_assign_order_unauthorized(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_assign2", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id)
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.post(
            f"/api/v1/dispatch/orders/{order.id}/assign",
            json={
                "driver_id": str(driver.id),
                "vehicle_id": str(vehicle.id),
            },
        )

        assert response.status_code == 401


class TestCompleteOrderAPI:
    @pytest.mark.asyncio
    async def test_complete_order_success(self, client: AsyncClient, db_session, auth_headers):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_complete", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id, status=OrderStatus.ASSIGNED.value)

        response = await client.post(
            f"/api/v1/dispatch/orders/{order.id}/complete",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["completed_at"] is not None

    @pytest.mark.asyncio
    async def test_complete_order_not_found(self, client: AsyncClient, auth_headers):
        response = await client.post(
            f"/api/v1/dispatch/orders/{uuid.uuid4()}/complete",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_complete_order_unauthorized(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        from app.models.user import UserRole

        user = await create_test_user(db_session, "dispatcher_complete2", "test123", UserRole.DISPATCHER.value)
        order = await create_test_order(db_session, user.id, status=OrderStatus.ASSIGNED.value)

        response = await client.post(f"/api/v1/dispatch/orders/{order.id}/complete")

        assert response.status_code == 401


class TestAvailableResourcesAPI:
    @pytest.mark.asyncio
    async def test_get_available_resources(self, client: AsyncClient, db_session, auth_headers):
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.get(
            "/api/v1/dispatch/orders/available-resources",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["drivers"]) == 1
        assert data["drivers"][0]["name"] == "张三"
        assert len(data["vehicles"]) == 1
        assert data["vehicles"][0]["plate_no"] == "粤A12345"

    @pytest.mark.asyncio
    async def test_get_available_resources_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/dispatch/orders/available-resources")

        assert response.status_code == 401


class TestDispatchAddressesAPI:
    @pytest.mark.asyncio
    async def test_create_address(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/dispatch/addresses",
            json={"name": "上海港"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "上海港"

    @pytest.mark.asyncio
    async def test_create_duplicate_address(self, client: AsyncClient, auth_headers):
        await client.post(
            "/api/v1/dispatch/addresses",
            json={"name": "上海港"},
            headers=auth_headers,
        )

        response = await client.post(
            "/api/v1/dispatch/addresses",
            json={"name": "上海港"},
            headers=auth_headers,
        )

        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_list_addresses(self, client: AsyncClient, auth_headers):
        await client.post(
            "/api/v1/dispatch/addresses",
            json={"name": "上海港"},
            headers=auth_headers,
        )
        await client.post(
            "/api/v1/dispatch/addresses",
            json={"name": "宁波港"},
            headers=auth_headers,
        )

        response = await client.get("/api/v1/dispatch/addresses", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_delete_address(self, client: AsyncClient, auth_headers):
        create_resp = await client.post(
            "/api/v1/dispatch/addresses",
            json={"name": "上海港"},
            headers=auth_headers,
        )
        address_id = create_resp.json()["id"]

        response = await client.delete(
            f"/api/v1/dispatch/addresses/{address_id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "删除成功"

    @pytest.mark.asyncio
    async def test_delete_address_not_found(self, client: AsyncClient, auth_headers):
        response = await client.delete(
            f"/api/v1/dispatch/addresses/{uuid.uuid4()}",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_addresses_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/dispatch/addresses")

        assert response.status_code == 401


class TestRouteTemplatesAPI:
    @pytest.mark.asyncio
    async def test_list_route_templates(self, client: AsyncClient, db_session, auth_headers):
        from app.models.business_type_route import BusinessTypeRoute

        route = BusinessTypeRoute(
            id=uuid.uuid4(),
            business_type="heavy_transport",
            origin_name="上海港",
            waypoints='["苏州物流园"]',
            dest_name="昆山工厂",
        )
        db_session.add(route)
        await db_session.commit()

        response = await client.get(
            "/api/v1/dispatch/route-templates",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["business_type"] == "heavy_transport"

    @pytest.mark.asyncio
    async def test_update_route_template(self, client: AsyncClient, db_session, auth_headers):
        from app.models.business_type_route import BusinessTypeRoute

        route = BusinessTypeRoute(
            id=uuid.uuid4(),
            business_type="heavy_transport",
            origin_name="旧启运地",
            waypoints=None,
            dest_name="旧目的地",
        )
        db_session.add(route)
        await db_session.commit()

        response = await client.put(
            "/api/v1/dispatch/route-templates/heavy_transport",
            json={
                "origin_name": "新启运地",
                "waypoints": ["新途径点"],
                "dest_name": "新目的地",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["origin_name"] == "新启运地"
        assert data["waypoints"] == ["新途径点"]
        assert data["dest_name"] == "新目的地"

    @pytest.mark.asyncio
    async def test_route_templates_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/dispatch/route-templates")

        assert response.status_code == 401