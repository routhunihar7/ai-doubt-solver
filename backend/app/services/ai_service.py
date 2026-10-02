import json
import re
import math
import logging
from typing import List, Dict, Any, Optional, Type, TypeVar
from pydantic import BaseModel
import httpx
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

FALLBACK_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "allam-2-7b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

class AIService:
    def __init__(self):
        self._client: Optional[AsyncGroq] = None
        self._working_model: Optional[str] = None
        self._init_client()

    def _init_client(self):
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip() != "":
            self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        else:
            self._client = None

    def _clean_json_response(self, text: str) -> str:
        """Extract valid JSON from potential markdown formatting."""
        text = text.strip()
        # Remove ```json ... ``` code blocks if present
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1).strip()
        
        # If wrapped in single backticks
        if text.startswith("`") and text.endswith("`"):
            text = text.strip("`").strip()
            
        return text

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.5,
        max_tokens: int = 1500,
        model: Optional[str] = None
    ) -> str:
        """Execute chat completion against Groq API with smart model fallback."""
        if not self._client:
            self._init_client()
            
        if not self._client:
            raise ValueError(
                "Groq API key is not configured. Please add GROQ_API_KEY to your backend .env file."
            )

        # Build prioritized list of models to try
        primary_model = model or self._working_model or settings.GROQ_MODEL
        models_to_try = [primary_model]
        for m in FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        last_err = None
        for candidate_model in models_to_try:
            try:
                response = await self._client.chat.completions.create(
                    model=candidate_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                self._working_model = candidate_model
                return response.choices[0].message.content or ""
            except Exception as e:
                logger.warning(f"Groq call with model '{candidate_model}' failed: {e}")
                last_err = e
                # If rate limited or model not found, try next candidate
                continue

        raise RuntimeError(f"AI Service Error: {str(last_err)}")

    async def generate_structured(
        self,
        prompt: str,
        system_prompt: str,
        schema_cls: Type[T],
        temperature: float = 0.3,
        retries: int = 2
    ) -> T:
        """Generate structured JSON and validate using Pydantic."""
        schema_json = json.dumps(schema_cls.model_json_schema(), indent=2)
        
        system_instruction = (
            f"{system_prompt}\n\n"
            f"IMPORTANT: You MUST respond ONLY with a raw, valid JSON object matching this JSON Schema:\n"
            f"{schema_json}\n"
            f"Do not include explanations, greetings, or markdown fences outside the JSON."
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]

        last_error = None
        for attempt in range(retries + 1):
            try:
                raw_text = await self.chat_completion(
                    messages=messages,
                    temperature=temperature
                )
                cleaned = self._clean_json_response(raw_text)
                parsed = json.loads(cleaned)
                return schema_cls.model_validate(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse structured response (attempt {attempt + 1}/{retries + 1}): {e}")
                last_error = e
                # Feed error back in prompt for retry
                messages.append({"role": "assistant", "content": raw_text if 'raw_text' in locals() else ""})
                messages.append({
                    "role": "user",
                    "content": f"The previous output was not valid JSON matching the schema ({e}). Please fix it and return strictly the valid JSON object."
                })

        raise ValueError(f"Failed to generate valid structured data after {retries} retries: {last_error}")

    def generate_embedding(self, text: str, dimensions: int = 128) -> List[float]:
        """
        Generate a normalized dense vector embedding for text.
        Uses character n-grams and term frequency hashing for fast, deterministic embeddings.
        """
        if not text:
            return [0.0] * dimensions
            
        vector = [0.0] * dimensions
        words = re.findall(r'\w+', text.lower())
        
        # Word hashing
        for word in words:
            h = hash(word) % dimensions
            vector[h] += 1.0
            
        # Bi-gram hashing for contextual semantics
        for i in range(len(words) - 1):
            bigram = f"{words[i]}_{words[i+1]}"
            h = hash(bigram) % dimensions
            vector[h] += 1.5
            
        # Normalize vector to unit length (L2 norm)
        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            vector = [x / norm for x in vector]
            
        return vector

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two float vectors."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

ai_service = AIService()
