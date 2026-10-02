from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Dict, Any, List
from app.models.base import TimeStampedBase

class CodeGeneration(TimeStampedBase):
    __tablename__ = "code_generations"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    problem_description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)
    generated_code: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    time_complexity: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    space_complexity: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    example_input: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    example_output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    test_cases: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, default=list, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="code_generations")
