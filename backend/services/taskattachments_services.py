from sqlalchemy.orm import Session
from models.TaskAttachements import TaskAttachment
from models.Tasks import Task
from models.Users import Users
from datetime import datetime
from fastapi import HTTPException


def add_attachment(db: Session, data):
    task = db.query(Task).filter(Task.id == data.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user = db.query(Users).filter(Users.id == data.uploaded_by).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = TaskAttachment(**data.dict())

    db.add(file)
    db.commit()
    db.refresh(file)

    return file


def get_all_attachments(db: Session):
    return db.query(TaskAttachment).filter(
        TaskAttachment.deleted_at == None
    ).all()


def get_attachments_by_task(db: Session, task_id: int):
    return db.query(TaskAttachment).filter(
        TaskAttachment.task_id == task_id,
        TaskAttachment.deleted_at == None
    ).all()

def update_attachment(db: Session, attachment_id: int, data):

    file = db.query(TaskAttachment).filter(
        TaskAttachment.id == attachment_id,
        TaskAttachment.deleted_at == None
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="Attachment not found")

    update_data = data.dict(exclude_unset=True)

    if "task_id" in update_data:
        task = db.query(Task).filter(Task.id == update_data["task_id"]).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
    if "uploaded_by" in update_data:
        user = db.query(Users).filter(Users.id == update_data["uploaded_by"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    for key, value in update_data.items():
        setattr(file, key, value)

    file.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(file)

    return file


def delete_attachment(db: Session, attachment_id: int):
    file = db.query(TaskAttachment).filter(
        TaskAttachment.id == attachment_id,
        TaskAttachment.deleted_at == None
    ).first()

    if not file:
        return None

    file.deleted_at = datetime.utcnow()

    db.commit()

    return file