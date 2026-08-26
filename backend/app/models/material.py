from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MaterialStatus(str, enum.Enum):
    processing = "Processing"
    ready = "Ready"
    failed = "Failed"


class QuestionStatus(str, enum.Enum):
    generated = "Generated"
    approved = "Approved"
    edited = "Edited"
    rejected = "Rejected"


class UploadedMaterial(Base):
    __tablename__ = "uploaded_materials"

    id = Column(Integer, primary_key=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_type = Column(String(20))  # pdf, docx, pptx
    file_size_bytes = Column(Integer)
    file_path = Column(String(1000))
    status = Column(SAEnum(MaterialStatus), default=MaterialStatus.processing)
    extracted_text = Column(Text)
    page_count = Column(Integer)
    concepts_detected = Column(JSON)  # list of detected concepts
    competencies_detected = Column(JSON)  # list of competency names
    chunk_count = Column(Integer)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quizzes = relationship("GeneratedQuiz", back_populates="material", lazy="selectin")


class GeneratedQuiz(Base):
    __tablename__ = "generated_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("uploaded_materials.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500))
    description = Column(Text)
    difficulty = Column(String(50))
    question_count = Column(Integer)
    competency_focus = Column(String(200))
    language = Column(String(50), default="English")
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("UploadedMaterial", back_populates="quizzes", lazy="selectin")
    questions = relationship("GeneratedQuestion", back_populates="quiz", cascade="all, delete-orphan", lazy="selectin")
    attempts = relationship("QuizAttempt", back_populates="quiz", lazy="selectin")


class GeneratedQuestion(Base):
    __tablename__ = "generated_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("generated_quizzes.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"))
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_answer = Column(String(1), nullable=False)
    explanation = Column(Text)
    difficulty = Column(String(50))
    competency_name = Column(String(200))
    source_reference = Column(String(500))
    status = Column(SAEnum(QuestionStatus), default=QuestionStatus.generated)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("GeneratedQuiz", back_populates="questions", lazy="selectin")
