"""
Embedding Service for GeM Portal Compliance Engine.
Uses Google Gemini text-embedding-004 (768 dimensions) to convert
document text chunks into vectors for semantic similarity search.

No model download needed — runs entirely via Gemini API.
"""

import os
import logging
from typing import List, Dict, Any

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("embedder")

# Configure Gemini with API key from environment
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Gemini's text embedding model — 768 dimensions, multilingual, free tier available
EMBEDDING_MODEL = "models/text-embedding-004"

# Chunk settings — tuned for Indian government certificates and tender documents
CHUNK_SIZE = 500        # characters per chunk (covers ~1 paragraph of a certificate)
CHUNK_OVERLAP = 80      # overlap prevents losing context at chunk boundaries


# ---------------------------------------------------------------------------
# Text Chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split a long document into overlapping text chunks.

    Why overlapping?
    - Requirements in tenders sometimes span two paragraphs.
    - Overlap ensures those cross-boundary requirements are captured
      fully in at least one chunk.

    Args:
        text:       Full document text to split.
        chunk_size: Max characters per chunk.
        overlap:    Characters to repeat between consecutive chunks.

    Returns:
        List of non-empty text chunks.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap  # slide forward by (chunk_size - overlap)
    return chunks


# ---------------------------------------------------------------------------
# Embedding Calls
# ---------------------------------------------------------------------------

def get_embedding(text: str) -> List[float]:
    """
    Get a 768-dimensional embedding vector for a document chunk.
    Use this when storing document content into the vector database.

    task_type="RETRIEVAL_DOCUMENT" → optimized for storing searchable content.
    """
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text[:2000],        # Gemini embedding has a token limit
            task_type="RETRIEVAL_DOCUMENT"
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Embedding failed for text chunk: {e}")
        return [0.0] * 768              # Return zero vector on failure


def get_query_embedding(query: str) -> List[float]:
    """
    Get embedding for a search query (requirement text).
    Use this when SEARCHING the vector DB, not storing.

    task_type="RETRIEVAL_QUERY" → optimized for querying against stored docs.
    Different task type gives better retrieval accuracy.
    """
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=query[:2000],
            task_type="RETRIEVAL_QUERY"
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Query embedding failed: {e}")
        return [0.0] * 768


# ---------------------------------------------------------------------------
# Document Embedding Pipeline
# ---------------------------------------------------------------------------

def embed_document(text: str) -> List[Dict[str, Any]]:
    """
    Full pipeline: chunk a document and embed each chunk.

    Used for both:
    - Tender documents (uploaded by procurement officer)
    - Bidder documents (GST cert, PAN, financial statements, etc.)

    Args:
        text: Full extracted text of the document.

    Returns:
        List of dicts with keys: chunk_text, chunk_index, embedding.
    """
    if not text or not text.strip():
        logger.warning("Empty text passed to embed_document — skipping.")
        return []

    chunks = chunk_text(text)
    logger.info(f"Embedding {len(chunks)} chunks from document ({len(text)} chars total).")

    embedded = []
    for i, chunk in enumerate(chunks):
        vector = get_embedding(chunk)
        embedded.append({
            "chunk_text": chunk,
            "chunk_index": i,
            "embedding": vector
        })

    logger.info(f"Successfully embedded {len(embedded)} chunks.")
    return embedded


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Compute cosine similarity between two embedding vectors.
    Returns a float between -1.0 (opposite) and 1.0 (identical).
    Used for local scoring when pgvector is not available.
    """
    import math
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
