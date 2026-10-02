from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import datetime

class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, description="Quiz topic (e.g., Binary Search Trees, Photosynthesis, Calculus limits)")
    subject: Optional[str] = Field("Computer Science", description="Academic subject")
    difficulty: str = Field("Medium", description="Difficulty: Easy, Medium, or Hard")
    num_questions: int = Field(5, ge=1, le=15, description="Number of questions to generate")

class QuizQuestionItem(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_answer: str
    explanation: Optional[str] = None

class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: List[str]
    # Note: When serving a quiz to be taken, correct_answer can be omitted or included
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

class QuizSessionResponse(BaseModel):
    id: str
    topic: str
    subject: Optional[str] = None
    difficulty: str
    total_questions: int
    score: Optional[float] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    questions: List[QuizQuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class QuizAnswerItem(BaseModel):
    question_id: str
    selected_option: str

class QuizSubmitRequest(BaseModel):
    answers: List[QuizAnswerItem]

class QuizResultResponse(BaseModel):
    quiz_id: str
    topic: str
    score: float
    total_questions: int
    correct_count: int
    percentage: float
    questions: List[QuizQuestionResponse]
