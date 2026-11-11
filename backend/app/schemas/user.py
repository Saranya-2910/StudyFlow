from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Preferences Schemas
class UserPreferencesBase(BaseModel):
    theme: str = "system"
    daily_goal_minutes: int = Field(default=120, ge=1, le=1440)
    default_focus_duration: int = Field(default=25, ge=1, le=240)
    default_break_duration: int = Field(default=5, ge=1, le=120)
    sound_enabled: bool = True
    notifications_enabled: bool = True


class UserPreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    daily_goal_minutes: Optional[int] = Field(default=None, ge=1, le=1440)
    default_focus_duration: Optional[int] = Field(default=None, ge=1, le=240)
    default_break_duration: Optional[int] = Field(default=None, ge=1, le=120)
    sound_enabled: Optional[bool] = None
    notifications_enabled: Optional[bool] = None


class UserPreferencesOut(UserPreferencesBase):
    id: str
    user_id: str

    model_config = ConfigDict(from_attributes=True)


# User Schemas
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    timezone: str = "UTC"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    timezone: Optional[str] = None
    profile_picture: Optional[str] = None


class UserOut(UserBase):
    id: str
    profile_picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    preferences: Optional[UserPreferencesOut] = None

    model_config = ConfigDict(from_attributes=True)


# Auth Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[str] = None
