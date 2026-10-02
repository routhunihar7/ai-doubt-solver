from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
import datetime

class NotesSummarizeRequest(BaseModel):
    title: Optional[str] = Field(None, description="Optional title for the notes")
    content: str = Field(..., min_length=20, description="Raw study notes or lecture text to summarize")
    format_style: Optional[str] = Field("comprehensive", description="Summary style: comprehensive, concise, or bulleted")

class ImportantConcept(BaseModel):
    concept: str
    definition: str

class NotesResponse(BaseModel):
    id: Optional[str] = None
    title: str
    source_type: str = "text"
    summary: str
    key_points: List[str]
    important_concepts: List[ImportantConcept]
    keywords: List[str]
    quick_revision_notes: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
