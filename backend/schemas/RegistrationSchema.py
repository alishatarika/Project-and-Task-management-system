from pydantic import BaseModel, validator
import re


class RegisterSchema(BaseModel):
    username:         str
    email:            str
    password:         str
    confirm_password: str

    @validator("username")
    def username_valid(cls, v):
        v = v.strip()
        if not v:                                raise ValueError("Username cannot be empty")
        if len(v) < 3:                           raise ValueError("Username must be at least 3 characters")
        if len(v) > 20:                          raise ValueError("Username must not exceed 20 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v): raise ValueError("Username can only contain letters, numbers, underscores")
        return v

    @validator("email")
    def email_valid(cls, v):
        v = v.lower().strip()
        if not v:
            raise ValueError("Email cannot be empty")
        if "@" not in v:
            raise ValueError("Invalid email format")
        if ".." in v:
            raise ValueError("Email cannot contain consecutive dots")
        local, _ = v.split("@", 1)
        if local.startswith(".") or local.endswith("."):
            raise ValueError("Email local part cannot start/end with dot")
        return v

    @validator("password")
    def password_strength(cls, v):
        if not v:                                        raise ValueError("Password cannot be empty")
        if len(v) < 6:                                   raise ValueError("Password must be at least 6 characters")
        if not re.search(r"[a-z]", v):                  raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"[A-Z]", v):                  raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"\d", v):                      raise ValueError("Password must contain a number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v): raise ValueError("Password must contain a special character")
        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if not v:
            raise ValueError("Confirm Password cannot be empty")
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v