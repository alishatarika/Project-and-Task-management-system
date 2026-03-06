from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from middleware.auth import get_current_user
from models.Users import Users
from services import notification_services

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
def get_all_notifications(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    notifications = notification_services.get_all_notifications(db)

    return [n.to_dict() for n in notifications]


@router.post("/")
def create_notification(
    user_id: int,
    message: str,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    notification = notification_services.create_notification(db, user_id, message)

    return {
        "message": "Notification created",
        "data": notification.to_dict()
    }


@router.get("/user/{user_id}")
def get_user_notifications(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    notifications = notification_services.get_user_notifications(db, user_id)

    return [n.to_dict() for n in notifications]


@router.put("/{id}")
def update_notification(
    id: int,
    message: str = None,
    status: bool = None,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    notification = notification_services.get_notification(db, id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    update_data = {}

    if message is not None:
        update_data["message"] = message

    if status is not None:
        update_data["status"] = status

    updated = notification_services.update_notification(db, notification, update_data)

    return {
        "message": "Notification updated",
        "data": updated.to_dict()
    }


@router.delete("/{id}")
def delete_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    notification = notification_services.get_notification(db, id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification_services.delete_notification(db, notification)

    return {"message": "Notification deleted"}