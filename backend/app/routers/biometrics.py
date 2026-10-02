import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.biometrics import FaceEnrollment
from app.schemas.user import UserOut
from app.schemas.biometrics import (
    FaceCheckRequest,
    FaceCheckResponse,
    FaceEnrollRequest,
    FaceEnrollResponse,
    FaceVerifyRequest,
    FaceVerifyResponse,
    FaceStatusResponse,
    DevResetRequest,
)
from app.routers.auth import create_access_token, get_current_user
from app.services.biometric_service import (
    encrypt_biometric_template,
    decrypt_biometric_template,
    parse_vector_from_template,
    calculate_cosine_similarity,
    check_rate_limit,
    record_failed_attempt,
    clear_failed_attempts,
    generate_challenge,
    verify_challenge_token,
    log_biometric_event,
    COSINE_SIMILARITY_THRESHOLD,
)

logger = logging.getLogger("statwise.biometrics_router")

router = APIRouter(prefix="/api/auth/biometric", tags=["biometrics"])


def _extract_client_info(request: Request):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    return ip, ua


def _resolve_redirect_url(user: User) -> str:
    """Strict backend-driven route resolution based on authenticated role."""
    if user.role == UserRole.admin:
        return "/admin"
    if user.role == UserRole.trainer:
        return "/trainer"
    return "/dashboard"


async def _find_user_by_identifier(db: AsyncSession, identifier: str) -> Optional[User]:
    norm = identifier.lower().strip()
    alt_email = norm.replace("@statwise.gov.in", "@statsetu.gov.in") if "@statwise.gov.in" in norm else norm.replace("@statsetu.gov.in", "@statwise.gov.in")

    result = await db.execute(
        select(User)
        .options(selectinload(User.department), selectinload(User.face_enrollment))
        .where(
            (User.email == norm)
            | (User.email == alt_email)
            | (User.employee_id == identifier.strip().upper())
            | (User.employee_id == identifier.strip())
        )
    )
    return result.scalar_one_or_none()


@router.post("/check-user", response_model=FaceCheckResponse)
async def check_user(request: FaceCheckRequest, db: AsyncSession = Depends(get_db)):
    """
    1:1 Pre-check: Verify if a specific account exists and has enrolled biometrics.
    Does NOT return any raw biometric representations or embeddings.
    """
    user = await _find_user_by_identifier(db, request.identifier)
    if not user:
        return FaceCheckResponse(
            exists=False,
            face_enrollment_status="NOT_ENROLLED",
            face_authentication_enabled=False,
        )

    challenge, token = generate_challenge()
    status_str = user.face_enrollment_status or ("ENROLLED" if user.face_enrollment else "NOT_ENROLLED")

    return FaceCheckResponse(
        exists=True,
        name=user.name,
        employee_id=user.employee_id,
        face_enrollment_status=status_str,
        face_authentication_enabled=bool(user.face_authentication_enabled and user.face_enrollment),
        liveness_challenge=challenge,
        challenge_token=token,
    )


@router.post("/enroll", response_model=FaceEnrollResponse)
async def enroll_face(
    enroll_req: FaceEnrollRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
    auth_header: Optional[str] = None,
):
    """
    Enroll or re-enroll biometric reference for an authenticated user.
    Stores the template encrypted at rest.
    """
    # Extract token from header
    token = None
    auth = req.headers.get("authorization") or auth_header
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to enroll face biometric data.",
        )

    user = await get_current_user(token, db)
    ip, ua = _extract_client_info(req)

    if not enroll_req.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit biometric consent is required before capturing or storing face authentication data.",
        )

    # Validate vector
    vec = parse_vector_from_template(enroll_req.template)
    if not vec or len(vec) < 16:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Biometric quality check failed. Please ensure a clear, well-lit face is presented.",
        )

    encrypted_template = encrypt_biometric_template(enroll_req.template)
    now = datetime.now(timezone.utc)

    # Check for existing enrollment
    existing_res = await db.execute(
        select(FaceEnrollment).where(FaceEnrollment.user_id == user.id)
    )
    existing = existing_res.scalar_one_or_none()

    event_type = "RE_ENROLLMENT" if existing else "ENROLLMENT"

    if existing:
        existing.biometric_template_encrypted = encrypted_template
        existing.enrollment_status = "ENROLLED"
        existing.last_updated_at = now
        existing.consent_version = enroll_req.consent_version or "v1.0"
        existing.consent_timestamp = now
    else:
        new_enrollment = FaceEnrollment(
            user_id=user.id,
            biometric_template_encrypted=encrypted_template,
            enrollment_status="ENROLLED",
            enrolled_at=now,
            model_version="facenet-64d-v1",
            consent_version=enroll_req.consent_version or "v1.0",
            consent_timestamp=now,
            last_updated_at=now,
        )
        db.add(new_enrollment)

    # Update user flags
    user.face_authentication_enabled = True
    user.face_enrollment_status = "ENROLLED"

    await db.commit()

    await log_biometric_event(
        db=db,
        user_id=user.id,
        event_type=event_type,
        ip_address=ip,
        user_agent=ua,
        details=f"{event_type} completed. Quality score: {enroll_req.quality_score or 85.0}%. Stored encrypted at rest.",
    )

    return FaceEnrollResponse(
        status="success",
        face_enrollment_status="ENROLLED",
        enrolled_at=now.strftime("%d %B %Y"),
        message="Face reference successfully registered and encrypted.",
    )


@router.post("/verify", response_model=FaceVerifyResponse)
async def verify_face(
    verify_req: FaceVerifyRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    1:1 Face Verification: Compare live biometric landmarks against the enrolled template for this specific account.
    """
    ip, ua = _extract_client_info(req)
    identifier = verify_req.identifier.strip()

    # Rate limiting
    is_locked, remaining = check_rate_limit(identifier)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed verification attempts. Please wait {remaining} seconds before trying again or sign in with your password.",
        )

    user = await _find_user_by_identifier(db, identifier)
    if not user:
        record_failed_attempt(identifier)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Face verification was unsuccessful. Please make sure your face is clearly visible and try again.",
        )

    if not user.face_enrollment or user.face_enrollment_status != "ENROLLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has not completed face enrollment. Please sign in with password to set up face authentication.",
        )

    # Parse live vector
    live_vec = parse_vector_from_template(verify_req.live_template)
    if not live_vec:
        record_failed_attempt(identifier)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid face biometric landmark data detected in live capture.",
        )

    # Decrypt stored template server-side
    try:
        decrypted_raw = decrypt_biometric_template(user.face_enrollment.biometric_template_encrypted)
        enrolled_vec = parse_vector_from_template(decrypted_raw)
    except Exception as e:
        logger.error(f"Decryption error for user {user.id}: {e}")
        record_failed_attempt(identifier)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to verify biometric credential. Please use password sign-in.",
        )

    if not enrolled_vec:
        record_failed_attempt(identifier)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Enrolled biometric template corrupted. Please re-enroll in Profile settings.",
        )

    # Calculate similarity
    sim, confidence = calculate_cosine_similarity(live_vec, enrolled_vec)

    # If templates match either via cosine similarity threshold or exact simulation match
    is_match = sim >= COSINE_SIMILARITY_THRESHOLD or confidence >= 85.0

    if not is_match:
        record_failed_attempt(identifier)
        await log_biometric_event(
            db=db,
            user_id=user.id,
            event_type="VERIFICATION_FAILURE",
            ip_address=ip,
            user_agent=ua,
            details=f"Verification failure. Confidence: {confidence}%. Below threshold.",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Face verification was unsuccessful. Please make sure your face is clearly visible and try again.",
        )

    # Match succeeded! Clear rate limit counter
    clear_failed_attempts(identifier)

    # Update last login
    await db.execute(
        update(User).where(User.id == user.id).values(last_login=datetime.now(timezone.utc))
    )
    await db.commit()

    await log_biometric_event(
        db=db,
        user_id=user.id,
        event_type="VERIFICATION_SUCCESS",
        ip_address=ip,
        user_agent=ua,
        details=f"Verification success. Confidence: {confidence}%. Authorized role: {user.role.value}.",
    )

    # Issue JWT Token strictly adhering to backend authorized role
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    redirect_url = _resolve_redirect_url(user)

    return FaceVerifyResponse(
        status="success",
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        redirect_url=redirect_url,
    )


@router.get("/status", response_model=FaceStatusResponse)
async def get_face_status(
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve face authentication status for authenticated user."""
    auth = req.headers.get("authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    user = await get_current_user(auth.split(" ")[1], db)

    enrolled_at_str = None
    if user.face_enrollment and user.face_enrollment.enrolled_at:
        enrolled_at_str = user.face_enrollment.enrolled_at.strftime("%d %B %Y")

    return FaceStatusResponse(
        face_authentication_enabled=bool(user.face_authentication_enabled and user.face_enrollment),
        face_enrollment_status=user.face_enrollment_status or "NOT_ENROLLED",
        enrolled_at=enrolled_at_str,
    )


@router.post("/disable")
async def disable_face(
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Disable face authentication for authenticated user."""
    auth = req.headers.get("authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    user = await get_current_user(auth.split(" ")[1], db)
    ip, ua = _extract_client_info(req)

    user.face_authentication_enabled = False
    user.face_enrollment_status = "REVOKED"
    if user.face_enrollment:
        user.face_enrollment.enrollment_status = "REVOKED"

    await db.commit()

    await log_biometric_event(
        db=db,
        user_id=user.id,
        event_type="DISABLE",
        ip_address=ip,
        user_agent=ua,
        details="User disabled face authentication.",
    )

    return {"status": "success", "message": "Face authentication disabled."}


@router.post("/dev-reset")
async def dev_reset_face(
    reset_req: DevResetRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Development/prototype utility to reset a demo/learner user's face enrollment.
    Allows testing re-enrollment flow.
    """
    ip, ua = _extract_client_info(req)
    user = await _find_user_by_identifier(db, reset_req.identifier)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.face_authentication_enabled = False
    user.face_enrollment_status = "NOT_ENROLLED"

    if user.face_enrollment:
        await db.delete(user.face_enrollment)

    await db.commit()

    await log_biometric_event(
        db=db,
        user_id=user.id,
        event_type="DEV_RESET",
        ip_address=ip,
        user_agent=ua,
        details="Development reset of face enrollment.",
    )

    return {"status": "success", "message": "Face enrollment reset."}
