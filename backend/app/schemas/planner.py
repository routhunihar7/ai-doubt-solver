from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
import datetime

class StudyPlanGenerateRequest(BaseModel):
    subjects: List[str] = Field(..., min_length=1, description="List of subjects or topics to master")
    exam_date: datetime.date = Field(..., description="Target exam date")
    available_hours_per_day: float = Field(4.0, ge=0.5, le=18.0, description="Available hours per day")
    current_level: str = Field("Intermediate", description="Beginner, Intermediate, or Advanced")
    target_score: Optional[str] = Field("Top Grade / 90%+", description="Goal or target score")

class DaySchedule(BaseModel):
    day: str
    focus_subject: str
    hours: float
    tasks: List[str]

class MilestoneItem(BaseModel):
    week: int
    title: str
    target: str

class StudyPlanResponse(BaseModel):
    id: Optional[str] = None
    title: str
    subjects: List[str]
    exam_date: datetime.date
    available_hours_per_day: float
    current_level: str
    target_score: Optional[str] = None
    schedule: Dict[str, Any]  # e.g., {"Monday": [...], "Tuesday": [...]}
    milestones: List[Dict[str, Any]]
    tips: List[str]
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
