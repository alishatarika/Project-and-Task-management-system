from pydantic import BaseModel


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyForgotOtpRequest(BaseModel):
    email: str
    otp:   str


class ResetPasswordRequest(BaseModel):
    email:            str
    new_password:     str
    confirm_password: str