from flask import Blueprint, request, g
from app.services import InventoryService
from app.middleware import admin_required
from app.utils.response import success_response
from app.utils.errors import BadRequestException

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/v1/inventory")

@inventory_bp.route("", methods=["GET"])
@admin_required()
def list_inventory():
    low_stock = request.args.get("low_stock", default="false").lower() in ("true", "1")
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)

    result = InventoryService.list_inventory(
        low_stock_only=low_stock,
        page=page,
        per_page=per_page
    )
    return success_response(data=result["inventory"], meta=result["pagination"])

@inventory_bp.route("/low-stock", methods=["GET"])
@admin_required()
def get_low_stock():
    """Demonstrates executing stored procedure sp_get_low_stock_products()"""
    products = InventoryService.get_low_stock_products()
    return success_response(data=products)

@inventory_bp.route("/adjustments", methods=["POST"])
@admin_required()
def adjust_inventory():
    """Demonstrates executing stored procedure sp_adjust_inventory()"""
    data = request.get_json() or {}
    product_id = data.get("product_id")
    adjustment_qty = data.get("adjustment_qty")
    reason = data.get("reason", "Manual adjustment")

    if product_id is None or adjustment_qty is None:
        raise BadRequestException("product_id and adjustment_qty are required.")

    result = InventoryService.adjust_inventory(
        product_id=int(product_id),
        adjustment_qty=int(adjustment_qty),
        reason=reason,
        user_id=g.current_user.user_id
    )
    return success_response(data=result, message="Inventory successfully adjusted via stored procedure.")

@inventory_bp.route("/movements", methods=["GET"])
@admin_required()
def list_movements():
    product_id = request.args.get("product_id", type=int)
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)

    result = InventoryService.get_movements(
        product_id=product_id,
        page=page,
        per_page=per_page
    )
    return success_response(data=result["movements"], meta=result["pagination"])
