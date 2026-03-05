from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database.connection import Base
from sqlalchemy.sql import func


class Project(Base):
    __tablename__ = "projects"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    status      = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime(timezone=True), nullable=True)
    deleted_at  = Column(DateTime(timezone=True), nullable=True)

    owner   = relationship("Users", back_populates="owned_projects", foreign_keys=[owner_id])
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    tasks   = relationship("Task", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":          self.id,
            "name":        self.name,
            "description": self.description,
            "owner_id":    self.owner_id,
            "status":      self.status,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
            "owner":       self.owner.to_dict() if self.owner else None,
        }