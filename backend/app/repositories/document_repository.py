from typing import Optional, Sequence, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.document import Document, DocumentChunk
from app.repositories.base_repository import BaseRepository

class DocumentRepository(BaseRepository[Document]):
    def __init__(self, session: AsyncSession):
        super().__init__(Document, session)

    async def get_user_documents(self, user_id: str, limit: int = 50) -> Sequence[Document]:
        stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_document_with_chunks(self, document_id: str, user_id: str) -> Optional[Document]:
        stmt = (
            select(Document)
            .options(selectinload(Document.chunks))
            .where(Document.id == document_id, Document.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_document(
        self,
        user_id: str,
        filename: str,
        file_path: str,
        file_size_bytes: int,
        page_count: int,
        summary: Optional[str] = None
    ) -> Document:
        doc = Document(
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            file_size_bytes=file_size_bytes,
            page_count=page_count,
            summary=summary,
            status="processed"
        )
        return await self.create(doc)

    async def add_chunks(self, document_id: str, chunks_data: List[dict]):
        for chunk in chunks_data:
            chunk_obj = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk["chunk_index"],
                page_number=chunk.get("page_number", 1),
                content=chunk["content"],
                embedding=chunk.get("embedding"),
                metadata_info=chunk.get("metadata", {})
            )
            self.session.add(chunk_obj)
        await self.session.flush()

    async def get_chunks_for_document(self, document_id: str) -> Sequence[DocumentChunk]:
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
