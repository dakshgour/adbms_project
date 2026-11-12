from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Integer, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    idempotency_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    idempotency_key = Column(String(100), nullable=False, index=True)
    order_id = Column(BigInteger, ForeignKey("orders.order_id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    response_status = Column(Integer, nullable=False)
    response_body = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "idempotency_key", name="uq_user_idempotency"),
    )

    user = relationship("User")
    order = relationship("Order")

    def to_dict(self):
        return {
            "idempotency_id": self.idempotency_id,
            "user_id": self.user_id,
            "idempotency_key": self.idempotency_key,
            "order_id": self.order_id,
            "response_status": self.response_status,
            "response_body": self.response_body,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
