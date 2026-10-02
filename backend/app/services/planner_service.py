from typing import List, Dict, Any, Optional
import datetime
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.planner_repository import PlannerRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.planner import StudyPlanGenerateRequest, StudyPlanResponse

class AIDaySchedule(BaseModel):
    day: str
    focus_subject: str
    hours: float
    tasks: List[str]

class AIMilestone(BaseModel):
    week: int
    title: str
    target: str

class AIStudyPlanOutput(BaseModel):
    title: str
    daily_schedule: List[AIDaySchedule]
    milestones: List[AIMilestone]
    tips: List[str]

PLANNER_SYSTEM_PROMPT = """You are an elite academic advisor and cognitive learning strategist.
Create an actionable, highly effective personalized study timetable and preparation roadmap.
Rules:
1. Distribute study hours pragmatically across all requested subjects based on spaced repetition and active recall.
2. Structure the `daily_schedule` covering 7 days (Monday through Sunday) with concrete focus topics and practical tasks.
3. Define weekly `milestones` leading up to the target exam date.
4. Include 3-5 high-leverage study tips for peak focus, memory retention, and mock test routines.
"""

class PlannerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.planner_repo = PlannerRepository(session)
        self.history_repo = HistoryRepository(session)

    async def generate_plan(self, user_id: str, request: StudyPlanGenerateRequest) -> StudyPlanResponse:
        today = datetime.date.today()
        days_left = (request.exam_date - today).days
        if days_left < 1:
            days_left = 1

        prompt = (
            f"Subjects to cover: {', '.join(request.subjects)}\n"
            f"Exam Date: {request.exam_date} ({days_left} days from today)\n"
            f"Daily Available Hours: {request.available_hours_per_day} hours/day\n"
            f"Current Preparation Level: {request.current_level}\n"
            f"Target Score/Goal: {request.target_score or 'Top Grade / 90%+'}\n\n"
            f"Please generate a complete 7-day routine, multi-week roadmap, and retention strategies."
        )

        ai_result: AIStudyPlanOutput = await ai_service.generate_structured(
            prompt=prompt,
            system_prompt=PLANNER_SYSTEM_PROMPT,
            schema_cls=AIStudyPlanOutput,
            temperature=0.3
        )

        schedule_dict = {
            day_item.day: {
                "focus_subject": day_item.focus_subject,
                "hours": day_item.hours,
                "tasks": day_item.tasks
            }
            for day_item in ai_result.daily_schedule
        }

        milestones_list = [m.model_dump() for m in ai_result.milestones]

        saved = await self.planner_repo.create_study_plan(
            user_id=user_id,
            title=ai_result.title or f"Study Plan: {', '.join(request.subjects[:2])}",
            subjects=request.subjects,
            exam_date=request.exam_date,
            available_hours_per_day=request.available_hours_per_day,
            current_level=request.current_level,
            target_score=request.target_score,
            schedule=schedule_dict,
            milestones=milestones_list,
            tips=ai_result.tips
        )

        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="planner",
            title=f"Study Plan Created: {saved.title}",
            description=f"{days_left} days roadmap ({request.available_hours_per_day} hrs/day)",
            reference_id=saved.id
        )

        return StudyPlanResponse(
            id=saved.id,
            title=saved.title,
            subjects=saved.subjects,
            exam_date=saved.exam_date,
            available_hours_per_day=saved.available_hours_per_day,
            current_level=saved.current_level,
            target_score=saved.target_score,
            schedule=saved.schedule,
            milestones=saved.milestones,
            tips=saved.tips,
            created_at=saved.created_at
        )
