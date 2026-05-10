import os
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.certificate import Certificate, DriverCertType, OwnerType, VehicleCertType
from app.models.driver import Driver
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.fleet import (
    CertificateListResponse,
    CertificateResponse,
    CertificateWarningCountResponse,
)
from app.services.fleet_service import delete_certificate_attachment

router = APIRouter(tags=["车队管理-证照"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def _validate_attachment(file: UploadFile) -> str:
    if not file.filename:
        raise AppException(code=422, message="文件名不能为空")

    ext = file.filename.lower()
    dot_index = ext.rfind(".")
    if dot_index == -1:
        raise AppException(code=422, message="文件格式不支持")
    ext = ext[dot_index:]

    if ext not in ALLOWED_EXTENSIONS:
        raise AppException(
            code=422,
            message=f"文件格式不支持，仅支持 {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise AppException(code=422, message="文件大小不能超过 5MB")
    file.file.seek(0)

    return ext


def _validate_cert_type(owner_type: str, cert_type: str) -> None:
    vehicle_types = {c.value for c in VehicleCertType}
    driver_types = {c.value for c in DriverCertType}

    if owner_type == OwnerType.VEHICLE.value and cert_type not in vehicle_types:
        raise AppException(
            code=422,
            message=f"车辆证照类型无效，可选值：{', '.join(vehicle_types)}",
        )
    if owner_type == OwnerType.DRIVER.value and cert_type not in driver_types:
        raise AppException(
            code=422,
            message=f"司机证照类型无效，可选值：{', '.join(driver_types)}",
        )


def _cert_to_response(cert: Certificate, owner_name: str | None = None) -> CertificateResponse:
    today = date.today()
    thirty_days_later = today + timedelta(days=30)
    is_expiring = cert.expiry_date >= today and cert.expiry_date <= thirty_days_later

    return CertificateResponse(
        id=str(cert.id),
        owner_id=str(cert.owner_id),
        owner_type=cert.owner_type,
        owner_name=owner_name,
        cert_type=cert.cert_type,
        cert_name=cert.cert_name,
        issue_date=cert.issue_date,
        expiry_date=cert.expiry_date,
        attachment=cert.attachment,
        remark=cert.remark,
        is_expiring_soon=is_expiring,
        created_at=cert.created_at,
        updated_at=cert.updated_at,
    )


@router.get("/certificates", response_model=CertificateListResponse)
async def list_certificates(
    owner_type: str | None = Query(None),
    owner_id: uuid.UUID | None = Query(None),
    expiring_soon: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = select(Certificate)
    count_query = select(func.count(Certificate.id))

    if owner_type:
        base_query = base_query.where(Certificate.owner_type == owner_type)
        count_query = count_query.where(Certificate.owner_type == owner_type)

    if owner_id:
        base_query = base_query.where(Certificate.owner_id == owner_id)
        count_query = count_query.where(Certificate.owner_id == owner_id)

    if expiring_soon:
        today = date.today()
        thirty_days_later = today + timedelta(days=30)
        base_query = base_query.where(
            Certificate.expiry_date >= today,
            Certificate.expiry_date <= thirty_days_later,
        )
        count_query = count_query.where(
            Certificate.expiry_date >= today,
            Certificate.expiry_date <= thirty_days_later,
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    base_query = base_query.offset(offset).limit(page_size).order_by(Certificate.created_at.desc())
    result = await db.execute(base_query)
    certificates = result.scalars().all()

    vehicle_ids = [c.owner_id for c in certificates if c.owner_type == OwnerType.VEHICLE.value]
    driver_ids = [c.owner_id for c in certificates if c.owner_type == OwnerType.DRIVER.value]

    owner_name_map: dict[uuid.UUID, str] = {}

    if vehicle_ids:
        vehicle_result = await db.execute(
            select(Vehicle.id, Vehicle.plate_no).where(Vehicle.id.in_(vehicle_ids))
        )
        owner_name_map.update({row[0]: row[1] for row in vehicle_result.all()})

    if driver_ids:
        driver_result = await db.execute(
            select(Driver.id, Driver.name).where(Driver.id.in_(driver_ids))
        )
        owner_name_map.update({row[0]: row[1] for row in driver_result.all()})

    items = [
        _cert_to_response(c, owner_name_map.get(c.owner_id))
        for c in certificates
    ]

    return CertificateListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("/certificates", response_model=CertificateResponse)
async def create_certificate(
    owner_id: uuid.UUID = Form(...),
    owner_type: str = Form(...),
    cert_type: str = Form(...),
    cert_name: str = Form(...),
    issue_date: date = Form(...),
    expiry_date: date = Form(...),
    attachment: UploadFile | None = File(None),
    remark: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if owner_type not in {o.value for o in OwnerType}:
        raise AppException(code=422, message=f"owner_type 无效，可选值：vehicle, driver")

    _validate_cert_type(owner_type, cert_type)

    if owner_type == OwnerType.VEHICLE.value:
        owner_result = await db.execute(select(Vehicle).where(Vehicle.id == owner_id))
        if not owner_result.scalar_one_or_none():
            raise AppException(code=404, message="车辆不存在")
    else:
        owner_result = await db.execute(select(Driver).where(Driver.id == owner_id))
        if not owner_result.scalar_one_or_none():
            raise AppException(code=404, message="司机不存在")

    attachment_path: str | None = None
    if attachment and attachment.filename:
        ext = _validate_attachment(attachment)
        upload_dir = os.path.join("uploads", "certificates")
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(upload_dir, filename)
        content = await attachment.read()
        with open(filepath, "wb") as f:
            f.write(content)
        attachment_path = f"certificates/{filename}"

    cert = Certificate(
        owner_id=owner_id,
        owner_type=owner_type,
        cert_type=cert_type,
        cert_name=cert_name,
        issue_date=issue_date,
        expiry_date=expiry_date,
        attachment=attachment_path,
        remark=remark,
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)

    owner_name = None
    if owner_type == OwnerType.VEHICLE.value:
        v_result = await db.execute(select(Vehicle.plate_no).where(Vehicle.id == owner_id))
        owner_name = v_result.scalar_one_or_none()
    else:
        d_result = await db.execute(select(Driver.name).where(Driver.id == owner_id))
        owner_name = d_result.scalar_one_or_none()

    return _cert_to_response(cert, owner_name)


@router.put("/certificates/{certificate_id}", response_model=CertificateResponse)
async def update_certificate(
    certificate_id: uuid.UUID,
    cert_type: str | None = Form(None),
    cert_name: str | None = Form(None),
    issue_date: date | None = Form(None),
    expiry_date: date | None = Form(None),
    attachment: UploadFile | None = File(None),
    remark: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Certificate).where(Certificate.id == certificate_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise AppException(code=404, message="证照不存在")

    if cert_type is not None:
        _validate_cert_type(cert.owner_type, cert_type)
        cert.cert_type = cert_type
    if cert_name is not None:
        cert.cert_name = cert_name
    if issue_date is not None:
        cert.issue_date = issue_date
    if expiry_date is not None:
        cert.expiry_date = expiry_date
    if remark is not None:
        cert.remark = remark

    if attachment and attachment.filename:
        ext = _validate_attachment(attachment)
        upload_dir = os.path.join("uploads", "certificates")
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(upload_dir, filename)
        content = await attachment.read()
        with open(filepath, "wb") as f:
            f.write(content)
        if cert.attachment:
            old_path = os.path.join("uploads", cert.attachment)
            if os.path.exists(old_path):
                os.remove(old_path)
        cert.attachment = f"certificates/{filename}"

    await db.commit()
    await db.refresh(cert)

    owner_name = None
    if cert.owner_type == OwnerType.VEHICLE.value:
        v_result = await db.execute(
            select(Vehicle.plate_no).where(Vehicle.id == cert.owner_id)
        )
        owner_name = v_result.scalar_one_or_none()
    else:
        d_result = await db.execute(
            select(Driver.name).where(Driver.id == cert.owner_id)
        )
        owner_name = d_result.scalar_one_or_none()

    return _cert_to_response(cert, owner_name)


@router.delete("/certificates/{certificate_id}")
async def delete_certificate(
    certificate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Certificate).where(Certificate.id == certificate_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise AppException(code=404, message="证照不存在")

    delete_certificate_attachment(cert)
    await db.delete(cert)
    await db.commit()

    return {"code": 200, "message": "证照已删除"}


@router.get("/certificates/warning-count", response_model=CertificateWarningCountResponse)
async def get_certificate_warning_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.fleet_service import get_certificate_warning_count

    count = await get_certificate_warning_count(db)
    return CertificateWarningCountResponse(count=count)