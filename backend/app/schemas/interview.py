from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import datetime

class InterviewGenerateRequest(BaseModel):
    topic: str = Field(..., description="Topic: Java, Python, SQL, DBMS, OOP, Networking, Data Structures, Algorithms, Operating Systems, AI/ML")
    difficulty: str = Field("Medium", description="Difficulty: Easy, Medium, Hard")
    target_role: Optional[str] = Field("Software Engineer", description="Target role (e.g., Junior Backend Dev, Data Engineer)")
    num_questions: int = Field(3, ge=1, le=10, description="Number of questions in the interview")

class InterviewQuestionItem(BaseModel):
    id: Optional[str] = None
    question: str
    user_answer: Optional[str] = None
    feedback: Optional[str] = None
    score: Optional[float] = None
    ideal_answer: Optional[str] = None
    follow_up_question: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class InterviewSessionResponse(BaseModel):
    id: str
    topic: str
    difficulty: str
    target_role: Optional[str] = None
    overall_score: Optional[float] = None
    feedback_summary: Optional[str] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    questions: List[InterviewQuestionItem] = []

    model_config = ConfigDict(from_attributes=True)

class InterviewAnswerRequest(BaseModel):
    question_id: str
    user_answer: str = Field(..., min_length=2, description="Candidate's technical answer")

class InterviewFeedbackResponse(BaseModel):
    question_id: str
    score: float = Field(..., description="Score out of 10")
    feedback: str
    ideal_answer: str
    follow_up_question: Optional[str] = None
