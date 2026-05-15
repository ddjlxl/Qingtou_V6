import json
import uuid

import pytest
from httpx import AsyncClient

from app.models.business_type_route import BusinessTypeRoute


async def create_route_template(db_session, business_type: str, origin_name: str, waypoints: list[str] | None, dest_name: str):
    route = BusinessTypeRoute(
        id=uuid.uuid4(),
        business_type=business_type,
        origin_name=origin_name,
        waypoints=json.dumps(waypoints, ensure_ascii=False) if waypoints else None,
        dest_name=dest_name,
    )
    db_session.add(route)
    await db_session.commit()
    await db_session.refresh(route)
    return route


class TestGetRouteTemplateService:
    @pytest.mark.asyncio
    async def test_get_heavy_transport_route(self, db_session):
        from app.services.dispatch_service import get_route_template

        await create_route_template(
            db_session,
            "heavy_transport",
            "上海港",
            ["苏州物流园"],
            "昆山工厂",
        )

        result = await get_route_template(db_session, "heavy_transport")

        assert result["origin_name"] == "上海港"
        assert result["waypoints"] == ["苏州物流园"]
        assert result["dest_name"] == "昆山工厂"

    @pytest.mark.asyncio
    async def test_get_empty_transport_route_no_waypoints(self, db_session):
        from app.services.dispatch_service import get_route_template

        await create_route_template(
            db_session,
            "empty_transport",
            "宁波港",
            None,
            "杭州仓库",
        )

        result = await get_route_template(db_session, "empty_transport")

        assert result["origin_name"] == "宁波港"
        assert result["waypoints"] is None
        assert result["dest_name"] == "杭州仓库"

    @pytest.mark.asyncio
    async def test_get_short_haul_route(self, db_session):
        from app.services.dispatch_service import get_route_template

        await create_route_template(
            db_session,
            "short_haul",
            "太仓港",
            ["常熟中转站"],
            "张家港工厂",
        )

        result = await get_route_template(db_session, "short_haul")

        assert result["origin_name"] == "太仓港"
        assert result["waypoints"] == ["常熟中转站"]
        assert result["dest_name"] == "张家港工厂"

    @pytest.mark.asyncio
    async def test_get_route_not_found_raises_exception(self, db_session):
        from app.services.dispatch_service import get_route_template
        from app.core.exceptions import AppException

        with pytest.raises(AppException) as exc_info:
            await get_route_template(db_session, "heavy_transport")

        assert exc_info.value.code == 404
        assert "路线模板" in exc_info.value.message


class TestGetRouteTemplateAPI:
    @pytest.mark.asyncio
    async def test_get_route_template_success(self, client: AsyncClient, db_session, auth_headers):
        await create_route_template(
            db_session,
            "heavy_transport",
            "上海港",
            ["苏州物流园"],
            "昆山工厂",
        )

        response = await client.get(
            "/api/v1/dispatch/route-templates/heavy_transport",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["origin_name"] == "上海港"
        assert data["waypoints"] == ["苏州物流园"]
        assert data["dest_name"] == "昆山工厂"

    @pytest.mark.asyncio
    async def test_get_route_template_no_waypoints(self, client: AsyncClient, db_session, auth_headers):
        await create_route_template(
            db_session,
            "empty_transport",
            "宁波港",
            None,
            "杭州仓库",
        )

        response = await client.get(
            "/api/v1/dispatch/route-templates/empty_transport",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["origin_name"] == "宁波港"
        assert data["waypoints"] is None
        assert data["dest_name"] == "杭州仓库"

    @pytest.mark.asyncio
    async def test_get_route_template_not_found(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/dispatch/route-templates/heavy_transport",
            headers=auth_headers,
        )

        assert response.status_code == 404
        data = response.json()
        assert data["code"] == 404

    @pytest.mark.asyncio
    async def test_get_route_template_invalid_business_type(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/dispatch/route-templates/invalid_type",
            headers=auth_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_route_template_unauthorized(self, client: AsyncClient, db_session):
        await create_route_template(
            db_session,
            "heavy_transport",
            "上海港",
            ["苏州物流园"],
            "昆山工厂",
        )

        response = await client.get(
            "/api/v1/dispatch/route-templates/heavy_transport",
        )

        assert response.status_code == 401