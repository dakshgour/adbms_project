from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    movement_id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey("products.product_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, index=True)
    movement_type = Column(
        Enum("PURCHASE", "SALE", "RESTOCK", "CANCELLATION_RETURN", "ADJUSTMENT", name="movement_type_enum"),
        nullable=False,
        index=True
    )
    quantity_changed = Column(Integer, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(BigInteger, nullable=True)
    reason = Column(String(255), nullable=True)
    created_by = Column(BigInteger, ForeignKey("users.user_id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    product = relationship("Product", back_populates="inventory_movements")
    creator = relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "movement_id": self.movement_id,
            "product_id": self.product_id,
            "product_name": self.product.product_name if self.product else None,
            "sku": self.product.sku if self.product else None,
            "movement_type": self.movement_type,
            "quantity_changed": self.quantity_changed,
            "quantity_before": self.quantity_before,
            "quantity_after": self.quantity_after,
            "reference_type": self.reference_type,
            "reference_id": self.reference_id,
            "reason": self.reason,
            "created_by": self.created_by,
            "created_by_name": self.creator.full_name if self.creator else "System",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
