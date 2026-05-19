import asyncio
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.driver import Driver
from app.models.transport_record import TransportRecord
from app.models.vehicle import Vehicle

YEAR = 2025


def parse_date(text: str) -> date:
    parts = text.replace("月", " ").replace("日", "").split()
    month = int(parts[0])
    day = int(parts[1])
    return date(YEAR, month, day)


def split_route(route: str) -> tuple[str, str]:
    parts = route.split("-", 1)
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]


records_raw = """10月3日 重 泷特 文汉-吉兴顺 MSDU6125134
10月3日 空 徽谊 堆场-文汉 HNKU6059331
10月3日 空 徽谊 堆场-文汉 WIKU05217289
10月3日 空 临鸡 堆场-文汉 KDCU8001800
10月3日 重 泷特 文汉-保税-陆港 MSNU5729361
10月9日 重 徽谊 南货场-吉兴顺 TGCU5432644
10月9日 重 鸿鑫运 文汉-保税-陆港 FLSU6013132
10月10日 重 徽谊 吉兴顺-保税 TGCU5432644
10月10日 重 鸿鑫运 文汉-保税-陆港 XHCU5455780
10月10日 空 万嘉 堆场-文汉 CICU2947345
10月10日 空 万嘉 堆场-文汉 CICU2942488
10月10日 重 鸿鑫运 文汉-保税-陆港 HPCU4242862
10月11日 重 徽谊 南货场-保税 TXGU8852763
10月13日 重 徽谊 南货场-保税-陆港 TXGU4378342
10月13日 重 徽谊 南货场-保税-陆港 TIIU6314960
10月13日 空 鸿鑫运 堆场-文汉 TDLU6214930
10月13日 空 鸿鑫运 堆场-文汉 KDCU8014812
10月13日 空 鸿鑫运 堆场-文汉 CTEU2106466
10月13日 空 徽谊 堆场-文汉 TDLU7007671
10月13日 空 徽谊 堆场-文汉 CICU2145294
10月14日 重 徽谊 南货场-保税-陆港 TRHU4706524
10月14日 重 海晨 保税-陆港 TISU5146498
10月14日 重 徽谊 文汉-保税-陆港 MCCU3072972
10月16日 重 徽谊 文汉-保税-陆港 CICU2145294
10月16日 空 徽谊 堆场-文汉 CICU3503638
10月16日 空 徽谊 堆场-文汉 CICU2523183
10月17日 空 鸿鑫运 堆场-文汉 RGHU4119668
10月18日 空 万嘉 堆场-文汉 SRWU2003293
10月18日 空 万嘉 堆场-文汉 CICU2216530
10月18日 空 鸿鑫运 堆场-文汉 MZWU2401512
10月18日 空 鸿鑫运 堆场-文汉 CICU7026699
10月20日 空 鸿鑫运 堆场-文汉 FORU8826600
10月20日 重 达盛行 散货场-保税-陆港 CICU2945147
10月20日 空 创源 堆场-文汉 FLSU6009298
10月21日 重 徽谊 南货场-保税-陆港 TBJU7293586
10月21日 重 徽谊 南货场-保税查验-陆港 TBJU7468811
10月22日 空 鸿鑫运 堆场-文汉 CICU5653072
10月22日 重 创源 文汉-陆港 FLSU6009298
10月22日 空 鸿鑫运 堆场-文汉 CICU2184710
10月22日 重 万嘉 文汉-保税-陆港 CICU2216530"""


async def import_records():
    async with AsyncSessionLocal() as db:
        v_result = await db.execute(
            select(Vehicle).where(Vehicle.plate_no == "川AKW761")
        )
        vehicle = v_result.scalar_one_or_none()
        if not vehicle:
            print("错误：车辆 川AKW761 未找到")
            return

        d_result = await db.execute(
            select(Driver).where(Driver.id == vehicle.bound_driver_id)
        )
        driver = d_result.scalar_one_or_none()
        if not driver:
            print(f"错误：司机未找到 (bound_driver_id: {vehicle.bound_driver_id})")
            return

        print(f"车辆: {vehicle.plate_no} (id: {vehicle.id})")
        print(f"司机: {driver.name} ({driver.phone}) (id: {driver.id})")
        print()

        existing_containers = set()
        existing_result = await db.execute(
            select(TransportRecord.container_no).where(
                TransportRecord.vehicle_id == vehicle.id
            )
        )
        for row in existing_result.all():
            existing_containers.add(row[0])

        success = 0
        skipped = 0
        lines = [l.strip() for l in records_raw.strip().split("\n") if l.strip()]

        for line in lines:
            parts = line.split()
            if len(parts) < 5:
                print(f"  跳过(格式错误): {line}")
                continue

            date_str = parts[0]
            load_type = parts[1]
            customer = parts[2]
            container_no = parts[-1]
            route = " ".join(parts[3:-1])

            if container_no in existing_containers:
                print(f"  跳过(已存在箱号): {container_no} - {customer} {route}")
                skipped += 1
                continue

            origin, destination = split_route(route)
            record_date = parse_date(date_str)
            order_no = f"AKW761-{record_date.strftime('%Y%m%d')}-{container_no}"

            record = TransportRecord(
                id=uuid.uuid4(),
                order_no=order_no,
                customer_info=customer,
                origin=origin,
                destination=destination,
                container_no=container_no,
                vehicle_id=vehicle.id,
                driver_id=driver.id,
                imported_at=datetime(
                    record_date.year, record_date.month, record_date.day,
                    tzinfo=timezone.utc,
                ),
            )
            db.add(record)
            success += 1
            load_label = "重箱" if load_type == "重" else "空箱"
            print(f"  {record_date} | {load_label} | {customer} | {route} → {container_no}")

        if success > 0:
            await db.commit()

        print(f"\n完成：成功导入 {success} 条，跳过 {skipped} 条（已存在）")


if __name__ == "__main__":
    asyncio.run(import_records())
