import functools
from flask import g, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from sqlalchemy import text
from app.database import db
from app.models import User
from app.utils.errors import UnauthorizedException, ForbiddenException

def jwt_required_custom():
    """Custom wrapper around verify_jwt_in_request with error mapping and user context loading."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                raise UnauthorizedException(f"Invalid or expired token: {str(e)}")
            
            user_id = get_jwt_identity()
            session = db.session
            user = session.query(User).filter_by(user_id=int(user_id), is_active=True).first()
            if not user:
                raise UnauthorizedException("User account not found or has been deactivated.")
            
            g.current_user = user
            
            # Inject session variable for MySQL audit triggers
            try:
                session.execute(text("SET @app_user_id = :uid;"), {"uid": user.user_id})
            except Exception:
                pass

            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required():
    """Ensures that the authenticated user possesses the 'admin' role."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                raise UnauthorizedException(f"Invalid or expired token: {str(e)}")

            user_id = get_jwt_identity()
            session = db.session
            user = session.query(User).filter_by(user_id=int(user_id), is_active=True).first()
            if not user:
                raise UnauthorizedException("User account not found.")

            if user.role != "admin":
                raise ForbiddenException("Administrator privileges required to perform this action.")

            g.current_user = user

            try:
                session.execute(text("SET @app_user_id = :uid;"), {"uid": user.user_id})
            except Exception:
                pass

            return fn(*args, **kwargs)
        return wrapper
    return decorator
