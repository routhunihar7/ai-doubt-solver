import datetime
from sqlalchemy import String, Text, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, Dict, Any
from app.models.base import TimeStampedBase

class InterviewSession(TimeStampedBase):
    __tablename__ = "interview_sessions"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    topic: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 'Java', 'Python', 'SQL', 'DBMS', 'OOP', 'Networking', 'Data Structures', 'Algorithms', 'Operating Systems', 'AI/ML'
    difficulty: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)  # 'Easy', 'Medium', 'Hard'
    target_role: Mapped[Optional[str]] = mapped_column(String(100), default="Software Engineer", nullable=True)
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="interview_sessions")
    questions: Mapped[List["InterviewQuestion"]] = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.created_at")

class InterviewQuestion(TimeStampedBase):
    __tablename__ = "interview_questions"
    
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    user_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # e.g., 0-10 or 0-100
    ideal_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    follow_up_question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="questions")
