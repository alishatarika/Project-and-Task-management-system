from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.Task_Comment import TaskCommentCreate, TaskCommentUpdate
from services.taskcomment_services import *
from middleware.auth import get_current_user
from models.Users import Users

router = APIRouter(prefix="/task-comments", tags=["Task Comments"])


@router.post("/")
def create(
    data: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    comment = add_comment(
        db,
        data.task_id,
        data.user_id,
        data.comment
    )

    return comment.to_dict()



@router.get("/")
def get_all(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    comments = get_all_comments(db)

    return [c.to_dict() for c in comments]


@router.get("/task/{task_id}")
def get(task_id: int, db: Session = Depends(get_db),
        current_user: Users = Depends(get_current_user)):

    comments = get_comments(db, task_id)

    return [c.to_dict() for c in comments]


@router.put("/{comment_id}")
def update(
    comment_id: int,
    data: TaskCommentUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    comment = update_comment(db, comment_id, data.comment)

    return comment.to_dict()


@router.delete("/{comment_id}")
def delete(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    comment = delete_comment(db, comment_id)

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    return {"message": "Comment deleted"}