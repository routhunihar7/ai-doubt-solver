from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)

class UserRegisterRequest(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_superuser: bool
    preferences: Dict[str, Any]
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    preferences: Optional[Dict[str, Any]] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)
