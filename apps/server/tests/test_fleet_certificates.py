import uuid
from datetime import date, timedelta

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


async def create_test_certificate(
    db_session,
    owner_id: uuid.UUID,
    owner_type: str = "vehicle",
    cert_type: str = "vehicle_license",
    cert_name: str = "行驶证",
    expiry_date: date | None = None,
):
    from app.models.certificate import Certificate

    cert = Certificate(
        id=uuid.uuid4(),
        owner_id=owner_id,
        owner_type=owner_type,
        cert_type=cert_type,
        cert_name=cert_name,
        issue_date=date.today(),
        expiry_date=expiry_date or date.today() + timedelta(days=365),
    )
    db_session.add(cert)
    await db_session.commit()
    await db_session.refresh(cert)
    return cert


class TestCreateCertificate:
    @pytest.mark.asyncio
    async def test_create_vehicle_certificate_success(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.post(
            "/api/v1/fleet/certificates",
            data={
                "owner_id": str(vehicle.id),
                "owner_type": "vehicle",
                "cert_type": "vehicle_license",
                "cert_name": "行驶证",
                "issue_date": "2026-01-01",
                "expiry_date": "2027-01-01",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["cert_name"] == "行驶证"
        assert data["cert_type"] == "vehicle_license"
        assert data["owner_type"] == "vehicle"
        assert data["owner_id"] == str(vehicle.id)

    @pytest.mark.asyncio
    async def test_create_driver_certificate_success(
        self, client: AsyncClient, db_session, auth_headers
    ):
        driver = await create_test_driver(db_session, "张三", "13800138001")

        response = await client.post(
            "/api/v1/fleet/certificates",
            data={
                "owner_id": str(driver.id),
                "owner_type": "driver",
                "cert_type": "driving_license",
                "cert_name": "驾驶证",
                "issue_date": "2025-06-01",
                "expiry_date": "2031-06-01",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["cert_name"] == "驾驶证"
        assert data["cert_type"] == "driving_license"
        assert data["owner_type"] == "driver"

    @pytest.mark.asyncio
    async def test_create_certificate_invalid_owner_type(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.post(
            "/api/v1/fleet/certificates",
            data={
                "owner_id": str(vehicle.id),
                "owner_type": "invalid_type",
                "cert_type": "vehicle_license",
                "cert_name": "行驶证",
                "issue_date": "2026-01-01",
                "expiry_date": "2027-01-01",
            },
            headers=auth_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_certificate_invalid_file_format(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        response = await client.post(
            "/api/v1/fleet/certificates",
            data={
                "owner_id": str(vehicle.id),
                "owner_type": "vehicle",
                "cert_type": "vehicle_license",
                "cert_name": "行驶证",
                "issue_date": "2026-01-01",
                "expiry_date": "2027-01-01",
            },
            files={"attachment": ("test.pdf", b"fake pdf content", "application/pdf")},
            headers=auth_headers,
        )

        assert response.status_code == 422
        assert "文件格式不支持" in response.json()["message"]

    @pytest.mark.asyncio
    async def test_create_certificate_oversized_file(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")

        large_content = b"x" * (6 * 1024 * 1024)

        response = await client.post(
            "/api/v1/fleet/certificates",
            data={
                "owner_id": str(vehicle.id),
                "owner_type": "vehicle",
                "cert_type": "vehicle_license",
                "cert_name": "行驶证",
                "issue_date": "2026-01-01",
                "expiry_date": "2027-01-01",
            },
            files={"attachment": ("test.jpg", large_content, "image/jpeg")},
            headers=auth_headers,
        )

        assert response.status_code == 422
        assert "文件大小不能超过" in response.json()["message"]


class TestListCertificates:
    @pytest.mark.asyncio
    async def test_list_certificates_empty(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.get(
            "/api/v1/fleet/certificates", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_list_certificates_with_data(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A11111")
        await create_test_certificate(db_session, vehicle.id)

        response = await client.get(
            "/api/v1/fleet/certificates", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1

    @pytest.mark.asyncio
    async def test_list_certificates_filter_expiring_soon(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A11111")
        await create_test_certificate(
            db_session, vehicle.id, expiry_date=date.today() + timedelta(days=365)
        )
        await create_test_certificate(
            db_session, vehicle.id, expiry_date=date.today() + timedelta(days=15)
        )

        response = await client.get(
            "/api/v1/fleet/certificates",
            params={"expiring_soon": "true"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_list_certificates_filter_by_owner_type(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A11111")
        driver = await create_test_driver(db_session, "张三", "13800138002")
        await create_test_certificate(db_session, vehicle.id, owner_type="vehicle")
        await create_test_certificate(db_session, driver.id, owner_type="driver", cert_type="driving_license", cert_name="驾驶证")

        response = await client.get(
            "/api/v1/fleet/certificates",
            params={"owner_type": "vehicle"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["owner_type"] == "vehicle"


class TestUpdateCertificate:
    @pytest.mark.asyncio
    async def test_update_certificate_success(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        cert = await create_test_certificate(db_session, vehicle.id)

        response = await client.put(
            f"/api/v1/fleet/certificates/{cert.id}",
            data={
                "cert_name": "更新后的证照名",
                "expiry_date": "2028-01-01",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["cert_name"] == "更新后的证照名"
        assert data["expiry_date"] == "2028-01-01"

    @pytest.mark.asyncio
    async def test_update_certificate_not_found(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.put(
            f"/api/v1/fleet/certificates/{uuid.uuid4()}",
            data={"cert_name": "不存在"},
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestDeleteCertificate:
    @pytest.mark.asyncio
    async def test_delete_certificate_success(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        cert = await create_test_certificate(db_session, vehicle.id)

        response = await client.delete(
            f"/api/v1/fleet/certificates/{cert.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200

    @pytest.mark.asyncio
    async def test_delete_certificate_not_found(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.delete(
            f"/api/v1/fleet/certificates/{uuid.uuid4()}",
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestCertificateWarningCount:
    @pytest.mark.asyncio
    async def test_warning_count_zero(
        self, client: AsyncClient, auth_headers
    ):
        response = await client.get(
            "/api/v1/fleet/certificates/warning-count",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0

    @pytest.mark.asyncio
    async def test_warning_count_with_expiring(
        self, client: AsyncClient, db_session, auth_headers
    ):
        vehicle = await create_test_vehicle(db_session, "粤A12345")
        await create_test_certificate(
            db_session, vehicle.id, expiry_date=date.today() + timedelta(days=15)
        )
        await create_test_certificate(
            db_session, vehicle.id, expiry_date=date.today() + timedelta(days=365)
        )

        response = await client.get(
            "/api/v1/fleet/certificates/warning-count",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1