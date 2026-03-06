from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.ProjectMemberSchema import ProjectMemberCreate, ProjectMemberUpdate
from services.projectMember_services import *
from middleware.auth import get_current_user
from models.Users import Users

router = APIRouter(prefix="/project-members", tags=["Project Members"])


@router.post("/")
def add(
    data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    member = add_member(db, data.project_id, data.user_id)
    return member.to_dict()



@router.get("/")
def get_all(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    members = get_all_members(db)
    return [m.to_dict() for m in members]



@router.get("/project/{project_id}")
def get_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    members = get_project_members(db, project_id)
    return [m.to_dict() for m in members]



@router.put("/{member_id}")
def update(
    member_id: int,
    data: ProjectMemberUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    member = update_member(db, member_id, data)
    return member.to_dict()



@router.delete("/{member_id}")
def delete(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    member = remove_member(db, member_id)

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    return {"message": "Member removed"}