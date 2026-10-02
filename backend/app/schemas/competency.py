from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.competency import CompetencyCategory


class CompetencyBase(BaseModel):
    name: str
    code: Optional[str] = None
    category: CompetencyCategory
    description: Optional[str] = None


class CompetencyOut(CompetencyBase):
    id: int
    max_level: int = 5
    class Config:
        from_attributes = True


class UserCompetencyOut(BaseModel):
    id: int
    user_id: int
    competency_id: int
    current_level: int
    score_percentage: float
    confidence: Optional[str] = "Medium"
    primary_evidence: Optional[str] = None
    status: Optional[str] = "Verified"
    last_assessed: Optional[datetime] = None
    assessment_count: int
    competency: Optional[CompetencyOut] = None
    class Config:
        from_attributes = True


class UserCompetencyUpdate(BaseModel):
    competency_id: int
    score_percentage: float


class SkillGapItem(BaseModel):
    competency_id: int
    competency_name: str
    category: str
    current_level: int
    current_percentage: float
    required_level: int
    required_percentage: float
    gap: int
    gap_label: str  # None/Low/Medium/High
    priority: int
    explanation: str
    confidence: Optional[str] = "Medium"
    primary_evidence: Optional[str] = None


class SkillGapResponse(BaseModel):
    user_id: int
    gaps: List[SkillGapItem]
    summary: str
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int


class RoleRequirementOut(BaseModel):
    competency_id: int
    competency_name: str
    required_level: int
    priority: int
    class Config:
        from_attributes = True
