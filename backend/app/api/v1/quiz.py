from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.quiz import (
    QuizGenerateRequest, QuizSessionResponse, QuizSubmitRequest, QuizResultResponse
)
from app.services.quiz_service import QuizService
from app.repositories.quiz_repository import QuizRepository

router = APIRouter(prefix="/quiz", tags=["Quiz Generator"])

@router.post("/generate", response_model=QuizSessionResponse)
async def generate_quiz(
    req: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a custom MCQ quiz using Groq AI."""
    service = QuizService(db)
    try:
        return await service.generate_quiz(user_id=current_user.id, request=req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit quiz answers, get evaluated score, and detailed explanations."""
    service = QuizService(db)
    try:
        return await service.submit_quiz(user_id=current_user.id, quiz_id=quiz_id, submission=submission)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("", response_model=List[QuizSessionResponse])
async def list_quizzes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List quiz history for the current user."""
    repo = QuizRepository(db)
    quizzes = await repo.get_user_quizzes(current_user.id)
    return [QuizSessionResponse.model_validate(q) for q in quizzes]

@router.get("/{quiz_id}", response_model=QuizSessionResponse)
async def get_quiz_details(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific quiz."""
    repo = QuizRepository(db)
    quiz = await repo.get_quiz_with_questions(quiz_id, current_user.id)
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    return QuizSessionResponse.model_validate(quiz)

@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a quiz."""
    repo = QuizRepository(db)
    quiz = await repo.get_by_id(quiz_id)
    if not quiz or quiz.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    await repo.delete_by_id(quiz_id)
    return {"message": "Quiz deleted successfully."}
