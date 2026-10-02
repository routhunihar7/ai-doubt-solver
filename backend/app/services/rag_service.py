from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.document_repository import DocumentRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.document import DocumentAskRequest, DocumentAskResponse, DocumentSourceChunk
from app.models.document import DocumentChunk

RAG_SYSTEM_PROMPT = """You are an academic research assistant answering questions strictly based on the provided document excerpts.

Rules:
1. Base your answer PRIMARILY on the retrieved document context below.
2. If the document provides a direct answer, synthesize it clearly and cite the relevant page numbers.
3. If the document does not contain enough information to fully answer the query, clearly state what information is in the document and what is missing, rather than hallucinating facts.
4. Use formatting (bullet points, bold text, code blocks, LaTeX math) where appropriate to make the answer clear and accessible.
"""

class RAGService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.doc_repo = DocumentRepository(session)
        self.history_repo = HistoryRepository(session)

    async def query_document(
        self,
        user_id: str,
        document_id: str,
        request: DocumentAskRequest
    ) -> DocumentAskResponse:
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc or doc.user_id != user_id:
            raise ValueError("Document not found or unauthorized.")

        # Fetch all chunks for this document
        chunks = await self.doc_repo.get_chunks_for_document(document_id)
        if not chunks:
            raise ValueError("No indexed content found for this document.")

        # Generate query embedding
        query_vector = ai_service.generate_embedding(request.question)

        # Rank chunks by cosine similarity
        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        for chunk in chunks:
            if chunk.embedding:
                sim = ai_service.cosine_similarity(query_vector, chunk.embedding)
            else:
                sim = 0.0
            scored_chunks.append((sim, chunk))

        # Sort by similarity descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_k = scored_chunks[:request.max_chunks]

        # Build context string
        context_parts = []
        source_items = []
        for sim, chunk in top_k:
            context_parts.append(
                f"[Excerpt from Page {chunk.page_number}]:\n{chunk.content}"
            )
            source_items.append(
                DocumentSourceChunk(
                    chunk_index=chunk.chunk_index,
                    page_number=chunk.page_number,
                    snippet=chunk.content[:200] + ("..." if len(chunk.content) > 200 else ""),
                    similarity_score=round(float(sim), 3)
                )
            )

        context_str = "\n\n---\n\n".join(context_parts)

        # Call LLM with retrieved context
        user_prompt = (
            f"Document Title: {doc.filename}\n\n"
            f"Retrieved Document Context:\n{context_str}\n\n"
            f"User Question: {request.question}\n\n"
            f"Please provide an accurate, grounded answer citing page references."
        )

        answer_text = await ai_service.chat_completion(
            messages=[
                {"role": "system", "content": RAG_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )

        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="document",
            title=f"Asked about PDF: {doc.filename}",
            description=request.question[:100],
            reference_id=doc.id,
            metadata_info={"question": request.question, "top_sources": len(source_items)}
        )

        return DocumentAskResponse(
            question=request.question,
            answer=answer_text,
            document_id=doc.id,
            document_name=doc.filename,
            sources=source_items
        )
