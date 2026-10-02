from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notes_repository import NotesRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.notes import NotesSummarizeRequest, NotesResponse, ImportantConcept

class AINotesOutput(BaseModel):
    title: str
    summary: str
    key_points: List[str]
    important_concepts: List[ImportantConcept]
    keywords: List[str]
    quick_revision_notes: str

NOTES_SYSTEM_PROMPT = """You are an academic learning specialist and master summarizer.
Analyze the provided study notes, lecture content, or textbook excerpt and extract key intellectual value.
Your output must include:
1. `title`: An engaging, descriptive title for these notes.
2. `summary`: A crystal-clear, structured 2-3 paragraph synthesis.
3. `key_points`: 5-8 bulleted high-impact core takeaways.
4. `important_concepts`: Key terminology and principles mapped to concise definitions.
5. `keywords`: 5-10 indexable subject tags.
6. `quick_revision_notes`: A quick-reference cheat sheet formatted for rapid 5-minute pre-exam review.
"""

class NotesService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.notes_repo = NotesRepository(session)
        self.history_repo = HistoryRepository(session)

    async def summarize_notes(
        self,
        user_id: str,
        request: NotesSummarizeRequest,
        source_type: str = "text"
    ) -> NotesResponse:
        prompt = (
            f"Notes Content:\n\"\"\"\n{request.content}\n\"\"\"\n\n"
            f"Requested Title: {request.title or 'Auto-detect'}\n"
            f"Formatting Style: {request.format_style or 'comprehensive'}\n"
            f"Please generate a complete academic breakdown (Summary, Key Points, Concepts, Keywords, Quick Revision)."
        )

        ai_result: AINotesOutput = await ai_service.generate_structured(
            prompt=prompt,
            system_prompt=NOTES_SYSTEM_PROMPT,
            schema_cls=AINotesOutput,
            temperature=0.3
        )

        saved = await self.notes_repo.create_note_summary(
            user_id=user_id,
            title=ai_result.title or (request.title or "Study Notes Summary"),
            source_type=source_type,
            original_content=request.content[:5000],  # store reasonable preview
            summary=ai_result.summary,
            key_points=ai_result.key_points,
            important_concepts=[c.model_dump() for c in ai_result.important_concepts],
            keywords=ai_result.keywords,
            quick_revision_notes=ai_result.quick_revision_notes
        )

        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="notes",
            title=f"Notes Summarized: {saved.title}",
            description=f"{len(ai_result.key_points)} key points extracted",
            reference_id=saved.id
        )

        return NotesResponse(
            id=saved.id,
            title=saved.title,
            source_type=saved.source_type,
            summary=saved.summary,
            key_points=saved.key_points,
            important_concepts=[ImportantConcept(**c) if isinstance(c, dict) else c for c in saved.important_concepts],
            keywords=saved.keywords,
            quick_revision_notes=saved.quick_revision_notes,
            created_at=saved.created_at
        )
