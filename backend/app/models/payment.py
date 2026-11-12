from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Numeric, DateTime, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("orders.order_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False, index=True)
    payment_method = Column(Enum("COD", "ONLINE", name="payment_method_enum"), nullable=False)
    payment_status = Column(
        Enum("PENDING", "COMPLETED", "FAILED", "REFUNDED", name="payment_status_enum"),
        nullable=False,
        default="PENDING",
        index=True
    )
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("amount >= 0", name="chk_payments_amount"),
    )

    order = relationship("Order", back_populates="payment")

    def to_dict(self):
        return {
            "payment_id": self.payment_id,
            "order_id": self.order_id,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "amount": float(self.amount),
            "transaction_reference": self.transaction_reference,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
