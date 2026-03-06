from pydantic import BaseModel
from typing import Optional


class TaskCommentCreate(BaseModel):
    task_id: int
    user_id: int
    comment: str


class TaskCommentUpdate(BaseModel):
    comment: Optional[str] = None