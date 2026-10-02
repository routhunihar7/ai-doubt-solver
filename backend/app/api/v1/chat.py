from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ChatRequest, ChatResponse, ConversationResponse, ConversationDetailResponse
)
from app.services.chat_service import ChatService
from app.repositories.chat_repository import ChatRepository

router = APIRouter(prefix="/chat", tags=["AI Chat & Doubt Solver"])

@router.post("", response_model=ChatResponse)
async def post_doubt_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ask an academic doubt or send a message in a conversation."""
    service = ChatService(db)
    try:
        return await service.process_chat(
            user_id=current_user.id,
            message=req.message,
            conversation_id=req.conversation_id,
            subject=req.subject
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all previous doubt conversations for the current user."""
    repo = ChatRepository(db)
    convs = await repo.get_user_conversations(current_user.id)
    return [ConversationResponse.model_validate(c) for c in convs]

@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversation details with all historical messages."""
    repo = ChatRepository(db)
    conv = await repo.get_conversation_with_messages(conversation_id, current_user.id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )
    return ConversationDetailResponse.model_validate(conv)

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a conversation."""
    repo = ChatRepository(db)
    conv = await repo.get_by_id(conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    await repo.delete_by_id(conversation_id)
    return {"message": "Conversation deleted successfully."}
