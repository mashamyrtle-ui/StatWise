from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    employee = "employee"
    trainer = "trainer"
    admin = "admin"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    code = Column(String(20), unique=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(500), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.employee, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    designation = Column(String(200))
    current_assignment = Column(String(500))
    years_experience = Column(Float, default=0)
    education = Column(String(500))
    career_goal = Column(Text)
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    department = relationship("Department", back_populates="users", lazy="selectin")
    user_competencies = relationship("UserCompetency", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    learning_history = relationship("LearningHistory", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="user", cascade="all, delete-orphan")

