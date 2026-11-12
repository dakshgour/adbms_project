from sqlalchemy import text
from app.database import db
from app.models import AuditLog, Inventory

def test_stored_procedure_sp_adjust_inventory(app, client, admin_token):
    with app.app_context():
        # Get current stock of product 4
        inv = db.session.query(Inventory).filter_by(product_id=4).first()
        initial_qty = inv.quantity_available

    # Perform +5 adjustment via API which calls sp_adjust_inventory
    res = client.post("/api/v1/inventory/adjustments", headers={
        "Authorization": f"Bearer {admin_token}"
    }, json={
        "product_id": 4,
        "adjustment_qty": 5,
        "reason": "Test restock via sp_adjust_inventory"
    })
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["quantity_changed"] == 5
    assert data["quantity_after"] == initial_qty + 5

    # Test negative quantity rejection in stored procedure
    # Attempting to deduct more units than exist
    fail_res = client.post("/api/v1/inventory/adjustments", headers={
        "Authorization": f"Bearer {admin_token}"
    }, json={
        "product_id": 4,
        "adjustment_qty": -9999,
        "reason": "Invalid excessive deduction"
    })
    assert fail_res.status_code == 400
    assert "negative" in fail_res.get_json()["message"].lower()

def test_audit_log_trigger_execution(app, client, admin_token):
    # Update product 2 via API
    res = client.put("/api/v1/products/2", headers={
        "Authorization": f"Bearer {admin_token}"
    }, json={
        "price": 1299.99
    })
    assert res.status_code == 200

    # Query audit_logs table to verify trigger fired
    with app.app_context():
        latest_audit = (
            db.session.query(AuditLog)
            .filter_by(table_name="products", record_id=2, operation="UPDATE")
            .order_by(AuditLog.log_id.desc())
            .first()
        )
        assert latest_audit is not None
        assert latest_audit.changed_by == 1  # Admin user ID set via @app_user_id
        assert latest_audit.new_values is not None
        assert float(latest_audit.new_values.get("price", 0)) == 1299.99

def test_sql_views_queryable(app):
    with app.app_context():
        session = db.session
        # Test vw_product_inventory
        v1 = session.execute(text("SELECT * FROM vw_product_inventory LIMIT 5;")).fetchall()
        assert len(v1) > 0

        # Test vw_order_details
        v2 = session.execute(text("SELECT * FROM vw_order_details LIMIT 5;")).fetchall()
        assert len(v2) > 0

        # Test vw_sales_summary
        v3 = session.execute(text("SELECT * FROM vw_sales_summary LIMIT 5;")).fetchall()
        assert len(v3) > 0

        # Test vw_low_stock_products
        v4 = session.execute(text("SELECT * FROM vw_low_stock_products;")).fetchall()
        assert isinstance(v4, list)
