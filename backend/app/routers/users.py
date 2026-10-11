from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash

from app import login_throttle
from app.auth import create_access_token, get_current_user
from app.age_groups import age_group_for_date_of_birth, calculate_age
from app.database import get_db
from app.models.user import User
from app.schemas.user import AuthResponse, UserCreate, UserLogin, UserResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

# Checked against when an email isn't registered, so "no such user" takes as
# long as "wrong password" and the response time doesn't reveal which emails exist.
_DUMMY_PASSWORD_HASH = generate_password_hash("no-account-with-this-email")


def _client_address(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def user_response(user: User) -> UserResponse:
    age = calculate_age(user.date_of_birth) if user.date_of_birth else None
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        date_of_birth=user.date_of_birth,
        age=age,
        age_group=age_group_for_date_of_birth(user.date_of_birth),
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    data: UserCreate,
    db: Session = Depends(get_db),
):
    if data.date_of_birth is not None and data.date_of_birth > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date of birth cannot be in the future",
        )
    if data.role == "child" and age_group_for_date_of_birth(data.date_of_birth) is None:
        # Covers a missing birthday too: a child account needs one to get the right lessons.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A child must be between 2 and 8 years old",
        )

    existing = (
        db.query(User)
        .filter(User.email == data.email.lower())
        .first()
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    user = User(
        name=data.name,
        email=data.email.lower(),
        password_hash=generate_password_hash(data.password),
        date_of_birth=data.date_of_birth,
        role=data.role,
        is_active=True,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Two sign-ups with the same email at the same moment: the unique index
        # lets only one through.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        ) from None
    db.refresh(user)

    return AuthResponse(access_token=create_access_token(user.id), user=user_response(user))


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login_user(
    data: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    email = data.email.lower()
    client = _client_address(request)

    wait = login_throttle.seconds_until_allowed(email, client)
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many tries. Please wait {max(1, round(wait / 60))} minute(s) and try again.",
            headers={"Retry-After": str(wait)},
        )

    user = db.query(User).filter(User.email == email).first()
    password_ok = check_password_hash(user.password_hash if user else _DUMMY_PASSWORD_HASH, data.password)

    if user is None or not password_ok:
        login_throttle.record_failure(email, client)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    login_throttle.clear(email, client)
    return AuthResponse(access_token=create_access_token(user.id), user=user_response(user))


# Declared before "/{user_id}" so "me" isn't parsed as a user id.
@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(current_user: User = Depends(get_current_user)):
    """The signed-in user, read fresh from the database. The browser calls this
    to check that a saved session is still good (account exists, still active,
    token not expired) instead of trusting what it stored."""
    return user_response(current_user)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only allow a user to fetch their own profile. Don't reveal whether a
    # different user_id exists, to avoid leaking other users' PII.
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user_response(current_user)
