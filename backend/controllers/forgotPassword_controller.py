import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.connection import get_db
from models.Users import Users
from models.Otp import OTP
from utils.otp import generate_otp, send_otp_email
from utils.hashing import hash_password
from schemas.ForgotPasswordSchema import ForgotPasswordRequest, VerifyForgotOtpRequest, ResetPasswordRequest
from datetime import datetime, timedelta, timezone
from services.otp_services import _replace_otp

router = APIRouter(prefix="/auth", tags=["Auth"])


def validate_password(password: str):
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Minimum 6 characters required.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Must contain a lowercase letter.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Must contain an uppercase letter.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Must contain a number.")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise HTTPException(status_code=400, detail="Must contain a special character.")


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    user = db.query(Users).filter(func.lower(Users.email) == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")
    code = _replace_otp(db, user)     
    try:
        send_otp_email(user.email, code)
    except Exception as e:
        print("Email send error (non-fatal):", e)

    return {"message": "OTP sent successfully."}



@router.post("/verify-forgot-otp")
def verify_forgot_otp(data: VerifyForgotOtpRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    record = db.query(OTP).filter(
        OTP.email       == email,
        OTP.is_verified == False,
    ).order_by(OTP.created_at.desc()).first()

    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if record.otp_code != data.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    record.is_verified = True
    db.commit()
    return {"message": "OTP verified successfully."}

@router.post("/resend-forgot-otp")
def resend_forgot_otp(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    user = db.query(Users).filter(func.lower(Users.email) == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")
    code = _replace_otp(db, user)

    try:
        send_otp_email(user.email, code)
    except Exception as e:
        print("Email send error (non-fatal):", e)

    return {"message": "OTP resent successfully."}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    validate_password(data.new_password)

    verified_record = db.query(OTP).filter(
        OTP.email       == email,
        OTP.is_verified == True,
    ).first()
    if not verified_record:
        raise HTTPException(status_code=400, detail="OTP not verified. Please complete verification first.")

    user = db.query(Users).filter(func.lower(Users.email) == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(data.new_password)  
    user.updated_at = datetime.now(timezone.utc)
    db.query(OTP).filter(OTP.email == email).delete()
    db.commit()

    return {"message": "Password reset successful."}