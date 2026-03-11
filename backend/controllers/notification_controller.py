from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.NotificationSchema import NotificationCreate,NotificationUpdate
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
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    notification = notification_services.create_notification(
        db,
        data.user_id,
        send_by=current_user.id,
        message=data.message
    )
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
    data: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    notification = notification_services.get_notification(db, id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    update_data = {}
    if data.message is not None:
        update_data["message"] = data.message
    if data.status is not None:
        update_data["status"] = data.status
    if data.is_seen is not None:                  
        update_data["is_seen"] = data.is_seen    

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