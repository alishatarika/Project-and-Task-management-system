from sqlalchemy.orm import Session
from models.TaskComments import TaskComment
from datetime import datetime, timezone
from models.Tasks import Task
from models.Users import Users
from models.Project import Project
from models.ProjectMembers import ProjectMember
from fastapi import HTTPException


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


def _get_active_user(db: Session, user_id: int) -> Users:
    user = db.query(Users).filter(
        Users.id == user_id,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or inactive")
    return user


def _get_active_task(db: Session, task_id: int) -> Task:
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.deleted_at == None
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _can_manage_comment(
    db: Session,
    comment: TaskComment,
    requesting_user_id: int
) -> bool:

    if comment.user_id == requesting_user_id:
        return True

    task = db.query(Task).filter(Task.id == comment.task_id).first()
    if not task:
        return False
    if task.assigned_by == requesting_user_id:
        return True
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if project and project.owner_id == requesting_user_id:
        return True

    return False


def add_comment(db: Session, task_id: int, user_id: int, comment: str) -> TaskComment:
    task = _get_active_task(db, task_id)
    _get_active_user(db, user_id)

    if not _is_project_member_or_owner(db, task.project_id, user_id):
        raise HTTPException(status_code=403, detail="Only project members or owner can comment on tasks")

    new_comment = TaskComment(
        task_id=task_id,
        user_id=user_id,
        comment=comment,
        status=True,
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


def get_comments(db: Session, task_id: int) -> list[TaskComment]:
    return (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id, TaskComment.deleted_at == None)
        .order_by(TaskComment.created_at.asc())
        .all()
    )


def get_all_comments(db: Session) -> list[TaskComment]:
    return (
        db.query(TaskComment)
        .filter(TaskComment.deleted_at == None)
        .order_by(TaskComment.created_at.asc())
        .all()
    )


def update_comment(
    db: Session,
    comment_id: int,
    new_text: str,
    requesting_user_id: int,
) -> TaskComment:
    comment = (
        db.query(TaskComment)
        .filter(TaskComment.id == comment_id, TaskComment.deleted_at == None)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if not _can_manage_comment(db, comment, requesting_user_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to edit this comment"
        )

    comment.comment    = new_text
    comment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(
    db: Session,
    comment_id: int,
    requesting_user_id: int,
) -> TaskComment | None:
    comment = (
        db.query(TaskComment)
        .filter(TaskComment.id == comment_id, TaskComment.deleted_at == None)
        .first()
    )
    if not comment:
        return None

    if not _can_manage_comment(db, comment, requesting_user_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this comment"
        )

    comment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return comment