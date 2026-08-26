from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class NotificationType(str, enum.Enum):
    assessment_due = "assessment_due"
    competency_update = "competency_update"
    new_recommendation = "new_recommendation"
    course_match = "course_match"
    learning_milestone = "learning_milestone"
    system = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SAEnum(NotificationType), default=NotificationType.system)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    action_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
