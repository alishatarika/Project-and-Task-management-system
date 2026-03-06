from sqlalchemy.orm import Session
from models.Roles import Role
from datetime import datetime
from fastapi import HTTPException


def create_role(db: Session, name: str, status: bool):

    role = db.query(Role).filter(Role.name == name).first()

    if role:
        if role.deleted_at is None:
            raise HTTPException(status_code=400, detail="Role already exists")

        # restore soft deleted role
        role.deleted_at = None
        role.status = status
        role.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(role)
        return role

    role = Role(name=name, status=status)

    db.add(role)
    db.commit()
    db.refresh(role)

    return role


def get_roles(db: Session):
    return db.query(Role).filter(Role.deleted_at == None).all()


def get_role(db: Session, role_id: int):
    return db.query(Role).filter(
        Role.id == role_id,
        Role.deleted_at == None
    ).first()


def update_role(db: Session, role, data):

    if "name" in data:
        existing_role = db.query(Role).filter(
            Role.name == data["name"],
            Role.id != role.id,
            Role.deleted_at == None
        ).first()

        if existing_role:
            raise HTTPException(status_code=400, detail="Role name already exists")

    for key, value in data.items():
        setattr(role, key, value)

    role.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(role)

    return role


def delete_role(db: Session, role: Role):

    role.deleted_at = datetime.utcnow()

    db.commit()
    db.refresh(role)

    return role