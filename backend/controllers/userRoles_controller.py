from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from services import userRole_services
from middleware.auth import get_current_user
from models.Users import Users

router = APIRouter(prefix="/user-roles", tags=["User Roles"])

@router.get("/")
def get_all_user_roles(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    roles = userRole_services.get_all_user_roles(db)

    return [r.to_dict() for r in roles]



@router.post("/")
def assign_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    user_role = userRole_services.assign_role(db, user_id, role_id)

    return {
        "message": "Role assigned successfully",
        "data": user_role.to_dict()
    }
    
    

@router.get("/user/{user_id}")
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    roles = userRole_services.get_user_roles(db, user_id)

    return [r.to_dict() for r in roles]


@router.put("/{id}")
def update_user_role(
    id: int,
    role_id: int = None,
    status: bool = None,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    user_role = userRole_services.get_user_role(db, id)

    if not user_role:
        raise HTTPException(status_code=404, detail="User role not found")

    update_data = {}

    if role_id is not None:
        update_data["role_id"] = role_id

    if status is not None:
        update_data["status"] = status

    updated_user_role = userRole_services.update_user_role(db, user_role, update_data)

    return {
        "message": "User role updated successfully",
        "data": updated_user_role.to_dict()
    }


@router.delete("/{id}")
def delete_user_role(
    id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):

    user_role = userRole_services.get_user_role(db, id)

    if not user_role:
        raise HTTPException(status_code=404, detail="User role not found")

    userRole_services.delete_user_role(db, user_role)

    return {"message": "Role removed"}