from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
import datetime

class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: int
    content: str
    metadata_info: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    page_count: int
    summary: Optional[str] = None
    status: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(DocumentResponse):
    chunks: List[DocumentChunkResponse] = []

class DocumentAskRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Question regarding the document")
    max_chunks: Optional[int] = Field(4, ge=1, le=10)

class DocumentSourceChunk(BaseModel):
    chunk_index: int
    page_number: int
    snippet: str
    similarity_score: Optional[float] = None

class DocumentAskResponse(BaseModel):
    question: str
    answer: str
    document_id: str
    document_name: str
    sources: List[DocumentSourceChunk]

class DocumentSummaryResponse(BaseModel):
    document_id: str
    document_name: str
    summary: str
    page_count: int
