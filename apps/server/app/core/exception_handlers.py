from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppException


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(_request: Request, exc: AppException):
        status_code = exc.code if 400 <= exc.code < 600 else 500
        return JSONResponse(
            status_code=status_code,
            content={"code": exc.code, "message": exc.message},
        )
