from typing import Optional, List, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.conversation import Conversation
from app.models.message import Message
from app.repositories.base_repository import BaseRepository

class ChatRepository(BaseRepository[Conversation]):
    def __init__(self, session: AsyncSession):
        super().__init__(Conversation, session)

    async def get_user_conversations(self, user_id: str, limit: int = 50) -> Sequence[Conversation]:
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_conversation_with_messages(self, conversation_id: str, user_id: str) -> Optional[Conversation]:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_conversation(self, user_id: str, title: str, subject: Optional[str] = None) -> Conversation:
        conversation = Conversation(
            user_id=user_id,
            title=title,
            subject=subject
        )
        return await self.create(conversation)

    async def get_messages_for_conversation(self, conversation_id: str, limit: int = 20) -> Sequence[Message]:
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def add_message(self, conversation_id: str, role: str, content: str, metadata_info: Optional[dict] = None) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata_info=metadata_info or {}
        )
        self.session.add(message)
        await self.session.flush()
        await self.session.refresh(message)
        return message
