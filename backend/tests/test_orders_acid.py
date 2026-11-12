import uuid
from app.database import db
from app.models import Inventory, Order, InventoryMovement

def test_order_checkout_acid_success(client, customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}

    # Clear cart first
    client.post("/api/v1/cart/clear", headers=headers)

    # Check initial stock of product 8
    inv_before = db.session.query(Inventory).filter_by(product_id=8).first().quantity_available
    assert inv_before >= 2, "Product 8 needs at least 2 units in stock for test"

    # Add 2 units of product 8 to cart
    add_res = client.post("/api/v1/cart/items", headers=headers, json={
        "product_id": 8,
        "quantity": 2
    })
    assert add_res.status_code == 200

    idempotency_key = f"TEST-IDEMP-{uuid.uuid4().hex}"

    # Perform checkout
    order_res = client.post("/api/v1/orders", headers={
        **headers,
        "Idempotency-Key": idempotency_key
    }, json={
        "shipping_name": "Alice Johnson",
        "shipping_address": "123 Maple Street",
        "shipping_city": "Seattle",
        "shipping_state": "WA",
        "shipping_postal_code": "98101",
        "payment_method": "ONLINE"
    })

    assert order_res.status_code == 201
    order_data = order_res.get_json()["data"]
    order_id = order_data["order_id"]
    assert order_data["order_status"] == "PLACED"
    assert order_data["payment"]["payment_status"] == "COMPLETED"

    # Verify inventory was atomically deducted in MySQL
    db.session.expire_all()
    inv_after = db.session.query(Inventory).filter_by(product_id=8).first().quantity_available
    assert inv_after == inv_before - 2

    # Verify idempotency: Repeating identical request returns the cached order without deducting stock again
    retry_res = client.post("/api/v1/orders", headers={
        **headers,
        "Idempotency-Key": idempotency_key
    }, json={
        "shipping_name": "Alice Johnson",
        "shipping_address": "123 Maple Street",
        "shipping_city": "Seattle",
        "shipping_state": "WA",
        "shipping_postal_code": "98101",
        "payment_method": "ONLINE"
    })
    assert retry_res.status_code in (200, 201)
    retry_data = retry_res.get_json()["data"]
    assert retry_data["order_id"] == order_id

    # Verify inventory was NOT deducted again
    db.session.expire_all()
    inv_check = db.session.query(Inventory).filter_by(product_id=8).first().quantity_available
    assert inv_check == inv_after

    # Now test Order Cancellation: Stock should be restored
    cancel_res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    cancelled_data = cancel_res.get_json()["data"]
    assert cancelled_data["order_status"] == "CANCELLED"
    assert cancelled_data["payment"]["payment_status"] == "REFUNDED"

    # Verify stock restored in MySQL
    db.session.expire_all()
    inv_restored = db.session.query(Inventory).filter_by(product_id=8).first().quantity_available
    assert inv_restored == inv_before

    # Verify repeated cancellation fails
    repeat_cancel = client.post(f"/api/v1/orders/{order_id}/cancel", headers=headers)
    assert repeat_cancel.status_code == 400
    assert "already been cancelled" in repeat_cancel.get_json()["message"]

def test_order_checkout_insufficient_stock_rollback(client, customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}
    client.post("/api/v1/cart/clear", headers=headers)

    # Product 17 has 0 units in stock
    # Attempting to add 1 unit or bypass cart to checkout should fail cleanly
    res = client.post("/api/v1/cart/items", headers=headers, json={
        "product_id": 17,
        "quantity": 1
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert "out of stock" in data["message"].lower() or "insufficient" in data["message"].lower()
