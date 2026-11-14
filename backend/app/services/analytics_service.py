from sqlalchemy import text
from app.database import db
from app.database.mysql import call_procedure
from app.models import User, Product, Order, Inventory

class AnalyticsService:
    @staticmethod
    def get_overview_kpis():
        """Fetches core SaaS dashboard KPI metrics directly from MySQL."""
        session = db.session

        # 1. Total revenue & orders from stored procedure
        rows = call_procedure(session, "CALL sp_get_sales_summary(NULL, NULL);")
        proc_result = rows[0] if rows else None
        session.commit()
        total_revenue = float(proc_result[0]) if proc_result and proc_result[0] is not None else 0.0
        total_orders = int(proc_result[1]) if proc_result and proc_result[1] is not None else 0
        total_units_sold = int(proc_result[2]) if proc_result and proc_result[2] is not None else 0
        avg_order_val = float(proc_result[3]) if proc_result and proc_result[3] is not None else 0.0

        # 2. Customers count
        total_customers = session.query(User).filter_by(role="customer", is_active=True).count()

        # 3. Active products count
        total_products = session.query(Product).filter_by(is_active=True).count()

        # 4. Low stock count
        low_stock_count = session.query(Inventory).filter(
            Inventory.quantity_available <= Inventory.reorder_level
        ).count()

        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_units_sold": total_units_sold,
            "average_order_value": round(avg_order_val, 2),
            "total_customers": total_customers,
            "total_products": total_products,
            "low_stock_count": low_stock_count,
        }

    @staticmethod
    def get_monthly_revenue():
        """Demonstrates monthly aggregation with LAG() window function."""
        session = db.session
        sql = """
        WITH MonthlySales AS (
            SELECT 
                DATE_FORMAT(o.created_at, '%Y-%m') AS sales_month,
                COUNT(DISTINCT o.order_id) AS orders_count,
                SUM(o.total_amount) AS current_month_revenue
            FROM orders o
            WHERE o.order_status != 'CANCELLED'
            GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
        )
        SELECT 
            sales_month,
            orders_count,
            current_month_revenue,
            LAG(current_month_revenue, 1, 0.00) OVER(ORDER BY sales_month) AS previous_month_revenue,
            ROUND(current_month_revenue - LAG(current_month_revenue, 1, 0.00) OVER(ORDER BY sales_month), 2) AS diff
        FROM MonthlySales
        ORDER BY sales_month ASC;
        """
        rows = session.execute(text(sql)).fetchall()
        data = []
        for r in rows:
            data.append({
                "month": r[0],
                "orders": int(r[1]),
                "revenue": float(r[2]),
                "previous_revenue": float(r[3]),
                "growth": float(r[4])
            })
        return data

    @staticmethod
    def get_top_selling_products(limit: int = 5):
        """Demonstrates ROW_NUMBER() window function on product sales."""
        session = db.session
        sql = """
        WITH RankedProducts AS (
            SELECT 
                p.product_id,
                p.product_name,
                c.category_name,
                COALESCE(SUM(oi.subtotal), 0.00) AS total_revenue,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                ROW_NUMBER() OVER(ORDER BY COALESCE(SUM(oi.subtotal), 0.00) DESC) AS sales_rank
            FROM products p
            INNER JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status != 'CANCELLED'
            GROUP BY p.product_id, p.product_name, c.category_name
        )
        SELECT product_id, product_name, category_name, total_revenue, units_sold, sales_rank
        FROM RankedProducts
        WHERE sales_rank <= :lim;
        """
        rows = session.execute(text(sql), {"lim": limit}).fetchall()
        data = []
        for r in rows:
            data.append({
                "product_id": r[0],
                "product_name": r[1],
                "category_name": r[2],
                "total_revenue": float(r[3]),
                "units_sold": int(r[4]),
                "rank": int(r[5])
            })
        return data

    @staticmethod
    def get_order_status_distribution():
        """Counts orders by status."""
        session = db.session
        sql = """
        SELECT order_status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0.00) AS total_value
        FROM orders
        GROUP BY order_status;
        """
        rows = session.execute(text(sql)).fetchall()
        data = []
        for r in rows:
            data.append({
                "status": r[0],
                "count": int(r[1]),
                "total_value": float(r[2])
            })
        return data

    @staticmethod
    def get_category_sales():
        """Demonstrates view vw_sales_summary aggregation."""
        session = db.session
        sql = """
        SELECT 
            category_name,
            SUM(orders_count) AS orders_count,
            SUM(units_sold) AS total_units_sold,
            SUM(gross_revenue) AS total_revenue
        FROM vw_sales_summary
        GROUP BY category_name
        ORDER BY total_revenue DESC;
        """
        rows = session.execute(text(sql)).fetchall()
        data = []
        for r in rows:
            data.append({
                "category_name": r[0],
                "orders_count": int(r[1]),
                "units_sold": int(r[2]),
                "revenue": float(r[3])
            })
        return data
