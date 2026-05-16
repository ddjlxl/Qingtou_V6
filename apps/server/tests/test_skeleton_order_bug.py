"""
Bug #1: 创建骨架任务失败测试
关联 AC-002: 支持骨架任务——所有字段可选

问题描述：提交所有字段为空的表单后，未看到成功提示
预期行为：应该成功创建骨架任务（所有字段可选）
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_create_skeleton_order_should_succeed(client: AsyncClient, db_session: AsyncSession):
    """测试创建骨架任务（所有字段为空）应该成功"""
    from tests.conftest import create_test_user
    from app.models.user import UserRole
    
    user = await create_test_user(db_session, "dispatcher1", "password123", UserRole.DISPATCHER.value)
    
    login_response = await client.post("/api/v1/auth/login", json={
        "username": "dispatcher1",
        "password": "password123"
    })
    token = login_response.json()["data"]["token"]
    
    response = await client.post(
        "/api/v1/dispatch/orders",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    
    data = response.json()
    assert "id" in data
    assert "order_no" in data
    assert data["status"] == "pending"
    assert data["customer_name"] is None
    assert data["origin_name"] is None
    assert data["dest_name"] is None


@pytest.mark.asyncio
async def test_create_order_with_empty_strings_should_succeed(client: AsyncClient, db_session: AsyncSession):
    """测试创建任务时，空字符串应该被当作 None 处理"""
    from tests.conftest import create_test_user
    from app.models.user import UserRole
    
    user = await create_test_user(db_session, "dispatcher2", "password123", UserRole.DISPATCHER.value)
    
    login_response = await client.post("/api/v1/auth/login", json={
        "username": "dispatcher2",
        "password": "password123"
    })
    token = login_response.json()["data"]["token"]
    
    response = await client.post(
        "/api/v1/dispatch/orders",
        json={
            "customer_name": "",
            "origin_name": "",
            "dest_name": "",
            "container_no": "",
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"
    
    data = response.json()
    assert data["customer_name"] is None
    assert data["origin_name"] is None
    assert data["dest_name"] is None
    assert data["container_no"] is None
