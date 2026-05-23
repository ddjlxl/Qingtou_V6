"""运输流水导入测试

覆盖 AC：AC-008, AC-009, AC-010, AC-024, AC-025, AC-026, AC-039（导入文件支持途径地）
"""
import io
import uuid
from datetime import date

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


async def create_test_transport_record(
    db_session,
    order_no: str,
    vehicle_id: uuid.UUID,
    driver_id: uuid.UUID,
):
    from app.models.transport_record import TransportRecord

    record = TransportRecord(
        id=uuid.uuid4(),
        order_no=order_no,
        customer_info="测试客户",
        origin="广州",
        destination="深圳",
        container_no="CONT001",
        vehicle_id=vehicle_id,
        driver_id=driver_id,
    )
    db_session.add(record)
    await db_session.commit()
    await db_session.refresh(record)
    return record


class TestTransportRecordList:
    @pytest.mark.asyncio
    async def test_list_empty(self, client: AsyncClient, auth_headers, db_session):
        response = await client.get(
            "/api/v1/fleet/transport-records", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_list_with_records(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")
        await create_test_transport_record(
            db_session, "ORD001", vehicle.id, driver.id
        )
        await create_test_transport_record(
            db_session, "ORD002", vehicle.id, driver.id
        )

        response = await client.get(
            "/api/v1/fleet/transport-records", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2
        assert data["items"][0]["order_no"] == "ORD002"

    @pytest.mark.asyncio
    async def test_list_filter_by_date(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")
        await create_test_transport_record(
            db_session, "ORD001", vehicle.id, driver.id
        )

        today = date.today().isoformat()
        response = await client.get(
            "/api/v1/fleet/transport-records",
            headers=auth_headers,
            params={"start_date": today, "end_date": today},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_list_filter_by_vehicle(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle1 = await create_test_vehicle(db_session, "粤A12345")
        vehicle2 = await create_test_vehicle(db_session, "粤B67890")
        driver = await create_test_driver(db_session, "张三", "13800138001")
        await create_test_transport_record(
            db_session, "ORD001", vehicle1.id, driver.id
        )
        await create_test_transport_record(
            db_session, "ORD002", vehicle2.id, driver.id
        )

        response = await client.get(
            "/api/v1/fleet/transport-records",
            headers=auth_headers,
            params={"vehicle_id": str(vehicle1.id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["vehicle_id"] == str(vehicle1.id)

    @pytest.mark.asyncio
    async def test_list_filter_by_driver(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver1 = await create_test_driver(db_session, "张三", "13800138001")
        driver2 = await create_test_driver(db_session, "李四", "13800138002")
        await create_test_transport_record(
            db_session, "ORD001", vehicle.id, driver1.id
        )
        await create_test_transport_record(
            db_session, "ORD002", vehicle.id, driver2.id
        )

        response = await client.get(
            "/api/v1/fleet/transport-records",
            headers=auth_headers,
            params={"driver_id": str(driver1.id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["driver_id"] == str(driver1.id)

    @pytest.mark.asyncio
    async def test_list_pagination(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")
        for i in range(5):
            await create_test_transport_record(
                db_session, f"ORD00{i}", vehicle.id, driver.id
            )

        response = await client.get(
            "/api/v1/fleet/transport-records",
            headers=auth_headers,
            params={"page": 1, "page_size": 2},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2

    @pytest.mark.asyncio
    async def test_list_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/fleet/transport-records")
        assert response.status_code == 401


class TestTransportRecordImport:
    @pytest.mark.asyncio
    async def test_import_9_columns_with_waypoints(
        self, client: AsyncClient, auth_headers, db_session
    ):
        """导入 9 列格式（包含途径地）应成功"""
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")

        content = (
            "任务编号\t客户信息\t起运地\t途径地\t目的地\t箱号\t执行车辆(车牌号)\t执行司机(手机号)\t空重箱状态\n"
            "ORD001\t测试客户\t广州\t苏州,无锡\t深圳\tCONT001\t粤A12345\t13800138001\theavy\n"
            "ORD002\t测试客户2\t佛山\t\t东莞\tCONT002\t粤A12345\t13800138001\tempty\n"
        )
        file_content = content.encode("utf-8")
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}

        response = await client.post(
            "/api/v1/fleet/transport-records/import",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_rows"] == 2
        assert data["success_count"] == 2
        assert data["error_count"] == 0

        # 验证途径地已保存
        from sqlalchemy import select
        from app.models.transport_record import TransportRecord

        result = await db_session.execute(
            select(TransportRecord).where(TransportRecord.order_no == "ORD001")
        )
        record = result.scalar_one_or_none()
        assert record is not None
        assert record.waypoints == '["苏州", "无锡"]'

        result2 = await db_session.execute(
            select(TransportRecord).where(TransportRecord.order_no == "ORD002")
        )
        record2 = result2.scalar_one_or_none()
        assert record2 is not None
        assert record2.waypoints is None

    @pytest.mark.asyncio
    async def test_import_8_columns_rejected(
        self, client: AsyncClient, auth_headers, db_session
    ):
        """强制升级：导入 8 列旧格式应被拒绝"""
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")

        content = (
            "ORD001\t测试客户\t广州\t深圳\tCONT001\t粤A12345\t13800138001\theavy\n"
        )
        file_content = content.encode("utf-8")
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}

        response = await client.post(
            "/api/v1/fleet/transport-records/import",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_import_excel_success(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")

        content = (
            "ORD001\t测试客户\t广州\t深圳\tCONT001\t粤A12345\t13800138001\n"
            "ORD002\t测试客户2\t佛山\t东莞\tCONT002\t粤A12345\t13800138001\n"
        )
        file_content = content.encode("utf-8")
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}

        response = await client.post(
            "/api/v1/fleet/transport-records/import",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_rows"] == 2
        assert data["success_count"] == 2
        assert data["duplicate_count"] == 0
        assert data["error_count"] == 0

    @pytest.mark.asyncio
    async def test_import_skip_duplicates(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")
        await create_test_transport_record(
            db_session, "ORD001", vehicle.id, driver.id
        )

        content = (
            "ORD001\t测试客户\t广州\t深圳\tCONT001\t粤A12345\t13800138001\n"
            "ORD002\t测试客户2\t佛山\t东莞\tCONT002\t粤A12345\t13800138001\n"
        )
        file_content = content.encode("utf-8")
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}

        response = await client.post(
            "/api/v1/fleet/transport-records/import",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_rows"] == 2
        assert data["success_count"] == 1
        assert data["duplicate_count"] == 1

    @pytest.mark.asyncio
    async def test_import_invalid_format(
        self, client: AsyncClient, auth_headers
    ):
        file_content = b"test"
        files = {"file": ("test.csv", io.BytesIO(file_content), "text/csv")}

        response = await client.post(
            "/api/v1/fleet/transport-records/import",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_import_wrong_column_count(
        self, client: AsyncClient, auth_headers
    ):
        content = "ORD001\t测试客户\t广州\t深圳\n"
        file_content = content.encode("utf-8")
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}

        response = await client.post(
            "/api/v1/fleet/transport-records/import",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_import_requires_auth(self, client: AsyncClient):
        file_content = b"test"
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}

        response = await client.post(
            "/api/v1/fleet/transport-records/import", files=files
        )
        assert response.status_code == 401


class TestTransportRecordStatistics:
    @pytest.mark.asyncio
    async def test_statistics_empty(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.get(
            "/api/v1/fleet/transport-records/statistics", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["by_driver"] == []
        assert data["by_vehicle"] == []

    @pytest.mark.asyncio
    async def test_statistics_with_data(
        self, client: AsyncClient, auth_headers, db_session
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        driver = await create_test_driver(db_session, "张三", "13800138001")
        await create_test_transport_record(
            db_session, "ORD001", vehicle.id, driver.id
        )
        await create_test_transport_record(
            db_session, "ORD002", vehicle.id, driver.id
        )

        response = await client.get(
            "/api/v1/fleet/transport-records/statistics", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["by_driver"]) == 1
        assert data["by_driver"][0]["count"] == 2
        assert data["by_driver"][0]["driver_name"] == "张三"
        assert len(data["by_vehicle"]) == 1
        assert data["by_vehicle"][0]["count"] == 2
        assert data["by_vehicle"][0]["vehicle_plate_no"] == "粤A12345"

    @pytest.mark.asyncio
    async def test_statistics_requires_auth(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/fleet/transport-records/statistics"
        )
        assert response.status_code == 401


class TestTransportRecordTemplate:
    @pytest.mark.asyncio
    async def test_download_template(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.get(
            "/api/v1/fleet/transport-records/template", headers=auth_headers
        )
        assert response.status_code == 200
        assert (
            "attachment" in response.headers.get("content-disposition", "")
        )

    @pytest.mark.asyncio
    async def test_template_requires_auth(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/fleet/transport-records/template"
        )
        assert response.status_code == 401