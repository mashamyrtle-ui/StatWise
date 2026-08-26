from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    match_score = Column(Float, nullable=False)  # 0-100
    gap_score = Column(Float, default=0.0)
    role_score = Column(Float, default=0.0)
    difficulty_score = Column(Float, default=0.0)
    career_score = Column(Float, default=0.0)
    dept_score = Column(Float, default=0.0)
    history_score = Column(Float, default=0.0)
    reason = Column(Text)
    priority_rank = Column(Integer)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="recommendations")
    course = relationship("Course", back_populates="recommendations")
