from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.code_repository import CodeRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.code import CodeGenerateRequest, CodeResponse

class AICodeOutput(BaseModel):
    title: str
    language: str
    generated_code: str
    explanation: str
    time_complexity: str
    space_complexity: str
    example_input: str
    example_output: str
    test_cases: List[Dict[str, Any]] = []

CODE_SYSTEM_PROMPT = """You are a Principal Software Engineer and Computer Science Professor.
Generate clean, highly efficient, idiomatically formatted code in the specified programming language.
Include:
1. Production-ready, fully implemented code without placeholder comments (e.g. avoid '# TODO').
2. Thorough explanation of the algorithm, approach, and logic.
3. Accurate Big-O Time Complexity and Space Complexity analysis.
4. Concrete example input and output demonstrating the solution.
5. 2-3 unit test cases (input, expected_output, explanation) covering normal and edge cases.
"""

class CodeService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.code_repo = CodeRepository(session)
        self.history_repo = HistoryRepository(session)

    async def generate_code(self, user_id: str, request: CodeGenerateRequest) -> CodeResponse:
        prompt = (
            f"Language: {request.language}\n"
            f"Difficulty: {request.difficulty or 'Medium'}\n"
            f"Problem/Task Description: {request.problem_description}\n\n"
            f"Please implement an optimal solution with explanation, Big-O complexity, examples, and test cases."
        )

        ai_result: AICodeOutput = await ai_service.generate_structured(
            prompt=prompt,
            system_prompt=CODE_SYSTEM_PROMPT,
            schema_cls=AICodeOutput,
            temperature=0.3
        )

        saved = await self.code_repo.create_code_generation(
            user_id=user_id,
            title=ai_result.title or f"{request.language} - {request.problem_description[:30]}",
            language=request.language,
            problem_description=request.problem_description,
            difficulty=request.difficulty or "Medium",
            generated_code=ai_result.generated_code,
            explanation=ai_result.explanation,
            time_complexity=ai_result.time_complexity,
            space_complexity=ai_result.space_complexity,
            example_input=ai_result.example_input,
            example_output=ai_result.example_output,
            test_cases=ai_result.test_cases
        )

        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="code",
            title=f"Code Generated: {saved.title} ({request.language})",
            description=request.problem_description[:100],
            reference_id=saved.id
        )

        return CodeResponse.model_validate(saved)
