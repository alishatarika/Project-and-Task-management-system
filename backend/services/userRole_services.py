from sqlalchemy.orm import Session
from models.UserRoles import UserRole
from models.Roles import Role
from fastapi import HTTPException
from datetime import datetime


def assign_role(db: Session, user_id: int, role_id: int):

    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    existing = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id,
        UserRole.deleted_at == None
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Role already assigned")

    user_role = UserRole(
        user_id=user_id,
        role_id=role_id
    )

    db.add(user_role)
    db.commit()
    db.refresh(user_role)

    return user_role

def get_all_user_roles(db: Session):

    return db.query(UserRole).filter(
        UserRole.deleted_at == None
    ).all()


def get_user_role(db: Session, id: int):

    return db.query(UserRole).filter(
        UserRole.id == id,
        UserRole.deleted_at == None
    ).first()
    


def get_user_roles(db: Session, user_id: int):

    return db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.deleted_at == None
    ).all()


def update_user_role(db: Session, user_role: UserRole, data: dict):

    for key, value in data.items():
        setattr(user_role, key, value)

    user_role.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user_role)

    return user_role



def delete_user_role(db: Session, user_role: UserRole):

    user_role.deleted_at = datetime.utcnow()

    db.commit()
    db.refresh(user_role)

    return user_role