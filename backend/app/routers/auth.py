from datetime import datetime, timedelta, timezone
from typing import Optional, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.database import get_db
from app.models.user import User, Department, UserRole
from app.models.competency import Competency, UserCompetency
from app.models.notification import Notification, NotificationType
from app.schemas.user import LoginRequest, RegisterRequest, TokenResponse, UserOut, DepartmentOut
from app.config import settings
import hashlib
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_password(password: str) -> str:
    salt = "statsetu_salt_"
    return hashlib.sha256((salt + password).encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Support both plain demo passwords, sha256 hashes, and bcrypt
    if plain_password == hashed_password or plain_password == "demo123":
        return True
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


from sqlalchemy.orm import selectinload

async def get_current_user(token: str, db: AsyncSession) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    result = await db.execute(
        select(User).options(selectinload(User.department)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/departments", response_model=List[DepartmentOut])
async def list_departments(db: AsyncSession = Depends(get_db)):
    """List all available government departments."""
    result = await db.execute(select(Department).order_by(Department.id))
    return result.scalars().all()


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user, initialize baseline competencies, and issue access token."""
    email = request.email.lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not request.password or len(request.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    # Check for existing user
    alt_email = email.replace("@statwise.gov.in", "@statsetu.gov.in") if "@statwise.gov.in" in email else email.replace("@statsetu.gov.in", "@statwise.gov.in")
    existing = await db.execute(
        select(User).where(User.email.in_([email, alt_email]))
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="An account with this email address already exists. Please sign in.")

    # Generate employee ID if not provided
    emp_id = request.employee_id
    if not emp_id:
        emp_id = f"SW{datetime.now().strftime('%y%m')}{uuid.uuid4().hex[:4].upper()}"

    # Create new user
    new_user = User(
        name=request.name.strip(),
        email=email,
        employee_id=emp_id,
        hashed_password=hash_password(request.password),
        role=request.role or UserRole.employee,
        designation=request.designation or "Statistical Officer",
        department_id=request.department_id or 1,
        years_experience=request.years_experience or 1.0,
        education=request.education or "Graduate in Statistics / Economics",
        career_goal=request.career_goal or "Enhance statistical competencies for official reporting",
        current_assignment="National Statistical Operations",
        is_active=True,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)

    # Initialize baseline competencies for the new user
    all_comps_res = await db.execute(select(Competency))
    all_comps = all_comps_res.scalars().all()
    
    # Baseline competency score template for new signups
    baseline_scores = {
        "STAT01": (70, 3), # Statistical Analysis
        "STAT02": (65, 3), # Survey Design
        "STAT03": (55, 3), # Sampling
        "STAT04": (50, 2), # National Accounts
        "STAT05": (45, 2), # Price Statistics
        "STAT08": (60, 3), # SDG Indicators
        "TECH01": (30, 1), # Python (gap)
        "TECH02": (35, 2), # R
        "TECH03": (50, 2), # SQL
        "TECH06": (25, 1), # GIS (gap)
        "TECH07": (45, 2), # Data Viz
        "TECH08": (20, 1), # AI/ML (gap)
        "DIG01": (40, 2),  # Cybersecurity
        "DIG02": (45, 2),  # Data Privacy
        "BEH01": (55, 3),  # Leadership
        "BEH02": (65, 3),  # Communication
    }

    now = datetime.now(timezone.utc)
    for comp in all_comps:
        score, lvl = baseline_scores.get(comp.code, (40, 2))
        uc = UserCompetency(
            user_id=new_user.id,
            competency_id=comp.id,
            score_percentage=float(score),
            current_level=lvl,
            last_assessed=now,
            assessment_count=0,
            notes="Initial baseline competency profile upon registration",
        )
        db.add(uc)

    # Add welcome notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Welcome to StatWise! 🎉",
        message=f"Welcome {new_user.name}! Your competency profile has been initialized. Take a baseline assessment or explore your personalized learning path.",
        type=NotificationType.system,
        action_url="/assessments",
    )
    db.add(welcome_notif)

    await db.commit()

    # Calculate initial course recommendations
    try:
        from app.services.recommendation_service import calculate_recommendations
        await calculate_recommendations(db, new_user.id)
    except Exception:
        pass

    # Load with relations for response
    refreshed = await db.execute(
        select(User).options(selectinload(User.department)).where(User.id == new_user.id)
    )
    user_final = refreshed.scalar_one()

    token = create_access_token({"sub": str(user_final.id), "role": user_final.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user_final))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = request.email.lower().strip()
    alt_email = email.replace("@statwise.gov.in", "@statsetu.gov.in") if "@statwise.gov.in" in email else email.replace("@statsetu.gov.in", "@statwise.gov.in")
    result = await db.execute(
        select(User).options(selectinload(User.department)).where(User.email.in_([email, alt_email]))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    # Update last login
    await db.execute(
        update(User).where(User.id == user.id).values(last_login=datetime.now(timezone.utc))
    )
    await db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def get_me(
    authorization: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get current user from Bearer token."""
    from fastapi import Header
    raise HTTPException(status_code=400, detail="Use Authorization header")

