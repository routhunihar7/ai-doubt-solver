from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.interview_repository import InterviewRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.interview import (
    InterviewGenerateRequest, InterviewSessionResponse,
    InterviewAnswerRequest, InterviewFeedbackResponse, InterviewQuestionItem
)

class AIInterviewGenQuestion(BaseModel):
    question: str
    ideal_answer: str
    follow_up_question: str

class AIInterviewGenOutput(BaseModel):
    topic: str
    target_role: str
    questions: List[AIInterviewGenQuestion]

class AIEvaluationOutput(BaseModel):
    score: float = Field(..., description="Score from 0.0 to 10.0")
    feedback: str
    ideal_answer: str
    follow_up_question: str

INTERVIEW_SYSTEM_PROMPT = """You are a Senior Technical Hiring Manager and FAANG/Tier-1 Interviewer.
Generate realistic, deep technical interview questions that test fundamentals, architecture, and practical engineering trade-offs.
Each question must come with:
1. `question`: A thought-provoking technical interview question.
2. `ideal_answer`: A comprehensive model answer explaining standard expectations.
3. `follow_up_question`: An intelligent follow-up probe testing deeper boundary scenarios.
"""

EVALUATION_SYSTEM_PROMPT = """You are a Principal Engineer evaluating a candidate's interview answer.
Provide an honest, constructive, and accurate evaluation.
Assess:
1. `score`: Numerical rating from 0.0 (completely incorrect) to 10.0 (exceptional, comprehensive answer).
2. `feedback`: Specific strengths and missing nuances/corrections in the candidate's explanation.
3. `ideal_answer`: Refined gold-standard answer for comparison.
4. `follow_up_question`: Challenging follow-up question to test deeper comprehension.
"""

class InterviewService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.interview_repo = InterviewRepository(session)
        self.history_repo = HistoryRepository(session)

    async def generate_interview(self, user_id: str, request: InterviewGenerateRequest) -> InterviewSessionResponse:
        prompt = (
            f"Generate a technical interview session for:\n"
            f"Topic: {request.topic}\n"
            f"Target Role: {request.target_role or 'Software Engineer'}\n"
            f"Difficulty: {request.difficulty}\n"
            f"Number of Questions: {request.num_questions}\n"
        )

        ai_result: AIInterviewGenOutput = await ai_service.generate_structured(
            prompt=prompt,
            system_prompt=INTERVIEW_SYSTEM_PROMPT,
            schema_cls=AIInterviewGenOutput,
            temperature=0.4
        )

        questions_data = [
            {
                "question": q.question,
                "ideal_answer": q.ideal_answer,
                "follow_up_question": q.follow_up_question
            }
            for q in ai_result.questions
        ]

        session_obj = await self.interview_repo.create_interview_session(
            user_id=user_id,
            topic=request.topic,
            difficulty=request.difficulty,
            target_role=request.target_role or "Software Engineer",
            questions_data=questions_data
        )

        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="interview",
            title=f"Mock Interview: {request.topic}",
            description=f"{len(questions_data)} questions ({request.difficulty})",
            reference_id=session_obj.id
        )

        return InterviewSessionResponse.model_validate(session_obj)

    async def evaluate_answer(
        self,
        user_id: str,
        session_id: str,
        request: InterviewAnswerRequest
    ) -> InterviewFeedbackResponse:
        session_obj = await self.interview_repo.get_interview_with_questions(session_id, user_id)
        if not session_obj:
            raise ValueError("Interview session not found.")

        target_q = None
        for q in session_obj.questions:
            if q.id == request.question_id:
                target_q = q
                break

        if not target_q:
            raise ValueError("Question not found in this interview session.")

        eval_prompt = (
            f"Topic: {session_obj.topic} ({session_obj.target_role})\n"
            f"Question Asked: {target_q.question}\n"
            f"Candidate's Answer:\n\"\"\"\n{request.user_answer}\n\"\"\"\n"
            f"Benchmark Ideal Answer Reference: {target_q.ideal_answer}\n\n"
            f"Please evaluate the candidate's answer with a score (0.0 to 10.0), constructive feedback, ideal answer, and follow-up question."
        )

        eval_result: AIEvaluationOutput = await ai_service.generate_structured(
            prompt=eval_prompt,
            system_prompt=EVALUATION_SYSTEM_PROMPT,
            schema_cls=AIEvaluationOutput,
            temperature=0.3
        )

        await self.interview_repo.update_question_answer(
            question_id=target_q.id,
            user_answer=request.user_answer,
            feedback=eval_result.feedback,
            score=eval_result.score,
            ideal_answer=eval_result.ideal_answer,
            follow_up=eval_result.follow_up_question
        )

        return InterviewFeedbackResponse(
            question_id=target_q.id,
            score=eval_result.score,
            feedback=eval_result.feedback,
            ideal_answer=eval_result.ideal_answer,
            follow_up_question=eval_result.follow_up_question
        )
