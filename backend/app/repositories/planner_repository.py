from typing import Optional, Sequence
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.study_plan import StudyPlan
from app.repositories.base_repository import BaseRepository

class PlannerRepository(BaseRepository[StudyPlan]):
    def __init__(self, session: AsyncSession):
        super().__init__(StudyPlan, session)

    async def get_user_plans(self, user_id: str, limit: int = 50) -> Sequence[StudyPlan]:
        stmt = (
            select(StudyPlan)
            .where(StudyPlan.user_id == user_id)
            .order_by(StudyPlan.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_study_plan(
        self,
        user_id: str,
        title: str,
        subjects: list,
        exam_date: datetime.date,
        available_hours_per_day: float,
        current_level: str,
        target_score: Optional[str],
        schedule: dict,
        milestones: list,
        tips: list
    ) -> StudyPlan:
        plan = StudyPlan(
            user_id=user_id,
            title=title,
            subjects=subjects,
            exam_date=exam_date,
            available_hours_per_day=available_hours_per_day,
            current_level=current_level,
            target_score=target_score,
            schedule=schedule,
            milestones=milestones,
            tips=tips
        )
        return await self.create(plan)
