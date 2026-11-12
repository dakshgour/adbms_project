from flask import Blueprint, request
from app.services import CategoryService
from app.middleware import admin_required
from app.utils.response import success_response
from app.utils.errors import BadRequestException

category_bp = Blueprint("categories", __name__, url_prefix="/api/v1/categories")

@category_bp.route("", methods=["GET"])
def get_categories():
    categories = CategoryService.list_categories()
    return success_response(data=categories)

@category_bp.route("/<int:category_id>", methods=["GET"])
def get_category(category_id: int):
    cat = CategoryService.get_category(category_id)
    return success_response(data=cat)

@category_bp.route("", methods=["POST"])
@admin_required()
def create_category():
    data = request.get_json() or {}
    category_name = data.get("category_name")
    if not category_name:
        raise BadRequestException("category_name is required.")

    cat = CategoryService.create_category(
        category_name=category_name,
        description=data.get("description")
    )
    return success_response(data=cat, message="Category created successfully.", status_code=201)

@category_bp.route("/<int:category_id>", methods=["PUT"])
@admin_required()
def update_category(category_id: int):
    data = request.get_json() or {}
    cat = CategoryService.update_category(
        category_id=category_id,
        category_name=data.get("category_name"),
        description=data.get("description")
    )
    return success_response(data=cat, message="Category updated successfully.")

@category_bp.route("/<int:category_id>", methods=["DELETE"])
@admin_required()
def delete_category(category_id: int):
    CategoryService.delete_category(category_id)
    return success_response(message="Category deleted successfully.")
