import datetime
from sqlalchemy import String, Integer, Date, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, Dict, Any
from app.models.base import TimeStampedBase

class StudyPlan(TimeStampedBase):
    __tablename__ = "study_plans"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subjects: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    exam_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    available_hours_per_day: Mapped[float] = mapped_column(Integer, default=4, nullable=False)
    current_level: Mapped[str] = mapped_column(String(50), default="Intermediate", nullable=False)  # Beginner, Intermediate, Advanced
    target_score: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Weekly/Daily breakdown schedule and milestones
    schedule: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    milestones: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    tips: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="study_plans")
