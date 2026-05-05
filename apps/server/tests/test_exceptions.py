from app.core.exceptions import (
    AppException,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
    ValidationException,
)


def test_app_exception_base():
    exc = AppException(code=400, message="Bad request")
    assert exc.code == 400
    assert exc.message == "Bad request"


def test_app_exception_default_message():
    exc = AppException(code=500)
    assert exc.code == 500
    assert exc.message == "Internal server error"


def test_not_found_exception():
    exc = NotFoundException("User")
    assert exc.code == 404
    assert "User" in exc.message


def test_not_found_exception_default():
    exc = NotFoundException()
    assert exc.code == 404
    assert exc.message == "Resource not found"


def test_unauthorized_exception():
    exc = UnauthorizedException()
    assert exc.code == 401
    assert exc.message == "Not authenticated"


def test_forbidden_exception():
    exc = ForbiddenException()
    assert exc.code == 403
    assert exc.message == "Permission denied"


def test_validation_exception():
    exc = ValidationException("Name is required")
    assert exc.code == 422
    assert exc.message == "Name is required"
