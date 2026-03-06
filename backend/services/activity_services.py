from sqlalchemy.orm import Session
from models.ActivityLogs import ActivityLog
from models.Users import Users
from datetime import datetime
from fastapi import HTTPException


def create_log(db: Session, user_id: int, action: str):

    user = db.query(Users).filter(
    Users.id == user_id,
    Users.is_verified == True,
    Users.status == True,
    Users.deleted_at == None
).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log = ActivityLog(
        user_id=user_id,
        action=action
    )

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
        user = db.query(Users).filter(Users.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        log.user_id = user_id

    if action:
        log.action = action

    log.updated_at = datetime.utcnow()

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

    log.deleted_at = datetime.utcnow()

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

    user = db.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.deleted_at == None
    ).all()

    return logs