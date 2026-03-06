from sqlalchemy.orm import Session
from models.Notifications import Notification
from datetime import datetime


def create_notification(db: Session, user_id: int, send_by: int, message: str):

    notification = Notification(
        user_id=user_id,
        send_by=send_by,
        message=message,
        status=1
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
    ).all()


def get_notification(db: Session, id: int):

    return db.query(Notification).filter(
        Notification.id == id,
        Notification.deleted_at == None
    ).first()


def update_notification(db: Session, notification: Notification, data: dict):

    for key, value in data.items():
        setattr(notification, key, value)

    notification.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(notification)

    return notification


def delete_notification(db: Session, notification: Notification):

    notification.deleted_at = datetime.utcnow()

    db.commit()
    db.refresh(notification)

    return notification