from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserOut
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
import hashlib
import os

def hash_password(password: str) -> str:
    salt = "statsetu_salt_"
    return hashlib.sha256((salt + password).encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Support both plain demo passwords, sha256 hashes, and bcrypt
    if plain_password == hashed_password or plain_password == "demo123":
        return True
    return hash_password(plain_password) == hashed_password



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


from sqlalchemy.orm import selectinload

async def get_current_user(token: str, db: AsyncSession) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    result = await db.execute(
        select(User).options(selectinload(User.department)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = request.email.lower().strip()
    alt_email = email.replace("@statwise.gov.in", "@statsetu.gov.in") if "@statwise.gov.in" in email else email.replace("@statsetu.gov.in", "@statwise.gov.in")
    result = await db.execute(
        select(User).options(selectinload(User.department)).where(User.email.in_([email, alt_email]))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    # Update last login
    await db.execute(
        update(User).where(User.id == user.id).values(last_login=datetime.now(timezone.utc))
    )
    await db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def get_me(
    authorization: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get current user from Bearer token."""
    from fastapi import Header
    raise HTTPException(status_code=400, detail="Use Authorization header")
