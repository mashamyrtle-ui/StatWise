from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.user import UserOut


class FaceCheckRequest(BaseModel):
    identifier: str = Field(..., description="Email or Employee ID of user")


class FaceCheckResponse(BaseModel):
    exists: bool
    name: Optional[str] = None
    employee_id: Optional[str] = None
    face_enrollment_status: str = "NOT_ENROLLED"
    face_authentication_enabled: bool = False
    liveness_challenge: str = "blink"
    challenge_token: str = ""


class FaceEnrollRequest(BaseModel):
    template: str = Field(..., description="Extracted biometric vector representation")
    consent: bool = Field(..., description="User explicit consent flag")
    consent_version: Optional[str] = "v1.0"
    quality_score: Optional[float] = 85.0


class FaceEnrollResponse(BaseModel):
    status: str
    face_enrollment_status: str
    enrolled_at: str
    message: str


class FaceVerifyRequest(BaseModel):
    identifier: str = Field(..., description="Email or Employee ID of user to verify")
    live_template: str = Field(..., description="Live captured biometric vector representation")
    challenge_token: Optional[str] = None
    liveness_response: Optional[str] = None


class FaceVerifyResponse(BaseModel):
    status: str
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    redirect_url: str


class FaceStatusResponse(BaseModel):
    face_authentication_enabled: bool
    face_enrollment_status: str
    enrolled_at: Optional[str] = None


class DevResetRequest(BaseModel):
    identifier: str = Field(..., description="Email or Employee ID of user to reset")
