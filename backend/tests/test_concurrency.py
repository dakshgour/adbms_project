import concurrent.futures
import pytest
from app import create_app
from app.database import db
from app.models import Inventory, Cart, CartItem, Order
from app.services import OrderService

def test_concurrent_purchase_race_condition(app):
    """
    Academic Demonstration of Concurrency Control & Row-Level Locking (SELECT ... FOR UPDATE).
    
    Setup:
      - Product 5 inventory is set to exactly 1 unit.
      - User 2 (Customer A) cart is loaded with 1 unit of Product 5.
      - User 3 (Customer B) cart is loaded with 1 unit of Product 5.
    Execution:
      - Two worker threads fire checkout simultaneously across independent database connections.
    Verification:
      - Exactly ONE checkout succeeds (HTTP 201/Order created).
      - Exactly ONE checkout fails with InsufficientStockException.
      - Final inventory quantity_available == 0 (NEVER negative).
      - No double-spend / overselling occurs.
    """
    with app.app_context():
        session = db.session

        # Set Product 5 stock to exactly 1 unit
        inv = session.query(Inventory).filter_by(product_id=5).first()
        inv.quantity_available = 1
        session.commit()

        # Prepare User 2 Cart
        cart2 = session.query(Cart).filter_by(user_id=2).first()
        session.query(CartItem).filter_by(cart_id=cart2.cart_id).delete()
        session.add(CartItem(cart_id=cart2.cart_id, product_id=5, quantity=1))

        # Prepare User 3 Cart
        cart3 = session.query(Cart).filter_by(user_id=3).first()
        session.query(CartItem).filter_by(cart_id=cart3.cart_id).delete()
        session.add(CartItem(cart_id=cart3.cart_id, product_id=5, quantity=1))
        session.commit()

    def attempt_checkout(user_id, name):
        # Create a fresh app context and session per thread
        thread_app = create_app("development")
        with thread_app.app_context():
            try:
                order = OrderService.checkout(
                    user_id=user_id,
                    shipping_name=name,
                    shipping_address="100 Concurrency St",
                    shipping_city="Boston",
                    shipping_state="MA",
                    shipping_postal_code="02108",
                    payment_method="ONLINE"
                )
                return {"status": "SUCCESS", "user_id": user_id, "order": order}
            except Exception as e:
                return {"status": "FAILED", "user_id": user_id, "error": str(e)}

    # Run the two checkout requests truly concurrently in parallel threads
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(attempt_checkout, 2, "Customer A")
        f2 = executor.submit(attempt_checkout, 3, "Customer B")
        r1 = f1.result()
        r2 = f2.result()

    results = [r1, r2]
    successes = [r for r in results if r["status"] == "SUCCESS"]
    failures = [r for r in results if r["status"] == "FAILED"]

    # 1. Exactly one order succeeded
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}: {results}"
    
    # 2. Exactly one order failed
    assert len(failures) == 1, f"Expected exactly 1 failure, got {len(failures)}: {results}"
    assert "insufficient" in failures[0]["error"].lower()

    # 3. Final stock in database must be exactly 0 (NOT negative, NOT double deducted)
    with app.app_context():
        final_inv = db.session.query(Inventory).filter_by(product_id=5).first()
        assert final_inv.quantity_available == 0, f"Expected 0 stock, got {final_inv.quantity_available}"
