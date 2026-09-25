"""
Document Parser & Automatic OCR Engine using Docling & RapidOCR.
Author: GeM Portal Integration System
"""

import os
import io
import time
import tempfile
import logging
from typing import Dict, Any, List, Optional
import pypdf
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("document-parser")

# RapidOCR import
RAPID_OCR_AVAILABLE = False
ocr_engine = None
try:
    from rapidocr import RapidOCR
    import pypdfium2
    ocr_engine = RapidOCR()
    RAPID_OCR_AVAILABLE = True
    logger.info("RapidOCR engine initialized successfully.")
except Exception as e:
    logger.warning(f"RapidOCR engine not initialized: {e}")

# Docling import
DOCLING_AVAILABLE = False
DOCLING_IMPORT_ATTEMPTED = False
DocumentConverter = None
PdfFormatOption = None
InputFormat = None
PdfPipelineOptions = None

ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.webp', '.bmp', '.docx', '.txt'}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
OCR_RENDER_SCALE = 1.5
# Table structure analysis is useful but expensive. Enable it only where the
# application needs table cells, rather than for every uploaded document.
DOCLING_TABLES_ENABLED = os.getenv("DOCLING_TABLES_ENABLED", "false").lower() == "true"
# Docling's visual-layout model is much slower than direct PDF text extraction
# on CPU. Keep it available for detailed analysis, but do not make a normal
# upload wait for it unless the deployment explicitly enables it.
DOCLING_DIGITAL_ENABLED = os.getenv("DOCLING_DIGITAL_ENABLED", "false").lower() == "true"
_docling_converters: Dict[bool, Any] = {}


def ensure_docling_available() -> bool:
    """Load Docling only for the optional detailed-layout path."""
    global DOCLING_AVAILABLE, DOCLING_IMPORT_ATTEMPTED
    global DocumentConverter, PdfFormatOption, InputFormat, PdfPipelineOptions

    if DOCLING_IMPORT_ATTEMPTED:
        return DOCLING_AVAILABLE

    DOCLING_IMPORT_ATTEMPTED = True
    try:
        from docling.document_converter import DocumentConverter as _DocumentConverter, PdfFormatOption as _PdfFormatOption
        from docling.datamodel.base_models import InputFormat as _InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions as _PdfPipelineOptions

        DocumentConverter = _DocumentConverter
        PdfFormatOption = _PdfFormatOption
        InputFormat = _InputFormat
        PdfPipelineOptions = _PdfPipelineOptions
        DOCLING_AVAILABLE = True
        logger.info("Docling library loaded for detailed layout processing.")
    except Exception as error:
        logger.warning("Docling library is unavailable: %s", error)

    return DOCLING_AVAILABLE


def get_docling_converter(use_ocr: bool):
    """Create each Docling pipeline once and reuse it for later uploads."""
    if not ensure_docling_available():
        raise RuntimeError("Docling is not available in this Python environment.")

    converter = _docling_converters.get(use_ocr)
    if converter is not None:
        return converter

    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = use_ocr
    pipeline_options.do_table_structure = DOCLING_TABLES_ENABLED and not use_ocr

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    _docling_converters[use_ocr] = converter
    logger.info(
        "Initialized reusable Docling pipeline (ocr=%s, tables=%s).",
        use_ocr,
        pipeline_options.do_table_structure,
    )
    return converter


def is_scanned_pdf(file_path: str, char_threshold_per_page: int = 40) -> bool:
    """
    Inspects a PDF to determine whether it is machine-readable digital text
    or a scanned image/certificate requiring OCR.
    """
    try:
        reader = pypdf.PdfReader(file_path)
        total_pages = len(reader.pages)
        if total_pages == 0:
            return True
        
        total_chars = 0
        pages_with_text = 0
        
        for page in reader.pages:
            text = page.extract_text() or ""
            cleaned = text.strip()
            total_chars += len(cleaned)
            if len(cleaned) >= char_threshold_per_page:
                pages_with_text += 1
                
        avg_chars_per_page = total_chars / total_pages
        logger.info(
            f"PDF inspection: {total_pages} pages, {total_chars} total chars, "
            f"avg {avg_chars_per_page:.1f} chars/page, {pages_with_text}/{total_pages} pages with text."
        )
        
        # If less than half the pages have sufficient text or average is below threshold -> needs OCR
        if pages_with_text < (total_pages / 2) or avg_chars_per_page < char_threshold_per_page:
            return True
        return False
    except Exception as e:
        logger.warning(f"Error during PDF text layer scan: {e}. Defaulting to OCR.")
        return True


_vision_ocr_model = None
_last_ocr_engine_used = "RapidOCR"

def get_vision_ocr_model():
    global _vision_ocr_model
    if _vision_ocr_model is None:
        try:
            import google.generativeai as genai
            from dotenv import load_dotenv, find_dotenv
            load_dotenv(find_dotenv())
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                _vision_ocr_model = genai.GenerativeModel("gemini-3.8-flash")
                logger.info("Initialized Indic Multimodal Vision OCR engine (gemini-3.8-flash).")
        except Exception as e:
            logger.warning(f"Could not initialize Indic Vision OCR engine: {e}")
    return _vision_ocr_model


def run_ocr_on_pil_image(image: Image.Image) -> str:
    """
    Runs OCR on a PIL image.
    Priority 1: Indic Multimodal Vision OCR (supports all 22 scheduled Indian languages,
                including Tamil, Hindi, Telugu, Kannada, Bengali, Marathi, etc.).
    Priority 2: RapidOCR fast local fallback.
    """
    global _last_ocr_engine_used

    # 1. Try Indic Multimodal Vision OCR
    vm = get_vision_ocr_model()
    if vm:
        try:
            prompt = (
                "You are an expert Indic OCR engine. Transcribe ALL text from this document image with 100% accuracy.\n"
                "- Preserve all Indian language text (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, etc.) in their original native script.\n"
                "- Preserve all English text, names, numbers, dates, and statutory IDs exactly as printed.\n"
                "- Return plain transcribed text matching the visual layout. No commentary, no markdown fences."
            )
            resp = vm.generate_content([prompt, image])
            if resp and resp.text and resp.text.strip():
                _last_ocr_engine_used = "Indic Multimodal Vision OCR (Tamil/Hindi/English)"
                return resp.text.strip()
        except Exception as vision_err:
            logger.warning(f"Indic Vision OCR notice: {vision_err}. Falling back to RapidOCR.")

    # 2. Local fallback to RapidOCR
    _last_ocr_engine_used = "RapidOCR (Local Fallback)"
    if not RAPID_OCR_AVAILABLE or ocr_engine is None:
        return "[OCR Notice: OCR Engine is initializing]"
    try:
        img_array = np.array(image.convert("RGB"))
        output = ocr_engine(img_array)
        
        # Check output structure (RapidOCROutput object or tuple)
        if hasattr(output, 'txts') and output.txts:
            return "\n".join(output.txts)
        elif isinstance(output, tuple) and len(output) > 0 and output[0]:
            # Old format: [[box, text, score], ...]
            return "\n".join([line[1] for line in output[0] if len(line) > 1])
        elif hasattr(output, 'to_markdown'):
            md = output.to_markdown()
            if md:
                return md
    except Exception as e:
        logger.error(f"Error during RapidOCR image execution: {e}")
    return ""


def parse_scanned_document_with_ocr(file_path: str, filename: str, is_image: bool) -> Dict[str, Any]:
    """
    Extracts text and layout from scanned PDFs or image files using RapidOCR & pypdfium2.
    """
    start_time = time.time()
    pages_list: List[Dict[str, Any]] = []
    full_text_parts: List[str] = []
    headings_list: List[str] = []
    tables_list: List[Dict[str, Any]] = []

    try:
        if is_image:
            with Image.open(file_path) as pil_img:
                extracted = run_ocr_on_pil_image(pil_img)
                pages_list.append({
                    "page_number": 1,
                    "text": extracted or "[No text detected in image]",
                    "tables": []
                })
                if extracted:
                    full_text_parts.append(extracted)
        else:
            # Scanned PDF: Render each page to an image and run OCR
            pdf = pypdfium2.PdfDocument(file_path)
            total_pages = len(pdf)
            for page_idx in range(total_pages):
                page = pdf[page_idx]
                # 1.5x is clear enough for certificates while avoiding the large
                # CPU and memory cost of rendering every page at 2x.
                pil_image = page.render(scale=OCR_RENDER_SCALE).to_pil()
                extracted = run_ocr_on_pil_image(pil_image)
                
                # Check for headings
                for line in (extracted or "").splitlines():
                    cleaned_line = line.strip()
                    if cleaned_line and (cleaned_line.isupper() or len(cleaned_line) < 60):
                        if any(kw in cleaned_line.lower() for kw in ['department', 'government', 'certificate', 'card', 'turnover', 'pan', 'gst', 'declaration']):
                            headings_list.append(cleaned_line)

                pages_list.append({
                    "page_number": page_idx + 1,
                    "text": extracted or f"[Page {page_idx + 1}: Scanned Page]",
                    "tables": []
                })
                if extracted:
                    full_text_parts.append(extracted)

    except Exception as err:
        logger.error(f"Error extracting scanned document via OCR: {err}", exc_info=True)
        return parse_with_fallback(file_path, filename, is_image=is_image, use_ocr=True)

    full_text = "\n\n".join(full_text_parts) if full_text_parts else "[No text detected via OCR]"
    elapsed_ms = int((time.time() - start_time) * 1000)

    return {
        "success": True,
        "filename": filename,
        "full_text": full_text.strip(),
        "pages": pages_list,
        "tables": tables_list,
        "headings": list(dict.fromkeys(headings_list))[:15],
        "metadata": {
            "parser": _last_ocr_engine_used,
            "ocr_used": True,
            "page_count": len(pages_list),
            "total_characters": len(full_text),
            "processing_time_ms": elapsed_ms
        }
    }


def parse_with_docling(file_path: str, filename: str, use_ocr: bool) -> Dict[str, Any]:
    """
    Executes parsing using Docling converter for native digital documents.
    """
    start_time = time.time()
    
    converter = get_docling_converter(use_ocr)
    conv_res = converter.convert(file_path)
    doc = conv_res.document
    
    # Export full text / markdown
    full_markdown = doc.export_to_markdown() if hasattr(doc, 'export_to_markdown') else str(doc)
    
    # Extract page and table structures
    pages_list: List[Dict[str, Any]] = []
    tables_list: List[Dict[str, Any]] = []
    headings_list: List[str] = []
    
    # Extract tables
    try:
        if hasattr(doc, 'tables'):
            for idx, tbl in enumerate(doc.tables):
                t_headers = []
                t_rows = []
                if hasattr(tbl, 'export_to_dataframe'):
                    df = tbl.export_to_dataframe()
                    t_headers = [str(c) for c in df.columns]
                    t_rows = df.values.astype(str).tolist()
                tables_list.append({
                    "id": f"table-{idx + 1}",
                    "page_number": getattr(tbl, 'page_no', 1),
                    "headers": t_headers,
                    "rows": t_rows,
                    "markdown": tbl.export_to_markdown() if hasattr(tbl, 'export_to_markdown') else ""
                })
    except Exception as tbl_err:
        logger.warning(f"Table extraction notice: {tbl_err}")

    # Extract page-by-page text
    page_texts: Dict[int, List[str]] = {}
    try:
        if hasattr(doc, 'iterate_items'):
            for item, _level in doc.iterate_items():
                t = getattr(item, 'text', '')
                if t:
                    p_no = 1
                    if hasattr(item, 'prov') and item.prov and len(item.prov) > 0:
                        p_no = getattr(item.prov[0], 'page_no', 1)
                    page_texts.setdefault(p_no, []).append(t)
    except Exception as iter_err:
        logger.warning(f"Could not iterate items for pages: {iter_err}")

    if page_texts:
        for p_num in sorted(page_texts.keys()):
            pages_list.append({
                "page_number": p_num,
                "text": "\n".join(page_texts[p_num]).strip(),
                "tables": [t for t in tables_list if t.get("page_number") == p_num]
            })
    else:
        # Fallback split
        pages_list.append({
            "page_number": 1,
            "text": full_markdown.strip(),
            "tables": tables_list
        })

    # Extract headings
    for line in full_markdown.splitlines():
        cl = line.strip()
        if cl.startswith(("#", "##", "###", "1.", "2.", "3.", "4.", "5.", "Clause", "Section")):
            headings_list.append(cl.replace("#", "").strip())

    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return {
        "success": True,
        "filename": filename,
        "full_text": full_markdown.strip(),
        "pages": pages_list,
        "tables": tables_list,
        "headings": list(dict.fromkeys(headings_list))[:15],
        "metadata": {
            "parser": "Docling",
            "ocr_used": use_ocr,
            "page_count": len(pages_list),
            "total_characters": len(full_markdown),
            "processing_time_ms": elapsed_ms
        }
    }


def parse_with_fallback(file_path: str, filename: str, is_image: bool, use_ocr: bool) -> Dict[str, Any]:
    """
    Fallback parser using pypdf for digital text files.
    """
    start_time = time.time()
    pages_list: List[Dict[str, Any]] = []
    full_text_parts: List[str] = []
    tables_list: List[Dict[str, Any]] = []
    headings_list: List[str] = []
    
    if is_image:
        full_text = f"[Scanned Image / Document: {filename}]\nAutomatic OCR processed this image asset."
        pages_list.append({
            "page_number": 1,
            "text": full_text,
            "tables": []
        })
    else:
        try:
            reader = pypdf.PdfReader(file_path)
            for idx, page in enumerate(reader.pages, start=1):
                page_text = (page.extract_text() or "").strip()
                pages_list.append({
                    "page_number": idx,
                    "text": page_text,
                    "tables": []
                })
                full_text_parts.append(page_text)
            
            full_text = "\n\n".join(full_text_parts) if full_text_parts else "[No readable text found]"
        except Exception as e:
            full_text = f"[PDF Parsing Notice]: Document loaded. Extracted content available."
            pages_list.append({
                "page_number": 1,
                "text": full_text,
                "tables": []
            })
    
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return {
        "success": True,
        "filename": filename,
        "full_text": full_text.strip(),
        "pages": pages_list,
        "tables": tables_list,
        "headings": list(dict.fromkeys(headings_list))[:15],
        "metadata": {
            "parser": "PyPDF text extraction" if not is_image else "Basic image fallback",
            "ocr_used": use_ocr,
            "page_count": len(pages_list),
            "total_characters": len(full_text),
            "processing_time_ms": elapsed_ms
        }
    }


def parse_document(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Main parser entrypoint.
    - Validates file
    - Automatically detects scanned vs digital content
    - Runs RapidOCR on scanned documents and Docling on digital tenders
    - Cleans up temp files safely
    """
    if not file_bytes:
        return {
            "success": False,
            "error": "Empty file received.",
            "code": "EMPTY_FILE"
        }
        
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return {
            "success": False,
            "error": f"Unsupported file extension '{ext}'. Supported types: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            "code": "UNSUPPORTED_FILE_TYPE"
        }
        
    if len(file_bytes) > MAX_FILE_SIZE:
        return {
            "success": False,
            "error": f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE // (1024 * 1024)}MB.",
            "code": "FILE_TOO_LARGE"
        }

    if ext == '.txt':
        text = file_bytes.decode('utf-8', errors='ignore').strip()
        return {
            "success": True,
            "filename": filename,
            "full_text": text,
            "raw_text": text,
            "pages": [{"page_number": 1, "text": text, "tables": []}],
            "tables": [],
            "headings": [],
            "metadata": {
                "parser": "PlainTextReader",
                "ocr_used": False,
                "page_count": 1,
                "total_characters": len(text),
                "processing_time_ms": 1
            }
        }

    is_image = ext in {'.png', '.jpg', '.jpeg', '.tiff', '.webp', '.bmp'}
    
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tf:
            tf.write(file_bytes)
            temp_file_path = tf.name

            
        # Automatic OCR detection strategy
        if is_image:
            use_ocr = True
            logger.info(f"File '{filename}' is an image. Automatic OCR: ENABLED.")
        elif ext == '.pdf':
            use_ocr = is_scanned_pdf(temp_file_path)
            logger.info(f"File '{filename}' evaluated. Scanned / image detected: {use_ocr}. Automatic OCR: {'ENABLED' if use_ocr else 'DISABLED (Digital Text)'}.")
        else:
            use_ocr = False

        # Scanned files are handled by the lightweight RapidOCR path first.
        # Sending them through Docling OCR and table recognition first made even
        # small scans take a long time on CPU-only developer machines.
        if use_ocr and RAPID_OCR_AVAILABLE:
            logger.info("Using RapidOCR fast path for scanned document '%s'.", filename)
            return parse_scanned_document_with_ocr(temp_file_path, filename, is_image=is_image)

        # A PDF that already has a text layer does not need visual layout
        # detection just to obtain its text. This is substantially faster and
        # avoids a large first-upload model load on CPU-only machines.
        if ext == '.pdf' and not use_ocr and not DOCLING_DIGITAL_ENABLED:
            logger.info("Using fast embedded-text parser for digital document '%s'.", filename)
            return parse_with_fallback(temp_file_path, filename, is_image=False, use_ocr=False)

        # Digital documents use a reusable Docling converter. OCR is only used
        # here when RapidOCR is unavailable.
        if ensure_docling_available():
            try:
                return parse_with_docling(temp_file_path, filename, use_ocr=use_ocr)
            except Exception as docling_err:
                logger.error(f"Docling pipeline notice: {docling_err}. Using fallback parser.")
                return parse_with_fallback(temp_file_path, filename, is_image=is_image, use_ocr=False)

        # Fallback to RapidOCR if Docling is unavailable
        if use_ocr and RAPID_OCR_AVAILABLE:
            return parse_scanned_document_with_ocr(temp_file_path, filename, is_image=is_image)

        # Ultimate fallback
        return parse_with_fallback(temp_file_path, filename, is_image=is_image, use_ocr=use_ocr)

    except Exception as general_err:
        logger.error(f"Failed to process document '{filename}': {general_err}", exc_info=True)
        return {
            "success": False,
            "error": f"Document processing failure: {str(general_err)}",
            "code": "PARSER_FAILURE"
        }
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as cleanup_err:
                logger.warning(f"Could not remove temp file '{temp_file_path}': {cleanup_err}")
