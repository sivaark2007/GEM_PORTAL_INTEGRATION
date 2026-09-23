"""
FastAPI Document Processing Service for GeM Portal Integration.
Exposes POST /parse-document for Docling & Automatic OCR.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from parser import parse_document, ALLOWED_EXTENSIONS, MAX_FILE_SIZE

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("document-service")

app = FastAPI(
    title="GeM Document Parsing & Automatic OCR Service",
    description="Docling-powered document processing and automatic OCR pipeline for public procurement documents.",
    version="1.0.0"
)

# Enable CORS for local Express backend and Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "GeM Document Parsing & Automatic OCR Service",
        "status": "online",
        "engine": "Docling",
        "supported_extensions": list(ALLOWED_EXTENSIONS)
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "document-service"
    }


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


if __name__ == "__main__":
    import uvicorn
    # Start on 127.0.0.1:8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
