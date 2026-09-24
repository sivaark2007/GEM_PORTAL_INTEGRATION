"""
Tender Requirement Extractor for GeM Portal.
Uses Gemini LLM to read a tender document and extract
all eligibility conditions as structured rules.

Example output for "Annual turnover ≥ ₹50 Lakh for last 3 years":
{
  "requirement_text": "Annual turnover of minimum ₹50 Lakh for each of last 3 financial years",
  "requirement_type": "FINANCIAL",
  "rule_condition": {
    "field": "annual_turnover",
    "operator": ">=",
    "value": 5000000,
    "unit": "INR",
    "years": 3
  }
}
"""

import os
import json
import logging
from typing import List, Dict, Any

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("requirement-extractor")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

_model = genai.GenerativeModel("gemini-2.0-flash")


# ---------------------------------------------------------------------------
# Extraction Prompt
# ---------------------------------------------------------------------------

REQUIREMENT_EXTRACTION_PROMPT = """
You are an expert in Indian Government procurement and GeM (Government e-Marketplace) tenders.

Read the tender document text below and extract ALL eligibility/qualification requirements
that a bidder must satisfy to be considered for this tender.

For EACH requirement, return a JSON object with:
{{
  "requirement_text": "Clear human-readable description of the requirement",
  "requirement_type": "<TYPE>",
  "rule_condition": {{
    "field": "<field_name>",
    "operator": ">=|<=|==|exists|contains|not_debarred",
    "value": <threshold or null>,
    "unit": "INR|years|count|null",
    "years": <number of years if applicable, else null>
  }}
}}

Valid requirement_type values:
- FINANCIAL       → Turnover, net worth, profitability conditions
- GST             → GST registration required
- MSME            → Udyam/MSME registration required
- MCA             → Company incorporation, type of entity
- EPFO            → PF/EPFO registration required
- ESIC            → ESIC registration required
- INCOME_TAX      → ITR filing compliance
- EXPERIENCE      → Past project/work experience requirements
- TECHNICAL       → Technical specifications, certifications (ISO, BIS, etc.)
- LEGAL           → Legal compliance (no blacklist, debarment, litigation)
- OEM             → OEM authorization required
- MAKE_IN_INDIA   → Make in India preference/requirement
- STARTUP_INDIA   → Startup India registration
- OTHER           → Anything else

Valid field names for rule_condition:
  annual_turnover, net_worth, gstin, udyam_number, cin, pan,
  years_experience, contract_value, employee_count, establishment_id,
  is_debarred, is_msme, is_startup, is_oem_authorized, iso_certified

Tender Document:
\"\"\"
{tender_text}
\"\"\"

Return a JSON array of requirement objects. No explanation, no markdown, just the JSON array.
If you cannot find any specific requirements, return an empty array [].
"""


# ---------------------------------------------------------------------------
# Main Functions
# ---------------------------------------------------------------------------

def extract_tender_requirements(tender_text: str) -> List[Dict[str, Any]]:
    """
    Extract all eligibility requirements from a tender document.

    Args:
        tender_text: Full text of the tender document (from Docling/OCR parser).

    Returns:
        List of requirement dicts, each with requirement_text, requirement_type,
        and rule_condition for use by the compliance engine.
    """
    if not tender_text or not tender_text.strip():
        logger.warning("Empty tender text passed to requirement extractor.")
        return []

    # Gemini has context limits — use first 6000 chars which covers most tender eligibility sections
    truncated_text = tender_text[:6000]

    prompt = REQUIREMENT_EXTRACTION_PROMPT.format(tender_text=truncated_text)

    try:
        response = _model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown code fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        requirements = json.loads(raw)

        # Validate it's a list
        if not isinstance(requirements, list):
            logger.error("Requirement extractor returned non-list JSON.")
            return []

        logger.info(f"Extracted {len(requirements)} requirements from tender document.")
        return requirements

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in requirement extraction: {e}")
        return []
    except Exception as e:
        logger.error(f"Requirement extraction failed: {e}")
        return []


def summarize_tender_requirements(requirements: List[Dict[str, Any]]) -> str:
    """
    Generate a human-readable summary of all extracted requirements.
    Used in the compliance report header.
    """
    if not requirements:
        return "No specific eligibility requirements were extracted from this tender."

    lines = ["**Tender Eligibility Requirements:**\n"]
    for i, req in enumerate(requirements, 1):
        req_type = req.get("requirement_type", "OTHER")
        text = req.get("requirement_text", "No description")
        lines.append(f"{i}. [{req_type}] {text}")

    return "\n".join(lines)
