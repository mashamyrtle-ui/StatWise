import random
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.assessment import Assessment, Question, AssessmentAttempt
from app.models.competency import Competency
from app.schemas.assessment import AssessmentOut, QuestionOut, AssessmentSubmit, AssessmentResult
from app.routers.auth import get_current_user
from app.services.competency_service import update_competency_after_assessment

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


async def _auth(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    return await get_current_user(authorization.split(" ", 1)[1], db)


@router.get("", response_model=List[AssessmentOut])
async def list_assessments(current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment))
    assessments = result.scalars().all()
    out = []
    for a in assessments:
        item = AssessmentOut.model_validate(a)
        item.questions = []
        out.append(item)
    return out


@router.get("/diagnostic", response_model=AssessmentOut)
async def get_diagnostic_assessment(current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    """Return the diagnostic assessment with randomly selected questions."""
    result = await db.execute(select(Assessment).where(Assessment.is_diagnostic == True).limit(1))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="No diagnostic assessment found")

    q_result = await db.execute(
        select(Question).where(Question.assessment_id == assessment.id)
    )
    questions = q_result.scalars().all()
    # Shuffle and pick up to total_questions
    random.shuffle(questions)
    selected = questions[:assessment.total_questions]

    item = AssessmentOut.model_validate(assessment)
    item.questions = [QuestionOut.model_validate(q) for q in selected]
    return item


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(
    assessment_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    q_result = await db.execute(
        select(Question).where(Question.assessment_id == assessment_id)
    )
    questions = q_result.scalars().all()
    item = AssessmentOut.model_validate(assessment)
    item.questions = [QuestionOut.model_validate(q) for q in questions]
    return item


@router.post("/{assessment_id}/submit", response_model=AssessmentResult)
async def submit_assessment(
    assessment_id: int,
    submission: AssessmentSubmit,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Load questions
    q_result = await db.execute(
        select(Question, Competency)
        .join(Competency, Question.competency_id == Competency.id, isouter=True)
        .where(Question.assessment_id == assessment_id)
    )
    questions_with_comp = q_result.all()

    # Score per question and per competency
    correct_count = 0
    question_results = []
    competency_correct: dict = {}
    competency_total: dict = {}
    competency_names: dict = {}

    for q, comp in questions_with_comp:
        selected = submission.answers.get(str(q.id), "")
        is_correct = selected.upper() == q.correct_answer.upper()
        if is_correct:
            correct_count += 1

        if comp:
            competency_correct.setdefault(comp.id, 0)
            competency_total.setdefault(comp.id, 0)
            competency_names[comp.id] = comp.name
            competency_total[comp.id] += 1
            if is_correct:
                competency_correct[comp.id] += 1

        question_results.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "selected_answer": selected,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
            "competency_name": comp.name if comp else None,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
        })

    total = len(questions_with_comp)
    score_pct = round(correct_count / total * 100, 1) if total > 0 else 0

    # Competency scores (percentage per competency)
    competency_scores_pct = {}
    for cid, cnt in competency_total.items():
        competency_scores_pct[cid] = round(competency_correct.get(cid, 0) / cnt * 100, 1)

    # Update competency records
    updates = await update_competency_after_assessment(db, current_user.id, competency_scores_pct)

    # Save attempt
    attempt = AssessmentAttempt(
        user_id=current_user.id,
        assessment_id=assessment_id,
        answers=submission.answers,
        score_percentage=score_pct,
        competency_scores={str(k): v for k, v in competency_scores_pct.items()},
        time_taken_seconds=submission.time_taken_seconds,
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    # Re-calculate recommendations asynchronously (best effort)
    try:
        from app.services.recommendation_service import calculate_recommendations
        await calculate_recommendations(db, current_user.id)
    except Exception:
        pass

    summary = (
        f"You scored {score_pct:.0f}% ({correct_count}/{total} correct). "
        f"Your competency scores have been updated. "
        f"{'Great performance!' if score_pct >= 80 else 'Keep learning to improve your scores.'}"
    )

    return AssessmentResult(
        attempt_id=attempt.id,
        assessment_id=assessment_id,
        score_percentage=score_pct,
        correct_count=correct_count,
        total_count=total,
        competency_scores={competency_names.get(k, str(k)): v for k, v in competency_scores_pct.items()},
        competency_updates=updates,
        question_results=question_results,
        summary=summary,
    )
