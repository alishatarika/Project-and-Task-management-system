from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.ActivitySchema import ActivityLogCreate,ActivityLogUpdate
from database.connection import get_db
from middleware.auth import get_current_user
from models.Users import Users
from services import activity_services

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])


@router.get("/")
def get_all_logs(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    logs = activity_services.get_all_logs(db)
    return [l.to_dict() for l in logs]


@router.post("/")
def create_log(
    data: ActivityLogCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    log = activity_services.create_log(db, data.user_id, data.action)
    return {
        "message": "Activity logged",
        "data": log.to_dict()
    }


@router.put("/{id}")
def update_log(
    id: int,
    data: ActivityLogUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    log = activity_services.update_log(db, id, data.user_id, data.action)
    return {
        "message": "Activity Updated",
        "data": log.to_dict()
    }


@router.delete("/{id}")
def delete_log(
    id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    log = activity_services.get_log(db, id)

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    activity_services.delete_log(db, log)
    return {"message": "Log deleted"}


@router.get("/log/{id}")
def get_log_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    log = activity_services.get_log_by_id(db, id)
    return log.to_dict()


@router.get("/user/{user_id}")
def get_logs_by_user_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    logs = activity_services.get_logs_by_user_id(db, user_id)
    return [log.to_dict() for log in logs]