from pydantic import BaseModel
from typing import Optional


class UserRoleAssign(BaseModel):
    user_id: int
    role_id: int


class UserRoleUpdate(BaseModel):
    role_id: Optional[int] = None
    status: Optional[bool] = None
