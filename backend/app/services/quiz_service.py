from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.quiz_repository import QuizRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.quiz import (
    QuizGenerateRequest, QuizSessionResponse, QuizSubmitRequest,
    QuizResultResponse, QuizQuestionResponse
)

class AIQuestionItem(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_answer: str
    explanation: str

class AIQuizOutput(BaseModel):
    topic: str
    difficulty: str
    questions: List[AIQuestionItem]

QUIZ_SYSTEM_PROMPT = """You are an expert academic examiner and professor.
Generate high-quality multiple choice questions (MCQs) for the requested topic, subject, and difficulty level.
Rules:
1. Provide exactly 4 options for each question (e.g. ["A...", "B...", "C...", "D..."] or clean option texts).
2. The `correct_answer` MUST match exactly one of the 4 options.
3. Provide a clear, insightful `explanation` of why the correct answer is right and why other options might be misleading.
4. Ensure questions test genuine conceptual understanding, problem solving, or analytical skills rather than trivial recall.
"""

class QuizService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.quiz_repo = QuizRepository(session)
        self.history_repo = HistoryRepository(session)

    async def generate_quiz(self, user_id: str, request: QuizGenerateRequest) -> QuizSessionResponse:
        prompt = (
            f"Generate an academic quiz with {request.num_questions} questions on the topic: '{request.topic}'.\n"
            f"Subject: {request.subject or 'General Academics'}\n"
            f"Difficulty Level: {request.difficulty}\n"
            f"Please generate {request.num_questions} challenging, accurate questions."
        )

        ai_result: AIQuizOutput = await ai_service.generate_structured(
            prompt=prompt,
            system_prompt=QUIZ_SYSTEM_PROMPT,
            schema_cls=AIQuizOutput,
            temperature=0.4
        )

        questions_data = [
            {
                "question": q.question,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation
            }
            for q in ai_result.questions
        ]

        quiz_session = await self.quiz_repo.create_quiz_with_questions(
            user_id=user_id,
            topic=request.topic,
            subject=request.subject,
            difficulty=request.difficulty,
            total_questions=len(questions_data),
            questions_data=questions_data
        )

        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="quiz",
            title=f"Quiz Generated: {request.topic}",
            description=f"{len(questions_data)} questions ({request.difficulty})",
            reference_id=quiz_session.id
        )

        return QuizSessionResponse.model_validate(quiz_session)

    async def submit_quiz(self, user_id: str, quiz_id: str, submission: QuizSubmitRequest) -> QuizResultResponse:
        quiz = await self.quiz_repo.get_quiz_with_questions(quiz_id, user_id)
        if not quiz:
            raise ValueError("Quiz session not found.")

        user_answer_map = {ans.question_id: ans.selected_option for ans in submission.answers}
        
        correct_count = 0
        for q in quiz.questions:
            user_choice = user_answer_map.get(q.id, "").strip().lower()
            correct_choice = q.correct_answer.strip().lower()
            if user_choice and (user_choice == correct_choice or correct_choice.startswith(user_choice)):
                correct_count += 1

        total = len(quiz.questions)
        percentage = round((correct_count / total * 100), 1) if total > 0 else 0.0

        updated_quiz = await self.quiz_repo.save_quiz_submission(
            quiz=quiz,
            score=percentage,
            user_answers=user_answer_map
        )

        # Log completion
        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="quiz",
            title=f"Completed Quiz: {quiz.topic}",
            description=f"Score: {correct_count}/{total} ({percentage}%)",
            reference_id=quiz.id,
            metadata_info={"score": percentage, "total": total, "correct": correct_count}
        )

        return QuizResultResponse(
            quiz_id=quiz.id,
            topic=quiz.topic,
            score=percentage,
            total_questions=total,
            correct_count=correct_count,
            percentage=percentage,
            questions=[QuizQuestionResponse.model_validate(q) for q in updated_quiz.questions]
        )
