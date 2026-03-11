from sqlalchemy.orm import Session
from models.Project import Project
from datetime import datetime, timezone
from models.Users import Users
from fastapi import HTTPException
from sqlalchemy import func


def create_project(db: Session, data, current_user: Users):
    user = db.query(Users).filter(
        Users.id == data.owner_id,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Owner user not found or inactive"
        )
    existing_project = db.query(Project).filter(
        Project.name == data.name,
        Project.deleted_at == None
    ).first()

    if existing_project:
        raise HTTPException(
            status_code=400,
            detail="Project with this name already exists"
        )

    project = Project(
        name=data.name,
        description=data.description,
        owner_id=current_user.id
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def get_projects(db: Session):
    return db.query(Project)\
        .filter(Project.deleted_at == None)\
        .order_by(Project.created_at.desc())\
        .all()

def get_project(db: Session, project_id: int):
    return db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()


def update_project(db: Session, project_id: int, data, current_user: Users):

    project = get_project(db, project_id)

    if not project:
        return None

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project creator can update this project")

    if data.name:

        existing_project = db.query(Project).filter(
            func.lower(Project.name) == data.name.lower(),
            Project.id != project_id,
            Project.deleted_at == None
        ).first()

        if existing_project:
            raise HTTPException(
                status_code=400,
                detail="Project with this name already exists"
            )
    for key, value in data.dict(exclude_unset=True).items():
        setattr(project, key, value)

    project.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(project)

    return project


def delete_project(db: Session, project_id: int, current_user: Users):
    project = get_project(db, project_id)

    if not project:
        return None

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project creator can delete this project")

    project.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return project