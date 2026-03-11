from sqlalchemy.orm import Session
from models.Notifications import Notification
from models.Users import Users
from datetime import datetime, timezone
from fastapi import HTTPException


def create_notification(db: Session, user_id: int, send_by: int, message: str):
    recipient = db.query(Users).filter(
        Users.id == user_id,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found or inactive")

    notification = Notification(
        user_id=user_id,
        send_by=send_by,
        message=message,
        status=True
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_all_notifications(db: Session):
    return db.query(Notification).filter(
        Notification.deleted_at == None
    ).all()


def get_user_notifications(db: Session, user_id: int):
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.deleted_at == None
    ).order_by(Notification.created_at.desc()).all()


def get_notification(db: Session, id: int):
    return db.query(Notification).filter(
        Notification.id == id,
        Notification.deleted_at == None
    ).first()


def update_notification(db: Session, notification: Notification, data: dict):
    for key, value in data.items():
        setattr(notification, key, value)

    notification.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


def delete_notification(db: Session, notification: Notification):
    notification.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification