from datetime import datetime
from sqlalchemy import Column, BigInteger, String, DateTime, Enum, JSON
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(BigInteger, primary_key=True, autoincrement=True)
    table_name = Column(String(50), nullable=False, index=True)
    operation = Column(Enum("INSERT", "UPDATE", "DELETE", name="audit_op_enum"), nullable=False)
    record_id = Column(BigInteger, nullable=False, index=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    changed_by = Column(BigInteger, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "table_name": self.table_name,
            "operation": self.operation,
            "record_id": self.record_id,
            "old_values": self.old_values,
            "new_values": self.new_values,
            "changed_by": self.changed_by,
            "changed_at": self.changed_at.isoformat() if self.changed_at else None,
        }
