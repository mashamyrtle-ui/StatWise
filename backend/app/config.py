import os
from pydantic_settings import BaseSettings
from typing import Optional

APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
BACKEND_ENV = os.path.join(BACKEND_DIR, ".env")
PROJECT_ENV = os.path.join(PROJECT_DIR, ".env")
EXAMPLE_ENV = os.path.join(BACKEND_DIR, ".env.example")


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./statsetu.db"
    SECRET_KEY: str = "statwise-hackathon-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    LLM_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-1.5-flash"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 20
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"

    def get_api_key(self) -> Optional[str]:
        # Priority: LLM_API_KEY -> GEMINI_API_KEY -> os.environ
        key = self.LLM_API_KEY or self.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("LLM_API_KEY")
        if key and key.strip() and key.strip() not in ("your-gemini-api-key-here", "your_gemini_api_key_here", "None"):
            return key.strip()
        return None

    class Config:
        env_file = (BACKEND_ENV, PROJECT_ENV, EXAMPLE_ENV, ".env")
        extra = "ignore"


settings = Settings()

