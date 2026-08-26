"""
Recommendation Engine — weighted scoring system.

Weights:
  40% — Skill gap relevance
  20% — Role relevance
  15% — Difficulty fit
  10% — Career relevance
  10% — Department priority
   5% — Learning history (penalise completed/in-progress courses)
"""
import logging
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.course import Course, CourseCompetency, LearningHistory
from app.models.competency import UserCompetency, Competency, RoleCompetencyRequirement
from app.models.user import User
from app.models.recommendation import Recommendation
from app.services.competency_service import percentage_to_level, LEVEL_PERCENTAGE_MAP

logger = logging.getLogger(__name__)

DIFFICULTY_LEVEL_MAP = {
    "Beginner": 1, "Easy": 1, "Basic": 1,
    "Intermediate": 2, "Medium": 2,
    "Advanced": 3, "Hard": 3,
    "Expert": 4,
}


def _difficulty_fit_score(user_avg_level: float, course_difficulty: Optional[str]) -> float:
    """How well does the course difficulty match the user's current level?"""
    course_lvl = DIFFICULTY_LEVEL_MAP.get(course_difficulty or "Intermediate", 2)
    target_lvl = user_avg_level + 0.5  # stretch one level above current
    diff = abs(course_lvl - target_lvl)
    if diff == 0:
        return 100.0
    elif diff <= 0.5:
        return 85.0
    elif diff <= 1:
        return 65.0
    else:
        return 30.0


def _build_reason(
    course: Course,
    gap_contributions: List[Dict],
    role_match: bool,
    difficulty_note: str,
    career_match: bool,
    already_done: bool,
) -> str:
    parts = []
    if gap_contributions:
        gap_names = [g["name"] for g in gap_contributions[:2]]
        parts.append(
            f"addresses your skill gap{'s' if len(gap_names) > 1 else ''} in {' and '.join(gap_names)}"
        )
    if role_match:
        parts.append("is highly relevant to your current role requirements")
    if difficulty_note:
        parts.append(difficulty_note)
    if career_match:
        parts.append("aligns with your career development goals")
    if already_done:
        parts.append("(note: you have previously engaged with this area)")

    if not parts:
        parts.append("is recommended based on your overall competency profile")

    reason = f"Recommended because this course {', and '.join(parts)}."
    return reason[0].upper() + reason[1:]


async def calculate_recommendations(
    db: AsyncSession,
    user_id: int,
    top_n: int = 10,
) -> List[Recommendation]:
    """Calculate and persist recommendations for a user."""
    # Load user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return []

    designation = user.designation or "Statistical Officer"

    # Load user competencies
    uc_result = await db.execute(
        select(UserCompetency).where(UserCompetency.user_id == user_id)
    )
    user_comps: Dict[int, UserCompetency] = {uc.competency_id: uc for uc in uc_result.scalars().all()}

    # Load role requirements
    req_result = await db.execute(
        select(RoleCompetencyRequirement)
        .where(RoleCompetencyRequirement.role_name == designation)
    )
    requirements = {r.competency_id: r for r in req_result.scalars().all()}

    if not requirements:
        req_result = await db.execute(
            select(RoleCompetencyRequirement)
            .where(RoleCompetencyRequirement.role_name == "Statistical Officer")
        )
        requirements = {r.competency_id: r for r in req_result.scalars().all()}

    # Load learning history
    lh_result = await db.execute(
        select(LearningHistory).where(LearningHistory.user_id == user_id)
    )
    lh_by_course: Dict[int, LearningHistory] = {lh.course_id: lh for lh in lh_result.scalars().all()}

    # Avg gap for difficulty fit
    gaps = []
    for cid, req in requirements.items():
        uc = user_comps.get(cid)
        cur = uc.current_level if uc else 1
        gaps.append(req.required_level - cur)
    avg_gap = sum(gaps) / len(gaps) if gaps else 1
    user_avg_level = max(1, 3 - avg_gap)

    # Load all active courses with competencies
    courses_result = await db.execute(
        select(Course).where(Course.is_active == True)
    )
    courses = courses_result.scalars().all()

    # Preload course competencies
    cc_result = await db.execute(select(CourseCompetency))
    course_comps: Dict[int, List[CourseCompetency]] = {}
    for cc in cc_result.scalars().all():
        course_comps.setdefault(cc.course_id, []).append(cc)

    scored_courses = []
    for course in courses:
        lh = lh_by_course.get(course.id)

        # History score — penalise completed
        if lh and lh.status == "Completed":
            history_score = 0.0  # already done
        elif lh and lh.status in ("Enrolled", "In Progress"):
            history_score = 50.0
        else:
            history_score = 100.0

        # Skill gap score
        ccs = course_comps.get(course.id, [])
        gap_scores = []
        gap_contributions = []
        role_match = False
        for cc in ccs:
            uc = user_comps.get(cc.competency_id)
            req = requirements.get(cc.competency_id)
            cur_level = uc.current_level if uc else 1
            if req:
                gap = req.required_level - cur_level
                if gap > 0:
                    gap_pct = min(100, gap * 33.3)
                    gap_scores.append(gap_pct)
                    gap_contributions.append({"name": _get_comp_name(cc.competency_id, user_comps), "gap": gap})
                    role_match = True
                else:
                    gap_scores.append(0.0)
            else:
                gap_scores.append(20.0)  # minor bonus for general enrichment

        gap_score = max(gap_scores) if gap_scores else 0.0
        role_score = 100.0 if role_match else 30.0

        # Difficulty fit
        d_score = _difficulty_fit_score(user_avg_level, course.difficulty)
        difficulty_note = ""
        if d_score >= 85:
            difficulty_note = "the difficulty level is well-matched to your current proficiency"
        elif d_score <= 30:
            difficulty_note = "the difficulty may be challenging given your current level"

        # Career score (simplified — non-zero for all relevant courses)
        career_score = 70.0 if role_match else 30.0

        # Department priority — default 60 for prototype
        dept_score = 60.0

        # Weighted final score
        final = (
            gap_score * 0.40
            + role_score * 0.20
            + d_score * 0.15
            + career_score * 0.10
            + dept_score * 0.10
            + history_score * 0.05
        )

        reason = _build_reason(
            course, gap_contributions, role_match, difficulty_note,
            career_score > 60, lh is not None and lh.status == "Completed"
        )

        scored_courses.append({
            "course": course,
            "final": final,
            "gap_score": gap_score,
            "role_score": role_score,
            "d_score": d_score,
            "career_score": career_score,
            "dept_score": dept_score,
            "history_score": history_score,
            "reason": reason,
        })

    scored_courses.sort(key=lambda x: -x["final"])
    top_courses = scored_courses[:top_n]

    # Delete old recommendations and re-insert
    await db.execute(delete(Recommendation).where(Recommendation.user_id == user_id))

    recs = []
    for rank, item in enumerate(top_courses, 1):
        rec = Recommendation(
            user_id=user_id,
            course_id=item["course"].id,
            match_score=round(item["final"], 1),
            gap_score=round(item["gap_score"], 1),
            role_score=round(item["role_score"], 1),
            difficulty_score=round(item["d_score"], 1),
            career_score=round(item["career_score"], 1),
            dept_score=round(item["dept_score"], 1),
            history_score=round(item["history_score"], 1),
            reason=item["reason"],
            priority_rank=rank,
        )
        db.add(rec)
        recs.append(rec)

    await db.commit()

    # Reload with course data
    result = await db.execute(
        select(Recommendation)
        .where(Recommendation.user_id == user_id)
        .order_by(Recommendation.priority_rank)
    )
    return result.scalars().all()


def _get_comp_name(comp_id: int, user_comps: Dict) -> str:
    """Fallback competency name lookup — will be enhanced with DB join in router."""
    return f"Competency #{comp_id}"
