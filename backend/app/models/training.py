from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Enum as SAEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class TrainingProvider(str, enum.Enum):
    nssta = "NSSTA"
    tpac = "TPAC"
    mospi = "MoSPI"
    csc = "CSC Academy"


class TrainingProgramme(Base):
    __tablename__ = "training_programmes"

    id = Column(Integer, primary_key=True, index=True)
    programme_code = Column(String(50), unique=True)
    title = Column(String(500), nullable=False)
    provider = Column(SAEnum(TrainingProvider), nullable=False)
    training_area = Column(String(200))
    description = Column(Text)
    target_audience = Column(Text)
    duration_days = Column(Integer)
    eligibility = Column(Text)
    competency_ids = Column(JSON)  # list of competency IDs
    schedule_info = Column(Text)
    venue = Column(String(500))
    contact_email = Column(String(200))
    external_url = Column(String(500))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
