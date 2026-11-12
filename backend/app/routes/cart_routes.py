from flask import Blueprint, request, g
from app.services import CartService
from app.middleware import jwt_required_custom
from app.utils.response import success_response
from app.utils.errors import BadRequestException

cart_bp = Blueprint("cart", __name__, url_prefix="/api/v1/cart")

@cart_bp.route("", methods=["GET"])
@jwt_required_custom()
def get_cart():
    cart = CartService.get_user_cart(g.current_user.user_id)
    return success_response(data=cart)

@cart_bp.route("/items", methods=["POST"])
@jwt_required_custom()
def add_to_cart():
    data = request.get_json() or {}
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        raise BadRequestException("product_id is required.")

    cart = CartService.add_item(
        user_id=g.current_user.user_id,
        product_id=int(product_id),
        quantity=int(quantity)
    )
    return success_response(data=cart, message="Item added to cart.")

@cart_bp.route("/items/<int:item_id>", methods=["PUT"])
@jwt_required_custom()
def update_cart_item(item_id: int):
    data = request.get_json() or {}
    quantity = data.get("quantity")
    if quantity is None:
        raise BadRequestException("quantity is required.")

    cart = CartService.update_item_quantity(
        user_id=g.current_user.user_id,
        cart_item_id=item_id,
        quantity=int(quantity)
    )
    return success_response(data=cart, message="Cart item updated.")

@cart_bp.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_required_custom()
def remove_cart_item(item_id: int):
    cart = CartService.remove_item(
        user_id=g.current_user.user_id,
        cart_item_id=item_id
    )
    return success_response(data=cart, message="Item removed from cart.")

@cart_bp.route("/clear", methods=["POST"])
@jwt_required_custom()
def clear_cart():
    CartService.clear_cart(g.current_user.user_id)
    return success_response(message="Cart cleared successfully.")
