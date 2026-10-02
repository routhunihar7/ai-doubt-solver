from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List, Union
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Doubt Solver – AI Academic Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    JWT_SECRET: str = "super-secret-production-grade-key-ai-doubt-solver-2026-x99"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    @property
    def effective_jwt_secret(self) -> str:
        return self.SECRET_KEY if self.SECRET_KEY else self.JWT_SECRET
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./academic_assistant.db",
        description="Async database connection string. Supports SQLite and PostgreSQL (postgresql+asyncpg://)"
    )
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = True
    
    # AI / Groq
    GROQ_API_KEY: str = Field(default="", description="Groq API key for LLM generation")
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    GROQ_FAST_MODEL: str = "openai/gpt-oss-120b"
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://ai-doubt-solver.vercel.app",
        "*"
    ]
    
    # File Storage
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_UPLOAD_SIZE_MB: int = 15
    
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
