import time
import random
import uuid
from datetime import datetime
from sqlalchemy import text
from pymysql.constants import ER
from pymysql.err import OperationalError

from app.database import db
from app.models import (
    Order, OrderItem, Cart, CartItem, Product, Inventory,
    Payment, InventoryMovement, IdempotencyRecord
)
from app.utils.errors import (
    NotFoundException, BadRequestException,
    InsufficientStockException, ConflictException
)

VALID_STATUS_TRANSITIONS = {
    "PLACED": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["SHIPPED", "CANCELLED"],
    "SHIPPED": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": []
}

class OrderService:
    @staticmethod
    def checkout(
        user_id: int,
        shipping_name: str,
        shipping_address: str,
        shipping_city: str,
        shipping_state: str,
        shipping_postal_code: str,
        payment_method: str = "ONLINE",
        idempotency_key: str = None
    ):
        """
        Executes an ACID order placement transaction with:
        - Idempotency deduplication
        - Deterministic ordered row-level locking (SELECT ... FOR UPDATE)
        - In-flight inventory verification
        - Trusted price calculation
        - Audit ledger recording
        - Bounded deadlock retry logic
        """
        if not shipping_name or not shipping_address or not shipping_city or not shipping_postal_code:
            raise BadRequestException("Shipping name, address, city, and postal code are all required.")

        payment_method = payment_method.upper()
        if payment_method not in ("COD", "ONLINE"):
            payment_method = "ONLINE"

        # Check idempotency record before entering transactional block
        if idempotency_key:
            existing_record = db.session.query(IdempotencyRecord).filter_by(
                user_id=user_id, idempotency_key=idempotency_key
            ).first()
            if existing_record and existing_record.order_id:
                # Return previously successful order response
                cached_order = db.session.query(Order).filter_by(order_id=existing_record.order_id).first()
                if cached_order:
                    return cached_order.to_dict()

        max_retries = 3
        retry_delay = 0.05  # 50ms initial backoff

        for attempt in range(max_retries):
            session = db.session
            try:
                # Set acting user variable for MySQL triggers
                session.execute(text("SET @app_user_id = :uid;"), {"uid": user_id})

                # 1. Fetch user cart
                cart = session.query(Cart).filter_by(user_id=user_id).first()
                if not cart or not cart.items:
                    raise BadRequestException("Cannot checkout: Shopping cart is empty.")

                # Gather requested items and quantities
                requested_items = {}
                for item in cart.items:
                    requested_items[item.product_id] = requested_items.get(item.product_id, 0) + item.quantity

                # 2. Sort product IDs strictly ascending to guarantee consistent lock ordering (Deadlock Prevention)
                sorted_product_ids = sorted(list(requested_items.keys()))

                # 3. Acquire exclusive row-level locks on inventory rows in sorted order
                locked_inventory = (
                    session.query(Inventory)
                    .filter(Inventory.product_id.in_(sorted_product_ids))
                    .order_by(Inventory.product_id.asc())
                    .with_for_update()
                    .all()
                )
                inventory_map = {inv.product_id: inv for inv in locked_inventory}

                # 4. Fetch products for trusted prices and status
                products = (
                    session.query(Product)
                    .filter(Product.product_id.in_(sorted_product_ids))
                    .all()
                )
                product_map = {p.product_id: p for p in products}

                # 5. Validate stock availability and product active state
                order_items_data = []
                total_amount = 0.0

                for pid in sorted_product_ids:
                    prod = product_map.get(pid)
                    if not prod or not prod.is_active:
                        raise BadRequestException(f"Product '{prod.product_name if prod else pid}' is no longer available.")

                    inv = inventory_map.get(pid)
                    qty_requested = requested_items[pid]

                    if not inv or inv.quantity_available < qty_requested:
                        avail = inv.quantity_available if inv else 0
                        raise InsufficientStockException(
                            f"Insufficient stock for '{prod.product_name}'. Requested {qty_requested}, but only {avail} available."
                        )

                    unit_price = float(prod.price)
                    subtotal = round(unit_price * qty_requested, 2)
                    total_amount += subtotal

                    order_items_data.append({
                        "product_id": pid,
                        "product_name_snapshot": prod.product_name,
                        "sku_snapshot": prod.sku,
                        "quantity": qty_requested,
                        "unit_price": unit_price,
                        "subtotal": subtotal,
                        "inv": inv
                    })

                total_amount = round(total_amount, 2)

                # 6. Generate unique order number
                order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

                # 7. Insert Order Header
                order = Order(
                    user_id=user_id,
                    order_number=order_number,
                    total_amount=total_amount,
                    order_status="PLACED",
                    shipping_name=shipping_name.strip(),
                    shipping_address=shipping_address.strip(),
                    shipping_city=shipping_city.strip(),
                    shipping_state=shipping_state.strip() if shipping_state else "",
                    shipping_postal_code=shipping_postal_code.strip(),
                )
                session.add(order)
                session.flush()

                # 8. Insert Order Items, deduct inventory, and record inventory movements
                for item_data in order_items_data:
                    order_item = OrderItem(
                        order_id=order.order_id,
                        product_id=item_data["product_id"],
                        product_name_snapshot=item_data["product_name_snapshot"],
                        sku_snapshot=item_data["sku_snapshot"],
                        quantity=item_data["quantity"],
                        unit_price=item_data["unit_price"],
                        subtotal=item_data["subtotal"]
                    )
                    session.add(order_item)

                    # Deduct inventory
                    inv = item_data["inv"]
                    qty_before = inv.quantity_available
                    qty_after = qty_before - item_data["quantity"]
                    inv.quantity_available = qty_after

                    # Movement record
                    movement = InventoryMovement(
                        product_id=item_data["product_id"],
                        movement_type="SALE",
                        quantity_changed=-item_data["quantity"],
                        quantity_before=qty_before,
                        quantity_after=qty_after,
                        reference_type="ORDER",
                        reference_id=order.order_id,
                        reason=f"Order checkout {order_number}",
                        created_by=user_id
                    )
                    session.add(movement)

                # 9. Insert Payment Record
                pay_status = "COMPLETED" if payment_method == "ONLINE" else "PENDING"
                txn_ref = f"SIM-TXN-{uuid.uuid4().hex[:12].upper()}" if payment_method == "ONLINE" else f"COD-PENDING-{uuid.uuid4().hex[:6].upper()}"
                payment = Payment(
                    order_id=order.order_id,
                    payment_method=payment_method,
                    payment_status=pay_status,
                    amount=total_amount,
                    transaction_reference=txn_ref
                )
                session.add(payment)

                # 10. Record Idempotency
                if idempotency_key:
                    idemp = IdempotencyRecord(
                        user_id=user_id,
                        idempotency_key=idempotency_key,
                        order_id=order.order_id,
                        response_status=201,
                        response_body={"order_id": order.order_id, "order_number": order_number}
                    )
                    session.add(idemp)

                # 11. Clear Cart
                session.query(CartItem).filter_by(cart_id=cart.cart_id).delete()

                # 12. Commit all changes atomically
                session.commit()

                return order.to_dict()

            except OperationalError as db_err:
                session.rollback()
                # Check for MySQL Deadlock error 1213
                if db_err.args and db_err.args[0] == ER.LOCK_DEADLOCK:
                    if attempt < max_retries - 1:
                        sleep_time = retry_delay * (2 ** attempt) + random.uniform(0.01, 0.05)
                        time.sleep(sleep_time)
                        continue
                raise
            except Exception:
                session.rollback()
                raise

    @staticmethod
    def cancel_order(user_id: int, order_id: int, is_admin: bool = False):
        """
        Cancels an eligible order and atomically restores inventory stock.
        Only PLACED and CONFIRMED orders may be cancelled.
        Shipped or Delivered orders cannot be cancelled through this flow.
        """
        session = db.session
        try:
            session.execute(text("SET @app_user_id = :uid;"), {"uid": user_id})

            # Lock order row FOR UPDATE
            query = session.query(Order).filter_by(order_id=order_id).with_for_update()
            if not is_admin:
                query = query.filter_by(user_id=user_id)

            order = query.first()
            if not order:
                raise NotFoundException(f"Order {order_id} not found or you are not authorized to cancel it.")

            if order.order_status == "CANCELLED":
                raise BadRequestException("This order has already been cancelled.")

            if order.order_status in ("SHIPPED", "DELIVERED"):
                raise BadRequestException(f"Cannot cancel order in status '{order.order_status}'. Please initiate a return.")

            # Order items to restore
            items = session.query(OrderItem).filter_by(order_id=order.order_id).all()
            sorted_product_ids = sorted([item.product_id for item in items])

            # Lock inventory in ascending order
            locked_inventory = (
                session.query(Inventory)
                .filter(Inventory.product_id.in_(sorted_product_ids))
                .order_by(Inventory.product_id.asc())
                .with_for_update()
                .all()
            )
            inv_map = {inv.product_id: inv for inv in locked_inventory}

            # Restore inventory & log movements
            for item in items:
                inv = inv_map.get(item.product_id)
                if inv:
                    qty_before = inv.quantity_available
                    qty_after = qty_before + item.quantity
                    inv.quantity_available = qty_after

                    movement = InventoryMovement(
                        product_id=item.product_id,
                        movement_type="CANCELLATION_RETURN",
                        quantity_changed=item.quantity,
                        quantity_before=qty_before,
                        quantity_after=qty_after,
                        reference_type="ORDER",
                        reference_id=order.order_id,
                        reason=f"Order cancellation restock {order.order_number}",
                        created_by=user_id
                    )
                    session.add(movement)

            # Update payment if exists
            if order.payment:
                order.payment.payment_status = "REFUNDED" if order.payment.payment_status == "COMPLETED" else "FAILED"

            order.order_status = "CANCELLED"
            session.commit()

            return order.to_dict()

        except Exception:
            session.rollback()
            raise

    @staticmethod
    def update_order_status(order_id: int, new_status: str, admin_user_id: int):
        """Admin transition of order status with state machine validation."""
        new_status = new_status.strip().upper()
        session = db.session
        try:
            session.execute(text("SET @app_user_id = :uid;"), {"uid": admin_user_id})

            order = session.query(Order).filter_by(order_id=order_id).with_for_update().first()
            if not order:
                raise NotFoundException(f"Order {order_id} not found.")

            current_status = order.order_status

            if new_status == current_status:
                return order.to_dict()

            allowed = VALID_STATUS_TRANSITIONS.get(current_status, [])
            if new_status not in allowed:
                raise BadRequestException(
                    f"Invalid status transition from '{current_status}' to '{new_status}'. Allowed transitions: {allowed}"
                )

            # If cancelling via status update, use cancel_order logic to restore stock
            if new_status == "CANCELLED":
                return OrderService.cancel_order(admin_user_id, order_id, is_admin=True)

            order.order_status = new_status
            if new_status == "DELIVERED" and order.payment and order.payment.payment_method == "COD":
                order.payment.payment_status = "COMPLETED"

            session.commit()
            return order.to_dict()

        except Exception:
            session.rollback()
            raise

    @staticmethod
    def get_order(order_id: int, user_id: int = None, is_admin: bool = False):
        session = db.session
        query = session.query(Order).filter_by(order_id=order_id)
        if not is_admin and user_id is not None:
            query = query.filter_by(user_id=user_id)

        order = query.first()
        if not order:
            raise NotFoundException(f"Order {order_id} not found.")
        return order.to_dict()

    @staticmethod
    def list_orders(user_id: int = None, is_admin: bool = False, status: str = None, page: int = 1, per_page: int = 10):
        session = db.session
        query = session.query(Order)

        if not is_admin and user_id is not None:
            query = query.filter(Order.user_id == user_id)

        if status:
            query = query.filter(Order.order_status == status.upper())

        query = query.order_by(Order.created_at.desc())

        total_items = query.count()
        orders = query.offset((page - 1) * per_page).limit(per_page).all()

        return {
            "orders": [o.to_dict() for o in orders],
            "pagination": {
                "total_items": total_items,
                "current_page": page,
                "per_page": per_page
            }
        }
