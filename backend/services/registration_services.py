from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.RegistrationSchema import RegisterSchema
from models.Users import Users
from utils.hashing import hash_password
from services.otp_services import _issue_otp
from utils.otp import send_otp_email
from sqlalchemy.exc import SQLAlchemyError


def register_user_service(db: Session, data: RegisterSchema):
    if db.query(Users).filter(Users.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")
    if db.query(Users).filter(Users.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    try:
        user = Users(
            username    = data.username,
            email       = data.email,
            password_hash   = hash_password(data.password),
            status      = True,
        )
        db.add(user)
        db.flush()          
        db.commit()
        db.refresh(user)
        db.flush()          
        code =_issue_otp(db, user)
        db.commit()
        db.refresh(user)

        try:
            send_otp_email(user.email, code)
        except Exception as e:
            print("Email send error (non-fatal):", e)

        return {
            "message": "Account created. A 6-digit OTP has been sent to your email. "
                       "Please verify to activate your account.",
            "email": user.email,
        }

    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        print("DB error during registration:", e)
        raise HTTPException(status_code=500, detail="Database error during registration.")


