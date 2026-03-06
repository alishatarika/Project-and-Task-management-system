from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.ProjectSchema import ProjectCreate, ProjectUpdate
from services.project_services import *
from middleware.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/")
def create(data: ProjectCreate, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    project = create_project(db, data)
    return project.to_dict()


@router.get("/")
def get_all(db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    projects = get_projects(db)
    return [p.to_dict() for p in projects]


@router.get("/{project_id}")
def get(project_id: int, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    project = get_project(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project.to_dict()


@router.put("/{project_id}")
def update(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    project = update_project(db, project_id, data)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project.to_dict()


@router.delete("/{project_id}")
def delete(project_id: int, db: Session = Depends(get_db),current_user: Users = Depends(get_current_user)):
    project = delete_project(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {"message": "Project deleted"}