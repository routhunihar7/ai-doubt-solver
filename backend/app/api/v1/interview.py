from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.interview import (
    InterviewGenerateRequest, InterviewSessionResponse,
    InterviewAnswerRequest, InterviewFeedbackResponse
)
from app.services.interview_service import InterviewService
from app.repositories.interview_repository import InterviewRepository

router = APIRouter(prefix="/interview", tags=["Interview Preparation"])

@router.post("/generate", response_model=InterviewSessionResponse)
async def generate_interview_session(
    req: InterviewGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate technical interview session for standard engineering topics."""
    service = InterviewService(db)
    try:
        return await service.generate_interview(user_id=current_user.id, request=req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{session_id}/answer", response_model=InterviewFeedbackResponse)
async def submit_interview_answer(
    session_id: str,
    req: InterviewAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit candidate answer and get real-time AI scoring, feedback, model answer & follow-up."""
    service = InterviewService(db)
    try:
        return await service.evaluate_answer(
            user_id=current_user.id,
            session_id=session_id,
            request=req
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("", response_model=List[InterviewSessionResponse])
async def list_interviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List interview prep sessions for the current user."""
    repo = InterviewRepository(db)
    sessions = await repo.get_user_interviews(current_user.id)
    return [InterviewSessionResponse.model_validate(s) for s in sessions]

@router.get("/{session_id}", response_model=InterviewSessionResponse)
async def get_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full interview session details and question evaluation history."""
    repo = InterviewRepository(db)
    session_obj = await repo.get_interview_with_questions(session_id, current_user.id)
    if not session_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")
    return InterviewSessionResponse.model_validate(session_obj)

@router.delete("/{session_id}")
async def delete_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an interview session."""
    repo = InterviewRepository(db)
    session_obj = await repo.get_by_id(session_id)
    if not session_obj or session_obj.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")
    await repo.delete_by_id(session_id)
    return {"message": "Interview session deleted successfully."}
