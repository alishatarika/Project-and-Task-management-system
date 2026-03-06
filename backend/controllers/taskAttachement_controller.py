from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.Task_Attachement import TaskAttachmentCreate, TaskAttachmentUpdate
from services.taskattachments_services import (
    add_attachment, get_all_attachments, get_attachments_by_task,
    update_attachment, delete_attachment
)
from middleware.auth import get_current_user
from models.Users import Users

router = APIRouter(prefix="/task-attachments", tags=["Task Attachments"])


@router.post("/")
def create(data: TaskAttachmentCreate, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    file = add_attachment(db, data)
    return file.to_dict()


@router.get("/")
def get_all(db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    files = get_all_attachments(db)
    return [f.to_dict() for f in files]


@router.get("/task/{task_id}")
def get_by_task(task_id: int, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    files = get_attachments_by_task(db, task_id)
    return [f.to_dict() for f in files]


@router.put("/{attachment_id}")
def update(attachment_id: int, data: TaskAttachmentUpdate, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    file = update_attachment(db, attachment_id, data)
    return file.to_dict()


@router.delete("/{attachment_id}")
def delete(attachment_id: int, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    file = delete_attachment(db, attachment_id)

    if not file:
        raise HTTPException(status_code=404, detail="Attachment not found")

    return {"message": "Attachment deleted"}