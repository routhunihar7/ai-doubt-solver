import os
import uuid
import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.utils.text_cleaner import extract_text_from_pdf, chunk_text
from app.repositories.document_repository import DocumentRepository
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.schemas.document import DocumentResponse

DOC_SUMMARY_PROMPT = """You are an academic researcher and document analyst.
Summarize the following document content concisely, highlighting its main subject, key topics covered, and intended educational purpose in 2-3 clear paragraphs.
"""

class PDFService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.doc_repo = DocumentRepository(session)
        self.history_repo = HistoryRepository(session)

    async def process_and_save_pdf(self, user_id: str, file: UploadFile) -> DocumentResponse:
        # Validate filename and type
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise ValueError("Only PDF files (.pdf) are supported.")

        # Generate unique stored filename
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

        # Read and check size
        content_bytes = await file.read()
        file_size = len(content_bytes)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise ValueError(f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
        if file_size == 0:
            raise ValueError("Uploaded PDF file is empty.")

        # Write to disk
        with open(file_path, "wb") as f:
            f.write(content_bytes)

        # Extract text via PyMuPDF
        pdf_data = extract_text_from_pdf(file_path)
        page_count = pdf_data.get("page_count", 1)
        full_text = pdf_data.get("full_text", "")

        if not full_text.strip():
            # If PDF is scanned or has no selectable text
            full_text = "Document uploaded without extractable text layer."

        # Generate summary of the document using the first ~4000 characters
        summary_sample = full_text[:4000]
        try:
            summary = await ai_service.chat_completion(
                messages=[
                    {"role": "system", "content": DOC_SUMMARY_PROMPT},
                    {"role": "user", "content": f"Document Title: {file.filename}\n\nContent:\n{summary_sample}"}
                ],
                temperature=0.3,
                max_tokens=600
            )
        except Exception:
            summary = f"Academic document '{file.filename}' containing {page_count} pages."

        # Create Document record
        doc_record = await self.doc_repo.create_document(
            user_id=user_id,
            filename=file.filename,
            file_path=file_path,
            file_size_bytes=file_size,
            page_count=page_count,
            summary=summary
        )

        # Process chunks per page
        chunks_to_insert = []
        chunk_idx = 0
        for p in pdf_data.get("pages", []):
            page_num = p["page_number"]
            page_chunks = chunk_text(p["text"], chunk_size=800, chunk_overlap=150)
            for c in page_chunks:
                embedding = ai_service.generate_embedding(c)
                chunks_to_insert.append({
                    "chunk_index": chunk_idx,
                    "page_number": page_num,
                    "content": c,
                    "embedding": embedding,
                    "metadata": {"page": page_num, "length": len(c)}
                })
                chunk_idx += 1

        if not chunks_to_insert:
            # Add at least one fallback chunk
            chunks_to_insert.append({
                "chunk_index": 0,
                "page_number": 1,
                "content": full_text[:1000] or "No text content.",
                "embedding": ai_service.generate_embedding(full_text[:1000]),
                "metadata": {"page": 1}
            })

        await self.doc_repo.add_chunks(doc_record.id, chunks_to_insert)

        await self.history_repo.log_activity(
            user_id=user_id,
            activity_type="document",
            title=f"Uploaded PDF: {file.filename}",
            description=f"{page_count} pages, {len(chunks_to_insert)} chunks indexed",
            reference_id=doc_record.id
        )

        return DocumentResponse.model_validate(doc_record)
