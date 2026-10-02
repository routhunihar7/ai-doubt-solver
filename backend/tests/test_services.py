import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from app.services.ai_service import ai_service
from app.services.quiz_service import AIQuizOutput, AIQuestionItem
from app.services.code_service import AICodeOutput
from app.services.notes_service import AINotesOutput
from app.schemas.notes import ImportantConcept
from app.services.interview_service import AIInterviewGenOutput, AIInterviewGenQuestion, AIEvaluationOutput
from app.services.planner_service import AIStudyPlanOutput, AIDaySchedule, AIMilestone
from app.utils.text_cleaner import clean_text, chunk_text

def test_text_cleaning_and_chunking():
    dirty = "   Hello   world!  \n\n\n\n This is a test.   \u00a0 "
    cleaned = clean_text(dirty)
    assert "Hello world!" in cleaned
    assert "\u00a0" not in cleaned
    
    long_text = "Sentence one. " * 100
    chunks = chunk_text(long_text, chunk_size=200, chunk_overlap=50)
    assert len(chunks) > 1
    assert all(len(c) <= 300 for c in chunks)

def test_vector_embeddings_and_similarity():
    v1 = ai_service.generate_embedding("Binary search trees and balanced AVL trees")
    v2 = ai_service.generate_embedding("Binary search trees algorithms")
    v3 = ai_service.generate_embedding("French impressionist painting art history")
    
    sim_related = ai_service.cosine_similarity(v1, v2)
    sim_unrelated = ai_service.cosine_similarity(v1, v3)
    
    assert sim_related > sim_unrelated
    assert 0.0 <= sim_related <= 1.0

@pytest.mark.asyncio
async def test_chat_endpoint(client: AsyncClient, auth_headers: dict):
    with patch.object(ai_service, 'chat_completion', new=AsyncMock(return_value="Polymorphism in OOP allows objects to be treated as instances of their parent class.")):
        res = await client.post(
            "/api/v1/chat",
            json={"message": "Explain polymorphism in Java", "subject": "Computer Science"},
            headers=auth_headers
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert "Polymorphism" in data["answer"]
        assert "conversation_id" in data

@pytest.mark.asyncio
async def test_quiz_generate_and_submit_endpoint(client: AsyncClient, auth_headers: dict):
    mock_quiz = AIQuizOutput(
        topic="QuickSort",
        difficulty="Medium",
        questions=[
            AIQuestionItem(
                question="What is the average time complexity of QuickSort?",
                options=["O(n log n)", "O(n^2)", "O(log n)", "O(n)"],
                correct_answer="O(n log n)",
                explanation="QuickSort partitions the array in O(n) and recurses on average log n times."
            )
        ]
    )
    with patch.object(ai_service, 'generate_structured', new=AsyncMock(return_value=mock_quiz)):
        res = await client.post(
            "/api/v1/quiz/generate",
            json={"topic": "QuickSort", "difficulty": "Medium", "num_questions": 1},
            headers=auth_headers
        )
        assert res.status_code == 200
        quiz_data = res.json()
        assert quiz_data["topic"] == "QuickSort"
        assert len(quiz_data["questions"]) == 1
        q_id = quiz_data["questions"][0]["id"]

        # Submit answer
        submit_res = await client.post(
            f"/api/v1/quiz/{quiz_data['id']}/submit",
            json={"answers": [{"question_id": q_id, "selected_option": "O(n log n)"}]},
            headers=auth_headers
        )
        assert submit_res.status_code == 200
        sub_data = submit_res.json()
        assert sub_data["score"] == 100.0
        assert sub_data["correct_count"] == 1

@pytest.mark.asyncio
async def test_code_generate_endpoint(client: AsyncClient, auth_headers: dict):
    mock_code = AICodeOutput(
        title="Two Sum Solution",
        language="Python",
        generated_code="def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        if target - num in lookup:\n            return [lookup[target - num], i]\n        lookup[num] = i\n    return []",
        explanation="Uses a hash map to achieve linear time complexity.",
        time_complexity="O(N)",
        space_complexity="O(N)",
        example_input="nums = [2, 7, 11, 15], target = 9",
        example_output="[0, 1]",
        test_cases=[{"input": "[2, 7, 11, 15], target=9", "expected_output": "[0, 1]"}]
    )
    with patch.object(ai_service, 'generate_structured', new=AsyncMock(return_value=mock_code)):
        res = await client.post(
            "/api/v1/code/generate",
            json={"problem_description": "Find two numbers in array that add up to target", "language": "Python"},
            headers=auth_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["language"] == "Python"
        assert "def two_sum" in data["generated_code"]

@pytest.mark.asyncio
async def test_notes_summarizer_endpoint(client: AsyncClient, auth_headers: dict):
    mock_notes = AINotesOutput(
        title="Operating Systems: Processes vs Threads",
        summary="A process is an execution environment with its own address space, while threads share the process memory.",
        key_points=["Processes have isolated address space", "Threads share heap and global memory", "Context switching threads is faster"],
        important_concepts=[ImportantConcept(concept="Thread", definition="Lightweight execution unit within a process")],
        keywords=["Process", "Thread", "Concurrency", "Context Switch"],
        quick_revision_notes="Processes = isolated. Threads = shared memory."
    )
    with patch.object(ai_service, 'generate_structured', new=AsyncMock(return_value=mock_notes)):
        res = await client.post(
            "/api/v1/notes/summarize",
            json={"content": "Detailed operating systems lecture on processes and threads...", "title": "OS Lecture 3"},
            headers=auth_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert "Processes" in data["title"]
        assert len(data["key_points"]) == 3

@pytest.mark.asyncio
async def test_planner_endpoint(client: AsyncClient, auth_headers: dict):
    mock_plan = AIStudyPlanOutput(
        title="Comprehensive CS Finals Plan",
        daily_schedule=[
            AIDaySchedule(day="Monday", focus_subject="Algorithms", hours=3.0, tasks=["Review dynamic programming", "Solve 3 LeetCode problems"])
        ],
        milestones=[
            AIMilestone(week=1, title="Algorithms Mastery", target="Complete DP and Graph traversals")
        ],
        tips=["Use Pomodoro technique 50/10 min blocks"]
    )
    with patch.object(ai_service, 'generate_structured', new=AsyncMock(return_value=mock_plan)):
        res = await client.post(
            "/api/v1/planner/generate",
            json={
                "subjects": ["Algorithms", "Databases"],
                "exam_date": "2026-11-15",
                "available_hours_per_day": 4.0,
                "current_level": "Intermediate"
            },
            headers=auth_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert "Monday" in data["schedule"]

@pytest.mark.asyncio
async def test_history_and_profile_endpoints(client: AsyncClient, auth_headers: dict):
    # History
    hist_res = await client.get("/api/v1/history", headers=auth_headers)
    assert hist_res.status_code == 200
    assert "items" in hist_res.json()

    # Profile
    prof_res = await client.get("/api/v1/profile", headers=auth_headers)
    assert prof_res.status_code == 200
    p_data = prof_res.json()
    assert "stats" in p_data
    assert p_data["email"] == "student@university.edu"
