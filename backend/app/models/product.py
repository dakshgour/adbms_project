from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    product_id = Column(BigInteger, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, index=True)
    product_name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    sku = Column(String(50), nullable=False, unique=True, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("price >= 0", name="chk_products_price"),
    )

    # Relationships
    category = relationship("Category", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    inventory_movements = relationship("InventoryMovement", back_populates="product")

    def to_dict(self, include_inventory=True, metadata=None):
        data = {
            "product_id": self.product_id,
            "category_id": self.category_id,
            "category_name": self.category.category_name if self.category else None,
            "product_name": self.product_name,
            "description": self.description,
            "sku": self.sku,
            "price": float(self.price) if self.price is not None else 0.0,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_inventory and self.inventory:
            data["quantity_available"] = self.inventory.quantity_available
            data["reorder_level"] = self.inventory.reorder_level
            data["stock_status"] = self.inventory.stock_status
        else:
            data["quantity_available"] = 0
            data["reorder_level"] = 5
            data["stock_status"] = "OUT_OF_STOCK"

        if metadata:
            data["metadata"] = metadata

        return data
