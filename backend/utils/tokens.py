import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from jwt.exceptions import InvalidTokenError

ALGORITHM = "HS256"

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def issue_token(subject: str, token_type: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("TOKEN_EXPIRY_TIME", "60")))
    payload = {"sub": subject, "typ": token_type, "exp": expires}
    return jwt.encode(payload, os.environ["JWT_SECRET_KEY"], algorithm=ALGORITHM)


def read_token(token: str, expected_type: str) -> str:
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET_KEY"], algorithms=[ALGORITHM])
    except InvalidTokenError:
        raise CREDENTIALS_EXCEPTION from None
    subject = payload.get("sub")
    if payload.get("typ") != expected_type or not subject:
        raise CREDENTIALS_EXCEPTION
    return subject
