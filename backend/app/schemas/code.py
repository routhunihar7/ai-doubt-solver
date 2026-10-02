from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
import datetime

class CodeGenerateRequest(BaseModel):
    problem_description: str = Field(..., min_length=5, description="Algorithm/Problem description to implement or debug")
    language: str = Field("Python", description="Programming language: Python, Java, C, C++, JavaScript, TypeScript, SQL, Go, Rust")
    difficulty: Optional[str] = Field("Medium", description="Difficulty: Easy, Medium, Hard")

class TestCaseItem(BaseModel):
    input: str
    expected_output: str
    explanation: Optional[str] = None

class CodeResponse(BaseModel):
    id: Optional[str] = None
    title: str
    language: str
    problem_description: str
    difficulty: str
    generated_code: str
    explanation: str
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    example_input: Optional[str] = None
    example_output: Optional[str] = None
    test_cases: List[Dict[str, Any]] = []
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
