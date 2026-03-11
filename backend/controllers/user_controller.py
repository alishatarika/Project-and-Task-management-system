from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.userSchema import UserCreate, UserUpdate, UserUpdatePassword
from services.user_services import (
    get_users,
    get_user,
    update_user,
    update_password,
    delete_user,
)
from middleware.auth import get_current_user
from models.Users import Users

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
def get_all(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    users = get_users(db)
    return [u.to_dict() for u in users]




@router.get("/me")
def get_me(current_user: Users = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user.to_dict()


@router.get("/{user_id}")
def get(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.to_dict()



@router.put("/{user_id}")
def update(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    user = update_user(db, user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.to_dict()


@router.put("/{user_id}/password")
def change_password(
    user_id: int,
    data: UserUpdatePassword,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    user = update_password(db, user_id, data)
    return user.to_dict()



@router.delete("/{user_id}")
def delete(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    user = delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}