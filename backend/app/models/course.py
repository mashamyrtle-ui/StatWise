from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class CourseProvider(str, enum.Enum):
    igot = "iGOT Karmayogi"
    nssta = "NSSTA"
    tpac = "TPAC"
    internal = "Internal"
    other_govt = "Other Govt Training"


class CourseStatus(str, enum.Enum):
    not_started = "Not Started"
    enrolled = "Enrolled"
    in_progress = "In Progress"
    completed = "Completed"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True)
    title = Column(String(500), nullable=False)
    provider = Column(SAEnum(CourseProvider), nullable=False)
    description = Column(Text)
    difficulty = Column(String(50))
    duration_hours = Column(Float)
    category = Column(String(200))
    rating = Column(Float, default=4.0)
    rating_count = Column(Integer, default=0)
    prerequisites = Column(JSON)  # list of course IDs
    tags = Column(JSON)  # list of tag strings
    external_url = Column(String(500))
    thumbnail_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    competencies = relationship("CourseCompetency", back_populates="course", lazy="selectin")
    learning_history = relationship("LearningHistory", back_populates="course", lazy="selectin")
    recommendations = relationship("Recommendation", back_populates="course", lazy="selectin")


class CourseCompetency(Base):
    """Maps courses to competencies they develop."""
    __tablename__ = "course_competencies"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    proficiency_gained = Column(Integer, default=1)  # levels gained on completion

    course = relationship("Course", back_populates="competencies", lazy="selectin")
    competency = relationship("Competency", back_populates="course_competencies", lazy="selectin")


class LearningHistory(Base):
    __tablename__ = "learning_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    status = Column(SAEnum(CourseStatus), default=CourseStatus.not_started)
    progress_percentage = Column(Float, default=0.0)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    hours_spent = Column(Float, default=0.0)
    score = Column(Float)
    certificate_url = Column(String(500))

    user = relationship("User", back_populates="learning_history", lazy="selectin")
    course = relationship("Course", back_populates="learning_history", lazy="selectin")


class LearningPathItem(Base):
    __tablename__ = "learning_path_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order_index = Column(Integer, default=0)
    status = Column(String(50), default="Recommended")  # Completed/InProgress/Recommended/Locked
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
