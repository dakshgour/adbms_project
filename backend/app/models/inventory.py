from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey("products.product_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    quantity_available = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=5)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("quantity_available >= 0", name="chk_inventory_qty_non_negative"),
        CheckConstraint("reorder_level >= 0", name="chk_inventory_reorder_non_negative"),
    )

    product = relationship("Product", back_populates="inventory")

    @property
    def stock_status(self) -> str:
        if self.quantity_available <= 0:
            return "OUT_OF_STOCK"
        elif self.quantity_available <= self.reorder_level:
            return "LOW_STOCK"
        return "IN_STOCK"

    def to_dict(self):
        return {
            "inventory_id": self.inventory_id,
            "product_id": self.product_id,
            "product_name": self.product.product_name if self.product else None,
            "sku": self.product.sku if self.product else None,
            "quantity_available": self.quantity_available,
            "reorder_level": self.reorder_level,
            "stock_status": self.stock_status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
