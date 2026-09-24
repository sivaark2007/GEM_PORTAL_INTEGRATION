"""
Structured Field Extractor for GeM Portal Documents.
Uses Gemini LLM to extract key fields from raw OCR/parsed text
into structured JSON — replacing unreliable regex-based extraction.

Supports: GST Certificate, PAN, Udyam, MCA, Financial Statement,
          EPFO, ESIC, Experience Certificate, OEM Authorization.
"""

import os
import json
import logging
from typing import Dict, Any, Optional

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("extractor")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use flash model for extraction — fast and accurate for structured data
_model = genai.GenerativeModel("gemini-2.0-flash")


# ---------------------------------------------------------------------------
# Per-document-type extraction prompts
# ---------------------------------------------------------------------------

EXTRACTION_PROMPTS: Dict[str, str] = {

    "GST_CERTIFICATE": """
You are extracting data from an Indian GST Registration Certificate.
Extract these fields from the text below:

Fields to extract:
- gstin: 15-character GST Identification Number
- legal_name: Legal name of the business
- trade_name: Trade name (if different from legal name)
- registration_date: Date of GST registration (DD/MM/YYYY)
- status: Active / Inactive / Suspended / Cancelled
- business_type: Proprietorship / Partnership / Private Limited / Public Limited / LLP / etc.
- state: State of registration
- business_address: Full registered address

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "PAN": """
You are extracting data from an Indian PAN Card.
Extract these fields from the text below:

Fields to extract:
- pan_number: 10-character PAN (e.g., ABCDE1234F)
- name: Full name of the PAN holder
- date_of_birth: Date of birth (DD/MM/YYYY) — for individuals
- entity_type: Individual / Company / Firm / Trust / HUF

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "UDYAM_CERTIFICATE": """
You are extracting data from an Indian Udyam Registration Certificate (MSME).
Extract these fields from the text below:

Fields to extract:
- udyam_number: Udyam Registration Number (format: UDYAM-XX-00-0000000)
- enterprise_name: Name of the enterprise
- owner_name: Name of the proprietor/owner
- category: Micro / Small / Medium
- major_activity: Manufacturing / Services / Trading
- nic_code: NIC Activity Code
- registration_date: Date of registration
- state: State of the enterprise

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "MCA_DOCUMENT": """
You are extracting data from an Indian MCA (Ministry of Corporate Affairs) company document.
Extract these fields from the text below:

Fields to extract:
- cin: Company Identification Number (21-character CIN)
- company_name: Registered company name
- company_type: Private Limited / Public Limited / OPC / LLP
- date_of_incorporation: Date (DD/MM/YYYY)
- registered_office: Registered address
- authorized_capital: Amount in INR
- paid_up_capital: Amount in INR
- status: Active / Struck Off / Under Liquidation

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "FINANCIAL_STATEMENT": """
You are extracting data from an Indian company's Financial Statement / Balance Sheet / Audited Accounts.
Extract these fields from the text below:

Fields to extract:
- company_name: Name of the company
- financial_year: e.g., 2023-24
- annual_turnover: Total revenue / turnover in INR (number only)
- net_worth: Net worth / shareholders equity in INR (number only)
- profit_loss: Net profit or loss in INR (positive=profit, negative=loss)
- total_assets: Total assets in INR (number only)
- auditor_name: Name of the CA / auditor firm
- ca_registration: ICAI registration number of the CA
- audit_date: Date of audit report

Return ONLY a JSON object with these keys. Use null for missing fields.
Numbers should be plain integers (no commas, no currency symbol).
""",

    "EPFO_DOCUMENT": """
You are extracting data from an EPFO (Employee Provident Fund Organization) compliance document.
Extract these fields from the text below:

Fields to extract:
- establishment_id: EPFO Establishment Code
- establishment_name: Name of the establishment
- coverage_date: Date from which covered under EPFO
- employee_count: Number of employees covered
- compliance_status: Compliant / Non-Compliant / Pending
- last_return_filed: Date of last return filed

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "EXPERIENCE_CERTIFICATE": """
You are extracting data from a Work Experience Certificate or Purchase Order or Contract document.
Extract these fields from the text below:

Fields to extract:
- client_name: Name of the client organization
- client_type: Government / PSU / Private
- project_description: What work was done
- contract_value: Value of the contract/order in INR (number only)
- start_date: Project start date (DD/MM/YYYY)
- end_date: Project completion date (DD/MM/YYYY)
- duration_years: Duration in years (number)
- issuer_name: Name of the person who issued the certificate
- issuer_designation: Designation of the issuer

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "OEM_AUTHORIZATION": """
You are extracting data from an OEM (Original Equipment Manufacturer) Authorization Certificate.
Extract these fields from the text below:

Fields to extract:
- oem_name: Name of the OEM/manufacturer
- authorized_dealer: Name of the authorized dealer/reseller
- authorization_number: Certificate/authorization number
- product_category: Products/items authorized to sell
- valid_from: Start date of authorization
- valid_until: Expiry date of authorization
- territory: Authorized region/territory (India / specific states)

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "OTHER": """
You are extracting key information from a business/government document.
Extract whatever important fields you find:

- document_type: What type of document is this?
- key_identifier: The main ID/number in this document
- entity_name: Name of the company/person this belongs to
- date: Most relevant date in the document
- status: Any status mentioned (Active/Valid/Expired/etc.)
- key_values: A dict of any other important field:value pairs found

Return ONLY a JSON object with these keys. Use null for missing fields.
"""
}


# ---------------------------------------------------------------------------
# Main Extractor Function
# ---------------------------------------------------------------------------

def extract_fields(raw_text: str, doc_type: str) -> Dict[str, Any]:
    """
    Extract structured fields from raw OCR/parsed text using Gemini LLM.

    This replaces brittle regex-based extraction with intelligent LLM parsing
    that handles:
    - Varying certificate formats across states/years
    - Mixed Hindi/English text
    - Garbled OCR output (partial fixes)
    - Different field orderings and layouts

    Args:
        raw_text: Raw text extracted from the document (OCR or Docling output).
        doc_type: Document type key (e.g., "GST_CERTIFICATE", "PAN", "UDYAM_CERTIFICATE").

    Returns:
        dict with extracted fields. Falls back to {"raw_text_preview": ...} on failure.
    """
    if not raw_text or not raw_text.strip():
        logger.warning(f"Empty text passed to extractor for doc_type={doc_type}")
        return {"error": "No text to extract from"}

    # Get the appropriate prompt — fall back to generic if type unknown
    prompt_template = EXTRACTION_PROMPTS.get(doc_type, EXTRACTION_PROMPTS["OTHER"])

    full_prompt = f"""{prompt_template}

Document Text:
\"\"\"
{raw_text[:3000]}
\"\"\"

Remember: Return ONLY valid JSON. No explanation, no markdown fences.
"""

    try:
        response = _model.generate_content(full_prompt)
        raw_response = response.text.strip()

        # Strip markdown code fences if Gemini wraps output in ```json ... ```
        if raw_response.startswith("```"):
            raw_response = raw_response.split("```")[1]
            if raw_response.startswith("json"):
                raw_response = raw_response[4:]
            raw_response = raw_response.strip()

        extracted = json.loads(raw_response)
        logger.info(f"Successfully extracted {len(extracted)} fields for {doc_type}")
        return extracted

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from Gemini extraction for {doc_type}: {e}")
        # Return a partial result with raw preview so data isn't completely lost
        return {
            "extraction_error": "LLM returned non-JSON response",
            "raw_text_preview": raw_text[:500]
        }
    except Exception as e:
        logger.error(f"Gemini extraction failed for {doc_type}: {e}")
        return {"extraction_error": str(e)}


def classify_document_type(raw_text: str) -> str:
    """
    Auto-classify what type of document this is using Gemini.
    Used when the document type is not known in advance.

    Returns one of:
        GST_CERTIFICATE, PAN, UDYAM_CERTIFICATE, MCA_DOCUMENT,
        EPFO_DOCUMENT, FINANCIAL_STATEMENT, EXPERIENCE_CERTIFICATE,
        OEM_AUTHORIZATION, OTHER
    """
    prompt = f"""
You are classifying an Indian government/business document.
Read the text and return ONLY one of these exact labels:

GST_CERTIFICATE
PAN
UDYAM_CERTIFICATE
MCA_DOCUMENT
EPFO_DOCUMENT
FINANCIAL_STATEMENT
EXPERIENCE_CERTIFICATE
OEM_AUTHORIZATION
OTHER

Document text (first 1000 characters):
\"\"\"{raw_text[:1000]}\"\"\"

Return ONLY the label. Nothing else.
"""
    try:
        response = _model.generate_content(prompt)
        label = response.text.strip().upper().replace(" ", "_")
        valid = list(EXTRACTION_PROMPTS.keys())
        return label if label in valid else "OTHER"
    except Exception as e:
        logger.error(f"Document classification failed: {e}")
        return "OTHER"
