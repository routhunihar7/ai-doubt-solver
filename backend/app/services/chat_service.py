from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.chat_repository import ChatRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.chat import ChatResponse
import datetime

SYSTEM_ACADEMIC_PROMPT = """You are 'AI Doubt Solver', an elite, empathetic, and exceptionally clear AI Academic Assistant and Tutor.
Your goal is to help students deeply understand concepts across computer science, mathematics, engineering, natural sciences, and humanities.

Teaching Guidelines:
1. Provide intuitive, step-by-step explanations starting with high-level intuition before diving into technical details.
2. Format all mathematical equations using clean LaTeX syntax (e.g., $E = mc^2$ or $$f(x) = \\int_{-\\infty}^{\\infty} e^{-t^2} dt$$).
3. When writing code, provide clean, idiomatic code inside markdown code blocks with the exact language specified (e.g., ```python, ```java, ```cpp).
4. Emphasize key concepts, real-world analogies, and common pitfalls/traps students encounter.
5. Conclude with a brief summary or a probing follow-up thought to reinforce learning.
"""

class ChatService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.chat_repo = ChatRepository(session)
        self.history_repo = HistoryRepository(session)

    async def process_chat(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[str] = None,
        subject: Optional[str] = None
    ) -> ChatResponse:
        # Get or create conversation
        if conversation_id:
            conv = await self.chat_repo.get_conversation_with_messages(conversation_id, user_id)
            if not conv:
                conv = await self.chat_repo.create_conversation(
                    user_id=user_id,
                    title=message[:40] + ("..." if len(message) > 40 else ""),
                    subject=subject
                )
        else:
            conv = await self.chat_repo.create_conversation(
                user_id=user_id,
                title=message[:40] + ("..." if len(message) > 40 else ""),
                subject=subject
            )

        # Save user message
        user_msg = await self.chat_repo.add_message(
            conversation_id=conv.id,
            role="user",
            content=message
        )

        # Fetch existing messages for context
        existing_msgs = await self.chat_repo.get_messages_for_conversation(conv.id, limit=10)

        # Build message history for LLM
        messages = [{"role": "system", "content": SYSTEM_ACADEMIC_PROMPT}]
        if subject:
            messages.append({
                "role": "system",
                "content": f"The current academic subject context is: {subject}."
            })

        for m in existing_msgs:
            messages.append({"role": m.role, "content": m.content})
        
        # Add current user message
        messages.append({"role": "user", "content": message})

        # Call AI
        answer_text = await ai_service.chat_completion(messages=messages, temperature=0.6)

        # Save assistant message
        assistant_msg = await self.chat_repo.add_message(
            conversation_id=conv.id,
            role="assistant",
            content=answer_text
        )

        # Log activity
        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="chat",
            title=f"Chat: {conv.title}",
            description=message[:100],
            reference_id=conv.id
        )

        return ChatResponse(
            answer=answer_text,
            conversation_id=conv.id,
            message_id=assistant_msg.id,
            created_at=assistant_msg.created_at
        )
