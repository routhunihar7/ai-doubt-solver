from sqlalchemy import String, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any
from app.models.base import TimeStampedBase

class User(TimeStampedBase):
    __tablename__ = "users"
    
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Store learning preferences like subjects of interest, target exams, theme, etc.
    preferences: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    quiz_sessions: Mapped[List["QuizSession"]] = relationship("QuizSession", back_populates="user", cascade="all, delete-orphan")
    code_generations: Mapped[List["CodeGeneration"]] = relationship("CodeGeneration", back_populates="user", cascade="all, delete-orphan")
    notes: Mapped[List["NoteSummary"]] = relationship("NoteSummary", back_populates="user", cascade="all, delete-orphan")
    interview_sessions: Mapped[List["InterviewSession"]] = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    study_plans: Mapped[List["StudyPlan"]] = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    activities: Mapped[List["ActivityLog"]] = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
