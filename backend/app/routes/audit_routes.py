from flask import Blueprint, request
from app.services import AuditService
from app.middleware import admin_required
from app.utils.response import success_response

audit_bp = Blueprint("audit", __name__, url_prefix="/api/v1/audit-logs")

@audit_bp.route("", methods=["GET"])
@admin_required()
def get_audit_logs():
    table_name = request.args.get("table_name")
    operation = request.args.get("operation")
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=25, type=int)

    result = AuditService.list_logs(
        table_name=table_name,
        operation=operation,
        page=page,
        per_page=per_page
    )
    return success_response(data=result["logs"], meta=result["pagination"])
