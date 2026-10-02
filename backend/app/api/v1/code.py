from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.code import CodeGenerateRequest, CodeResponse
from app.services.code_service import CodeService
from app.repositories.code_repository import CodeRepository

router = APIRouter(prefix="/code", tags=["Code Generator"])

@router.post("/generate", response_model=CodeResponse)
async def generate_code(
    req: CodeGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate production-grade code with complexity analysis and test cases."""
    service = CodeService(db)
    try:
        return await service.generate_code(user_id=current_user.id, request=req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("", response_model=List[CodeResponse])
async def list_generated_codes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List code generation history for current user."""
    repo = CodeRepository(db)
    codes = await repo.get_user_codes(current_user.id)
    return [CodeResponse.model_validate(c) for c in codes]

@router.get("/{code_id}", response_model=CodeResponse)
async def get_code_item(
    code_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific code generation item."""
    repo = CodeRepository(db)
    code_item = await repo.get_by_id(code_id)
    if not code_item or code_item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code item not found.")
    return CodeResponse.model_validate(code_item)

@router.delete("/{code_id}")
async def delete_code_item(
    code_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a code generation record."""
    repo = CodeRepository(db)
    code_item = await repo.get_by_id(code_id)
    if not code_item or code_item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Code item not found.")
    await repo.delete_by_id(code_id)
    return {"message": "Code item deleted successfully."}
