from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.Task_Comment import TaskCommentCreate, TaskCommentUpdate
from services.taskcomment_services import (
    add_comment,
    get_all_comments,
    get_comments,
    update_comment,
    delete_comment,
)
from middleware.auth import get_current_user
from models.Users import Users

router = APIRouter(prefix="/task-comments", tags=["Task Comments"])


@router.post("/")
def create(
    data: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    comment = add_comment(db, data.task_id, data.user_id, data.comment)
    return comment.to_dict()


@router.get("/")
def get_all(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return [c.to_dict() for c in get_all_comments(db)]


@router.get("/task/{task_id}")
def get(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return [c.to_dict() for c in get_comments(db, task_id)]


@router.put("/{comment_id}")
def update(
    comment_id: int,
    data: TaskCommentUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    
    comment = update_comment(
        db,
        comment_id=comment_id,
        new_text=data.comment,
        requesting_user_id=current_user.id,   
    )
    return comment.to_dict()


@router.delete("/{comment_id}")
def delete(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    comment = delete_comment(
        db,
        comment_id=comment_id,
        requesting_user_id=current_user.id,   
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted"}