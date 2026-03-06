from sqlalchemy.orm import Session
from models.ProjectMembers import ProjectMember
from datetime import datetime
from models.Users import Users
from models.Project import Project
from fastapi import HTTPException


def add_member(db: Session, project_id: int, user_id: int):

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    member = ProjectMember(
        project_id=project_id,
        user_id=user_id,
        status=True
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return member


def get_project_members(db: Session, project_id: int):
    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.deleted_at == None
    ).all()


def get_all_members(db: Session):
    return db.query(ProjectMember).filter(
        ProjectMember.deleted_at == None
    ).all()


def update_member(db: Session, member_id: int, data):
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.deleted_at == None
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(member, key, value)

    member.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(member)

    return member


def remove_member(db: Session, member_id: int):
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.deleted_at == None
    ).first()

    if not member:
        return None

    member.deleted_at = datetime.utcnow()

    db.commit()

    return member