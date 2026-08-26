from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.competency import Competency, UserCompetency
from app.schemas.competency import CompetencyOut, UserCompetencyOut, SkillGapResponse
from app.routers.auth import get_current_user
from app.services.competency_service import get_skill_gaps

router = APIRouter(prefix="/api", tags=["competencies"])


async def _auth(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    return await get_current_user(authorization.split(" ", 1)[1], db)


@router.get("/competencies", response_model=List[CompetencyOut])
async def list_competencies(current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Competency))
    return result.scalars().all()


@router.get("/users/{user_id}/competencies", response_model=List[UserCompetencyOut])
async def get_user_competencies(
    user_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value not in ("admin", "trainer"):
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(
        select(UserCompetency, Competency)
        .join(Competency, UserCompetency.competency_id == Competency.id)
        .where(UserCompetency.user_id == user_id)
        .order_by(UserCompetency.score_percentage.desc())
    )
    rows = result.all()
    out = []
    for uc, comp in rows:
        item = UserCompetencyOut.model_validate(uc)
        item.competency = CompetencyOut.model_validate(comp)
        out.append(item)
    return out


@router.get("/skill-gaps/{user_id}", response_model=SkillGapResponse)
async def get_skill_gaps_endpoint(
    user_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value not in ("admin", "trainer"):
        raise HTTPException(status_code=403, detail="Access denied")
    return await get_skill_gaps(db, user_id)
