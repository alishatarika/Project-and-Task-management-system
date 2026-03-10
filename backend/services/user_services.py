from sqlalchemy.orm import Session
from models.Users import Users
from datetime import datetime, timezone
from fastapi import HTTPException
from utils.hashing import verify_password, hash_password


# ── READ ─────────────────────────────────────────────────────────

def get_users(db: Session):
    return db.query(Users).filter(
        Users.is_verified == True,   # only verified
        Users.status      == True,   # only active
        Users.deleted_at  == None    # not deleted
    ).all()


def get_user(db: Session, user_id: int):
    return db.query(Users).filter(
        Users.id          == user_id,
        Users.is_verified == True,   # only verified
        Users.status      == True,   # only active
        Users.deleted_at  == None    # not deleted
    ).first()


def get_user_by_email(db: Session, email: str):
    return db.query(Users).filter(
        Users.email      == email,
        Users.deleted_at == None
    ).first()


# ── UPDATE ───────────────────────────────────────────────────────

def update_user(db: Session, user_id: int, data):
    user = get_user(db, user_id)
    if not user:
        return None

    for key, value in data.dict(exclude_unset=True).items():
        setattr(user, key, value)

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user_id: int, data):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    user.password   = hash_password(data.new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


# ── DELETE (soft) ────────────────────────────────────────────────

def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        return None

    user.deleted_at = datetime.now(timezone.utc)
    user.status     = False
    db.commit()
    return user