from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.document import (
    DocumentResponse, DocumentDetailResponse, DocumentAskRequest,
    DocumentAskResponse, DocumentSummaryResponse
)
from app.services.pdf_service import PDFService
from app.services.rag_service import RAGService
from app.repositories.document_repository import DocumentRepository

router = APIRouter(prefix="/documents", tags=["PDF & Document Assistant (RAG)"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload PDF, extract text with PyMuPDF, chunk, index embeddings, and summarize."""
    service = PDFService(db)
    try:
        return await service.process_and_save_pdf(user_id=current_user.id, file=file)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List uploaded academic documents for current user."""
    repo = DocumentRepository(db)
    docs = await repo.get_user_documents(current_user.id)
    return [DocumentResponse.model_validate(d) for d in docs]

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get document details with indexed chunks."""
    repo = DocumentRepository(db)
    doc = await repo.get_document_with_chunks(document_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return DocumentDetailResponse.model_validate(doc)

@router.post("/{document_id}/ask", response_model=DocumentAskResponse)
async def ask_document_doubt(
    document_id: str,
    req: DocumentAskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ask question about a specific document using Vector RAG similarity search."""
    service = RAGService(db)
    try:
        return await service.query_document(
            user_id=current_user.id,
            document_id=document_id,
            request=req
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{document_id}/summary", response_model=DocumentSummaryResponse)
async def get_document_summary(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get document summary."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return DocumentSummaryResponse(
        document_id=doc.id,
        document_name=doc.filename,
        summary=doc.summary or "No summary available.",
        page_count=doc.page_count
    )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a document and its indexed chunks."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    await repo.delete_by_id(document_id)
    return {"message": "Document deleted successfully."}
