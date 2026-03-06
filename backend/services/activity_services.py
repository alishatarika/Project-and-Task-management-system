from sqlalchemy.orm import Session
from models.ActivityLogs import ActivityLog
from models.Users import Users
from datetime import datetime, timezone
from fastapi import HTTPException


def _get_active_user(db: Session, user_id: int):
    user = db.query(Users).filter(
        Users.id == user_id,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or inactive")
    return user


def create_log(db: Session, user_id: int, action: str):
    _get_active_user(db, user_id)

    log = ActivityLog(user_id=user_id, action=action)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def update_log(db: Session, id: int, user_id: int = None, action: str = None):
    log = db.query(ActivityLog).filter(
        ActivityLog.id == id,
        ActivityLog.deleted_at == None
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    if user_id:
        _get_active_user(db, user_id)
        log.user_id = user_id

    if action:
        log.action = action

    log.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(log)
    return log


def get_all_logs(db: Session):
    return db.query(ActivityLog).filter(
        ActivityLog.deleted_at == None
    ).all()


def get_log(db: Session, id: int):
    return db.query(ActivityLog).filter(
        ActivityLog.id == id,
        ActivityLog.deleted_at == None
    ).first()


def delete_log(db: Session, log: ActivityLog):
    log.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(log)
    return log


def get_log_by_id(db: Session, id: int):
    log = db.query(ActivityLog).filter(
        ActivityLog.id == id,
        ActivityLog.deleted_at == None
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    return log


def get_logs_by_user_id(db: Session, user_id: int):
    _get_active_user(db, user_id)

    return db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.deleted_at == None
    ).all()