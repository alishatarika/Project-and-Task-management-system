from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.Task import TaskCreate, TaskUpdate
from services.task_services import create_task, get_tasks, get_task, update_task, delete_task
from middleware.auth import get_current_user
from models.Users import Users

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("/")
def create(data: TaskCreate, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    task = create_task(db, data, current_user)
    return task.to_dict()


@router.get("/")
def get_all(db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    tasks = get_tasks(db)
    return [t.to_dict() for t in tasks]


@router.get("/{task_id}")
def get(task_id: int, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    task = get_task(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task.to_dict()


@router.put("/{task_id}")
def update(task_id: int, data: TaskUpdate, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    task = update_task(db, task_id, data, current_user)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task.to_dict()


@router.delete("/{task_id}")
def delete(task_id: int, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    task = delete_task(db, task_id, current_user)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted"}