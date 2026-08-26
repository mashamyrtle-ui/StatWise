"""
Competency Service — core intelligence for gap calculation and score updates.
"""
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.competency import UserCompetency, Competency, RoleCompetencyRequirement
from app.models.user import User
from app.schemas.competency import SkillGapItem, SkillGapResponse


# Map proficiency level (1-5) to percentage range midpoints
LEVEL_PERCENTAGE_MAP = {
    1: 20,   # Beginner: 0-20%
    2: 40,   # Basic: 21-40%
    3: 60,   # Intermediate: 41-60%
    4: 80,   # Advanced: 61-80%
    5: 100,  # Expert: 81-100%
}

LEVEL_NAMES = {1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced", 5: "Expert"}


def percentage_to_level(percentage: float) -> int:
    """Convert a score percentage to a proficiency level (1-5)."""
    if percentage <= 20:
        return 1
    elif percentage <= 40:
        return 2
    elif percentage <= 60:
        return 3
    elif percentage <= 80:
        return 4
    else:
        return 5


def gap_to_label(gap: int) -> str:
    if gap <= 0:
        return "None"
    elif gap == 1:
        return "Low"
    elif gap == 2:
        return "Medium"
    else:
        return "High"


async def get_user_competencies(db: AsyncSession, user_id: int) -> List[UserCompetency]:
    result = await db.execute(
        select(UserCompetency)
        .where(UserCompetency.user_id == user_id)
        .join(Competency)
    )
    return result.scalars().all()


async def get_skill_gaps(db: AsyncSession, user_id: int) -> SkillGapResponse:
    """Calculate skill gaps for a user against their role requirements."""
    # Get user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return SkillGapResponse(user_id=user_id, gaps=[], summary="User not found",
                                high_priority_count=0, medium_priority_count=0, low_priority_count=0)

    designation = user.designation or "Statistical Officer"

    # Get role requirements
    req_result = await db.execute(
        select(RoleCompetencyRequirement, Competency)
        .join(Competency, RoleCompetencyRequirement.competency_id == Competency.id)
        .where(RoleCompetencyRequirement.role_name == designation)
    )
    requirements = req_result.all()

    if not requirements:
        # Fall back to generic Statistical Officer requirements
        req_result = await db.execute(
            select(RoleCompetencyRequirement, Competency)
            .join(Competency, RoleCompetencyRequirement.competency_id == Competency.id)
            .where(RoleCompetencyRequirement.role_name == "Statistical Officer")
        )
        requirements = req_result.all()

    # Get user competencies as dict
    uc_result = await db.execute(
        select(UserCompetency).where(UserCompetency.user_id == user_id)
    )
    user_comps = {uc.competency_id: uc for uc in uc_result.scalars().all()}

    gaps: List[SkillGapItem] = []
    for req, comp in requirements:
        uc = user_comps.get(comp.id)
        current_level = uc.current_level if uc else 1
        current_pct = uc.score_percentage if uc else 10.0
        required_level = req.required_level
        required_pct = LEVEL_PERCENTAGE_MAP.get(required_level, 60)

        gap = required_level - current_level
        gap_label = gap_to_label(gap)

        if gap > 0:
            explanation = (
                f"{comp.name} is required at {LEVEL_NAMES.get(required_level, 'Advanced')} level "
                f"for the {designation} role. Your current proficiency is "
                f"{LEVEL_NAMES.get(current_level, 'Beginner')} ({current_pct:.0f}%), "
                f"which is {required_pct - current_pct:.0f}% below the required level."
            )
        else:
            explanation = (
                f"Your {comp.name} proficiency ({LEVEL_NAMES.get(current_level, 'Proficient')}) "
                f"meets the requirement for the {designation} role."
            )

        gaps.append(SkillGapItem(
            competency_id=comp.id,
            competency_name=comp.name,
            category=comp.category.value,
            current_level=current_level,
            current_percentage=current_pct,
            required_level=required_level,
            required_percentage=float(required_pct),
            gap=gap,
            gap_label=gap_label,
            priority=req.priority,
            explanation=explanation,
        ))

    # Sort: highest gap first, then priority
    gaps.sort(key=lambda x: (-x.gap, -x.priority))

    high = sum(1 for g in gaps if g.gap_label == "High")
    medium = sum(1 for g in gaps if g.gap_label == "Medium")
    low = sum(1 for g in gaps if g.gap_label == "Low")

    top_gaps = [g.competency_name for g in gaps if g.gap > 0][:3]
    summary = (
        f"You have {high} high-priority, {medium} medium-priority, and {low} low-priority skill gaps. "
        f"Focus areas: {', '.join(top_gaps)}." if top_gaps
        else "Your competency profile meets all role requirements. Great work!"
    )

    return SkillGapResponse(
        user_id=user_id,
        gaps=gaps,
        summary=summary,
        high_priority_count=high,
        medium_priority_count=medium,
        low_priority_count=low,
    )


async def update_competency_after_assessment(
    db: AsyncSession,
    user_id: int,
    competency_scores: Dict[int, float],
) -> List[Dict]:
    """
    Update user competency scores after an assessment.
    Applies weighted average: 70% existing + 30% new score (diminishing blend).
    Returns list of {competency_name, before, after, delta}.
    """
    updates = []
    for competency_id, quiz_score in competency_scores.items():
        # Get existing competency
        result = await db.execute(
            select(UserCompetency, Competency)
            .join(Competency, UserCompetency.competency_id == Competency.id)
            .where(UserCompetency.user_id == user_id)
            .where(UserCompetency.competency_id == competency_id)
        )
        row = result.first()

        if row:
            uc, comp = row
            before = uc.score_percentage
            # Weighted blend
            after = round(before * 0.7 + quiz_score * 0.3, 1)
            uc.score_percentage = after
            uc.current_level = percentage_to_level(after)
            uc.assessment_count += 1
            from datetime import datetime, timezone
            uc.last_assessed = datetime.now(timezone.utc)
            updates.append({
                "competency_id": competency_id,
                "competency_name": comp.name,
                "before": before,
                "after": after,
                "delta": round(after - before, 1),
            })
        else:
            # Create new UserCompetency record
            comp_result = await db.execute(select(Competency).where(Competency.id == competency_id))
            comp = comp_result.scalar_one_or_none()
            if comp:
                new_uc = UserCompetency(
                    user_id=user_id,
                    competency_id=competency_id,
                    score_percentage=quiz_score,
                    current_level=percentage_to_level(quiz_score),
                    assessment_count=1,
                )
                db.add(new_uc)
                updates.append({
                    "competency_id": competency_id,
                    "competency_name": comp.name,
                    "before": 0.0,
                    "after": quiz_score,
                    "delta": quiz_score,
                })

    await db.commit()
    return updates
