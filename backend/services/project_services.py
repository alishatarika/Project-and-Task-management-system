from sqlalchemy.orm import Session
from models.Project import Project
from datetime import datetime, timezone
from models.Users import Users
from fastapi import HTTPException


def create_project(db: Session, data):
    user = db.query(Users).filter(
        Users.id == data.owner_id,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Owner user not found or inactive")

    project = Project(
        name=data.name,
        description=data.description,
        owner_id=data.owner_id
    )

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_projects(db: Session):
    return db.query(Project).filter(Project.deleted_at == None).all()


def get_project(db: Session, project_id: int):
    return db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()


def update_project(db: Session, project_id: int, data):
    project = get_project(db, project_id)

    if not project:
        return None

    for key, value in data.dict(exclude_unset=True).items():
        setattr(project, key, value)

    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int):
    project = get_project(db, project_id)

    if not project:
        return None

    project.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return project