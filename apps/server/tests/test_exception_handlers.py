from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.exceptions import (
    AppException,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
    ValidationException,
)
from app.core.exception_handlers import register_exception_handlers


def create_test_app():
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/test/app-error")
    def raise_app_error():
        raise AppException(code=400, message="Test error")

    @app.get("/test/not-found")
    def raise_not_found():
        raise NotFoundException("Item")

    @app.get("/test/unauthorized")
    def raise_unauthorized():
        raise UnauthorizedException()

    @app.get("/test/forbidden")
    def raise_forbidden():
        raise ForbiddenException()

    @app.get("/test/validation")
    def raise_validation():
        raise ValidationException("Field required")

    return app


def test_app_exception_handler():
    client = TestClient(create_test_app())
    response = client.get("/test/app-error")
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == 400
    assert data["message"] == "Test error"


def test_not_found_handler():
    client = TestClient(create_test_app())
    response = client.get("/test/not-found")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == 404
    assert "Item" in data["message"]


def test_unauthorized_handler():
    client = TestClient(create_test_app())
    response = client.get("/test/unauthorized")
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == 401


def test_forbidden_handler():
    client = TestClient(create_test_app())
    response = client.get("/test/forbidden")
    assert response.status_code == 403
    data = response.json()
    assert data["code"] == 403


def test_validation_handler():
    client = TestClient(create_test_app())
    response = client.get("/test/validation")
    assert response.status_code == 422
    data = response.json()
    assert data["code"] == 422
