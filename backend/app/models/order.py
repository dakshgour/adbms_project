from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, ForeignKey, CheckConstraint, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, index=True)
    order_number = Column(String(50), nullable=False, unique=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    order_status = Column(
        Enum("PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", name="order_status_enum"),
        nullable=False,
        default="PLACED",
        index=True
    )
    shipping_name = Column(String(100), nullable=False)
    shipping_address = Column(String(255), nullable=False)
    shipping_city = Column(String(100), nullable=False)
    shipping_state = Column(String(100), nullable=False)
    shipping_postal_code = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="chk_orders_total_non_negative"),
    )

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

    def to_dict(self, include_items=True):
        data = {
            "order_id": self.order_id,
            "order_number": self.order_number,
            "user_id": self.user_id,
            "customer_name": self.user.full_name if self.user else self.shipping_name,
            "customer_email": self.user.email if self.user else None,
            "total_amount": float(self.total_amount) if self.total_amount is not None else 0.0,
            "order_status": self.order_status,
            "shipping_name": self.shipping_name,
            "shipping_address": self.shipping_address,
            "shipping_city": self.shipping_city,
            "shipping_state": self.shipping_state,
            "shipping_postal_code": self.shipping_postal_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "payment": self.payment.to_dict() if self.payment else None,
        }
        if include_items:
            data["items"] = [item.to_dict() for item in self.items]
            data["items_count"] = sum(item.quantity for item in self.items)
        return data

class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("orders.order_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(BigInteger, ForeignKey("products.product_id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, index=True)
    product_name_snapshot = Column(String(200), nullable=False)
    sku_snapshot = Column(String(50), nullable=False)
    quantity = Column(BigInteger, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_order_items_quantity"),
        CheckConstraint("unit_price >= 0", name="chk_order_items_unit_price"),
        CheckConstraint("subtotal >= 0", name="chk_order_items_subtotal"),
    )

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    def to_dict(self):
        return {
            "order_item_id": self.order_item_id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "product_name": self.product_name_snapshot,
            "sku": self.sku_snapshot,
            "quantity": int(self.quantity),
            "unit_price": float(self.unit_price),
            "subtotal": float(self.subtotal),
            "image_url": self.product.image_url if self.product else None,
        }
