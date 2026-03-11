from sqlalchemy.orm import Session
from models.ProjectMembers import ProjectMember
from datetime import datetime, timezone
from models.Users import Users
from models.Project import Project
from fastapi import HTTPException
from services.notification_services import create_notification


def add_member(db: Session, project_id: int, user_id: int, current_user: Users):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project creator can add members")

    user = db.query(Users).filter(
        Users.id == user_id,
        Users.is_verified == True,
        Users.status == True,
        Users.deleted_at == None
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or inactive")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
        ProjectMember.deleted_at == None
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this project")

    member = ProjectMember(project_id=project_id, user_id=user_id, status=True)
    db.add(member)
    db.commit()
    db.refresh(member)

    if user.id != current_user.id:
        create_notification(db, user_id=user.id, send_by=current_user.id, message=f'You have been added to project "{project.name}" by {current_user.username}.')

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


def update_member(db: Session, member_id: int, data, current_user: Users):
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.deleted_at == None
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    project = db.query(Project).filter(Project.id == member.project_id).first()
    project_name = project.name if project else "a project"

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project creator can update members")

    old_user_id = member.user_id

    for key, value in data.dict(exclude_unset=True).items():
        setattr(member, key, value)

    member.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(member)

    if old_user_id != current_user.id:
        create_notification(db, user_id=old_user_id, send_by=current_user.id, message=f'Your membership in project "{project_name}" has been updated by {current_user.username}.')

    return member


def remove_member(db: Session, member_id: int, current_user: Users):
    member = db.query(ProjectMember).filter(
        ProjectMember.id == member_id,
        ProjectMember.deleted_at == None
    ).first()

    if not member:
        return None

    project = db.query(Project).filter(Project.id == member.project_id).first()
    project_name = project.name if project else "a project"

    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project creator can remove members")

    removed_user_id = member.user_id

    member.deleted_at = datetime.now(timezone.utc)
    db.commit()

    if removed_user_id != current_user.id:
        create_notification(db, user_id=removed_user_id, send_by=current_user.id, message=f'You have been removed from project "{project_name}" by {current_user.username}.')

    return member 