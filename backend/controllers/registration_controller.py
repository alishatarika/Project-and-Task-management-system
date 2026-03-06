from schemas.RegistrationSchema import RegisterSchema
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from services.registration_services import register_user_service
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", status_code=201)
def register(user_data: RegisterSchema, db: Session = Depends(get_db)):
    result = register_user_service(db, user_data)
    return result