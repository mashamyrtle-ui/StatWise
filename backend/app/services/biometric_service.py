import base64
import hashlib
import json
import logging
import math
import secrets
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.config import settings
from app.models.user import User
from app.models.biometrics import FaceEnrollment, BiometricAuditLog

logger = logging.getLogger("statwise.biometrics")

# In-memory rate limiting: { identifier: [timestamp1, timestamp2, ...] }
FAILED_VERIFICATION_ATTEMPTS: Dict[str, List[float]] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 300  # 5 minutes

# Supported liveness challenges
LIVENESS_CHALLENGES = ["blink", "turn_left", "turn_right", "smile"]

# Similarity threshold (Cosine similarity: -1.0 to 1.0)
# A cosine similarity >= 0.70 corresponds to >= 85% match confidence
COSINE_SIMILARITY_THRESHOLD = 0.70


def _get_fernet() -> Fernet:
    """Derive deterministic 32-byte Fernet key from SECRET_KEY for AES-128-CBC encryption."""
    derived_key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(derived_key)


def encrypt_biometric_template(raw_template: str) -> str:
    """Encrypt biometric vector template at rest."""
    f = _get_fernet()
    return f.encrypt(raw_template.encode("utf-8")).decode("utf-8")


def decrypt_biometric_template(encrypted_template: str) -> str:
    """Decrypt biometric vector template in memory for verification."""
    f = _get_fernet()
    return f.decrypt(encrypted_template.encode("utf-8")).decode("utf-8")


def parse_vector_from_template(template_str: str) -> Optional[List[float]]:
    """Extract float vector array from JSON template string or array."""
    if not template_str:
        return None
    try:
        data = json.loads(template_str)
        if isinstance(data, list):
            return [float(x) for x in data]
        if isinstance(data, dict):
            if "vector" in data and isinstance(data["vector"], list):
                return [float(x) for x in data["vector"]]
    except Exception:
        pass
    return None


def calculate_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> Tuple[float, float]:
    """
    Computes cosine similarity and 0-100 confidence score between two feature vectors.
    Returns: (cosine_similarity, confidence_percentage)
    """
    length = min(len(vec_a), len(vec_b))
    if length == 0:
        return 0.0, 0.0

    dot_product = sum(vec_a[i] * vec_b[i] for i in range(length))
    mag_a = math.sqrt(sum(vec_a[i] ** 2 for i in range(length)))
    mag_b = math.sqrt(sum(vec_b[i] ** 2 for i in range(length)))

    if mag_a == 0 or mag_b == 0:
        return 0.0, 0.0

    sim = dot_product / (mag_a * mag_b)
    sim = max(-1.0, min(1.0, sim))
    confidence = max(0.0, min(100.0, round(((sim + 1.0) / 2.0) * 100.0, 1)))
    return sim, confidence


def check_rate_limit(identifier: str) -> Tuple[bool, int]:
    """
    Checks if too many failed verification attempts have occurred for an identifier.
    Returns: (is_locked, remaining_seconds)
    """
    norm = identifier.lower().strip()
    now = time.time()
    attempts = [t for t in FAILED_VERIFICATION_ATTEMPTS.get(norm, []) if now - t < LOCKOUT_SECONDS]
    FAILED_VERIFICATION_ATTEMPTS[norm] = attempts

    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        oldest = min(attempts)
        remaining = int(LOCKOUT_SECONDS - (now - oldest))
        return True, max(1, remaining)

    return False, 0


def record_failed_attempt(identifier: str) -> None:
    """Record a failed verification attempt timestamp for rate limiting."""
    norm = identifier.lower().strip()
    now = time.time()
    attempts = [t for t in FAILED_VERIFICATION_ATTEMPTS.get(norm, []) if now - t < LOCKOUT_SECONDS]
    attempts.append(now)
    FAILED_VERIFICATION_ATTEMPTS[norm] = attempts


def clear_failed_attempts(identifier: str) -> None:
    """Clear failed attempts on successful verification."""
    norm = identifier.lower().strip()
    if norm in FAILED_VERIFICATION_ATTEMPTS:
        del FAILED_VERIFICATION_ATTEMPTS[norm]


def generate_challenge() -> Tuple[str, str]:
    """Generates random liveness action and signed challenge token."""
    challenge = secrets.choice(LIVENESS_CHALLENGES)
    nonce = secrets.token_hex(8)
    timestamp = int(time.time())
    sig_payload = f"{challenge}:{nonce}:{timestamp}:{settings.SECRET_KEY}"
    sig = hashlib.sha256(sig_payload.encode()).hexdigest()[:16]
    token = f"{challenge}:{nonce}:{timestamp}:{sig}"
    return challenge, token


def verify_challenge_token(token: str, max_age_seconds: int = 120) -> Tuple[bool, Optional[str]]:
    """Verifies that challenge token is authentic and within time window."""
    if not token or ":" not in token:
        return False, None
    parts = token.split(":")
    if len(parts) != 4:
        return False, None
    challenge, nonce, ts_str, sig = parts
    try:
        ts = int(ts_str)
    except ValueError:
        return False, None

    if abs(time.time() - ts) > max_age_seconds:
        return False, None

    expected_sig = hashlib.sha256(f"{challenge}:{nonce}:{ts_str}:{settings.SECRET_KEY}".encode()).hexdigest()[:16]
    if secrets.compare_digest(sig, expected_sig):
        return True, challenge

    return False, None


async def log_biometric_event(
    db: AsyncSession,
    user_id: Optional[int],
    event_type: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[str] = None,
) -> None:
    """Write an audit entry. Never stores raw biometric representations."""
    log_entry = BiometricAuditLog(
        user_id=user_id,
        event_type=event_type,
        ip_address=ip_address,
        user_agent=user_agent[:500] if user_agent else None,
        details=details[:500] if details else None,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log_entry)
    await db.commit()
