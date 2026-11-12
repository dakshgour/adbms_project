from flask import Blueprint, request
from app.services import AnalyticsService
from app.middleware import admin_required
from app.utils.response import success_response

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/v1/analytics")

@analytics_bp.route("/overview", methods=["GET"])
@admin_required()
def get_overview():
    kpis = AnalyticsService.get_overview_kpis()
    return success_response(data=kpis)

@analytics_bp.route("/revenue", methods=["GET"])
@admin_required()
def get_revenue():
    revenue = AnalyticsService.get_monthly_revenue()
    return success_response(data=revenue)

@analytics_bp.route("/top-products", methods=["GET"])
@admin_required()
def get_top_products():
    limit = request.args.get("limit", default=5, type=int)
    products = AnalyticsService.get_top_selling_products(limit=limit)
    return success_response(data=products)

@analytics_bp.route("/order-status", methods=["GET"])
@admin_required()
def get_order_status():
    status_dist = AnalyticsService.get_order_status_distribution()
    return success_response(data=status_dist)

@analytics_bp.route("/category-sales", methods=["GET"])
@admin_required()
def get_category_sales():
    sales = AnalyticsService.get_category_sales()
    return success_response(data=sales)
