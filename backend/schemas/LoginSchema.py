from pydantic import BaseModel

class LoginSchema(BaseModel):
    identifier: str
    password:   str
    remember:   bool = False