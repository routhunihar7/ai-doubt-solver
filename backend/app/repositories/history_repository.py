from typing import Optional, Sequence, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete
from app.models.activity import ActivityLog
from app.models.conversation import Conversation
from app.models.quiz import QuizSession
from app.models.code import CodeGeneration
from app.models.notes import NoteSummary
from app.models.interview import InterviewSession
from app.models.document import Document
from app.models.study_plan import StudyPlan
from app.repositories.base_repository import BaseRepository

class HistoryRepository(BaseRepository[ActivityLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(ActivityLog, session)

    async def log_activity(
        self,
        user_id: str,
        activity_type: str,
        title: str,
        description: Optional[str] = None,
        reference_id: Optional[str] = None,
        metadata_info: Optional[dict] = None
    ) -> ActivityLog:
        log = ActivityLog(
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            description=description,
            reference_id=reference_id,
            metadata_info=metadata_info or {}
        )
        return await self.create(log)

    async def get_user_activities(
        self,
        user_id: str,
        activity_type: Optional[str] = None,
        search_query: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[Sequence[ActivityLog], int]:
        stmt = select(ActivityLog).where(ActivityLog.user_id == user_id)
        count_stmt = select(func.count(ActivityLog.id)).where(ActivityLog.user_id == user_id)

        if activity_type and activity_type.lower() != "all":
            stmt = stmt.where(ActivityLog.activity_type == activity_type.lower())
            count_stmt = count_stmt.where(ActivityLog.activity_type == activity_type.lower())

        if search_query:
            pattern = f"%{search_query}%"
            stmt = stmt.where(ActivityLog.title.ilike(pattern) | ActivityLog.description.ilike(pattern))
            count_stmt = count_stmt.where(ActivityLog.title.ilike(pattern) | ActivityLog.description.ilike(pattern))

        stmt = stmt.order_by(desc(ActivityLog.created_at)).offset(skip).limit(limit)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar_one() or 0

        res = await self.session.execute(stmt)
        items = res.scalars().all()

        return items, total

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        # Count questions / conversations
        conv_cnt = await self.session.scalar(select(func.count(Conversation.id)).where(Conversation.user_id == user_id)) or 0
        
        # Quizzes
        quiz_cnt = await self.session.scalar(select(func.count(QuizSession.id)).where(QuizSession.user_id == user_id)) or 0
        avg_score = await self.session.scalar(
            select(func.avg(QuizSession.score)).where(QuizSession.user_id == user_id, QuizSession.score.isnot(None))
        ) or 0.0
        
        # Code
        code_cnt = await self.session.scalar(select(func.count(CodeGeneration.id)).where(CodeGeneration.user_id == user_id)) or 0
        
        # Notes
        notes_cnt = await self.session.scalar(select(func.count(NoteSummary.id)).where(NoteSummary.user_id == user_id)) or 0
        
        # Interview
        interview_cnt = await self.session.scalar(select(func.count(InterviewSession.id)).where(InterviewSession.user_id == user_id)) or 0
        
        # Documents
        doc_cnt = await self.session.scalar(select(func.count(Document.id)).where(Document.user_id == user_id)) or 0
        
        # Study plans
        plan_cnt = await self.session.scalar(select(func.count(StudyPlan.id)).where(StudyPlan.user_id == user_id)) or 0

        return {
            "total_questions_asked": int(conv_cnt),
            "total_quizzes_completed": int(quiz_cnt),
            "average_quiz_score": round(float(avg_score), 1),
            "total_code_generations": int(code_cnt),
            "total_notes_summarized": int(notes_cnt),
            "total_interviews_taken": int(interview_cnt),
            "total_documents_uploaded": int(doc_cnt),
            "total_study_plans": int(plan_cnt)
        }
