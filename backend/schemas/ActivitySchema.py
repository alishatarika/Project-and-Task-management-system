from pydantic import BaseModel
from typing import Optional


class ActivityLogCreate(BaseModel):
    user_id: int
    action: str


class ActivityLogUpdate(BaseModel):
    user_id: Optional[int] = None
    action: Optional[str] = None