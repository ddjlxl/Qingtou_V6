import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dispatch_address import DispatchAddress
from app.models.driver import Driver
from app.models.order import BusinessType, Order, OrderStatus
from app.models.user import User
from app.models.vehicle import Vehicle, VehicleStatus
from app.core.exceptions import AppException


async def create_test_user(db_session, username: str, role: str = "dispatcher"):
    user = User(
        id=uuid.uuid4(),
        username=username,
        password="$2b$12$placeholder",
        name=username,
        role=role,
        status="active",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


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
    driver = Driver(
        id=uuid.uuid4(),
        name=name,
        phone=phone,
    )
    db_session.add(driver)
    await db_session.commit()
    await db_session.refresh(driver)
    return driver


async def _ensure_dispatcher(db_session, dispatcher_id: uuid.UUID):
    from sqlalchemy import select
    from app.models.user import User
    result = await db_session.execute(select(User).where(User.id == dispatcher_id))
    if result.scalar_one_or_none() is None:
        user = User(
            id=dispatcher_id,
            username=f"dispatcher_{dispatcher_id.hex[:8]}",
            password="$2b$12$placeholder",
            name=f"dispatcher_{dispatcher_id.hex[:8]}",
            role="dispatcher",
            status="active",
        )
        db_session.add(user)
        await db_session.commit()


async def create_test_order(
    db_session,
    dispatcher_id: uuid.UUID,
    status: str = OrderStatus.PENDING.value,
    driver_id: uuid.UUID | None = None,
    vehicle_id: uuid.UUID | None = None,
    **kwargs,
):
    from app.services.dispatch_service import generate_order_no

    await _ensure_dispatcher(db_session, dispatcher_id)
    order_no = await generate_order_no(db_session)
    order = Order(
        id=uuid.uuid4(),
        order_no=order_no,
        status=status,
        dispatcher_id=dispatcher_id,
        driver_id=driver_id,
        vehicle_id=vehicle_id,
        **kwargs,
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)
    return order


class TestGenerateOrderNo:
    @pytest.mark.asyncio
    async def test_first_order_of_day(self, db_session: AsyncSession):
        from app.services.dispatch_service import generate_order_no

        order_no = await generate_order_no(db_session)
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        assert order_no == f"T{today_str}0001"

    @pytest.mark.asyncio
    async def test_sequential_order_no(self, db_session: AsyncSession):
        from app.services.dispatch_service import generate_order_no

        dispatcher_id = uuid.uuid4()
        await create_test_order(db_session, dispatcher_id)
        await create_test_order(db_session, dispatcher_id)

        order_no = await generate_order_no(db_session)
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        assert order_no == f"T{today_str}0003"


class TestValidateContainerNoUnique:
    @pytest.mark.asyncio
    async def test_unique_container_no_passes(self, db_session: AsyncSession):
        from app.services.dispatch_service import validate_container_no_unique

        await validate_container_no_unique(db_session, "ABCD1234567")

    @pytest.mark.asyncio
    async def test_duplicate_container_no_raises(self, db_session: AsyncSession):
        from app.services.dispatch_service import validate_container_no_unique

        dispatcher_id = uuid.uuid4()
        await create_test_order(
            db_session, dispatcher_id,
            container_no="ABCD1234567",
            status=OrderStatus.PENDING.value,
        )

        with pytest.raises(AppException) as exc_info:
            await validate_container_no_unique(db_session, "ABCD1234567")

        assert exc_info.value.code == 409
        assert "箱号" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_duplicate_completed_order_ignored(self, db_session: AsyncSession):
        from app.services.dispatch_service import validate_container_no_unique

        dispatcher_id = uuid.uuid4()
        await create_test_order(
            db_session, dispatcher_id,
            container_no="ABCD1234567",
            status=OrderStatus.COMPLETED.value,
        )

        await validate_container_no_unique(db_session, "ABCD1234567")

    @pytest.mark.asyncio
    async def test_exclude_order_id(self, db_session: AsyncSession):
        from app.services.dispatch_service import validate_container_no_unique

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(
            db_session, dispatcher_id,
            container_no="ABCD1234567",
            status=OrderStatus.PENDING.value,
        )

        await validate_container_no_unique(db_session, "ABCD1234567", exclude_order_id=order.id)


class TestIsDriverAvailable:
    @pytest.mark.asyncio
    async def test_driver_available(self, db_session: AsyncSession):
        from app.services.dispatch_service import is_driver_available

        driver = await create_test_driver(db_session, "张三", "13800138000")
        result = await is_driver_available(db_session, driver.id)
        assert result is True

    @pytest.mark.asyncio
    async def test_driver_not_found(self, db_session: AsyncSession):
        from app.services.dispatch_service import is_driver_available

        result = await is_driver_available(db_session, uuid.uuid4())
        assert result is False

    @pytest.mark.asyncio
    async def test_driver_disabled(self, db_session: AsyncSession):
        from app.services.dispatch_service import is_driver_available

        driver = await create_test_driver(db_session, "张三", "13800138000")
        driver.is_disabled = True
        await db_session.commit()

        result = await is_driver_available(db_session, driver.id)
        assert result is False

    @pytest.mark.asyncio
    async def test_driver_busy_with_assigned_order(self, db_session: AsyncSession):
        from app.services.dispatch_service import is_driver_available

        driver = await create_test_driver(db_session, "张三", "13800138000")
        dispatcher_id = uuid.uuid4()
        await create_test_order(
            db_session, dispatcher_id,
            driver_id=driver.id,
            status=OrderStatus.ASSIGNED.value,
        )

        result = await is_driver_available(db_session, driver.id)
        assert result is False

    @pytest.mark.asyncio
    async def test_driver_busy_with_transiting_order(self, db_session: AsyncSession):
        from app.services.dispatch_service import is_driver_available

        driver = await create_test_driver(db_session, "张三", "13800138000")
        dispatcher_id = uuid.uuid4()
        await create_test_order(
            db_session, dispatcher_id,
            driver_id=driver.id,
            status=OrderStatus.TRANSITING.value,
        )

        result = await is_driver_available(db_session, driver.id)
        assert result is False


class TestCreateOrder:
    @pytest.mark.asyncio
    async def test_create_skeleton_order(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher = await create_test_user(db_session, "skeleton_dispatcher")
        dispatcher_id = dispatcher.id
        order = await create_order(db_session, {}, dispatcher_id)

        assert order.id is not None
        assert order.order_no is not None
        assert order.status == OrderStatus.PENDING.value
        assert order.dispatcher_id == dispatcher_id
        assert order.customer_name is None
        assert order.origin_name is None
        assert order.dest_name is None

    @pytest.mark.asyncio
    async def test_create_order_with_all_fields(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher = await create_test_user(db_session, "allfields_dispatcher")
        dispatcher_id = dispatcher.id
        data = {
            "customer_name": "测试客户",
            "customer_phone": "13800138000",
            "origin_name": "上海港",
            "dest_name": "昆山工厂",
            "waypoints": ["苏州物流园"],
            "container_no": "ABCD1234567",
            "container_type": "40GP",
            "seal_no": "SEAL001",
            "business_type": "heavy_transport",
            "documents": ["pickup_order", "weighing"],
            "remark": "测试备注",
        }
        order = await create_order(db_session, data, dispatcher_id)

        assert order.customer_name == "测试客户"
        assert order.customer_phone == "13800138000"
        assert order.origin_name == "上海港"
        assert order.dest_name == "昆山工厂"
        assert json.loads(order.waypoints) == ["苏州物流园"]
        assert order.container_no == "ABCD1234567"
        assert order.container_type == "40GP"
        assert order.seal_no == "SEAL001"
        assert order.business_type == "heavy_transport"
        assert json.loads(order.documents) == ["pickup_order", "weighing"]
        assert order.remark == "测试备注"

    @pytest.mark.asyncio
    async def test_create_order_same_origin_dest_raises(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher_id = uuid.uuid4()
        data = {
            "origin_name": "上海港",
            "dest_name": "上海港",
        }

        with pytest.raises(AppException) as exc_info:
            await create_order(db_session, data, dispatcher_id)

        assert exc_info.value.code == 422
        assert "不能相同" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_create_order_duplicate_container_no_raises(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher_id = uuid.uuid4()
        await create_test_order(
            db_session, dispatcher_id,
            container_no="ABCD1234567",
            status=OrderStatus.PENDING.value,
        )

        with pytest.raises(AppException) as exc_info:
            await create_order(db_session, {"container_no": "ABCD1234567"}, dispatcher_id)

        assert exc_info.value.code == 409

    @pytest.mark.asyncio
    async def test_create_order_with_driver_and_vehicle(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher = await create_test_user(db_session, "driver_vehicle_dispatcher")
        dispatcher_id = dispatcher.id
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        data = {
            "driver_id": str(driver.id),
            "vehicle_id": str(vehicle.id),
        }
        order = await create_order(db_session, data, dispatcher_id)

        assert order.driver_id == driver.id
        assert order.vehicle_id == vehicle.id
        assert order.status == OrderStatus.ASSIGNED.value
        assert order.assigned_at is not None

        await db_session.refresh(vehicle)
        assert vehicle.status == VehicleStatus.TRANSITING.value

    @pytest.mark.asyncio
    async def test_create_order_driver_not_available(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher_id = uuid.uuid4()
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        await create_test_order(
            db_session, dispatcher_id,
            driver_id=driver.id,
            status=OrderStatus.ASSIGNED.value,
        )

        data = {
            "driver_id": str(driver.id),
            "vehicle_id": str(vehicle.id),
        }

        with pytest.raises(AppException) as exc_info:
            await create_order(db_session, data, dispatcher_id)

        assert exc_info.value.code == 409
        assert "司机" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_create_order_vehicle_not_available(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher = await create_test_user(db_session, "vehicle_nav_dispatcher")
        dispatcher_id = dispatcher.id
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        vehicle.status = VehicleStatus.TRANSITING.value
        await db_session.commit()

        data = {
            "driver_id": str(driver.id),
            "vehicle_id": str(vehicle.id),
        }

        with pytest.raises(AppException) as exc_info:
            await create_order(db_session, data, dispatcher_id)

        assert exc_info.value.code == 409
        assert "车辆" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_create_order_container_no_uppercase(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher = await create_test_user(db_session, "container_upper_dispatcher")
        dispatcher_id = dispatcher.id
        order = await create_order(db_session, {"container_no": "abcd1234567"}, dispatcher_id)

        assert order.container_no == "ABCD1234567"

    @pytest.mark.asyncio
    async def test_create_order_seal_no_uppercase(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_order

        dispatcher = await create_test_user(db_session, "seal_upper_dispatcher")
        dispatcher_id = dispatcher.id
        order = await create_order(db_session, {"seal_no": "seal001"}, dispatcher_id)

        assert order.seal_no == "SEAL001"


class TestUpdateOrder:
    @pytest.mark.asyncio
    async def test_update_order_success(self, db_session: AsyncSession):
        from app.services.dispatch_service import update_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)

        updated = await update_order(db_session, order.id, {
            "customer_name": "新客户",
            "customer_phone": "13900139000",
        })

        assert updated.customer_name == "新客户"
        assert updated.customer_phone == "13900139000"

    @pytest.mark.asyncio
    async def test_update_order_not_found(self, db_session: AsyncSession):
        from app.services.dispatch_service import update_order

        with pytest.raises(AppException) as exc_info:
            await update_order(db_session, uuid.uuid4(), {"customer_name": "新客户"})

        assert exc_info.value.code == 404

    @pytest.mark.asyncio
    async def test_update_order_not_pending(self, db_session: AsyncSession):
        from app.services.dispatch_service import update_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.ASSIGNED.value,
        )

        with pytest.raises(AppException) as exc_info:
            await update_order(db_session, order.id, {"customer_name": "新客户"})

        assert exc_info.value.code == 422
        assert "待分配" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_update_order_same_origin_dest(self, db_session: AsyncSession):
        from app.services.dispatch_service import update_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)

        with pytest.raises(AppException) as exc_info:
            await update_order(db_session, order.id, {
                "origin_name": "上海港",
                "dest_name": "上海港",
            })

        assert exc_info.value.code == 422

    @pytest.mark.asyncio
    async def test_update_order_waypoints(self, db_session: AsyncSession):
        from app.services.dispatch_service import update_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)

        updated = await update_order(db_session, order.id, {
            "waypoints": ["苏州物流园", "无锡中转站"],
        })

        assert json.loads(updated.waypoints) == ["苏州物流园", "无锡中转站"]

    @pytest.mark.asyncio
    async def test_update_order_documents(self, db_session: AsyncSession):
        from app.services.dispatch_service import update_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)

        updated = await update_order(db_session, order.id, {
            "documents": ["pickup_order"],
        })

        assert json.loads(updated.documents) == ["pickup_order"]


class TestAssignOrder:
    @pytest.mark.asyncio
    async def test_assign_order_success(self, db_session: AsyncSession):
        from app.services.dispatch_service import assign_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        result = await assign_order(db_session, order.id, driver.id, vehicle.id)

        assert result.driver_id == driver.id
        assert result.vehicle_id == vehicle.id
        assert result.status == OrderStatus.ASSIGNED.value
        assert result.assigned_at is not None

        await db_session.refresh(vehicle)
        assert vehicle.status == VehicleStatus.TRANSITING.value

    @pytest.mark.asyncio
    async def test_assign_order_not_found(self, db_session: AsyncSession):
        from app.services.dispatch_service import assign_order

        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        with pytest.raises(AppException) as exc_info:
            await assign_order(db_session, uuid.uuid4(), driver.id, vehicle.id)

        assert exc_info.value.code == 404

    @pytest.mark.asyncio
    async def test_assign_order_not_pending(self, db_session: AsyncSession):
        from app.services.dispatch_service import assign_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.ASSIGNED.value,
        )
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        with pytest.raises(AppException) as exc_info:
            await assign_order(db_session, order.id, driver.id, vehicle.id)

        assert exc_info.value.code == 422

    @pytest.mark.asyncio
    async def test_assign_order_driver_busy(self, db_session: AsyncSession):
        from app.services.dispatch_service import assign_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        await create_test_order(
            db_session, dispatcher_id,
            driver_id=driver.id,
            status=OrderStatus.ASSIGNED.value,
        )

        with pytest.raises(AppException) as exc_info:
            await assign_order(db_session, order.id, driver.id, vehicle.id)

        assert exc_info.value.code == 409

    @pytest.mark.asyncio
    async def test_assign_order_vehicle_not_idle(self, db_session: AsyncSession):
        from app.services.dispatch_service import assign_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)
        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        vehicle.status = VehicleStatus.TRANSITING.value
        await db_session.commit()

        with pytest.raises(AppException) as exc_info:
            await assign_order(db_session, order.id, driver.id, vehicle.id)

        assert exc_info.value.code == 409


class TestCompleteOrder:
    @pytest.mark.asyncio
    async def test_complete_assigned_order(self, db_session: AsyncSession):
        from app.services.dispatch_service import complete_order

        dispatcher_id = uuid.uuid4()
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        vehicle.status = VehicleStatus.TRANSITING.value
        await db_session.commit()

        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.ASSIGNED.value,
            vehicle_id=vehicle.id,
        )

        result = await complete_order(db_session, order.id)

        assert result.status == OrderStatus.COMPLETED.value
        assert result.completed_at is not None

        await db_session.refresh(vehicle)
        assert vehicle.status == VehicleStatus.IDLE.value

    @pytest.mark.asyncio
    async def test_complete_transiting_order(self, db_session: AsyncSession):
        from app.services.dispatch_service import complete_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.TRANSITING.value,
        )

        result = await complete_order(db_session, order.id)

        assert result.status == OrderStatus.COMPLETED.value

    @pytest.mark.asyncio
    async def test_complete_overdue_order(self, db_session: AsyncSession):
        from app.services.dispatch_service import complete_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.OVERDUE.value,
        )

        result = await complete_order(db_session, order.id)

        assert result.status == OrderStatus.COMPLETED.value

    @pytest.mark.asyncio
    async def test_complete_pending_order_succeeds(self, db_session: AsyncSession):
        """AC-011: PENDING 状态（无司机）的任务也可以完成"""
        from app.services.dispatch_service import complete_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)

        result = await complete_order(db_session, order.id)

        assert result.status == OrderStatus.COMPLETED.value

    @pytest.mark.asyncio
    async def test_complete_order_not_found(self, db_session: AsyncSession):
        from app.services.dispatch_service import complete_order

        with pytest.raises(AppException) as exc_info:
            await complete_order(db_session, uuid.uuid4())

        assert exc_info.value.code == 404


class TestDeleteOrder:
    @pytest.mark.asyncio
    async def test_delete_pending_order(self, db_session: AsyncSession):
        from app.services.dispatch_service import delete_order

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(db_session, dispatcher_id)

        await delete_order(db_session, order.id)

        result = await db_session.get(Order, order.id)
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_assigned_order_releases_vehicle(self, db_session: AsyncSession):
        from app.services.dispatch_service import delete_order

        dispatcher_id = uuid.uuid4()
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        vehicle.status = VehicleStatus.TRANSITING.value
        await db_session.commit()

        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.ASSIGNED.value,
            vehicle_id=vehicle.id,
        )

        await delete_order(db_session, order.id)

        await db_session.refresh(vehicle)
        assert vehicle.status == VehicleStatus.IDLE.value

    @pytest.mark.asyncio
    async def test_delete_order_not_found(self, db_session: AsyncSession):
        from app.services.dispatch_service import delete_order

        with pytest.raises(AppException) as exc_info:
            await delete_order(db_session, uuid.uuid4())

        assert exc_info.value.code == 404


class TestGetAvailableResources:
    @pytest.mark.asyncio
    async def test_empty_resources(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_available_resources

        result = await get_available_resources(db_session)

        assert result["drivers"] == []
        assert result["vehicles"] == []

    @pytest.mark.asyncio
    async def test_available_driver_and_vehicle(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_available_resources

        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        result = await get_available_resources(db_session)

        assert len(result["drivers"]) == 1
        assert result["drivers"][0]["name"] == "张三"
        assert len(result["vehicles"]) == 1
        assert result["vehicles"][0]["plate_no"] == "粤A12345"

    @pytest.mark.asyncio
    async def test_busy_driver_excluded(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_available_resources

        driver = await create_test_driver(db_session, "张三", "13800138000")
        dispatcher_id = uuid.uuid4()
        await create_test_order(
            db_session, dispatcher_id,
            driver_id=driver.id,
            status=OrderStatus.ASSIGNED.value,
        )

        result = await get_available_resources(db_session)

        assert len(result["drivers"]) == 0

    @pytest.mark.asyncio
    async def test_disabled_driver_excluded(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_available_resources

        driver = await create_test_driver(db_session, "张三", "13800138000")
        driver.is_disabled = True
        await db_session.commit()

        result = await get_available_resources(db_session)

        assert len(result["drivers"]) == 0

    @pytest.mark.asyncio
    async def test_non_idle_vehicle_excluded(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_available_resources

        vehicle = await create_test_vehicle(db_session, "粤A12345")
        vehicle.status = VehicleStatus.TRANSITING.value
        await db_session.commit()

        result = await get_available_resources(db_session)

        assert len(result["vehicles"]) == 0

    @pytest.mark.asyncio
    async def test_bound_driver_vehicle_info(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_available_resources

        driver = await create_test_driver(db_session, "张三", "13800138000")
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        vehicle.bound_driver_id = driver.id
        await db_session.commit()

        result = await get_available_resources(db_session)

        assert result["drivers"][0]["bound_vehicle_plate_no"] == "粤A12345"
        assert result["vehicles"][0]["bound_driver_name"] == "张三"


class TestDispatchAddresses:
    @pytest.mark.asyncio
    async def test_create_address(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_dispatch_address

        user = await create_test_user(db_session, "addr_user1")
        user_id = user.id
        address = await create_dispatch_address(db_session, user_id, "上海港")

        assert address.name == "上海港"
        assert address.user_id == user_id

    @pytest.mark.asyncio
    async def test_create_duplicate_address_raises(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_dispatch_address

        user = await create_test_user(db_session, "addr_dup_user")
        user_id = user.id
        await create_dispatch_address(db_session, user_id, "上海港")

        with pytest.raises(AppException) as exc_info:
            await create_dispatch_address(db_session, user_id, "上海港")

        assert exc_info.value.code == 409

    @pytest.mark.asyncio
    async def test_list_addresses(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_dispatch_addresses, create_dispatch_address

        user = await create_test_user(db_session, "addr_list_user")
        user_id = user.id
        await create_dispatch_address(db_session, user_id, "上海港")
        await create_dispatch_address(db_session, user_id, "宁波港")

        addresses = await get_dispatch_addresses(db_session, user_id)

        assert len(addresses) == 2

    @pytest.mark.asyncio
    async def test_list_addresses_user_isolation(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_dispatch_addresses, create_dispatch_address

        user_a = await create_test_user(db_session, "addr_iso_user_a")
        user_b = await create_test_user(db_session, "addr_iso_user_b")
        await create_dispatch_address(db_session, user_a.id, "上海港")

        addresses = await get_dispatch_addresses(db_session, user_b.id)

        assert len(addresses) == 0

    @pytest.mark.asyncio
    async def test_delete_address(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_dispatch_address, delete_dispatch_address

        user = await create_test_user(db_session, "addr_del_user")
        user_id = user.id
        address = await create_dispatch_address(db_session, user_id, "上海港")

        await delete_dispatch_address(db_session, address.id, user_id)

        result = await db_session.get(DispatchAddress, address.id)
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_address_not_found(self, db_session: AsyncSession):
        from app.services.dispatch_service import delete_dispatch_address

        user = await create_test_user(db_session, "addr_notfound_user")
        with pytest.raises(AppException) as exc_info:
            await delete_dispatch_address(db_session, uuid.uuid4(), user.id)

        assert exc_info.value.code == 404

    @pytest.mark.asyncio
    async def test_delete_address_wrong_user(self, db_session: AsyncSession):
        from app.services.dispatch_service import create_dispatch_address, delete_dispatch_address

        user_a = await create_test_user(db_session, "addr_wrong_user_a")
        user_b = await create_test_user(db_session, "addr_wrong_user_b")
        address = await create_dispatch_address(db_session, user_a.id, "上海港")

        with pytest.raises(AppException) as exc_info:
            await delete_dispatch_address(db_session, address.id, user_b.id)

        assert exc_info.value.code == 404


class TestGetOrderStatusCounts:
    @pytest.mark.asyncio
    async def test_empty_counts(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_order_status_counts

        counts = await get_order_status_counts(db_session)

        assert counts["pending"] == 0
        assert counts["assigned"] == 0
        assert counts["transiting"] == 0
        assert counts["completed"] == 0
        assert counts["overdue"] == 0

    @pytest.mark.asyncio
    async def test_mixed_status_counts(self, db_session: AsyncSession):
        from app.services.dispatch_service import get_order_status_counts

        dispatcher_id = uuid.uuid4()
        await create_test_order(db_session, dispatcher_id, status=OrderStatus.PENDING.value)
        await create_test_order(db_session, dispatcher_id, status=OrderStatus.PENDING.value)
        await create_test_order(db_session, dispatcher_id, status=OrderStatus.ASSIGNED.value)
        await create_test_order(db_session, dispatcher_id, status=OrderStatus.COMPLETED.value)

        counts = await get_order_status_counts(db_session)

        assert counts["pending"] == 2
        assert counts["assigned"] == 1
        assert counts["completed"] == 1
        assert counts["transiting"] == 0
        assert counts["overdue"] == 0


class TestCheckOrderOverdue:
    @pytest.mark.asyncio
    async def test_no_overdue_orders(self, db_session: AsyncSession):
        from app.services.dispatch_service import check_order_overdue

        dispatcher_id = uuid.uuid4()
        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.ASSIGNED.value,
            assigned_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )

        await check_order_overdue(db_session)

        await db_session.refresh(order)
        assert order.status == OrderStatus.ASSIGNED.value

    @pytest.mark.asyncio
    async def test_overdue_order_marked(self, db_session: AsyncSession):
        from app.services.dispatch_service import check_order_overdue

        dispatcher_id = uuid.uuid4()
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        vehicle.status = VehicleStatus.TRANSITING.value
        await db_session.commit()

        order = await create_test_order(
            db_session, dispatcher_id,
            status=OrderStatus.ASSIGNED.value,
            vehicle_id=vehicle.id,
            assigned_at=datetime.now(timezone.utc) - timedelta(hours=5),
        )

        await check_order_overdue(db_session)

        await db_session.refresh(order)
        assert order.status == OrderStatus.OVERDUE.value

        await db_session.refresh(vehicle)
        assert vehicle.status == VehicleStatus.OVERDUE.value