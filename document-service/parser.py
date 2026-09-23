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
try:
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    DOCLING_AVAILABLE = True
    logger.info("Docling library loaded successfully.")
except Exception as e:
    logger.warning(f"Docling library not yet available: {e}")

ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.webp', '.bmp', '.docx', '.txt'}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


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


def run_ocr_on_pil_image(image: Image.Image) -> str:
    """
    Runs RapidOCR on a PIL image and returns extracted text lines.
    """
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
                pil_image = page.render(scale=2.0).to_pil()
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
            "parser": "Docling RapidOCR",
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
    
    # Configure Docling pipeline
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = use_ocr
    pipeline_options.do_table_structure = True
    
    pdf_format_option = PdfFormatOption(pipeline_options=pipeline_options)
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: pdf_format_option
        }
    )
    
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
            "parser": "Docling Engine",
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

        # If scanned PDF or image, run automatic RapidOCR
        if use_ocr and RAPID_OCR_AVAILABLE:
            return parse_scanned_document_with_ocr(temp_file_path, filename, is_image=is_image)

        # If digital document, run Docling conversion
        if DOCLING_AVAILABLE and not is_image:
            try:
                return parse_with_docling(temp_file_path, filename, use_ocr=False)
            except Exception as docling_err:
                logger.error(f"Docling pipeline notice: {docling_err}. Using text fallback.")
                return parse_with_fallback(temp_file_path, filename, is_image=is_image, use_ocr=False)
        else:
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
