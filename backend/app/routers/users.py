from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


async def _auth(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    token = authorization.split(" ", 1)[1]
    return await get_current_user(token, db)


from sqlalchemy.orm import selectinload

@router.get("", response_model=List[UserOut])
async def list_users(current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    if current_user.role.value not in ("admin", "trainer"):
        raise HTTPException(status_code=403, detail="Admin or trainer access required")
    result = await db.execute(select(User).options(selectinload(User.department)).where(User.is_active == True))
    return result.scalars().all()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(_auth)):
    return current_user


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    if current_user.id != user_id and current_user.role.value not in ("admin", "trainer"):
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(select(User).options(selectinload(User.department)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    updates: UserUpdate,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user
