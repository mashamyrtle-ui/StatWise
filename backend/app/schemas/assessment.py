from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class QuestionOut(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: str
    competency_id: Optional[int] = None
    class Config:
        from_attributes = True


class QuestionWithAnswer(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str
    competency_id: Optional[int] = None
    competency_name: Optional[str] = None
    source_reference: Optional[str] = None
    class Config:
        from_attributes = True


class AssessmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    difficulty: str
    total_questions: int
    time_limit_minutes: int
    is_diagnostic: bool
    questions: List[QuestionOut] = []
    class Config:
        from_attributes = True


class AssessmentSubmit(BaseModel):
    answers: Dict[str, str]  # {question_id: selected_option}
    time_taken_seconds: Optional[int] = None


class AssessmentResult(BaseModel):
    attempt_id: int
    assessment_id: int
    score_percentage: float
    correct_count: int
    total_count: int
    competency_scores: Dict[str, float]
    competency_updates: List[Dict[str, Any]]
    question_results: List[Dict[str, Any]]
    summary: str


class GeneratedQuestionOut(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str
    competency_name: Optional[str] = None
    source_reference: Optional[str] = None
    status: str
    order_index: int
    class Config:
        from_attributes = True


class GeneratedQuizOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    difficulty: str
    question_count: int
    competency_focus: Optional[str] = None
    is_published: bool
    questions: List[GeneratedQuestionOut] = []
    material_filename: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


class QuizSubmit(BaseModel):
    answers: Dict[str, str]
    time_taken_seconds: Optional[int] = None


class QuizResult(BaseModel):
    attempt_id: int
    quiz_id: int
    score_percentage: float
    correct_count: int
    total_count: int
    question_results: List[Dict[str, Any]]
    competency_updates: List[Dict[str, Any]]
    summary: str


class GenerateQuizRequest(BaseModel):
    material_id: int
    question_count: int = 10
    difficulty: str = "Medium"
    competency_focus: Optional[str] = None
    language: str = "English"


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[str] = None
    status: Optional[str] = None
