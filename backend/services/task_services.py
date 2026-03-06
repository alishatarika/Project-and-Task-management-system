from sqlalchemy.orm import Session
from models.Tasks import Task
from datetime import datetime
from models.Project import Project
from models.Users import Users
from fastapi import HTTPException


def create_task(db: Session, data):

    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    creator = db.query(Users).filter(Users.id == data.created_by).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    assigner = db.query(Users).filter(Users.id == data.created_by).first()
    if not assigner:
        raise HTTPException(status_code=404, detail="Assigner not found")

    if data.assigned_to:
        assignee = db.query(Users).filter(Users.id == data.assigned_to).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assigned user not found")

    task = Task(
        title=data.title,
        description=data.description,
        project_id=data.project_id,
        created_by=data.created_by,
        assigned_to=data.assigned_to,
        task_status=data.task_status,
        priority=data.priority,
        due_date=data.due_date
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


def get_tasks(db: Session):
    return db.query(Task).filter(Task.deleted_at == None).all()


def get_task(db: Session, task_id: int):
    return db.query(Task).filter(
        Task.id == task_id,
        Task.deleted_at == None
    ).first()


def update_task(db: Session, task_id: int, data):
    task = get_task(db, task_id)

    if not task:
        return None

    for key, value in data.dict(exclude_unset=True).items():
        setattr(task, key, value)

    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)

    return task


def delete_task(db: Session, task_id: int):
    task = get_task(db, task_id)

    if not task:
        return None

    task.deleted_at = datetime.utcnow()

    db.commit()

    return task