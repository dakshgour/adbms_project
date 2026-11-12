from app.database import db
from app.models import AuditLog, User

class AuditService:
    @staticmethod
    def list_logs(table_name: str = None, operation: str = None, page: int = 1, per_page: int = 25):
        session = db.session
        query = session.query(AuditLog)

        if table_name:
            query = query.filter(AuditLog.table_name == table_name.lower())

        if operation:
            query = query.filter(AuditLog.operation == operation.upper())

        query = query.order_by(AuditLog.changed_at.desc(), AuditLog.log_id.desc())

        total = query.count()
        logs = query.offset((page - 1) * per_page).limit(per_page).all()

        # Map user names for changed_by
        user_ids = {l.changed_by for l in logs if l.changed_by}
        user_map = {}
        if user_ids:
            users = session.query(User).filter(User.user_id.in_(list(user_ids))).all()
            user_map = {u.user_id: u.full_name for u in users}

        results = []
        for l in logs:
            d = l.to_dict()
            d["changed_by_name"] = user_map.get(l.changed_by, "System / Direct SQL" if not l.changed_by else f"User #{l.changed_by}")
            results.append(d)

        return {
            "logs": results,
            "pagination": {
                "total_items": total,
                "current_page": page,
                "per_page": per_page
            }
        }
