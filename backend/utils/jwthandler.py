from datetime import datetime, timedelta
from jose import jwt, JWTError
from utils.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

REMEMBER_TOKEN_EXPIRE_MINUTES = 60 * 24 


def create_access_token(data: dict, remember: bool = False):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=REMEMBER_TOKEN_EXPIRE_MINUTES if remember else ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt