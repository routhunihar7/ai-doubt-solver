import re
from typing import List, Dict, Any
import pymupdf as fitz

def clean_text(text: str) -> str:
    """Clean extracted text by removing control characters, excess newlines and spacing."""
    if not text:
        return ""
    
    # Replace non-breaking spaces and zero-width spaces
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    
    # Normalize consecutive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Replace excessive spaces/tabs on the same line
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Strip leading/trailing whitespaces per line
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join([line for line in lines if line])
    
    return text.strip()

def chunk_text(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> List[str]:
    """
    Split text into overlapping chunks using paragraph and sentence boundaries.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []
    
    if len(cleaned) <= chunk_size:
        return [cleaned]
    
    chunks: List[str] = []
    start = 0
    text_length = len(cleaned)
    
    while start < text_length:
        end = start + chunk_size
        
        if end >= text_length:
            chunks.append(cleaned[start:].strip())
            break
        
        # Look for sentence boundaries (., ?, !, \n) near the end
        boundary = -1
        for sep in ['\n\n', '\n', '. ', '? ', '! ', '; ']:
            pos = cleaned.rfind(sep, start, end)
            if pos != -1 and pos > start + (chunk_size // 2):
                boundary = pos + len(sep)
                break
        
        if boundary != -1:
            chunk = cleaned[start:boundary].strip()
            chunks.append(chunk)
            start = max(boundary - chunk_overlap, start + 1)
        else:
            # Fallback to space break
            space_pos = cleaned.rfind(' ', start, end)
            if space_pos != -1 and space_pos > start + (chunk_size // 2):
                chunk = cleaned[start:space_pos].strip()
                chunks.append(chunk)
                start = max(space_pos - chunk_overlap, start + 1)
            else:
                chunk = cleaned[start:end].strip()
                chunks.append(chunk)
                start = end - chunk_overlap
                
    return [c for c in chunks if len(c) > 20]

def extract_text_from_pdf(file_path: str) -> Dict[str, Any]:
    """
    Extract text and metadata from a PDF file using PyMuPDF.
    Returns page-wise text and document metadata.
    """
    doc = fitz.open(file_path)
    pages = []
    total_text = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text()
        cleaned_page_text = clean_text(page_text)
        
        pages.append({
            "page_number": page_num + 1,
            "text": cleaned_page_text
        })
        if cleaned_page_text:
            total_text.append(cleaned_page_text)
            
    doc_metadata = doc.metadata or {}
    page_count = len(doc)
    doc.close()
    
    return {
        "page_count": page_count,
        "metadata": doc_metadata,
        "pages": pages,
        "full_text": "\n\n".join(total_text)
    }
