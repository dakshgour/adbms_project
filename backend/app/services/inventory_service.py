from sqlalchemy import text
from app.database import db
from app.models import Inventory, InventoryMovement, Product
from app.utils.errors import NotFoundException, BadRequestException

class InventoryService:
    @staticmethod
    def list_inventory(low_stock_only: bool = False, page: int = 1, per_page: int = 20):
        session = db.session
        query = session.query(Inventory).join(Product).filter(Product.is_active == True)

        if low_stock_only:
            query = query.filter(Inventory.quantity_available <= Inventory.reorder_level)

        query = query.order_by(Inventory.quantity_available.asc())
        total_items = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()

        return {
            "inventory": [inv.to_dict() for inv in items],
            "pagination": {
                "total_items": total_items,
                "current_page": page,
                "per_page": per_page
            }
        }

    @staticmethod
    def get_low_stock_products():
        """Demonstrates invoking stored procedure sp_get_low_stock_products()"""
        session = db.session
        result = session.execute(text("CALL sp_get_low_stock_products();"))
        rows = result.fetchall()
        data = []
        for r in rows:
            data.append({
                "product_id": r[0],
                "sku": r[1],
                "product_name": r[2],
                "category_name": r[3],
                "quantity_available": r[4],
                "reorder_level": r[5],
                "shortage": r[6]
            })
        return data

    @staticmethod
    def adjust_inventory(product_id: int, adjustment_qty: int, reason: str, user_id: int):
        """
        Invokes stored procedure sp_adjust_inventory to execute locked, validated stock changes.
        """
        session = db.session
        if adjustment_qty == 0:
            raise BadRequestException("Adjustment quantity cannot be zero.")

        try:
            result = session.execute(
                text("CALL sp_adjust_inventory(:pid, :qty, :reason, :uid);"),
                {
                    "pid": product_id,
                    "qty": adjustment_qty,
                    "reason": reason or "Manual inventory adjustment",
                    "uid": user_id
                }
            )
            row = result.fetchone()
            session.commit()
            return {
                "inventory_id": row[0],
                "product_id": row[1],
                "quantity_before": row[2],
                "quantity_changed": row[3],
                "quantity_after": row[4],
                "status": row[5]
            }
        except Exception as e:
            session.rollback()
            raise BadRequestException(f"Inventory adjustment failed: {str(e)}")

    @staticmethod
    def get_movements(product_id: int = None, page: int = 1, per_page: int = 20):
        session = db.session
        query = session.query(InventoryMovement)
        if product_id:
            query = query.filter_by(product_id=product_id)

        query = query.order_by(InventoryMovement.created_at.desc())
        total = query.count()
        movements = query.offset((page - 1) * per_page).limit(per_page).all()

        return {
            "movements": [m.to_dict() for m in movements],
            "pagination": {
                "total_items": total,
                "current_page": page,
                "per_page": per_page
            }
        }
