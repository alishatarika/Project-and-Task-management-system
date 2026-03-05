from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database.connection import Base
from sqlalchemy.sql import func


class ProjectMember(Base):
    __tablename__ = "project_members"

    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status     = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    project = relationship("Project", back_populates="members")
    user    = relationship("Users", back_populates="project_members", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id":         self.id,
            "project_id": self.project_id,
            "user_id":    self.user_id,
            "status":     self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user":       self.user.to_dict() if self.user else None,
        }