from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.Roles import RoleCreate, RoleUpdate
from services import roles_services
from middleware.auth import get_current_user
from models.Users import Users


router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/")
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    role = roles_services.create_role(db, data.name, data.status)

    return {"message": "Role created", "data": role.to_dict()}



@router.get("/")
def get_roles(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    roles = roles_services.get_roles(db)

    return [r.to_dict() for r in roles]



@router.put("/{role_id}")
def update_role(
    role_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    role = roles_services.get_role(db, role_id)

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    updated_role = roles_services.update_role(db, role, data.dict(exclude_unset=True))

    return {"message": "Role updated", "data": updated_role.to_dict()}


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    role = roles_services.get_role(db, role_id)

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    roles_services.delete_role(db, role)

    return {"message": "Role deleted"}