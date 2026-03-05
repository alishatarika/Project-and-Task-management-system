from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    email = Column(String(150), nullable=False, index=True)
    otp_code = Column(String(10), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    expires_at = Column(DateTime(timezone=True), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("Users", back_populates="otps")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "is_verified": self.is_verified,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }