from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class CompetencyCategory(str, enum.Enum):
    statistical = "Statistical"
    technical = "Technical"
    digital_governance = "Digital Governance"
    behavioural = "Behavioural & Managerial"


class ProficiencyLevel(str, enum.Enum):
    beginner = "Beginner"
    basic = "Basic"
    intermediate = "Intermediate"
    advanced = "Advanced"
    expert = "Expert"


class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    code = Column(String(50), unique=True)
    category = Column(SAEnum(CompetencyCategory), nullable=False)
    description = Column(Text)
    # Level 1-5 as proficiency levels
    max_level = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_competencies = relationship("UserCompetency", back_populates="competency")
    course_competencies = relationship("CourseCompetency", back_populates="competency")
    role_requirements = relationship("RoleCompetencyRequirement", back_populates="competency")


class RoleCompetencyRequirement(Base):
    """Defines required competency levels per role/designation."""
    __tablename__ = "role_competency_requirements"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(200), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    required_level = Column(Integer, nullable=False)  # 1-5
    priority = Column(Integer, default=1)  # 1=Low 2=Medium 3=High

    competency = relationship("Competency", back_populates="role_requirements", lazy="selectin")


class UserCompetency(Base):
    __tablename__ = "user_competencies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    current_level = Column(Integer, default=1)  # 1-5
    score_percentage = Column(Float, default=0.0)  # 0-100
    confidence = Column(String(50), default="Medium")
    primary_evidence = Column(String(500), nullable=True)
    status = Column(String(50), default="Verified")
    last_assessed = Column(DateTime(timezone=True))
    assessment_count = Column(Integer, default=0)
    notes = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="user_competencies")
    competency = relationship("Competency", back_populates="user_competencies", lazy="selectin")
