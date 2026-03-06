from datetime import datetime, timezone,timedelta
from sqlalchemy.orm import Session
from models.Otp import OTP
from utils.otp import generate_otp
from models.Users import Users

def verify_otp(db: Session, email: str, otp: str):
    record = db.query(OTP).filter(OTP.email == email).first()
    if not record:
        return False
    current_time = datetime.now(timezone.utc)
    expires_at_aware = record.expires_at.replace(tzinfo=timezone.utc) if record.expires_at.tzinfo is None else record.expires_at

    if current_time > expires_at_aware:
        db.delete(record)
        db.commit()
        return False
        
    if record.otp_code != otp:
        return False
        
    record.is_verified = True
    db.commit()
    return True


def is_email_verified(db: Session, email: str) -> bool:
    record = db.query(OTP).filter(
        OTP.email == email,
        OTP.is_verified == True
    ).first()

    return record is not None

def _replace_otp(db: Session, user: Users) -> str:
    db.query(OTP).filter(OTP.email == user.email).delete()
    code = generate_otp()
    db.add(OTP(
        user_id     = user.id,
        email       = user.email,
        otp_code    = code,
        is_verified = False,
        expires_at  = datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    db.commit()
    return code

def _expire_old_otps(db: Session, email: str) -> None:
    db.query(OTP).filter(
        OTP.email       == email,
        OTP.deleted_at.is_(None),
        OTP.is_verified == False,
    ).update(
        {"deleted_at": datetime.now(timezone.utc)},
    )
def _issue_otp(db: Session, user: Users) -> str:
    _expire_old_otps(db, user.email)
    code = generate_otp()
    db.add(OTP(
        user_id     = user.id,
        email       = user.email,
        otp_code    = code,
        is_verified = False,
        expires_at  = datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    return code