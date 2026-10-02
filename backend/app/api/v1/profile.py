from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest, UserStatsResponse
from app.schemas.auth import PasswordChangeRequest
from app.repositories.history_repository import HistoryRepository
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/profile", tags=["User Profile & Learning Preferences"])

@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile, learning preferences, and aggregated learning statistics."""
    history_repo = HistoryRepository(db)
    stats_data = await history_repo.get_user_stats(current_user.id)
    
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        preferences=current_user.preferences or {},
        created_at=current_user.created_at,
        stats=UserStatsResponse(**stats_data)
    )

@router.put("", response_model=ProfileResponse)
async def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update profile information and learning preferences."""
    if req.full_name:
        current_user.full_name = req.full_name

    current_prefs = dict(current_user.preferences or {})
    if req.target_exam is not None:
        current_prefs["target_exam"] = req.target_exam
    if req.study_hours_target is not None:
        current_prefs["study_hours_target"] = req.study_hours_target
    if req.favorite_subjects is not None:
        current_prefs["favorite_subjects"] = req.favorite_subjects
    if req.theme is not None:
        current_prefs["theme"] = req.theme
    if req.custom_preferences:
        current_prefs.update(req.custom_preferences)

    current_user.preferences = current_prefs
    await db.flush()
    await db.refresh(current_user)

    history_repo = HistoryRepository(db)
    stats_data = await history_repo.get_user_stats(current_user.id)

    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        preferences=current_user.preferences,
        created_at=current_user.created_at,
        stats=UserStatsResponse(**stats_data)
    )

@router.post("/change-password")
async def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change account password."""
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.hashed_password = get_password_hash(req.new_password)
    await db.flush()
    return {"message": "Password changed successfully."}
