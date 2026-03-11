from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    send_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_seen=Column(Boolean,default=False,nullable=False)

    message = Column(String(500), nullable=False)
    status = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship(
    "Users",
    foreign_keys=[user_id],
    back_populates="notifications_received"
    )

    sender = relationship(
    "Users",
    foreign_keys=[send_by],
    back_populates="notifications_sent"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "send_by": self.send_by,
            "message": self.message,
            "is_seen": self.is_seen,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user": self.user.to_dict() if self.user else None,
            "sender": self.sender.to_dict() if self.sender else None
        }