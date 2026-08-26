from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.competency import UserCompetency, Competency, CompetencyCategory
from app.models.course import LearningHistory, CourseStatus
from app.models.assessment import AssessmentAttempt, QuizAttempt
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


async def _auth(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    return await get_current_user(authorization.split(" ", 1)[1], db)


@router.get("/organization")
async def organization_analytics(current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    """Organization-wide analytics for admin dashboard."""
    # Total employees
    emp_result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    total_employees = emp_result.scalar()

    # Average competency
    avg_result = await db.execute(select(func.avg(UserCompetency.score_percentage)))
    avg_competency = round(avg_result.scalar() or 0, 1)

    # Total courses completed
    completed_result = await db.execute(
        select(func.count(LearningHistory.id)).where(LearningHistory.status == CourseStatus.completed)
    )
    courses_completed = completed_result.scalar()

    # Total learning hours
    hours_result = await db.execute(select(func.sum(LearningHistory.hours_spent)))
    learning_hours = round(hours_result.scalar() or 0, 1)

    # Average assessment score
    score_result = await db.execute(select(func.avg(AssessmentAttempt.score_percentage)))
    avg_score = round(score_result.scalar() or 0, 1)

    # Competency gap distribution per competency
    gap_data = await db.execute(
        select(Competency.name, func.avg(UserCompetency.score_percentage))
        .join(UserCompetency, Competency.id == UserCompetency.competency_id)
        .group_by(Competency.id)
        .order_by(func.avg(UserCompetency.score_percentage))
    )
    competency_averages = [
        {"competency": name, "avg_score": round(avg or 0, 1)}
        for name, avg in gap_data.all()
    ]

    # Department comparison
    from app.models.user import Department
    dept_result = await db.execute(
        select(Department.name, func.avg(UserCompetency.score_percentage))
        .join(User, Department.id == User.department_id)
        .join(UserCompetency, User.id == UserCompetency.user_id)
        .group_by(Department.id)
    )
    dept_averages = [
        {"department": name, "avg_score": round(avg or 0, 1)}
        for name, avg in dept_result.all()
    ]

    # Category breakdown
    cat_result = await db.execute(
        select(Competency.category, func.avg(UserCompetency.score_percentage))
        .join(UserCompetency, Competency.id == UserCompetency.competency_id)
        .group_by(Competency.category)
    )
    category_averages = [
        {"category": cat.value if hasattr(cat, 'value') else str(cat), "avg_score": round(avg or 0, 1)}
        for cat, avg in cat_result.all()
    ]

    # Skill gaps — competencies with avg score < 60
    skill_gaps = [c for c in competency_averages if c["avg_score"] < 60]
    skill_gaps.sort(key=lambda x: x["avg_score"])

    # Training participation
    participation_result = await db.execute(
        select(func.count(LearningHistory.id))
    )
    total_enrollments = participation_result.scalar()

    return {
        "kpis": {
            "total_employees": total_employees,
            "avg_competency": avg_competency,
            "courses_completed": courses_completed,
            "learning_hours": learning_hours,
            "avg_assessment_score": avg_score,
            "total_enrollments": total_enrollments,
        },
        "competency_averages": competency_averages,
        "department_averages": dept_averages,
        "category_averages": category_averages,
        "skill_gaps": skill_gaps[:10],
        "emerging_skills": [
            {"skill": "Generative AI", "current": 22, "required": 65, "demand": "High", "priority": 1},
            {"skill": "Machine Learning", "current": 31, "required": 60, "demand": "High", "priority": 2},
            {"skill": "Data Engineering", "current": 35, "required": 55, "demand": "High", "priority": 3},
            {"skill": "Cloud Computing", "current": 28, "required": 50, "demand": "Medium", "priority": 4},
            {"skill": "GIS & Spatial Analysis", "current": 33, "required": 55, "demand": "Medium", "priority": 5},
            {"skill": "Cybersecurity", "current": 40, "required": 60, "demand": "High", "priority": 6},
            {"skill": "Data Visualization", "current": 48, "required": 65, "demand": "Medium", "priority": 7},
        ],
    }


@router.get("/notifications/{user_id}")
async def get_notifications(
    user_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    from app.models.notification import Notification
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": n.id,
            "type": n.type.value,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "action_url": n.action_url,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    from app.models.notification import Notification
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notif = result.scalar_one_or_none()
    if notif and notif.user_id == current_user.id:
        notif.is_read = True
        await db.commit()
    return {"message": "Marked as read"}
