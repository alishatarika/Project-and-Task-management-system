from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from database.connection import Base
from sqlalchemy.sql import func


class UserRole(Base):
    __tablename__ = "user_roles"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id    = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    status     = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("Users", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "role_id":    self.role_id,
            "status":     self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user":       self.user.to_dict() if self.user else None,
            "role":       self.role.to_dict() if self.role else None,
        }