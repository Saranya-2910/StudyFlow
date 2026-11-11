from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.user import User, UserPreferences
from app.schemas.user import UserCreate, UserLogin, Token, UserOut

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> Token:
        # Check if email is already registered
        existing = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        # Create user
        hashed_password = get_password_hash(user_in.password)
        user = User(
            name=user_in.name.strip(),
            email=user_in.email.lower().strip(),
            password_hash=hashed_password,
            timezone=user_in.timezone or "UTC",
        )
        db.add(user)
        db.flush()

        # Create default preferences
        preferences = UserPreferences(
            user_id=user.id,
            theme="system",
            daily_goal_minutes=120,
            default_focus_duration=25,
            default_break_duration=5,
            sound_enabled=True,
            notifications_enabled=True,
        )
        db.add(preferences)
        db.commit()
        db.refresh(user)

        # Generate access token
        access_token = create_access_token(subject=user.id)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserOut.model_validate(user),
        )

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> Token:
        user = db.query(User).filter(User.email == credentials.email.lower().strip()).first()
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(subject=user.id)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserOut.model_validate(user),
        )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that authenticates the Bearer token and returns the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if not user_id:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception

    return user
