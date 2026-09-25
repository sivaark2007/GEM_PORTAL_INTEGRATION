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

# Candidate models to try in order of preference
MODEL_CANDIDATES = [
    os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest"
]

_model = None
for candidate in MODEL_CANDIDATES:
    try:
        _model = genai.GenerativeModel(candidate)
        logger.info(f"Initialized Gemini model: {candidate}")
        break
    except Exception as err:
        logger.warning(f"Could not initialize {candidate}: {err}")

if _model is None:
    _model = genai.GenerativeModel("gemini-3.8-flash")


# ---------------------------------------------------------------------------
# Universal Indic Document Extractor Prompt (Handles ANY Indian Language & Document)
# ---------------------------------------------------------------------------

UNIVERSAL_INDIC_PROMPT = """
You are an expert universal Indian document analyzer and data extractor for government, statutory, and procurement records.
The document text may be in English and/or any Indian language script (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Odia, Punjabi, etc.).

Analyze the document and extract all available information into a clean JSON object with this standard schema:
{
  "document_title": "Official document title (e.g. Aadhaar Card, Permanent Account Number Card, GST Registration, Udyam MSME Certificate, Certificate of Incorporation, Voter ID, Driving License, etc.)",
  "document_category": "Standard category: AADHAAR / PAN / GST_CERTIFICATE / UDYAM_CERTIFICATE / MCA_DOCUMENT / OEM_AUTHORIZATION / FINANCIAL_STATEMENT / IDENTITY_DOCUMENT / OTHER",
  "issuing_authority": "Issuing Government Authority / Ministry / Department / Organization (e.g. UIDAI, Income Tax Department, CBIC, Ministry of MSME, MCA)",
  "primary_identifier_name": "Name of main statutory ID (e.g. Aadhaar Number, PAN Number, GSTIN, CIN, Udyam Registration No, License No)",
  "primary_identifier_value": "The exact statutory number/ID. Note: Correct OCR errors where letters/numbers are confused (e.g., 5 vs S in 10-character PAN cards).",
  "name": "Full legal name in English",
  "name_regional_script": "Name in native Indian script (Tamil, Hindi, etc.) if present, otherwise null",
  "father_or_representative_name": "Father's name, Spouse name, Care of (S/O, D/O, W/O, C/O), or Authorized Director / Signatory",
  "date_of_birth_or_incorporation": "DD/MM/YYYY date if present, otherwise null",
  "gender": "Male / Female / Transgender / NA",
  "address": "Full postal address with district, state, and PIN code if present",
  "key_fields": {
    "Any additional detected field": "value"
  }
}

Return ONLY valid JSON. No explanation, no markdown code fences.
"""


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
- pan_number: 10-character Permanent Account Number.
  CRITICAL OCR CORRECTION: Indian PAN cards always follow the statutory format [A-Z]{5}[0-9]{4}[A-Z] (5 uppercase alphabetic letters, 4 digits, 1 uppercase alphabetic letter). Optical Character Recognition (OCR) frequently misidentifies characters (e.g. reading 'S' as '5', 'O' as '0', 'I' as '1', 'B' as '8'). If you see a candidate like 'UBDP51014R', correct the 5th character from digit '5' to letter 'S' -> 'UBDPS1014R'. The first 5 characters MUST be alphabetic.
- name: Full name of the PAN holder (e.g., SARAN KUMAR)
- father_name: Father's name if present
- date_of_birth: Date of birth (DD/MM/YYYY)
- entity_type: Individual / Company / Firm / Trust / HUF

Return ONLY a JSON object with these keys. Use null for missing fields.
""",

    "AADHAAR": """
You are extracting data from an Indian Aadhaar Card (issued by UIDAI / Unique Identification Authority of India).
Extract these fields from the text below:

Fields to extract:
- aadhaar_number: 12-digit Aadhaar number (e.g., 3039 6841 0567). Always 12 digits, often formatted in 3 groups of 4 digits.
- name: Full name of the resident (e.g., Saran Kumar)
- father_name: Father's Name or Care of / S/O / D/O / W/O / C/O (e.g., Kumar)
- date_of_birth: Date of birth (DD/MM/YYYY)
- gender: Male / Female / Transgender
- address: Full address including street, village/town, district, state, and PIN code
- enrolment_no: Enrolment number if present (e.g., 2726/11201/98534)

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

import re

def normalize_pan(pan: str) -> str:
    """
    Normalizes a PAN string by correcting common OCR character confusions.
    Indian PAN structure: 5 uppercase letters, 4 numeric digits, 1 uppercase letter.
    """
    if not pan:
        return ""
    clean = re.sub(r'[^A-Z0-9]', '', pan.strip().upper())
    if len(clean) != 10:
        return clean

    chars = list(clean)
    digit_to_alpha = {'0': 'O', '1': 'I', '2': 'Z', '5': 'S', '8': 'B'}
    alpha_to_digit = {'O': '0', 'D': '0', 'I': '1', 'L': '1', 'Z': '2', 'S': '5', 'B': '8'}

    # First 5 characters must be uppercase alphabets
    for i in range(5):
        if chars[i].isdigit() and chars[i] in digit_to_alpha:
            chars[i] = digit_to_alpha[chars[i]]

    # Characters 6 to 9 (indices 5-8) must be digits
    for i in range(5, 9):
        if chars[i].isalpha() and chars[i] in alpha_to_digit:
            chars[i] = alpha_to_digit[chars[i]]

    # 10th character (index 9) must be an uppercase alphabet
    if chars[9].isdigit() and chars[9] in digit_to_alpha:
        chars[9] = digit_to_alpha[chars[9]]

    return "".join(chars)


def extract_fallback(raw_text: str, doc_type: str) -> Dict[str, Any]:
    """
    Deterministic regex and rule-based field extractor used as a reliable fallback
    when LLM is unreachable or returns malformed data.
    """
    extracted: Dict[str, Any] = {}
    upper = raw_text.upper()

    if doc_type == "PAN" or "PERMANENT ACCOUNT" in upper or "INCOME TAX DEPARTMENT" in upper:
        # 1. Search for statutory PAN regex
        pan_match = re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', upper)
        if pan_match:
            pan_val = pan_match.group(0)
        else:
            # Tolerant search: 4 letters + 1 char + 4 digits + 1 letter
            pan_cand = re.search(r'\b[A-Z]{4}[A-Z0-9][0-9]{4}[A-Z0-9]\b', upper)
            pan_val = normalize_pan(pan_cand.group(0)) if pan_cand else None

        # 2. Date of birth
        dob_match = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', raw_text)
        dob = dob_match.group(1) if dob_match else None

        # 3. Name heuristic from lines
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        name = None
        father_name = None
        for i, line in enumerate(lines):
            l_up = line.upper()
            if "NAME" in l_up and "FATHER" not in l_up:
                if i + 1 < len(lines) and not any(k in lines[i+1].upper() for k in ["FATHER", "DATE", "PERMANENT"]):
                    name = lines[i+1].strip()
            elif "FATHER" in l_up:
                if i + 1 < len(lines) and not any(k in lines[i+1].upper() for k in ["DATE", "SIGNATURE", "BIRTH"]):
                    father_name = lines[i+1].strip()

        # If name not found by keyword, check for prominent uppercase names
        if not name:
            for line in lines:
                clean_l = re.sub(r'[^A-Za-z\s]', '', line).strip()
                if len(clean_l.split()) >= 2 and clean_l.isupper() and clean_l not in ["INCOME TAX DEPARTMENT", "GOVT OF INDIA", "PERMANENT ACCOUNT NUMBER CARD"]:
                    name = clean_l
                    break

        extracted = {
            "pan_number": pan_val,
            "pan": pan_val,
            "name": name,
            "father_name": father_name,
            "date_of_birth": dob,
            "entity_type": "Individual" if (pan_val and len(pan_val) >= 4 and pan_val[3] == 'P') else ("Company" if pan_val else None)
        }

    elif doc_type == "GST_CERTIFICATE" or "GSTIN" in upper:
        gst_match = re.search(r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b', upper)
        extracted = {
            "gstin": gst_match.group(0) if gst_match else None,
            "status": "Active"
        }

    elif doc_type == "UDYAM_CERTIFICATE" or "UDYAM" in upper:
        udyam_match = re.search(r'\bUDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}\b', upper)
        extracted = {
            "udyam_number": udyam_match.group(0) if udyam_match else None,
            "category": "Micro/Small/Medium"
        }

    elif doc_type == "AADHAAR" or "AADHAAR" in upper or "UIDAI" in upper or "UNIQUE IDENTIFICATION" in upper:
        # 1. Aadhaar Number (12 digits, often 4-4-4)
        aadhaar_match = re.search(r'\b[0-9]{4}\s[0-9]{4}\s[0-9]{4}\b', raw_text)
        aadhaar_num = aadhaar_match.group(0) if aadhaar_match else None
        if not aadhaar_num:
            m12 = re.search(r'\b[0-9]{12}\b', raw_text)
            if m12:
                d = m12.group(0)
                aadhaar_num = f"{d[0:4]} {d[4:8]} {d[8:12]}"

        # 2. Date of Birth
        dob_match = re.search(r'(?:DOB|Birth|நாள்)[\s:]*([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})', raw_text, re.IGNORECASE)
        dob = dob_match.group(1) if dob_match else None
        if not dob:
            d_any = re.search(r'\b([0-9]{2}/[0-9]{2}/[0-9]{4})\b', raw_text)
            dob = d_any.group(1) if d_any else None

        # 3. Gender
        gender = "Male" if ("MALE" in upper or "ஆண்" in raw_text) else ("Female" if ("FEMALE" in upper or "பெண்" in raw_text) else None)

        # 4. Care of / Father's Name
        so_match = re.search(r'(?:S/O|D/O|W/O|C/O|S\s*/\s*O|D\s*/\s*D|W\s*/\s*O)[\s:]*([A-Za-z\s]+)', raw_text, re.IGNORECASE)
        father = so_match.group(1).split(',')[0].strip() if so_match else None

        # 5. Name: find line with English person name (typically before DOB / Gender)
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        name = None
        for i, l in enumerate(lines):
            clean_up = l.upper()
            if any(kw in clean_up for kw in ["DOB", "DATE OF BIRTH", "MALE", "FEMALE", "YEAR OF BIRTH"]):
                if i > 0 and len(lines[i-1].split()) <= 4 and re.match(r'^[A-Za-z\s\.]+$', lines[i-1]):
                    name = lines[i-1].strip()
                    break
            if clean_up in ["TO", "பெயர்", "NAME"]:
                if i + 1 < len(lines):
                    cand = lines[i+1].split('S/')[0].split('S /')[0].strip()
                    if re.match(r'^[A-Za-z\s\.]+$', cand):
                        name = cand
                        break

        extracted = {
            "aadhaar_number": aadhaar_num,
            "name": name,
            "father_name": father,
            "date_of_birth": dob,
            "gender": gender,
        }

    return extracted


def normalize_extracted_data(extracted: Dict[str, Any], doc_type: str, raw_text: str) -> Dict[str, Any]:
    """
    Enriches extracted dictionary with canonical alias keys and
    human-friendly display keys for the frontend UI.
    """
    res = dict(extracted)

    # Aadhaar normalization
    aadhaar = res.get("aadhaar_number") or res.get("aadhaar")
    if aadhaar and isinstance(aadhaar, str):
        res["aadhaar_number"] = aadhaar.strip()
        res["Aadhaar Number"] = aadhaar.strip()
    if (doc_type == "AADHAAR" or "Aadhaar Number" in res) and "name" in res and res["name"]:
        res["Resident Name"] = str(res["name"])
        res["Cardholder Name"] = str(res["name"])
    if (doc_type == "AADHAAR" or "Aadhaar Number" in res) and "gender" in res and res["gender"]:
        res["Gender"] = str(res["gender"])
    if (doc_type == "AADHAAR" or "Aadhaar Number" in res) and "father_name" in res and res["father_name"]:
        res["Care of / Father's Name"] = str(res["father_name"])
    if (doc_type == "AADHAAR" or "Aadhaar Number" in res) and "address" in res and res["address"]:
        res["Registered Address"] = str(res["address"])
    if (doc_type == "AADHAAR" or "Aadhaar Number" in res) and "enrolment_no" in res and res["enrolment_no"]:
        res["Enrolment Number"] = str(res["enrolment_no"])

    # PAN normalization
    pan_candidate = res.get("pan_number") or res.get("pan") or res.get("key_identifier")
    if pan_candidate and isinstance(pan_candidate, str):
        normalized = normalize_pan(pan_candidate)
        res["pan_number"] = normalized
        res["pan"] = normalized
        res["PAN Number"] = normalized

    if "name" in res and res["name"]:
        res["Cardholder Name"] = str(res["name"])
        res["Name of Assessee"] = str(res["name"])
    if "father_name" in res and res["father_name"]:
        res["Father's Name"] = str(res["father_name"])
    if "date_of_birth" in res and res["date_of_birth"]:
        res["Date of Birth"] = str(res["date_of_birth"])
    if "entity_type" in res and res["entity_type"]:
        res["Entity Classification"] = str(res["entity_type"])

    # GST normalization
    gstin = res.get("gstin")
    if gstin and isinstance(gstin, str):
        res["GSTIN"] = gstin.strip().upper()
    if "legal_name" in res and res["legal_name"]:
        res["Legal Name"] = str(res["legal_name"])
    if "trade_name" in res and res["trade_name"]:
        res["Trade Name"] = str(res["trade_name"])

    # Udyam normalization
    udyam = res.get("udyam_number")
    if udyam and isinstance(udyam, str):
        res["Udyam Registration No"] = udyam.strip().upper()
    if "enterprise_name" in res and res["enterprise_name"]:
        res["Enterprise Name"] = str(res["enterprise_name"])

    # MCA normalization
    cin = res.get("cin")
    if cin and isinstance(cin, str):
        res["CIN"] = cin.strip().upper()
    if "company_name" in res and res["company_name"]:
        res["Company Name"] = str(res["company_name"])

    # Universal schema normalization (handles any Indian language / statutory document)
    if "document_title" in res and res["document_title"]:
        res["Document Title"] = str(res["document_title"])
    if "issuing_authority" in res and res["issuing_authority"]:
        res["Issuing Authority"] = str(res["issuing_authority"])
    if "primary_identifier_value" in res and res["primary_identifier_value"]:
        id_name = res.get("primary_identifier_name") or "Primary Identifier"
        res[id_name] = str(res["primary_identifier_value"])
        res["Primary Identifier"] = str(res["primary_identifier_value"])
    if "name_regional_script" in res and res["name_regional_script"]:
        res["Name (Regional Script)"] = str(res["name_regional_script"])
    if "father_or_representative_name" in res and res["father_or_representative_name"]:
        res["Care of / Representative"] = str(res["father_or_representative_name"])
    if "date_of_birth_or_incorporation" in res and res["date_of_birth_or_incorporation"]:
        res["Date of Birth / Registration"] = str(res["date_of_birth_or_incorporation"])
    if "address" in res and res["address"]:
        res["Registered Address"] = str(res["address"])

    return res


# ---------------------------------------------------------------------------
# Main Extractor Function
# ---------------------------------------------------------------------------

def extract_fields(raw_text: str, doc_type: str) -> Dict[str, Any]:
    """
    Extract structured fields from raw OCR/parsed text using Gemini LLM,
    with deterministic fallback and statutory field normalization.
    """
    if not raw_text or not raw_text.strip():
        logger.warning(f"Empty text passed to extractor for doc_type={doc_type}")
        return {"error": "No text to extract from"}

    # Use specialized prompt if explicitly defined, otherwise use UNIVERSAL_INDIC_PROMPT
    if doc_type in EXTRACTION_PROMPTS and doc_type != "OTHER":
        prompt_template = EXTRACTION_PROMPTS[doc_type]
    else:
        prompt_template = UNIVERSAL_INDIC_PROMPT
    full_prompt = f"""{prompt_template}

Document Text:
\"\"\"
{raw_text[:3500]}
\"\"\"

Remember: Return ONLY valid JSON. No explanation, no markdown fences.
"""

    extracted = None

    # Try Gemini extraction
    for model_name in MODEL_CANDIDATES:
        try:
            m = genai.GenerativeModel(model_name)
            response = m.generate_content(full_prompt)
            raw_response = response.text.strip()

            if raw_response.startswith("```"):
                raw_response = raw_response.split("```")[1]
                if raw_response.startswith("json"):
                    raw_response = raw_response[4:]
                raw_response = raw_response.strip()

            parsed = json.loads(raw_response)
            if isinstance(parsed, dict) and len(parsed) > 0:
                extracted = parsed
                logger.info(f"Successfully extracted {len(extracted)} fields for {doc_type} using {model_name}")
                break
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed for {doc_type}: {e}")

    # Fallback to deterministic regex extraction if LLM failed
    if not extracted:
        logger.info(f"Using deterministic fallback extraction for doc_type={doc_type}")
        extracted = extract_fallback(raw_text, doc_type)

    # Post-process & normalize
    final_result = normalize_extracted_data(extracted, doc_type, raw_text)
    return final_result


def classify_document_type(raw_text: str) -> str:
    """
    Auto-classify what type of document this is using fast statutory heuristics
    followed by Gemini LLM classification.
    """
    if not raw_text:
        return "OTHER"

    upper = raw_text.upper()

    # Fast statutory pattern recognition
    if "EMD" in upper or "TENDER FEE" in upper or "PAYMENT RECEIPT" in upper or "CHALLAN" in upper or "EXEMPTION CERTIFICATE" in upper or "TRANSACTION ID" in upper or "UTR" in upper:
        return "FEE_RECEIPT"
    if "AADHAAR" in upper or "UIDAI" in upper or "UNIQUE IDENTIFICATION AUTHORITY OF INDIA" in upper or "EAADHAAR" in upper or re.search(r'\b[0-9]{4}\s[0-9]{4}\s[0-9]{4}\b', raw_text):
        return "AADHAAR"
    if "PERMANENT ACCOUNT NUMBER" in upper or "INCOME TAX DEPARTMENT" in upper or re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', upper):
        return "PAN"
    if "FORM GST REG-06" in upper or "GOODS AND SERVICES TAX" in upper or "GSTIN" in upper:
        return "GST_CERTIFICATE"
    if "UDYAM REGISTRATION" in upper or "UDYAM-" in upper or "MINISTRY OF MSME" in upper:
        return "UDYAM_CERTIFICATE"
    if "MINISTRY OF CORPORATE AFFAIRS" in upper or "CERTIFICATE OF INCORPORATION" in upper or "ROC" in upper:
        return "MCA_DOCUMENT"
    if "EMPLOYEES' PROVIDENT FUND" in upper or "EPFO" in upper:
        return "EPFO_DOCUMENT"
    if "MANUFACTURER AUTHORIZATION" in upper or "OEM AUTHORIZATION" in upper or "MAF" in upper:
        return "OEM_AUTHORIZATION"
    if "FINANCIAL STATEMENT" in upper or "BALANCE SHEET" in upper or "INDEPENDENT AUDITOR" in upper:
        return "FINANCIAL_STATEMENT"

    # LLM classification fallback
    prompt = f"""
You are classifying an Indian government/business document.
Read the text and return ONLY one standard uppercase label (e.g. AADHAAR, PAN, GST_CERTIFICATE, FEE_RECEIPT, UDYAM_CERTIFICATE, MCA_DOCUMENT, EPFO_DOCUMENT, FINANCIAL_STATEMENT, OEM_AUTHORIZATION, OTHER):

Document text (first 1000 characters):
\"\"\"{raw_text[:1000]}\"\"\"

Return ONLY the label. Nothing else.
"""
    try:
        if _model:
            response = _model.generate_content(prompt)
            label = response.text.strip().upper().replace(" ", "_")
            return label
    except Exception as e:
        logger.warning(f"Document classification failed: {e}")

    return "OTHER"


def classify_and_verify_slot(
    raw_text: str,
    filename: str = "",
    requirement_slot: Optional[str] = None
) -> Dict[str, Any]:
    """
    Universally analyzes any Indian government or commercial document and dynamically
    verifies if it matches the target requirement slot without hardcoded assumptions.
    """
    upper_text = (raw_text or "").upper()
    upper_fn = (filename or "").upper()
    slot_clean = (requirement_slot or "").strip()

    # 1. Try Gemini Universal Classifier & Slot Verifier
    if _model and (raw_text.strip() or filename.strip()):
        prompt = f"""
You are an expert government document compliance auditor for the GeM (Government e-Marketplace) portal.
Evaluate the uploaded document against the target requirement slot.

File Name: "{filename}"
Target Slot Requirement: "{slot_clean or 'General Document'}"

Document Content Snippet:
\"\"\"
{raw_text[:2500]}
\"\"\"

Task:
1. Identify the official document category and title (e.g. PAN Card, Aadhaar Card, EMD / Tender Fee Payment Receipt, GST Registration, Udyam MSME Certificate, Certificate of Incorporation, Balance Sheet / Financial Statement, OEM Authorization, etc.).
2. Determine if this document ACTUALLY satisfies the Target Slot Requirement.
   - If slot is "PAN Card" and file is "EMD Payment Receipt", "Fee Receipt", "Challan", or "Aadhaar Card", is_slot_match MUST be false.
   - If slot is "Aadhaar Card" and file is "PAN Card", is_slot_match MUST be false.
   - If slot is "PAN Card" and file is "PAN Card", is_slot_match MUST be true.
   - If no specific slot or "General Document", is_slot_match is true.

Return ONLY a JSON object with:
{{
  "document_category": "UPPERCASE_KEY (e.g. PAN, AADHAAR, GST_CERTIFICATE, FEE_RECEIPT, UDYAM_CERTIFICATE, MCA_DOCUMENT, FINANCIAL_STATEMENT, OTHER)",
  "document_title": "Full Official Title",
  "is_slot_match": true or false,
  "mismatch_reason": "Clear explanation if mismatch, or null if matching"
}}
"""
        try:
            resp = _model.generate_content(prompt)
            clean_resp = resp.text.strip()
            if clean_resp.startswith("```"):
                clean_resp = clean_resp.split("```")[1]
                if clean_resp.startswith("json"):
                    clean_resp = clean_resp[4:]
                clean_resp = clean_resp.strip()
            data = json.loads(clean_resp)
            if isinstance(data, dict) and "document_category" in data:
                logger.info(f"Gemini slot verification for '{filename}' against slot '{slot_clean}': match={data.get('is_slot_match')}")
                return data
        except Exception as e:
            logger.warning(f"Gemini slot verification failed: {e}")

    # 2. Deterministic Fallback if LLM unavailable
    # Detect document category
    is_fee = any(k in upper_fn or k in upper_text for k in ["EMD", "TENDER FEE", "PAYMENT RECEIPT", "CHALLAN", "EXEMPTION", "TRANSACTION ID", "UTR"])
    has_pan = bool(re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', upper_text)) or "PERMANENT ACCOUNT" in upper_text or "PAN" in upper_fn
    has_aadhaar = bool(re.search(r'\b[0-9]{4}\s[0-9]{4}\s[0-9]{4}\b', raw_text)) or "UIDAI" in upper_text or "AADHAAR" in upper_text or "AADHAAR" in upper_fn
    has_gst = bool(re.search(r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b', upper_text)) or "GSTIN" in upper_text or "FORM GST REG-06" in upper_text

    if is_fee and not has_pan:
        category = "FEE_RECEIPT"
        title = "EMD / Tender Fee Payment Receipt"
    elif has_pan:
        category = "PAN"
        title = "Permanent Account Number (PAN) Card"
    elif has_aadhaar:
        category = "AADHAAR"
        title = "Aadhaar Identity Card"
    elif has_gst:
        category = "GST_CERTIFICATE"
        title = "GST Registration Certificate"
    else:
        category = classify_document_type(raw_text)
        title = category.replace("_", " ").title()

    # Slot matching check
    is_slot_match = True
    mismatch_reason = None

    if slot_clean:
        slot_upper = slot_clean.upper()
        if "PAN" in slot_upper:
            if category != "PAN" or not has_pan:
                is_slot_match = False
                mismatch_reason = f"Document Mismatch: Uploaded file appears to be a {title}, which does not satisfy the required 'PAN Card' slot."
        elif "AADHAAR" in slot_upper or "UIDAI" in slot_upper:
            if category != "AADHAAR" or not has_aadhaar:
                is_slot_match = False
                mismatch_reason = f"Document Mismatch: Uploaded file appears to be a {title}, which does not satisfy the required 'Aadhaar Card' slot."
        elif "GST" in slot_upper:
            if category != "GST_CERTIFICATE" or not has_gst:
                is_slot_match = False
                mismatch_reason = f"Document Mismatch: Uploaded file appears to be a {title}, which does not satisfy the required 'GST Registration' slot."
        elif "EMD" in slot_upper or "FEE" in slot_upper:
            if category != "FEE_RECEIPT":
                is_slot_match = False
                mismatch_reason = f"Document Mismatch: Uploaded file does not appear to be an EMD or Tender Fee Payment Receipt."

    return {
        "document_category": category,
        "document_title": title,
        "is_slot_match": is_slot_match,
        "mismatch_reason": mismatch_reason
    }

