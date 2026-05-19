"""
初始化车队实际数据：驾驶员 + 对应营运车辆
"""
import asyncio
import uuid

from app.core.database import AsyncSessionLocal, engine
from app.models.base import Base
from app.models.driver import Driver
from app.models.vehicle import Vehicle


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        fleet_data = [
            {"name": "段江", "phone": "15388256973", "plate_no": "川AKW761"},
            {"name": "高宣富", "phone": "13688449787", "plate_no": "川ALB088"},
            {"name": "黄勇", "phone": "13540437604", "plate_no": "川ALW868"},
            {"name": "杨思华", "phone": "19180779279", "plate_no": "川ALA857"},
            {"name": "杨均", "phone": "13980051438", "plate_no": "川ALC706"},
        ]

        for item in fleet_data:
            driver = Driver(
                id=uuid.uuid4(),
                name=item["name"],
                phone=item["phone"],
                is_disabled=False,
            )
            db.add(driver)
            await db.flush()

            vehicle = Vehicle(
                id=uuid.uuid4(),
                plate_no=item["plate_no"],
                ownership="own",
                bound_driver_id=driver.id,
                status="idle",
                is_disabled=False,
            )
            db.add(vehicle)
            print(f"  创建: {item['name']} ({item['phone']}) → {item['plate_no']}")

        await db.commit()
        print("\n车队数据创建完成！")


if __name__ == "__main__":
    asyncio.run(seed())
