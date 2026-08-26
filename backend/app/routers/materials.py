import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.models.material import UploadedMaterial, GeneratedQuiz, GeneratedQuestion
from app.models.competency import Competency
from app.schemas.assessment import (
    GeneratedQuizOut, GeneratedQuestionOut, GenerateQuizRequest,
    QuizSubmit, QuizResult, QuestionUpdate
)
from app.routers.auth import get_current_user
from app.services.document_service import (
    extract_text, chunk_text, detect_competencies, validate_file
)
from app.services.ai_service import generate_mcqs_from_text
from app.services.competency_service import update_competency_after_assessment
from app.config import settings

router = APIRouter(prefix="/api", tags=["materials"])


async def _auth(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    return await get_current_user(authorization.split(" ", 1)[1], db)


@router.post("/materials/upload")
async def upload_material(
    file: UploadFile = File(...),
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    # Validate
    file_type = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    content = await file.read()
    error = validate_file(file.filename, len(content), settings.MAX_UPLOAD_SIZE_MB)
    if error:
        raise HTTPException(status_code=400, detail=error)

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{file_type}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Create DB record
    material = UploadedMaterial(
        uploaded_by=current_user.id,
        filename=unique_name,
        original_filename=file.filename,
        file_type=file_type,
        file_size_bytes=len(content),
        file_path=file_path,
        status="Processing",
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    # Extract text
    try:
        text, page_count = extract_text(file_path, file_type)
        chunks = chunk_text(text)
        concepts = detect_competencies(text)

        material.extracted_text = text[:50000]  # store up to 50k chars
        material.page_count = page_count
        material.concepts_detected = concepts
        material.competencies_detected = concepts
        material.chunk_count = len(chunks)
        material.status = "Ready"
    except Exception as e:
        material.status = "Failed"
        material.error_message = str(e)

    await db.commit()
    await db.refresh(material)

    return {
        "id": material.id,
        "filename": material.original_filename,
        "file_type": material.file_type,
        "status": material.status,
        "page_count": material.page_count,
        "concepts_detected": material.concepts_detected or [],
        "competencies_detected": material.competencies_detected or [],
        "chunk_count": material.chunk_count,
    }


@router.get("/materials", )
async def list_materials(current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UploadedMaterial)
        .where(UploadedMaterial.uploaded_by == current_user.id)
        .order_by(UploadedMaterial.created_at.desc())
    )
    materials = result.scalars().all()
    return [
        {
            "id": m.id,
            "filename": m.original_filename,
            "file_type": m.file_type,
            "status": m.status,
            "page_count": m.page_count,
            "concepts_detected": m.concepts_detected or [],
            "competencies_detected": m.competencies_detected or [],
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in materials
    ]


@router.post("/quizzes/generate", response_model=GeneratedQuizOut)
async def generate_quiz(
    request: GenerateQuizRequest,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    # Load material
    mat_result = await db.execute(
        select(UploadedMaterial).where(UploadedMaterial.id == request.material_id)
    )
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.status != "Ready":
        raise HTTPException(status_code=400, detail="Material is not ready for quiz generation")

    # Chunk the material text
    text = material.extracted_text or ""
    chunks = chunk_text(text) if text else []

    # Generate questions via AI service
    raw_questions = await generate_mcqs_from_text(
        text_chunks=chunks,
        question_count=request.question_count,
        difficulty=request.difficulty,
        competency_focus=request.competency_focus,
        source_filename=material.original_filename,
    )

    # Look up competency ID
    comp_id = None
    if request.competency_focus:
        comp_result = await db.execute(
            select(Competency).where(
                Competency.name.ilike(f"%{request.competency_focus}%")
            )
        )
        comp = comp_result.scalar_one_or_none()
        if comp:
            comp_id = comp.id

    # Create quiz record
    quiz = GeneratedQuiz(
        material_id=material.id,
        created_by=current_user.id,
        title=f"Quiz on {material.original_filename}",
        description=f"AI-generated quiz covering {request.competency_focus or 'key concepts'} from the uploaded material.",
        difficulty=request.difficulty,
        question_count=len(raw_questions),
        competency_focus=request.competency_focus,
        language=request.language,
        is_published=False,
    )
    db.add(quiz)
    await db.flush()

    # Save questions
    for idx, q in enumerate(raw_questions):
        gq = GeneratedQuestion(
            quiz_id=quiz.id,
            competency_id=comp_id,
            question_text=q.get("question_text", ""),
            option_a=q.get("option_a", ""),
            option_b=q.get("option_b", ""),
            option_c=q.get("option_c", ""),
            option_d=q.get("option_d", ""),
            correct_answer=q.get("correct_answer", "A"),
            explanation=q.get("explanation", ""),
            difficulty=q.get("difficulty", request.difficulty),
            competency_name=q.get("competency_name", request.competency_focus),
            source_reference=q.get("source_reference", ""),
            status="Generated",
            order_index=idx,
        )
        db.add(gq)

    await db.commit()
    await db.refresh(quiz)

    # Return full quiz with questions
    q_result = await db.execute(
        select(GeneratedQuestion)
        .where(GeneratedQuestion.quiz_id == quiz.id)
        .order_by(GeneratedQuestion.order_index)
    )
    questions = q_result.scalars().all()

    out = GeneratedQuizOut.model_validate(quiz)
    out.questions = [GeneratedQuestionOut.model_validate(q) for q in questions]
    out.material_filename = material.original_filename
    return out


@router.get("/quizzes/{quiz_id}", response_model=GeneratedQuizOut)
async def get_quiz(quiz_id: int, current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GeneratedQuiz).where(GeneratedQuiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    q_result = await db.execute(
        select(GeneratedQuestion)
        .where(GeneratedQuestion.quiz_id == quiz_id)
        .where(GeneratedQuestion.status != "Rejected")
        .order_by(GeneratedQuestion.order_index)
    )
    questions = q_result.scalars().all()

    # Get material filename
    mat_result = await db.execute(select(UploadedMaterial).where(UploadedMaterial.id == quiz.material_id))
    material = mat_result.scalar_one_or_none()

    out = GeneratedQuizOut.model_validate(quiz)
    out.questions = [GeneratedQuestionOut.model_validate(q) for q in questions]
    out.material_filename = material.original_filename if material else None
    return out


@router.get("/quizzes", response_model=List[GeneratedQuizOut])
async def list_quizzes(current_user: User = Depends(_auth), db: AsyncSession = Depends(get_db)):
    if current_user.role.value == "trainer":
        result = await db.execute(
            select(GeneratedQuiz)
            .where(GeneratedQuiz.created_by == current_user.id)
            .order_by(GeneratedQuiz.created_at.desc())
        )
    else:
        result = await db.execute(
            select(GeneratedQuiz)
            .where(GeneratedQuiz.is_published == True)
            .order_by(GeneratedQuiz.created_at.desc())
        )
    quizzes = result.scalars().all()
    out = []
    for quiz in quizzes:
        item = GeneratedQuizOut.model_validate(quiz)
        item.questions = []
        out.append(item)
    return out


@router.patch("/quizzes/{quiz_id}/questions/{question_id}", response_model=GeneratedQuestionOut)
async def update_question(
    quiz_id: int,
    question_id: int,
    updates: QuestionUpdate,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GeneratedQuestion)
        .where(GeneratedQuestion.id == question_id)
        .where(GeneratedQuestion.quiz_id == quiz_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(question, field, value)
    if updates.question_text or updates.option_a:
        question.status = "Edited"

    await db.commit()
    await db.refresh(question)
    return GeneratedQuestionOut.model_validate(question)


@router.delete("/quizzes/{quiz_id}/questions/{question_id}")
async def delete_question(
    quiz_id: int,
    question_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GeneratedQuestion)
        .where(GeneratedQuestion.id == question_id)
        .where(GeneratedQuestion.quiz_id == quiz_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.status = "Rejected"
    await db.commit()
    return {"message": "Question removed"}


@router.post("/quizzes/{quiz_id}/publish")
async def publish_quiz(
    quiz_id: int,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GeneratedQuiz).where(GeneratedQuiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    from datetime import datetime, timezone
    quiz.is_published = True
    quiz.published_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Quiz published successfully", "quiz_id": quiz_id}


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResult)
async def submit_quiz(
    quiz_id: int,
    submission: QuizSubmit,
    current_user: User = Depends(_auth),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GeneratedQuiz).where(GeneratedQuiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Load active questions
    q_result = await db.execute(
        select(GeneratedQuestion)
        .where(GeneratedQuestion.quiz_id == quiz_id)
        .where(GeneratedQuestion.status != "Rejected")
        .order_by(GeneratedQuestion.order_index)
    )
    questions = q_result.scalars().all()

    correct_count = 0
    question_results = []
    competency_correct: dict = {}
    competency_total: dict = {}

    for q in questions:
        selected = submission.answers.get(str(q.id), "")
        is_correct = selected.upper() == q.correct_answer.upper()
        if is_correct:
            correct_count += 1

        if q.competency_id:
            competency_correct.setdefault(q.competency_id, 0)
            competency_total.setdefault(q.competency_id, 0)
            competency_total[q.competency_id] += 1
            if is_correct:
                competency_correct[q.competency_id] += 1

        question_results.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "selected_answer": selected,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
            "competency_name": q.competency_name,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "source_reference": q.source_reference,
        })

    total = len(questions)
    score_pct = round(correct_count / total * 100, 1) if total > 0 else 0

    competency_scores_pct = {}
    for cid, cnt in competency_total.items():
        competency_scores_pct[cid] = round(competency_correct.get(cid, 0) / cnt * 100, 1)

    # Update competency scores
    updates = await update_competency_after_assessment(db, current_user.id, competency_scores_pct)

    # Save quiz attempt
    from app.models.assessment import QuizAttempt
    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        answers=submission.answers,
        score_percentage=score_pct,
        correct_count=correct_count,
        total_count=total,
        competency_updates={str(k): v for k, v in competency_scores_pct.items()},
        time_taken_seconds=submission.time_taken_seconds,
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    # Recalculate recommendations
    try:
        from app.services.recommendation_service import calculate_recommendations
        await calculate_recommendations(db, current_user.id)
    except Exception:
        pass

    summary = (
        f"You scored {score_pct:.0f}% — {correct_count} out of {total} correct. "
        f"{'Excellent work!' if score_pct >= 80 else 'Good effort! Review the explanations to strengthen your understanding.'}"
    )
    if updates:
        comp_names = [u["competency_name"] for u in updates]
        summary += f" Competency updated: {', '.join(comp_names)}."

    return QuizResult(
        attempt_id=attempt.id,
        quiz_id=quiz_id,
        score_percentage=score_pct,
        correct_count=correct_count,
        total_count=total,
        question_results=question_results,
        competency_updates=updates,
        summary=summary,
    )
