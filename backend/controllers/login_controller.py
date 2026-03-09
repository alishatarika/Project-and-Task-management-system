from fastapi import APIRouter, Depends, HTTPException, status, Response
from schemas.LoginSchema import LoginSchema
from utils.jwthandler import create_access_token
from sqlalchemy.orm import Session
from database.connection import get_db
from services.login_services import authenticate_user
from middleware.auth import get_current_user
from models.Users import Users
from utils.otp import send_otp_email
from services.otp_services import _issue_otp
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):

    if not data.identifier or not data.identifier.strip():
        raise HTTPException(
            status_code=422,
            detail="Username or email is required"
        )

    if not data.password or len(data.password) < 6:
        raise HTTPException(
            status_code=422,
            detail="Password must be at least 6 characters"
        )

    user = authenticate_user(db, data.identifier.strip(), data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    if not user.is_verified:
        try:
            code = _issue_otp(db, user)
            send_otp_email(user.email, code)
        except Exception as e:
            logger.error(f"[OTP EMAIL ERROR] Failed to send OTP to {user.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "Please verify your email. If you didn't receive an OTP, use the resend option.",
                    "email": user.email,
                    "code": "USER_NOT_VERIFIED",
                },
            )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Please verify your email before logging in",
                "email": user.email,
                "code": "USER_NOT_VERIFIED",
            },
        )

    if not user.status:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated",
        )

    token = create_access_token(
        {"user_id": user.id},
        remember=data.remember
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@router.post("/logout")
def logout(
    response: Response,
    current_user: Users = Depends(get_current_user)
):
    response.delete_cookie(key="access_token")

    return {
        "message": "Logged out successfully"
    }