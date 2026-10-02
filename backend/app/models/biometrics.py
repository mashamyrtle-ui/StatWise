from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FaceEnrollment(Base):
    __tablename__ = "face_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    biometric_template_encrypted = Column(Text, nullable=False)
    enrollment_status = Column(String(50), default="ENROLLED", nullable=False) # ENROLLED, REVOKED, NOT_ENROLLED
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    model_version = Column(String(100), default="facenet-64d-v1")
    consent_version = Column(String(50), default="v1.0")
    consent_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="face_enrollment")


class BiometricAuditLog(Base):
    __tablename__ = "biometric_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(100), nullable=False)  # ENROLLMENT, RE_ENROLLMENT, VERIFICATION_SUCCESS, VERIFICATION_FAILURE, DISABLE, DEV_RESET
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details = Column(String(500), nullable=True)  # Strictly sanitized metadata — no raw biometrics
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="biometric_audit_logs")
