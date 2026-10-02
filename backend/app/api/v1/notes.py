from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.notes import NotesSummarizeRequest, NotesResponse
from app.services.notes_service import NotesService
from app.repositories.notes_repository import NotesRepository

router = APIRouter(prefix="/notes", tags=["Notes Summarizer"])

@router.post("/summarize", response_model=NotesResponse)
async def summarize_notes(
    req: NotesSummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Summarize study notes and extract key concepts, keywords, and quick revision notes."""
    service = NotesService(db)
    try:
        return await service.summarize_notes(user_id=current_user.id, request=req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("", response_model=List[NotesResponse])
async def list_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List notes summaries for current user."""
    repo = NotesRepository(db)
    notes = await repo.get_user_notes(current_user.id)
    return [NotesResponse.model_validate(n) for n in notes]

@router.get("/{note_id}", response_model=NotesResponse)
async def get_note_item(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific note summary item."""
    repo = NotesRepository(db)
    note = await repo.get_by_id(note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return NotesResponse.model_validate(note)

@router.delete("/{note_id}")
async def delete_note_item(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a note summary."""
    repo = NotesRepository(db)
    note = await repo.get_by_id(note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    await repo.delete_by_id(note_id)
    return {"message": "Note deleted successfully."}
