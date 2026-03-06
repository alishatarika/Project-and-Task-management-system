from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: int
    created_by: int
    task_status: str = "todo"
    assigned_to: Optional[int] = None
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    task_status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None