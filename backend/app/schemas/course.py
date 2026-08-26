from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CourseCompetencyOut(BaseModel):
    competency_id: int
    competency_name: Optional[str] = None
    proficiency_gained: int
    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: int
    course_code: Optional[str] = None
    title: str
    provider: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    duration_hours: Optional[float] = None
    category: Optional[str] = None
    rating: float
    rating_count: int
    tags: Optional[List[str]] = []
    external_url: Optional[str] = None
    competencies: List[CourseCompetencyOut] = []
    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: int
    course_id: int
    match_score: float
    gap_score: float
    role_score: float
    difficulty_score: float
    career_score: float
    dept_score: float
    history_score: float
    reason: str
    priority_rank: int
    course: Optional[CourseOut] = None
    class Config:
        from_attributes = True


class LearningHistoryOut(BaseModel):
    id: int
    course_id: int
    status: str
    progress_percentage: float
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    hours_spent: float
    score: Optional[float] = None
    course: Optional[CourseOut] = None
    class Config:
        from_attributes = True


class LearningPathItemOut(BaseModel):
    id: int
    course_id: int
    order_index: int
    status: str
    reason: Optional[str] = None
    course: Optional[CourseOut] = None
    class Config:
        from_attributes = True
