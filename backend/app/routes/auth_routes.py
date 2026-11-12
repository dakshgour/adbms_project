from flask import Blueprint, request, g
from app.services import AuthService
from app.middleware import jwt_required_custom
from app.utils.response import success_response, error_response
from app.utils.errors import BadRequestException

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone")

    if not full_name or not email or not password:
        raise BadRequestException("full_name, email, and password are required fields.")

    result = AuthService.register(
        full_name=full_name,
        email=email,
        password=password,
        phone=phone,
        role="customer"
    )
    return success_response(data=result, message="Registration successful.", status_code=201)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise BadRequestException("email and password are required fields.")

    result = AuthService.login(email=email, password=password)
    return success_response(data=result, message="Login successful.")

@auth_bp.route("/me", methods=["GET"])
@jwt_required_custom()
def get_current_user_profile():
    return success_response(data=g.current_user.to_dict())
