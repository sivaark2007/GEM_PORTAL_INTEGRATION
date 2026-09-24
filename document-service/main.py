"""
FastAPI Backend & Document Processing Service for GeM Portal Integration.
Features:
- PostgreSQL persistence for Bidders, Tenders, Bid Submissions & Certificates
- Docling & Automatic OCR pipeline for public procurement documents
"""

import logging
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from parser import parse_document, ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from database import get_db, get_db_status, get_session_factory
from embedder import embed_document, get_query_embedding
from extractor import extract_fields, classify_document_type
from requirement_extractor import extract_tender_requirements, summarize_tender_requirements
from compliance_engine import run_compliance_pipeline
from crud import (
    init_database,
    get_bidders,
    get_bidder_by_id,
    create_bidder,
    get_tenders,
    get_tender_by_id,
    create_tender,
    update_tender_gem_doc,
    get_submissions,
    get_submission_by_id,
    create_submission,
    update_submission_verification,
)
from schemas import (
    CompanyCreate,
    CompanyResponse,
    TenderCreate,
    TenderResponse,
    GemBiddingDocument,
    TenderDocumentPayload,
    BidSubmissionCreate,
    BidSubmissionResponse,
    VerificationUpdate,
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("document-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes the database schema and seeds initial data upon startup."""
    logger.info("Initializing database schema...")
    try:
        SessionFactory = get_session_factory()
        with SessionFactory() as db:
            init_database(db)
        logger.info("Database schema initialized and verified.")
    except Exception as e:
        logger.error(f"Failed to initialize database on startup: {e}")
    yield


app = FastAPI(
    title="GeM Portal API & Document Processing Service",
    description="PostgreSQL-backed tender, bidder, and submission management with Docling & RapidOCR pipeline.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for local Express backend and Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- System & Health Endpoints ----------------
@app.get("/")
def root():
    db_info = get_db_status()
    return {
        "service": "GeM Portal API & Document Processing Service",
        "status": "online",
        "engine": "Docling + RapidOCR",
        "database": db_info,
        "supported_extensions": list(ALLOWED_EXTENSIONS)
    }


@app.get("/health")
def health_check():
    db_info = get_db_status()
    return {
        "status": "healthy",
        "service": "document-service",
        "database": db_info
    }


@app.get("/api/db/status")
def db_status():
    return get_db_status()


# ---------------- Bidder / Company Endpoints ----------------
@app.get("/api/bidders", response_model=List[CompanyResponse])
def list_bidders(db: Session = Depends(get_db)):
    """Fetch all registered bidders / companies from the database."""
    bidders = get_bidders(db)
    return [b.to_dict() for b in bidders]


@app.get("/api/bidders/{bidder_id}", response_model=CompanyResponse)
def get_bidder(bidder_id: str, db: Session = Depends(get_db)):
    """Fetch a specific bidder by ID."""
    bidder = get_bidder_by_id(db, bidder_id)
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")
    return bidder.to_dict()


@app.post("/api/bidders", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def add_bidder(bidder_in: CompanyCreate, db: Session = Depends(get_db)):
    """Register or save a new bidder into the database."""
    created = create_bidder(db, bidder_in)
    return created.to_dict()


# ---------------- Tender Endpoints ----------------
@app.get("/api/tenders", response_model=List[TenderResponse])
def list_tenders(db: Session = Depends(get_db)):
    """Fetch all tenders published by Government officers."""
    tenders = get_tenders(db)
    return [t.to_dict() for t in tenders]


@app.get("/api/tenders/{tender_id:path}", response_model=TenderResponse)
def get_tender(tender_id: str, db: Session = Depends(get_db)):
    """Fetch a single tender with all requirements and bidding document details."""
    tender = get_tender_by_id(db, tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender.to_dict()


@app.post("/api/tenders", response_model=TenderResponse, status_code=status.HTTP_201_CREATED)
def add_tender(tender_in: TenderCreate, db: Session = Depends(get_db)):
    """Create a new Government tender in the database."""
    created = create_tender(db, tender_in)
    return created.to_dict()


@app.post("/api/tenders/document", response_model=TenderResponse)
def attach_gem_bidding_document(payload: TenderDocumentPayload, db: Session = Depends(get_db)):
    """Attach parsed GeM Bidding Document specification to an existing tender."""
    updated = update_tender_gem_doc(db, payload.tenderId, payload.document.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="Tender not found")
    return updated.to_dict()


# ---------------- Bid Submission & Certificates Endpoints ----------------
@app.get("/api/bids", response_model=List[BidSubmissionResponse])
def list_submissions(
    tender_id: Optional[str] = Query(None, alias="tenderId"),
    company_id: Optional[str] = Query(None, alias="companyId"),
    db: Session = Depends(get_db)
):
    """
    Fetch bid submissions stored in the database.
    Can be filtered by tenderId or companyId.
    """
    submissions = get_submissions(db, tender_id=tender_id, company_id=company_id)
    return [s.to_dict() for s in submissions]


@app.get("/api/bids/{bid_id:path}", response_model=BidSubmissionResponse)
def get_submission(bid_id: str, db: Session = Depends(get_db)):
    """Fetch a specific bid submission including all certificates and parsed details."""
    submission = get_submission_by_id(db, bid_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission.to_dict()


@app.post("/api/bids", response_model=BidSubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_bid(sub_in: BidSubmissionCreate, db: Session = Depends(get_db)):
    """
    Submit a bid with certificates and details for a tender.
    Stores bidder's certificates and parsed data directly in the database.
    """
    # Verify tender and company exist
    tender = get_tender_by_id(db, sub_in.tenderId)
    if not tender:
        raise HTTPException(status_code=404, detail=f"Tender {sub_in.tenderId} not found")

    created = create_submission(db, sub_in)
    return created.to_dict()


@app.post("/api/bids/{bid_id:path}/verify", response_model=BidSubmissionResponse)
def verify_bid(bid_id: str, ver_in: VerificationUpdate, db: Session = Depends(get_db)):
    """Update verification status, compliance score, and flags for a bid submission."""
    updated = update_submission_verification(db, bid_id, ver_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Submission not found")
    return updated.to_dict()


# ---------------- Document Parsing Pipeline ----------------
@app.post("/parse-document")
async def handle_parse_document(file: UploadFile = File(...)):
    """
    Accepts an uploaded document (PDF/image/doc), parses text/tables with Docling,
    automatically detects and triggers OCR for scanned certificates, and returns structured JSON.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": "No file uploaded or missing filename.", "code": "NO_FILE"}
        )

    filename = file.filename
    logger.info(f"Received parse request for: '{filename}' (Content-Type: {file.content_type})")

    try:
        content = await file.read()
    except Exception as read_err:
        logger.error(f"Error reading file upload '{filename}': {read_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": f"Failed to read file content: {str(read_err)}", "code": "READ_ERROR"}
        )

    # Perform parsing and automatic OCR
    result = parse_document(content, filename)

    if not result.get("success"):
        error_code = result.get("code", "PROCESSING_ERROR")
        status_code = status.HTTP_400_BAD_REQUEST if error_code in ["UNSUPPORTED_FILE_TYPE", "EMPTY_FILE", "FILE_TOO_LARGE"] else status.HTTP_500_INTERNAL_SERVER_ERROR
        return JSONResponse(status_code=status_code, content=result)

    return JSONResponse(status_code=status.HTTP_200_OK, content=result)


# ===========================================================================
# Compliance Engine Endpoints
# ===========================================================================

@app.post("/tenders/{tender_id}/embed")
async def embed_tender_document(tender_id: str, db: Session = Depends(get_db)):
    """
    Step 1 (Procurement Officer): Embed a tender document into vectors.

    Reads the tender's gem_bidding_document text, chunks it, generates
    Gemini embeddings, and extracts structured requirements via LLM.

    Call this after uploading a tender PDF.
    """
    from crud import get_tender_by_id
    tender = get_tender_by_id(db, tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    # Extract text from the stored tender document
    gem_doc = tender.gem_bidding_document or {}
    tender_text = gem_doc.get("full_text", "") or gem_doc.get("text", "")
    if not tender_text:
        # Fallback: use title + requirements fields
        reqs = tender.requirements or []
        tender_text = tender.title + "\n" + "\n".join(
            [r if isinstance(r, str) else str(r) for r in reqs]
        )

    if not tender_text.strip():
        raise HTTPException(status_code=400, detail="No text content found in tender document")

    # 1. Chunk + embed the tender document
    chunks = embed_document(tender_text)
    logger.info(f"Embedded {len(chunks)} chunks for tender {tender_id}")

    # 2. Extract structured requirements using Gemini LLM
    requirements = extract_tender_requirements(tender_text)
    logger.info(f"Extracted {len(requirements)} requirements for tender {tender_id}")

    return {
        "success": True,
        "tender_id": tender_id,
        "chunks_embedded": len(chunks),
        "requirements_extracted": len(requirements),
        "requirements": requirements,
        "summary": summarize_tender_requirements(requirements)
    }


@app.post("/submissions/{submission_id}/embed")
async def embed_submission_documents(submission_id: str, db: Session = Depends(get_db)):
    """
    Step 2 (Bidder): Embed all bidder-uploaded documents into vectors.

    For each document in the submission:
    1. Classifies the document type (GST, PAN, Udyam, etc.)
    2. Extracts structured fields using Gemini
    3. Chunks and embeds the full text for RAG search

    Call this after a bidder uploads their documents.
    """
    from crud import get_submission_by_id
    submission = get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    all_chunks = []
    all_extracted_fields = {}
    doc_summaries = []

    # Process each document in the submission
    documents = submission.documents or []
    for doc in documents:
        parsed = doc.parsed_data or {}
        raw_text = parsed.get("full_text", "") or parsed.get("text", "")

        if not raw_text:
            logger.warning(f"Document {doc.id} has no parsed text — skipping embedding.")
            continue

        # Classify document type if not already set
        doc_type = parsed.get("document_type") or classify_document_type(raw_text)

        # Extract structured fields
        fields = extract_fields(raw_text, doc_type)
        all_extracted_fields.update(fields)  # Merge all fields into one dict

        # Chunk + embed the document text
        chunks = embed_document(raw_text)
        all_chunks.extend(chunks)

        doc_summaries.append({
            "document_name": doc.name,
            "document_type": doc_type,
            "chunks": len(chunks),
            "fields_extracted": list(fields.keys())
        })

    logger.info(f"Embedded {len(all_chunks)} total chunks for submission {submission_id}")

    return {
        "success": True,
        "submission_id": submission_id,
        "documents_processed": len(doc_summaries),
        "total_chunks": len(all_chunks),
        "extracted_fields": all_extracted_fields,
        "documents": doc_summaries
    }


@app.post("/submissions/{submission_id}/compliance-check")
async def run_compliance_check(
    submission_id: str,
    tender_id: str,
    db: Session = Depends(get_db)
):
    """
    Step 3 (Procurement Officer): Run full compliance analysis.

    Orchestrates the complete pipeline:
    1. Load tender requirements (extracted by /tenders/{id}/embed)
    2. Load + embed bidder documents (from /submissions/{id}/embed)
    3. RAG: find evidence for each requirement in bidder chunks
    4. Mock API: verify GSTIN, PAN, Udyam, etc. against government DBs
    5. Rule Engine: check numeric thresholds (turnover >= X)
    6. LLM Judge: determine COMPLIANT / NON_COMPLIANT / REVIEW per requirement
    7. Compute overall compliance score (0-100)

    Returns the full compliance report.
    """
    from crud import get_submission_by_id, get_tender_by_id

    tender = get_tender_by_id(db, tender_id)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    submission = get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # --- Load tender requirements ---
    gem_doc = tender.gem_bidding_document or {}
    tender_text = gem_doc.get("full_text", "") or gem_doc.get("text", "")
    if not tender_text:
        reqs = tender.requirements or []
        tender_text = tender.title + "\n" + "\n".join(
            [r if isinstance(r, str) else str(r) for r in reqs]
        )
    requirements = extract_tender_requirements(tender_text)

    if not requirements:
        return {
            "success": False,
            "message": "No requirements could be extracted from this tender. Run /tenders/{id}/embed first."
        }

    # --- Load + embed bidder documents ---
    all_chunks = []
    all_extracted_fields = {}

    documents = submission.documents or []
    for doc in documents:
        parsed = doc.parsed_data or {}
        raw_text = parsed.get("full_text", "") or parsed.get("text", "")
        if not raw_text:
            continue
        doc_type = parsed.get("document_type") or classify_document_type(raw_text)
        fields = extract_fields(raw_text, doc_type)
        all_extracted_fields.update(fields)
        chunks = embed_document(raw_text)
        all_chunks.extend(chunks)

    # --- Run the compliance engine ---
    compliance_result = await run_compliance_pipeline(
        requirements=requirements,
        bidder_chunks=all_chunks,
        extracted_fields=all_extracted_fields
    )

    # --- Update compliance score in DB ---
    from crud import update_submission_verification
    update_submission_verification(db, submission_id, {
        "compliance_score": compliance_result["compliance_score"],
        "ai_verification_stage": "Completed",
        "status": "Verified" if compliance_result["compliance_score"] >= 70 else "Under Review"
    })

    return {
        "success": True,
        "submission_id": submission_id,
        "tender_id": tender_id,
        **compliance_result
    }


@app.get("/submissions/{submission_id}/compliance-report")
async def get_compliance_report(submission_id: str, db: Session = Depends(get_db)):
    """
    Get the latest compliance report for a bid submission.
    Returns the stored compliance score, stage, and status.
    """
    from crud import get_submission_by_id
    submission = get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission.to_dict()


if __name__ == "__main__":
    import uvicorn
    # Start on 127.0.0.1:8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
