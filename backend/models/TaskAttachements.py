from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database.connection import Base
from sqlalchemy.sql import func


class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id          = Column(Integer, primary_key=True, index=True)
    task_id     = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name   = Column(String(255), nullable=False)
    file_path   = Column(String(500), nullable=False)
    status      = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime(timezone=True), nullable=True)
    deleted_at  = Column(DateTime(timezone=True), nullable=True)

    task     = relationship("Task", back_populates="attachments")
    uploader = relationship("Users", back_populates="task_attachments", foreign_keys=[uploaded_by])

    def to_dict(self):
        return {
            "id":          self.id,
            "task_id":     self.task_id,
            "uploaded_by": self.uploaded_by,
            "file_name":   self.file_name,
            "file_path":   self.file_path,
            "status":      self.status,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
            "uploader":    self.uploader.to_dict() if self.uploader else None,
        }