from typing import Optional
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from models.Users import Users
from utils.hashing import verify_password

def authenticate_user(db: Session, identifier: str, password: str) :
    try:
        user = db.query(Users).filter(
            (Users.username == identifier) | (Users.email == identifier),
            Users.deleted_at.is_(None),
        ).first()
    except SQLAlchemyError as e:
        print("DB error during login:", e)
        raise HTTPException(status_code=500, detail="Database error during authentication.")

    if not user:
        return None

    try:
        if not verify_password(password, user.password_hash):
            return None
    except Exception as e:
        print("Password verify error:", e)
        raise HTTPException(status_code=500, detail="Authentication error.")

    if not user.status:
        raise HTTPException(status_code=403, detail="Your account has been deactivated.")

    return user