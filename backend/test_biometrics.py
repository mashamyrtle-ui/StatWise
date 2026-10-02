import asyncio
import json
import math
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.models.biometrics import FaceEnrollment, BiometricAuditLog

def pseudo_random_vector(seed: str, dims: int = 64):
    h = 0
    for char in seed:
        h = (h << 5) - h + ord(char)
        h &= 0xFFFFFFFF
    vec = []
    for _ in range(dims):
        h = (h * 1664525 + 1013904223) & 0xFFFFFFFF
        vec.append((h / 4294967296) * 2 - 1)
    mag = math.sqrt(sum(v * v for v in vec)) or 1
    return [v / mag for v in vec]

async def run_tests():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("=== TEST 1: Health check ===")
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("PASS: Health check ok")

        print("\n=== TEST 2: 1:1 Pre-check for Un-enrolled Demo Learner (DEMO-L001) ===")
        res = await client.post("/api/auth/biometric/check-user", json={"identifier": "DEMO-L001"})
        assert res.status_code == 200, f"Check user failed: {res.text}"
        data = res.json()
        print("Response:", data)
        assert data["exists"] is True
        assert data["face_enrollment_status"] == "NOT_ENROLLED"
        assert data["face_authentication_enabled"] is False
        assert "challenge_token" in data
        challenge_token = data["challenge_token"]
        print("PASS: DEMO-L001 check correctly returns exists=True and face_enrollment_status=NOT_ENROLLED")

        print("\n=== TEST 3: 1:1 Pre-check for Enrolled User (MOS2024001 - Ananya) ===")
        res = await client.post("/api/auth/biometric/check-user", json={"identifier": "MOS2024001"})
        assert res.status_code == 200
        ananya_data = res.json()
        print("Response:", ananya_data)
        assert ananya_data["exists"] is True
        assert ananya_data["face_enrollment_status"] == "ENROLLED"
        assert ananya_data["face_authentication_enabled"] is True
        print("PASS: Ananya check correctly returns face_enrollment_status=ENROLLED")

        print("\n=== TEST 4: Attempt Face Verification for Un-enrolled User (Should Fail with 400) ===")
        v_dummy = pseudo_random_vector("test dummy")
        dummy_tpl = json.dumps({"version": "1.0", "vector": v_dummy})
        res = await client.post("/api/auth/biometric/verify", json={
            "identifier": "DEMO-L001",
            "live_template": dummy_tpl
        })
        assert res.status_code == 400
        print("Response detail:", res.json()["detail"])
        assert "not completed face enrollment" in res.json()["detail"].lower()
        print("PASS: Un-enrolled account correctly rejected before verification")

        print("\n=== TEST 5: Enroll Face for DEMO-L001 ===")
        # First authenticate DEMO-L001 with password to get token
        login_res = await client.post("/api/auth/login", json={
            "email": "learner@statwise.gov.in",
            "password": "demo123"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        print("Authenticated DEMO-L001, token obtained")

        # Now enroll face with multi-frame vector
        learner_vec = pseudo_random_vector("demo learner reference face")
        learner_tpl = json.dumps({"version": "1.0", "type": "facenet-64d-enrolled", "vector": learner_vec})
        enroll_res = await client.post(
            "/api/auth/biometric/enroll",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "template": learner_tpl,
                "consent": True,
                "consent_version": "v1.0",
                "quality_score": 95.0
            }
        )
        assert enroll_res.status_code == 200, f"Enroll failed: {enroll_res.text}"
        enroll_data = enroll_res.json()
        print("Enroll response:", enroll_data)
        assert enroll_data["face_enrollment_status"] == "ENROLLED"
        print("PASS: Face enrollment succeeded and status is ENROLLED")

        print("\n=== TEST 6: Verify with Matching Live Face ===")
        # Live vector with tiny noise (98% cosine similarity)
        live_vec = [x + 0.005 for x in learner_vec]
        mag = math.sqrt(sum(x * x for x in live_vec))
        live_vec = [x / mag for x in live_vec]
        live_tpl = json.dumps({"version": "1.0", "type": "facenet-64d-live", "vector": live_vec})

        verify_res = await client.post("/api/auth/biometric/verify", json={
            "identifier": "DEMO-L001",
            "live_template": live_tpl,
            "challenge_token": challenge_token
        })
        assert verify_res.status_code == 200, f"Verification failed: {verify_res.text}"
        verify_data = verify_res.json()
        print("Verify response:", {k: v for k, v in verify_data.items() if k != "access_token"})
        assert verify_data["status"] == "success"
        assert verify_data["redirect_url"] == "/dashboard"
        assert verify_data["user"]["role"] == "employee"
        print("PASS: Live face verification matched and issued authenticated session with role=employee -> /dashboard")

        print("\n=== TEST 7: Verify with Impostor Face (Should Fail with 401) ===")
        impostor_vec = pseudo_random_vector("completely different impostor")
        impostor_tpl = json.dumps({"version": "1.0", "type": "facenet-64d-live", "vector": impostor_vec})
        fail_res = await client.post("/api/auth/biometric/verify", json={
            "identifier": "DEMO-L001",
            "live_template": impostor_tpl
        })
        assert fail_res.status_code == 401
        print("Impostor response detail:", fail_res.json()["detail"])
        assert "unsuccessful" in fail_res.json()["detail"].lower()
        print("PASS: Impostor face correctly rejected with generic security message")

        print("\n=== TEST 8: Check Biometric Audit Logs (Zero Raw Biometrics) ===")
        async with AsyncSessionLocal() as db:
            logs_res = await db.execute(select(BiometricAuditLog).order_by(BiometricAuditLog.id.desc()).limit(5))
            logs = logs_res.scalars().all()
            for l in logs:
                print(f"Log ID {l.id}: Event={l.event_type}, Details={l.details}")
                assert "vector" not in (l.details or "").lower()
                assert "template" not in (l.details or "").lower()
        print("PASS: Audit logs verified — strictly sanitized metadata, zero raw biometric data")

        print("\n=== TEST 9: Dev Reset Face Enrollment ===")
        reset_res = await client.post("/api/auth/biometric/dev-reset", json={"identifier": "DEMO-L001"})
        assert reset_res.status_code == 200
        print("Reset response:", reset_res.json())

        # Check status after reset
        check_after = await client.post("/api/auth/biometric/check-user", json={"identifier": "DEMO-L001"})
        assert check_after.json()["face_enrollment_status"] == "NOT_ENROLLED"
        print("PASS: Dev reset successfully reset DEMO-L001 back to NOT_ENROLLED")

        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
