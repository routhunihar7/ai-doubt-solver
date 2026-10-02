from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, Dict, Any
from app.models.base import TimeStampedBase

class NoteSummary(TimeStampedBase):
    __tablename__ = "notes"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), default="text", nullable=False)  # 'text', 'document'
    original_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    key_points: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    important_concepts: Mapped[List[Dict[str, str]]] = mapped_column(JSON, default=list, nullable=False)
    keywords: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    quick_revision_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notes")
