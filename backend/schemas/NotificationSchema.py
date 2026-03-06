from pydantic import BaseModel
from typing import Optional

class NotificationCreate(BaseModel):
    user_id: int
    message: str


class NotificationUpdate(BaseModel):
    message: Optional[str] = None
    status: Optional[bool] = None