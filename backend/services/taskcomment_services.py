from sqlalchemy.orm import Session
from models.TaskComments import TaskComment
from datetime import datetime, timezone
from models.Tasks import Task
from models.Users import Users
from fastapi import HTTPException


def add_comment(db: Session, task_id: int, user_id: int, comment: str):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.deleted_at == None
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    user = db.query(Users).filter(
        Users.id == user_id,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or inactive")

    new_comment = TaskComment(
        task_id=task_id,
        user_id=user_id,
        comment=comment,
        status=True
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


def get_comments(db: Session, task_id: int):
    return db.query(TaskComment).filter(
        TaskComment.task_id == task_id,
        TaskComment.deleted_at == None
    ).all()


def get_all_comments(db: Session):
    return db.query(TaskComment).filter(
        TaskComment.deleted_at == None
    ).all()


def update_comment(db: Session, comment_id: int, comment: str):
    existing_comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.deleted_at == None
    ).first()

    if not existing_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing_comment.comment = comment
    existing_comment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(existing_comment)
    return existing_comment


def delete_comment(db: Session, comment_id: int):
    comment = db.query(TaskComment).filter(
        TaskComment.id == comment_id,
        TaskComment.deleted_at == None
    ).first()

    if not comment:
        return None

    comment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return comment