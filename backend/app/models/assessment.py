from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class DifficultyLevel(str, enum.Enum):
    easy = "Easy"
    medium = "Medium"
    hard = "Hard"
    adaptive = "Adaptive"


class QuestionType(str, enum.Enum):
    mcq = "MCQ"
    true_false = "True/False"


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    difficulty = Column(SAEnum(DifficultyLevel), default=DifficultyLevel.medium)
    total_questions = Column(Integer, default=20)
    time_limit_minutes = Column(Integer, default=30)
    is_diagnostic = Column(Boolean, default=False)
    competency_ids = Column(JSON)  # list of competency IDs covered
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    questions = relationship("Question", back_populates="assessment", lazy="selectin")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", lazy="selectin")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    competency_id = Column(Integer, ForeignKey("competencies.id"))
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_answer = Column(String(1), nullable=False)  # A, B, C, D
    explanation = Column(Text)
    difficulty = Column(SAEnum(DifficultyLevel), default=DifficultyLevel.medium)
    question_type = Column(SAEnum(QuestionType), default=QuestionType.mcq)
    source_reference = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assessment = relationship("Assessment", back_populates="questions", lazy="selectin")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    answers = Column(JSON)  # {question_id: selected_option}
    score_percentage = Column(Float)
    competency_scores = Column(JSON)  # {competency_id: score}
    time_taken_seconds = Column(Integer)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="assessment_attempts", lazy="selectin")
    assessment = relationship("Assessment", back_populates="attempts", lazy="selectin")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("generated_quizzes.id"), nullable=False)
    answers = Column(JSON)  # {question_id: selected_option}
    score_percentage = Column(Float)
    correct_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    competency_updates = Column(JSON)  # {competency_id: {before, after}}
    time_taken_seconds = Column(Integer)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="quiz_attempts", lazy="selectin")
    quiz = relationship("GeneratedQuiz", back_populates="attempts", lazy="selectin")
