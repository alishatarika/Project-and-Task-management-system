from sqlalchemy import Column, Integer, String, DateTime, Boolean,text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    status = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, server_default=text("false"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    owned_projects = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    project_members = relationship("ProjectMember", back_populates="user", foreign_keys="ProjectMember.user_id")

    assigned_tasks = relationship("Task", back_populates="assignee", foreign_keys="Task.assigned_to")
    created_tasks = relationship("Task", back_populates="creator", foreign_keys="Task.created_by")
    task_comments = relationship("TaskComment", back_populates="user")
    task_attachments = relationship("TaskAttachment", back_populates="uploader")
    activity_logs = relationship("ActivityLog", back_populates="user")
    notifications_received = relationship(
        "Notification",
        foreign_keys="Notification.user_id",
        back_populates="user"
    )
    notifications_sent = relationship(
        "Notification",
        foreign_keys="Notification.send_by",
        back_populates="sender"
    )
    otps = relationship("OTP", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }