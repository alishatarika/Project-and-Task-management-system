from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from database.connection import get_db
from models.Users import Users
from models.Otp import OTP
from schemas.OtpSchema import OtpVerifyRequest, OtpResendRequest
from utils.jwthandler import create_access_token
from utils.otp import send_otp_email
from services.otp_services import _replace_otp


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/verify-otp")
def verify_otp_endpoint(data: OtpVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    record = db.query(OTP).filter(
        OTP.email       == data.email,
        OTP.is_verified == False,
    ).order_by(OTP.created_at.desc()).first()

    if not record:
        if user.is_verified:
            token = create_access_token({"user_id": user.id})
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Email already verified.",
                    "access_token": token,
                    "user": user.to_dict(),
                },
            )
        raise HTTPException(
            status_code=400,
            detail="No active OTP found. Please request a new one.",
        )

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if record.otp_code != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    user.status      = True
    user.is_verified = True
    db.delete(record)
    db.commit()

    token = create_access_token({"user_id": user.id})
    return JSONResponse(
        status_code=200,
        content={
            "message": "Email verified successfully.",
            "access_token": token,
            "user": user.to_dict(),
        },
    )


@router.post("/resend-otp")
def resend_otp(data: OtpResendRequest, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="This email is already verified.")
    code = _replace_otp(db, user)
    try:
        send_otp_email(user.email, code)
    except Exception as e:
        print("Email send error (non-fatal):", e)

    return {"message": "A new OTP has been sent to your email."}