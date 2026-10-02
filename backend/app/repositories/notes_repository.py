from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notes import NoteSummary
from app.repositories.base_repository import BaseRepository

class NotesRepository(BaseRepository[NoteSummary]):
    def __init__(self, session: AsyncSession):
        super().__init__(NoteSummary, session)

    async def get_user_notes(self, user_id: str, limit: int = 50) -> Sequence[NoteSummary]:
        stmt = (
            select(NoteSummary)
            .where(NoteSummary.user_id == user_id)
            .order_by(NoteSummary.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_note_summary(
        self,
        user_id: str,
        title: str,
        source_type: str,
        original_content: Optional[str],
        summary: str,
        key_points: list,
        important_concepts: list,
        keywords: list,
        quick_revision_notes: Optional[str] = None
    ) -> NoteSummary:
        note = NoteSummary(
            user_id=user_id,
            title=title,
            source_type=source_type,
            original_content=original_content,
            summary=summary,
            key_points=key_points,
            important_concepts=important_concepts,
            keywords=keywords,
            quick_revision_notes=quick_revision_notes
        )
        return await self.create(note)
