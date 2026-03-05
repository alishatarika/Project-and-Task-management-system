from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from database.connection import Base
from sqlalchemy.sql import func

class Role(Base):
    __tablename__ = "roles"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(255), nullable=False, unique=True)
    status     = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "status":     self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }