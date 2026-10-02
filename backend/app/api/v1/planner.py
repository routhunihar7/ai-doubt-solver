from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.planner import StudyPlanGenerateRequest, StudyPlanResponse
from app.services.planner_service import PlannerService
from app.repositories.planner_repository import PlannerRepository

router = APIRouter(prefix="/planner", tags=["Study Planner"])

@router.post("/generate", response_model=StudyPlanResponse)
async def generate_study_plan(
    req: StudyPlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a personalized study plan and timetable with weekly milestones."""
    service = PlannerService(db)
    try:
        return await service.generate_plan(user_id=current_user.id, request=req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("", response_model=List[StudyPlanResponse])
async def list_study_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List study plans for current user."""
    repo = PlannerRepository(db)
    plans = await repo.get_user_plans(current_user.id)
    return [StudyPlanResponse.model_validate(p) for p in plans]

@router.get("/{plan_id}", response_model=StudyPlanResponse)
async def get_study_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific study plan."""
    repo = PlannerRepository(db)
    plan = await repo.get_by_id(plan_id)
    if not plan or plan.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found.")
    return StudyPlanResponse.model_validate(plan)

@router.delete("/{plan_id}")
async def delete_study_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a study plan."""
    repo = PlannerRepository(db)
    plan = await repo.get_by_id(plan_id)
    if not plan or plan.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found.")
    await repo.delete_by_id(plan_id)
    return {"message": "Study plan deleted successfully."}
