class AppException(Exception):
    def __init__(self, message, status_code=400, errors=None, error_code=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors
        self.error_code = error_code

class NotFoundException(AppException):
    def __init__(self, message="Resource not found", errors=None):
        super().__init__(message, status_code=404, errors=errors, error_code="NOT_FOUND")

class BadRequestException(AppException):
    def __init__(self, message="Invalid request parameters", errors=None):
        super().__init__(message, status_code=400, errors=errors, error_code="BAD_REQUEST")

class UnauthorizedException(AppException):
    def __init__(self, message="Authentication required", errors=None):
        super().__init__(message, status_code=401, errors=errors, error_code="UNAUTHORIZED")

class ForbiddenException(AppException):
    def __init__(self, message="Access forbidden: insufficient privileges", errors=None):
        super().__init__(message, status_code=403, errors=errors, error_code="FORBIDDEN")

class ConflictException(AppException):
    def __init__(self, message="Resource conflict or duplicate detected", errors=None):
        super().__init__(message, status_code=409, errors=errors, error_code="CONFLICT")

class InsufficientStockException(AppException):
    def __init__(self, message="Insufficient inventory stock", errors=None):
        super().__init__(message, status_code=400, errors=errors, error_code="INSUFFICIENT_STOCK")
