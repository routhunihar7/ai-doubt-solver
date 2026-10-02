from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
import datetime

class HistoryItemResponse(BaseModel):
    id: str
    activity_type: str  # 'chat', 'quiz', 'code', 'notes', 'interview', 'planner', 'document'
    title: str
    description: Optional[str] = None
    reference_id: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class HistoryListResponse(BaseModel):
    total: int
    items: List[HistoryItemResponse]
