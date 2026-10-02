import datetime
from sqlalchemy import String, Integer, Float, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any
from app.models.base import TimeStampedBase

class QuizSession(TimeStampedBase):
    __tablename__ = "quiz_sessions"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="quiz_sessions")
    questions: Mapped[List["QuizQuestion"]] = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.created_at")

class QuizQuestion(TimeStampedBase):
    __tablename__ = "quiz_questions"
    
    quiz_id: Mapped[str] = mapped_column(String(36), ForeignKey("quiz_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    question: Mapped[str] = mapped_column(String(1000), nullable=False)
    options: Mapped[List[str]] = mapped_column(JSON, nullable=False)  # List of 4 strings
    correct_answer: Mapped[str] = mapped_column(String(500), nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    user_answer: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Relationships
    quiz: Mapped["QuizSession"] = relationship("QuizSession", back_populates="questions")
