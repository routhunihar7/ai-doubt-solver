from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.history import HistoryListResponse, HistoryItemResponse
from app.repositories.history_repository import HistoryRepository

router = APIRouter(prefix="/history", tags=["Unified History & Activity Logs"])

@router.get("", response_model=HistoryListResponse)
async def get_history(
    type: Optional[str] = Query(None, description="Filter by activity type: chat, quiz, code, notes, interview, planner, document"),
    search: Optional[str] = Query(None, description="Search term in title or description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated searchable history of all student AI interactions."""
    repo = HistoryRepository(db)
    items, total = await repo.get_user_activities(
        user_id=current_user.id,
        activity_type=type,
        search_query=search,
        skip=skip,
        limit=limit
    )
    return HistoryListResponse(
        total=total,
        items=[HistoryItemResponse.model_validate(item) for item in items]
    )

@router.delete("/{item_id}")
async def delete_history_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a history item."""
    repo = HistoryRepository(db)
    item = await repo.get_by_id(item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History item not found.")
    await repo.delete_by_id(item_id)
    return {"message": "History item removed successfully."}
