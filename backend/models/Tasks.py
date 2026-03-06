from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database.connection import Base
from sqlalchemy.sql import func


class Task(Base):
    __tablename__ = "tasks"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    task_status = Column(String(50), default="todo", nullable=False)   
    priority    = Column(String(50), default="medium", nullable=False) 
    due_date    = Column(DateTime(timezone=True), nullable=True)
    status   = Column(Boolean, default=True, nullable=False)        
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime(timezone=True), nullable=True)
    deleted_at  = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project     = relationship("Project", back_populates="tasks")
    creator     = relationship("Users", back_populates="created_tasks", foreign_keys=[created_by])
    assignee    = relationship("Users", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    comments    = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":          self.id,
            "title":       self.title,
            "description": self.description,
            "project_id":  self.project_id,
            "created_by":  self.created_by,
            "assigned_to": self.assigned_to,
            "task_status": self.task_status,
            "priority":    self.priority,
            "due_date":    self.due_date.isoformat() if self.due_date else None,
            "status":   self.status,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
            "creator":     self.creator.to_dict() if self.creator else None,
            "assignee":    self.assignee.to_dict() if self.assignee else None,
        }