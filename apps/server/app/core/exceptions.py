class AppException(Exception):
    def __init__(self, code: int, message: str = "Internal server error"):
        self.code = code
        self.message = message
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(code=404, message=f"{resource} not found")


class UnauthorizedException(AppException):
    def __init__(self):
        super().__init__(code=401, message="Not authenticated")


class ForbiddenException(AppException):
    def __init__(self):
        super().__init__(code=403, message="Permission denied")


class ValidationException(AppException):
    def __init__(self, message: str):
        super().__init__(code=422, message=message)


class BusinessRuleViolationError(AppException):
    def __init__(self, message: str):
        super().__init__(code=409, message=message)
