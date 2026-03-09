import os
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models.Otp import OTP
from models.Users import Users

load_dotenv()


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def send_otp_email(to_email: str, otp: str):
    """Send OTP to user's email using SMTP."""
    host     = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port     = int(os.getenv("EMAIL_PORT", 587))
    user     = os.getenv("SMTP_EMAIL", "")
    password = os.getenv("SMTP_PASSWORD", "")

    if not user or not password:
        raise HTTPException(
            status_code=500,
            detail="Email service is not configured. Please contact support."
        )

    body = f"""
Hi there,

Your verification code is:

    {otp}

This code expires in 10 minutes. Do not share it with anyone.

— Thank you
"""

    msg = MIMEText(body)
    msg["Subject"] = "Your OTP Verification Code"
    msg["From"]    = user
    msg["To"]      = to_email

    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(user, to_email, msg.as_string())
    except Exception as e:
        print(f"Email sending failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP email.")


def save_otp(db: Session, email: str, otp: str, user_id: Optional[int] = None):
    if user_id is None:
        user = db.query(Users).filter(Users.email == email).first()
        if user:
            user_id = user.id

    db.query(OTP).filter(OTP.email == email).delete()
    new_record = OTP(
        user_id     = user_id,
        email       = email,
        otp_code    = otp,
        expires_at  = datetime.now(timezone.utc) + timedelta(minutes=10),
        is_verified = False,
    )
    db.add(new_record)
    db.commit()