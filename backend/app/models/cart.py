from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Cart(Base):
    __tablename__ = "carts"

    cart_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

    def to_dict(self):
        item_list = [item.to_dict() for item in self.items]
        total_price = sum(item["subtotal"] for item in item_list)
        total_items = sum(item["quantity"] for item in item_list)
        return {
            "cart_id": self.cart_id,
            "user_id": self.user_id,
            "items": item_list,
            "total_items": total_items,
            "total_price": round(total_price, 2),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class CartItem(Base):
    __tablename__ = "cart_items"

    cart_item_id = Column(BigInteger, primary_key=True, autoincrement=True)
    cart_id = Column(BigInteger, ForeignKey("carts.cart_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(BigInteger, ForeignKey("products.product_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),
        CheckConstraint("quantity > 0", name="chk_cart_item_quantity"),
    )

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")

    def to_dict(self):
        price = float(self.product.price) if self.product and self.product.price is not None else 0.0
        return {
            "cart_item_id": self.cart_item_id,
            "cart_id": self.cart_id,
            "product_id": self.product_id,
            "product_name": self.product.product_name if self.product else None,
            "sku": self.product.sku if self.product else None,
            "price": price,
            "image_url": self.product.image_url if self.product else None,
            "quantity": self.quantity,
            "subtotal": round(price * self.quantity, 2),
            "is_active": self.product.is_active if self.product else False,
            "quantity_available": self.product.inventory.quantity_available if self.product and self.product.inventory else 0,
        }
