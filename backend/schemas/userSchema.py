from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email:    EmailStr
    password: str


class UserUpdate(BaseModel):
    username:    Optional[str]   = None
    email:       Optional[EmailStr] = None
    is_verified: Optional[bool]  = None
    status:      Optional[bool]  = None


class UserUpdatePassword(BaseModel):
    old_password: str
    new_password: str