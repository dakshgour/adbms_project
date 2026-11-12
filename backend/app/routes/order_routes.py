from flask import Blueprint, request, g
from app.services import OrderService
from app.middleware import jwt_required_custom, admin_required
from app.utils.response import success_response
from app.utils.errors import BadRequestException

order_bp = Blueprint("orders", __name__, url_prefix="/api/v1/orders")

@order_bp.route("", methods=["POST"])
@jwt_required_custom()
def checkout():
    data = request.get_json() or {}
    shipping_name = data.get("shipping_name")
    shipping_address = data.get("shipping_address")
    shipping_city = data.get("shipping_city")
    shipping_state = data.get("shipping_state")
    shipping_postal_code = data.get("shipping_postal_code")
    payment_method = data.get("payment_method", "ONLINE")
    
    # Retrieve Idempotency-Key from header or body
    idempotency_key = request.headers.get("Idempotency-Key") or data.get("idempotency_key")

    order = OrderService.checkout(
        user_id=g.current_user.user_id,
        shipping_name=shipping_name,
        shipping_address=shipping_address,
        shipping_city=shipping_city,
        shipping_state=shipping_state,
        shipping_postal_code=shipping_postal_code,
        payment_method=payment_method,
        idempotency_key=idempotency_key
    )
    return success_response(data=order, message="Order placed successfully.", status_code=201)

@order_bp.route("", methods=["GET"])
@jwt_required_custom()
def list_orders():
    is_admin = (g.current_user.role == "admin")
    status = request.args.get("status")
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

    result = OrderService.list_orders(
        user_id=g.current_user.user_id,
        is_admin=is_admin,
        status=status,
        page=page,
        per_page=per_page
    )
    return success_response(data=result["orders"], meta=result["pagination"])

@order_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required_custom()
def get_order(order_id: int):
    is_admin = (g.current_user.role == "admin")
    order = OrderService.get_order(
        order_id=order_id,
        user_id=g.current_user.user_id,
        is_admin=is_admin
    )
    return success_response(data=order)

@order_bp.route("/<int:order_id>/cancel", methods=["POST"])
@jwt_required_custom()
def cancel_order(order_id: int):
    is_admin = (g.current_user.role == "admin")
    order = OrderService.cancel_order(
        user_id=g.current_user.user_id,
        order_id=order_id,
        is_admin=is_admin
    )
    return success_response(data=order, message="Order cancelled successfully and stock restored.")

@order_bp.route("/<int:order_id>/status", methods=["PATCH"])
@admin_required()
def update_order_status(order_id: int):
    data = request.get_json() or {}
    status = data.get("status")
    if not status:
        raise BadRequestException("status is required.")

    order = OrderService.update_order_status(
        order_id=order_id,
        new_status=status,
        admin_user_id=g.current_user.user_id
    )
    return success_response(data=order, message=f"Order status updated to {status}.")
