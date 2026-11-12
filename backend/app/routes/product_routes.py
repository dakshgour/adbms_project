from flask import Blueprint, request
from app.services import ProductService, MongoDBService
from app.middleware import admin_required
from app.utils.response import success_response
from app.utils.errors import BadRequestException

product_bp = Blueprint("products", __name__, url_prefix="/api/v1/products")

@product_bp.route("", methods=["GET"])
def get_products():
    category_id = request.args.get("category_id", type=int)
    search = request.args.get("search", type=str)
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    stock_status = request.args.get("stock_status", type=str)
    sort_by = request.args.get("sort_by", default="newest", type=str)
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=12, type=int)

    # By default, public list only returns active products
    is_active = request.args.get("is_active")
    if is_active is None:
        is_active_bool = True
    else:
        is_active_bool = is_active.lower() in ("true", "1")

    result = ProductService.list_products(
        category_id=category_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        is_active=is_active_bool,
        stock_status=stock_status,
        sort_by=sort_by,
        page=page,
        per_page=per_page
    )
    return success_response(data=result["products"], meta=result["pagination"])

@product_bp.route("/<int:product_id>", methods=["GET"])
def get_product_detail(product_id: int):
    product = ProductService.get_product(product_id)
    return success_response(data=product)

@product_bp.route("", methods=["POST"])
@admin_required()
def create_product():
    data = request.get_json() or {}
    category_id = data.get("category_id")
    product_name = data.get("product_name")
    sku = data.get("sku")
    price = data.get("price")

    if not category_id or not product_name or not sku or price is None:
        raise BadRequestException("category_id, product_name, sku, and price are required.")

    product = ProductService.create_product(
        category_id=int(category_id),
        product_name=str(product_name),
        sku=str(sku),
        price=float(price),
        description=data.get("description"),
        image_url=data.get("image_url"),
        initial_stock=int(data.get("initial_stock", 0)),
        reorder_level=int(data.get("reorder_level", 5)),
        metadata=data.get("metadata")
    )
    return success_response(data=product, message="Product created successfully.", status_code=201)

@product_bp.route("/<int:product_id>", methods=["PUT"])
@admin_required()
def update_product(product_id: int):
    data = request.get_json() or {}
    product = ProductService.update_product(
        product_id=product_id,
        category_id=data.get("category_id"),
        product_name=data.get("product_name"),
        sku=data.get("sku"),
        price=data.get("price"),
        description=data.get("description"),
        image_url=data.get("image_url"),
        is_active=data.get("is_active"),
        metadata=data.get("metadata")
    )
    return success_response(data=product, message="Product updated successfully.")

@product_bp.route("/<int:product_id>", methods=["DELETE"])
@admin_required()
def delete_product(product_id: int):
    ProductService.delete_product(product_id)
    return success_response(message="Product deactivated successfully.")

@product_bp.route("/<int:product_id>/metadata", methods=["GET"])
def get_product_metadata(product_id: int):
    metadata = MongoDBService.get_product_metadata(product_id)
    return success_response(data=metadata)

@product_bp.route("/<int:product_id>/metadata", methods=["PUT"])
@admin_required()
def update_product_metadata(product_id: int):
    data = request.get_json() or {}
    MongoDBService.upsert_product_metadata(product_id, data)
    return success_response(data=MongoDBService.get_product_metadata(product_id), message="Product metadata saved in MongoDB.")
