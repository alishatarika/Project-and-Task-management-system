from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database.connection import Base
from sqlalchemy.sql import func


class TaskComment(Base):
    __tablename__ = "task_comments"

    id         = Column(Integer, primary_key=True, index=True)
    task_id    = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment    = Column(String(1000), nullable=False)
    status     = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    task = relationship("Task", back_populates="comments")
    user = relationship("Users", back_populates="task_comments")

    def to_dict(self):
        return {
            "id":         self.id,
            "task_id":    self.task_id,
            "user_id":    self.user_id,
            "comment":    self.comment,
            "status":     self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user":       self.user.to_dict() if self.user else None,
        }