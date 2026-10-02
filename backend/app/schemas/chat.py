from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
import datetime

class MessageCreate(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., min_length=1)
    metadata_info: Optional[Dict[str, Any]] = Field(default_factory=dict)

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    metadata_info: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationBase(BaseModel):
    title: str
    subject: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: str
    user_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Academic doubt or question")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID if continuing")
    subject: Optional[str] = Field(None, description="Subject area (e.g., Computer Science, Mathematics, Physics)")

class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    message_id: str
    created_at: datetime.datetime
