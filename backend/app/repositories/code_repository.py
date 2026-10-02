from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.code import CodeGeneration
from app.repositories.base_repository import BaseRepository

class CodeRepository(BaseRepository[CodeGeneration]):
    def __init__(self, session: AsyncSession):
        super().__init__(CodeGeneration, session)

    async def get_user_codes(self, user_id: str, limit: int = 50) -> Sequence[CodeGeneration]:
        stmt = (
            select(CodeGeneration)
            .where(CodeGeneration.user_id == user_id)
            .order_by(CodeGeneration.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_code_generation(
        self,
        user_id: str,
        title: str,
        language: str,
        problem_description: str,
        difficulty: str,
        generated_code: str,
        explanation: str,
        time_complexity: Optional[str] = None,
        space_complexity: Optional[str] = None,
        example_input: Optional[str] = None,
        example_output: Optional[str] = None,
        test_cases: Optional[list] = None
    ) -> CodeGeneration:
        code_gen = CodeGeneration(
            user_id=user_id,
            title=title,
            language=language,
            problem_description=problem_description,
            difficulty=difficulty,
            generated_code=generated_code,
            explanation=explanation,
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            example_input=example_input,
            example_output=example_output,
            test_cases=test_cases or []
        )
        return await self.create(code_gen)
