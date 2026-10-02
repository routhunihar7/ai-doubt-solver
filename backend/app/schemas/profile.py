from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any, List
import datetime

class UserStatsResponse(BaseModel):
    total_questions_asked: int
    total_quizzes_completed: int
    average_quiz_score: float
    total_code_generations: int
    total_notes_summarized: int
    total_interviews_taken: int
    total_documents_uploaded: int
    total_study_plans: int

class ProfileResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    preferences: Dict[str, Any]
    created_at: datetime.datetime
    stats: UserStatsResponse

    model_config = ConfigDict(from_attributes=True)

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    target_exam: Optional[str] = None
    study_hours_target: Optional[float] = None
    favorite_subjects: Optional[List[str]] = None
    theme: Optional[str] = None
    custom_preferences: Optional[Dict[str, Any]] = None
