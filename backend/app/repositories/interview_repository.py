from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.interview import InterviewSession, InterviewQuestion
from app.repositories.base_repository import BaseRepository

class InterviewRepository(BaseRepository[InterviewSession]):
    def __init__(self, session: AsyncSession):
        super().__init__(InterviewSession, session)

    async def get_user_interviews(self, user_id: str, limit: int = 50) -> Sequence[InterviewSession]:
        stmt = (
            select(InterviewSession)
            .options(selectinload(InterviewSession.questions))
            .where(InterviewSession.user_id == user_id)
            .order_by(InterviewSession.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_interview_with_questions(self, session_id: str, user_id: str) -> Optional[InterviewSession]:
        stmt = (
            select(InterviewSession)
            .options(selectinload(InterviewSession.questions))
            .where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_interview_session(
        self,
        user_id: str,
        topic: str,
        difficulty: str,
        target_role: str,
        questions_data: list
    ) -> InterviewSession:
        interview = InterviewSession(
            user_id=user_id,
            topic=topic,
            difficulty=difficulty,
            target_role=target_role
        )
        self.session.add(interview)
        await self.session.flush()

        for q in questions_data:
            q_obj = InterviewQuestion(
                session_id=interview.id,
                question=q["question"],
                ideal_answer=q.get("ideal_answer"),
                follow_up_question=q.get("follow_up_question")
            )
            self.session.add(q_obj)

        await self.session.flush()
        await self.session.refresh(interview)
        return await self.get_interview_with_questions(interview.id, user_id)

    async def update_question_answer(
        self,
        question_id: str,
        user_answer: str,
        feedback: str,
        score: float,
        ideal_answer: Optional[str] = None,
        follow_up: Optional[str] = None
    ) -> Optional[InterviewQuestion]:
        stmt = select(InterviewQuestion).where(InterviewQuestion.id == question_id)
        result = await self.session.execute(stmt)
        q = result.scalar_one_or_none()
        if q:
            q.user_answer = user_answer
            q.feedback = feedback
            q.score = score
            if ideal_answer:
                q.ideal_answer = ideal_answer
            if follow_up:
                q.follow_up_question = follow_up
            await self.session.flush()
            await self.session.refresh(q)
        return q
