from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.competency import UserCompetency, Competency
from app.schemas.competency import SkillGapResponse
from app.routers.auth import get_current_user
from app.services.ai_service import generate_assistant_response
from app.services.competency_service import get_skill_gaps

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []


async def _auth(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    return await get_current_user(authorization.split(" ", 1)[1], db)


@router.post("")
async def chat(
    body: ChatMessage,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    # Build user context for the AI
    uc_result = await db.execute(
        select(UserCompetency, Competency)
        .join(Competency, UserCompetency.competency_id == Competency.id)
        .where(UserCompetency.user_id == current_user.id)
        .order_by(UserCompetency.score_percentage)
    )
    competencies = [
        {"name": c.name, "score": round(uc.score_percentage, 0), "level": uc.current_level}
        for uc, c in uc_result.all()
    ]

    gaps = await get_skill_gaps(db, current_user.id)
    top_gap = gaps.gaps[0].competency_name if gaps.gaps else "Python"

    user_context = {
        "name": current_user.name,
        "designation": current_user.designation or "Statistical Officer",
        "department": "Department of Statistics",
        "experience_years": current_user.years_experience,
        "competencies": competencies[:10],
        "top_gap": top_gap,
        "career_goal": current_user.career_goal or "Advance in data analysis and official statistics",
    }

    response = await generate_assistant_response(
        user_message=body.message,
        user_context=user_context,
        conversation_history=body.conversation_history or [],
    )

    return {
        "response": response,
        "user_context_used": True,
    }
