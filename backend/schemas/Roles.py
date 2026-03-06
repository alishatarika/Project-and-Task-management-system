from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RoleCreate(BaseModel):
    name: str
    status: Optional[bool] = True


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[bool] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    status: bool
    created_at: datetime
    updated_at: Optional[datetime]
