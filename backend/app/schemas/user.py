from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole


class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True


class UserBase(BaseModel):
    name: str
    email: str
    employee_id: str
    role: UserRole = UserRole.employee
    designation: Optional[str] = None
    department_id: Optional[int] = None
    current_assignment: Optional[str] = None
    years_experience: Optional[float] = 0
    education: Optional[str] = None
    career_goal: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    current_assignment: Optional[str] = None
    years_experience: Optional[float] = None
    education: Optional[str] = None
    career_goal: Optional[str] = None
    avatar_url: Optional[str] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    department: Optional[DepartmentOut] = None
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
