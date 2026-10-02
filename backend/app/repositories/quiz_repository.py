from typing import Optional, List, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import datetime
from app.models.quiz import QuizSession, QuizQuestion
from app.repositories.base_repository import BaseRepository

class QuizRepository(BaseRepository[QuizSession]):
    def __init__(self, session: AsyncSession):
        super().__init__(QuizSession, session)

    async def get_user_quizzes(self, user_id: str, limit: int = 50) -> Sequence[QuizSession]:
        stmt = (
            select(QuizSession)
            .options(selectinload(QuizSession.questions))
            .where(QuizSession.user_id == user_id)
            .order_by(QuizSession.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_quiz_with_questions(self, quiz_id: str, user_id: str) -> Optional[QuizSession]:
        stmt = (
            select(QuizSession)
            .options(selectinload(QuizSession.questions))
            .where(QuizSession.id == quiz_id, QuizSession.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_quiz_with_questions(
        self,
        user_id: str,
        topic: str,
        subject: Optional[str],
        difficulty: str,
        total_questions: int,
        questions_data: List[dict]
    ) -> QuizSession:
        quiz = QuizSession(
            user_id=user_id,
            topic=topic,
            subject=subject,
            difficulty=difficulty,
            total_questions=total_questions
        )
        self.session.add(quiz)
        await self.session.flush()
        
        for q in questions_data:
            question_obj = QuizQuestion(
                quiz_id=quiz.id,
                question=q["question"],
                options=q["options"],
                correct_answer=q["correct_answer"],
                explanation=q.get("explanation")
            )
            self.session.add(question_obj)
            
        await self.session.flush()
        await self.session.refresh(quiz)
        return await self.get_quiz_with_questions(quiz.id, user_id)

    async def save_quiz_submission(self, quiz: QuizSession, score: float, user_answers: dict) -> QuizSession:
        quiz.score = score
        quiz.completed_at = datetime.datetime.now(datetime.timezone.utc)
        for q in quiz.questions:
            if q.id in user_answers:
                q.user_answer = user_answers[q.id]
                q.is_correct = (q.user_answer.strip().lower() == q.correct_answer.strip().lower())
        await self.session.flush()
        return quiz
