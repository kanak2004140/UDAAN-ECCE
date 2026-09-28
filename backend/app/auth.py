from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db, settings
from app.models.user import User

SECRET_KEY = settings.AUTH_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(days=7)
bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: UUID) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + ACCESS_TOKEN_EXPIRE,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = UUID(str(payload.get("sub")))
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from None

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user
