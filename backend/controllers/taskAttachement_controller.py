import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database.connection import get_db
from services.taskattachments_services import (
    get_all_attachments, get_attachments_by_task,
    update_attachment, delete_attachment
)
from middleware.auth import get_current_user
from models.Users import Users
from models.Tasks import Task
from models.Project import Project
from models.ProjectMembers import ProjectMember
from models.TaskAttachements import TaskAttachment
from datetime import datetime, timezone

router = APIRouter(prefix="/task-attachments", tags=["Task Attachments"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "gif", "webp", "svg",
    "pdf", "doc", "docx", "xls", "xlsx", "csv",
    "txt", "zip", "rar", "7z", "mp4", "mp3",
}
MAX_SIZE = 10 * 1024 * 1024


def _is_project_member_or_owner(db: Session, project_id: int, user_id: int) -> bool:
    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at == None).first()
    if project and project.owner_id == user_id:
        return True
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
        ProjectMember.deleted_at == None
    ).first()
    return member is not None


@router.post("/upload")
async def upload(
    task_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.deleted_at == None).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not _is_project_member_or_owner(db, task.project_id, current_user.id):
        raise HTTPException(status_code=403, detail="Only project members or owner can upload attachments")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '.{ext}' not allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(save_path, "wb") as f:
        f.write(contents)

    file_url = f"/uploads/{unique_name}"

    attachment = TaskAttachment(
        task_id=task_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_path=file_url,
        status=True,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment.to_dict()


@router.get("/")
def get_all(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    files = get_all_attachments(db)
    return [f.to_dict() for f in files]


@router.get("/task/{task_id}")
def get_by_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    files = get_attachments_by_task(db, task_id)
    return [f.to_dict() for f in files]


@router.delete("/{attachment_id}")
def delete(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    attachment = db.query(TaskAttachment).filter(
        TaskAttachment.id == attachment_id,
        TaskAttachment.deleted_at == None,
    ).first()

    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    task = db.query(Task).filter(Task.id == attachment.task_id).first()
    if task and not _is_project_member_or_owner(db, task.project_id, current_user.id):
        raise HTTPException(status_code=403, detail="Only project members or owner can delete attachments")

    if attachment.file_path:
        file_on_disk = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..",
            attachment.file_path.lstrip("/")
        )
        if os.path.exists(file_on_disk):
            os.remove(file_on_disk)

    attachment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Attachment deleted"}