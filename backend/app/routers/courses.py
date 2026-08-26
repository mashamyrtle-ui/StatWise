from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.course import Course, CourseCompetency, LearningHistory, LearningPathItem
from app.models.recommendation import Recommendation
from app.models.competency import Competency
from app.schemas.course import CourseOut, RecommendationOut, LearningHistoryOut, LearningPathItemOut, CourseCompetencyOut
from app.routers.auth import get_current_user
from app.services.recommendation_service import calculate_recommendations

router = APIRouter(prefix="/api", tags=["courses"])


async def _auth(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    return await get_current_user(authorization.split(" ", 1)[1], db)


async def _enrich_course(course: Course, db: AsyncSession) -> CourseOut:
    """Add competency names to a course."""
    cc_result = await db.execute(
        select(CourseCompetency, Competency)
        .join(Competency, CourseCompetency.competency_id == Competency.id)
        .where(CourseCompetency.course_id == course.id)
    )
    comps = []
    for cc, comp in cc_result.all():
        comps.append(CourseCompetencyOut(
            competency_id=cc.competency_id,
            competency_name=comp.name,
            proficiency_gained=cc.proficiency_gained,
        ))
    return CourseOut(
        id=course.id,
        course_code=course.course_code,
        title=course.title,
        provider=course.provider.value if hasattr(course.provider, "value") else str(course.provider),
        description=course.description,
        difficulty=course.difficulty,
        duration_hours=course.duration_hours,
        category=course.category,
        rating=course.rating or 4.0,
        rating_count=course.rating_count or 0,
        tags=course.tags or [],
        external_url=course.external_url,
        competencies=comps,
    )


@router.get("/courses", response_model=List[CourseOut])
async def list_courses(
    provider: Optional[str] = None,
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    query = select(Course).where(Course.is_active == True)
    if provider:
        query = query.where(Course.provider == provider)
    if difficulty:
        query = query.where(Course.difficulty == difficulty)
    if category:
        query = query.where(Course.category == category)

    result = await db.execute(query)
    courses = result.scalars().all()

    if search:
        search_lower = search.lower()
        courses = [c for c in courses if search_lower in c.title.lower() or (c.description and search_lower in c.description.lower())]

    return [await _enrich_course(c, db) for c in courses]


@router.get("/courses/{course_id}", response_model=CourseOut)
async def get_course(course_id: int, current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return await _enrich_course(course, db)


@router.get("/recommendations/{user_id}", response_model=List[RecommendationOut])
async def get_recommendations(
    user_id: int,
    recalculate: bool = False,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value not in ("admin", "trainer"):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if we have existing recommendations
    existing = await db.execute(
        select(Recommendation).where(Recommendation.user_id == user_id).limit(1)
    )
    has_recs = existing.scalar_one_or_none() is not None

    if not has_recs or recalculate:
        await calculate_recommendations(db, user_id)

    result = await db.execute(
        select(Recommendation, Course)
        .join(Course, Recommendation.course_id == Course.id)
        .where(Recommendation.user_id == user_id)
        .where(Recommendation.is_dismissed == False)
        .order_by(Recommendation.priority_rank)
    )
    rows = result.all()

    out = []
    for rec, course in rows:
        enriched = await _enrich_course(course, db)
        item = RecommendationOut(
            id=rec.id,
            course_id=rec.course_id,
            match_score=rec.match_score,
            gap_score=rec.gap_score,
            role_score=rec.role_score,
            difficulty_score=rec.difficulty_score,
            career_score=rec.career_score,
            dept_score=rec.dept_score,
            history_score=rec.history_score,
            reason=rec.reason,
            priority_rank=rec.priority_rank,
            course=enriched,
        )
        out.append(item)
    return out


@router.get("/learning-path/{user_id}", response_model=List[LearningPathItemOut])
async def get_learning_path(
    user_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value not in ("admin",):
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(LearningPathItem, Course)
        .join(Course, LearningPathItem.course_id == Course.id)
        .where(LearningPathItem.user_id == user_id)
        .order_by(LearningPathItem.order_index)
    )
    rows = result.all()

    out = []
    for item, course in rows:
        enriched = await _enrich_course(course, db)
        lpi = LearningPathItemOut(
            id=item.id,
            course_id=item.course_id,
            order_index=item.order_index,
            status=item.status,
            reason=item.reason,
            course=enriched,
        )
        out.append(lpi)
    return out


@router.get("/learning-history/{user_id}", response_model=List[LearningHistoryOut])
async def get_learning_history(
    user_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value not in ("admin",):
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(LearningHistory, Course)
        .join(Course, LearningHistory.course_id == Course.id)
        .where(LearningHistory.user_id == user_id)
        .order_by(LearningHistory.enrolled_at.desc())
    )
    rows = result.all()

    out = []
    for lh, course in rows:
        enriched = await _enrich_course(course, db)
        item = LearningHistoryOut(
            id=lh.id,
            course_id=lh.course_id,
            status=lh.status.value if hasattr(lh.status, "value") else str(lh.status),
            progress_percentage=lh.progress_percentage or 0.0,
            enrolled_at=lh.enrolled_at,
            completed_at=lh.completed_at,
            hours_spent=lh.hours_spent or 0.0,
            score=lh.score,
            course=enriched,
        )
        out.append(item)
    return out


@router.post("/courses/{course_id}/enroll")
async def enroll_course(
    course_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    # Check if already enrolled
    existing = await db.execute(
        select(LearningHistory)
        .where(LearningHistory.user_id == current_user.id)
        .where(LearningHistory.course_id == course_id)
    )
    if existing.scalar_one_or_none():
        return {"message": "Already enrolled", "status": "enrolled"}

    lh = LearningHistory(
        user_id=current_user.id,
        course_id=course_id,
        status="Enrolled",
    )
    db.add(lh)
    await db.commit()
    return {"message": "Enrolled successfully", "status": "enrolled"}
