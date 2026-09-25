"""
Tender Requirement & Document Extractor for GeM Portal.
Uses Gemini LLM to read any uploaded tender document and automatically:
1. Extract all required technical specifications (hardware, parameters, values, standards).
2. Extract all eligibility conditions (financial turnover, experience, technical certifications, OEM, MSME, warranty).
3. Identify all specific needed documents that bidders must submit.
4. Summarize the conditions and needed documents for both the officer and bidders.
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional

import httpx
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger("requirement-extractor")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Candidate models to try in order of preference
MODEL_CANDIDATES = [
    os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
]


def call_gemini_rest(
    prompt: str,
    system_instruction: str = "",
    model: str = "gemini-2.5-flash",
    timeout_s: float = 35.0
) -> Optional[str]:
    """
    Direct HTTPS REST call to Gemini GenerateContent API using httpx.
    Reliable, zero external Google dependency issues, and fast.
    """
    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    if not api_key:
        logger.warning("GEMINI_API_KEY is not set.")
        return None

    models_to_try = [model, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"]
    seen = set()
    models = [m for m in models_to_try if not (m in seen or seen.add(m))]

    for m_name in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
            payload: Dict[str, Any] = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.1
                }
            }
            if system_instruction:
                payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

            with httpx.Client(timeout=timeout_s) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    logger.warning(f"Gemini REST {m_name} returned status {res.status_code}: {res.text[:200]}")
        except Exception as exc:
            logger.warning(f"Gemini REST {m_name} call error: {exc}")

    # Fallback to google.generativeai if available
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        for m_name in models:
            try:
                m = genai.GenerativeModel(m_name)
                resp = m.generate_content(prompt)
                if resp.text:
                    return resp.text
            except Exception:
                pass
    except Exception:
        pass

    return None


# ---------------------------------------------------------------------------
# Comprehensive Tender Analysis Prompt
# ---------------------------------------------------------------------------

TENDER_ANALYSIS_PROMPT = """
You are an expert Indian Government procurement officer and GeM (Government e-Marketplace) tender analyst.
Read the tender document text below and thoroughly analyze all clauses, specifications, schedule of requirements, buyer added bid-specific terms (ATC), and eligibility criteria.

Extract and structure the information into a strict JSON object with this exact format:
{{
  "tender_title": "Official title or subject of the tender (e.g. Supply of All-in-One PC / Supply of Trash Rack Cleaning Machine / etc.)",
  "scope_of_work": "Brief 1-2 sentence description of items, quantities, or services to be procured",
  "estimated_value": "Estimated contract value with currency if mentioned (e.g., ₹ 45,00,000) or null",
  "closing_date": "Bid submission deadline date (DD/MM/YYYY) if mentioned, else null",
  "emd_amount": "Earnest Money Deposit (EMD) requirement with exact amount or 'Exempted for MSME / Nil'",

  "technical_specifications": [
    {{
      "parameter": "Parameter name (e.g. RAM, Storage, Processor, OS, Display, Volume, Capacity, Warranty, Inspection, Dismantling)",
      "required_value": "Exact required value/threshold from tender (e.g. 16 GB DDR5, 1 TB NVMe SSD, Windows 11 Pro, 3.5 m3, 3 Years Onsite)",
      "category": "Hardware | Software | Service | Warranty | Mechanical | Electrical"
    }}
  ],

  "conditions": [
    {{
      "title": "Short condition title (e.g. Minimum Annual Turnover, Past Experience, OEM Manufacturer Authorization (MAF), ISO 9001 Certification, BIS Registration, EPR / RoHS / BEE, Make in India Preference, EMD Exemption)",
      "category": "financial | technical | compliance | statutory | exemption",
      "description": "Precise condition details, thresholds, and years required",
      "mandatory": true,
      "rule_condition": {{
        "field": "annual_turnover | years_experience | gstin | pan | udyam_number | is_oem_authorized | iso_certified | is_debarred | warranty_years",
        "operator": ">= | <= | == | exists | contains",
        "value": null,
        "unit": "INR | years | count | null"
      }}
    }}
  ],

  "needed_documents": [
    {{
      "document_name": "Standard document title (e.g. OEM Authorization Certificate (MAF), GST Registration Certificate, CA Certified Turnover Certificate, Past Experience / Work Orders, BIS Registration, ISO Certificate, Signed Buyer Added ATC, EMD Payment Receipt / MSME Exemption Certificate)",
      "category": "statutory | financial | technical | experience",
      "mandatory": true,
      "purpose": "What eligibility condition or requirement this document verifies"
    }}
  ],

  "summary_markdown": "A concise, well-formatted 3-4 bullet point executive summary of key bidder requirements and needed submissions."
}}

CRITICAL INSTRUCTIONS:
1. Dynamically extract the SPECIFIC parameters, values, and conditions present in THIS tender. Do NOT hardcode or make assumptions.
2. If this tender is for IT hardware, extract CPU, RAM, Storage, OS, Warranty, OEM MAF, Certifications.
3. If this tender is for machinery, services, or equipment, extract the technical parameters, volume, capacities, spare parts, transport, and commissioning scopes.
4. Return ONLY valid JSON.
"""


# ---------------------------------------------------------------------------
# Fallback Heuristic Analysis
# ---------------------------------------------------------------------------

def fallback_tender_analysis(tender_text: str, filename: str = "") -> Dict[str, Any]:
    """
    Deterministic rule-based analysis used when Gemini LLM is unavailable.
    Scans tender clauses for financial, experience, technical and document requirements.
    """
    conditions: List[Dict[str, Any]] = []
    needed_docs: List[Dict[str, Any]] = []
    specs: List[Dict[str, Any]] = []
    upper = tender_text.upper()

    # 1. Turnover condition
    turnover_match = re.search(r'(?:turnover|annual\s+turnover)[^.\n\r]{0,80}?(?:rs\.?|inr|₹)?\s*([0-9]+(?:\.[0-9]+)?)\s*(lakh|crore|lacs|cr)?', upper, re.IGNORECASE)
    if turnover_match:
        val_str = turnover_match.group(1)
        unit = (turnover_match.group(2) or "").lower()
        multiplier = 10000000 if 'cr' in unit else (100000 if 'lakh' in unit or 'lac' in unit else 1)
        try:
            val_num = float(val_str) * multiplier
            display_val = f"₹{val_str} {unit.capitalize()}" if unit else f"₹{val_num:,.0f}"
        except Exception:
            display_val = turnover_match.group(0).strip()
            val_num = None

        conditions.append({
            "title": "Minimum Annual Turnover",
            "category": "financial",
            "description": f"Bidder must have minimum annual turnover as specified ({display_val}) in recent financial years.",
            "mandatory": True,
            "rule_condition": {
                "field": "annual_turnover",
                "operator": ">=",
                "value": val_num,
                "unit": "INR"
            }
        })
        needed_docs.append({
            "document_name": "CA Certified Annual Turnover Certificate",
            "category": "financial",
            "mandatory": True,
            "purpose": "Verification of bidder's financial eligibility and turnover thresholds (with UDIN)."
        })

    # 2. Experience condition
    exp_match = re.search(r'([0-9]+)\s*(?:years?|yrs?)[^.\n\r]{0,60}?(?:experience|past\s+performance)', upper, re.IGNORECASE)
    if exp_match:
        yrs = int(exp_match.group(1))
        conditions.append({
            "title": "Past Experience & Performance",
            "category": "compliance",
            "description": f"Bidder must possess at least {yrs} years of verifiable past experience in supplying similar items/services.",
            "mandatory": True,
            "rule_condition": {
                "field": "years_experience",
                "operator": ">=",
                "value": yrs,
                "unit": "years"
            }
        })
        needed_docs.append({
            "document_name": "Past Work Orders & Completion Certificates",
            "category": "experience",
            "mandatory": True,
            "purpose": f"Proof of minimum {yrs} years past performance and supply history."
        })

    # 3. Technical Specs / Parameters found in text
    # RAM
    ram_m = re.search(r'([0-9]+\s*GB(?:\s*DDR[0-9]+)?)', upper)
    if ram_m:
        specs.append({"parameter": "RAM / Memory", "required_value": ram_m.group(1), "category": "Hardware"})
    # Storage
    storage_m = re.search(r'([0-9]+\s*(?:TB|GB)\s*(?:NVME|SSD|HDD)?)', upper)
    if storage_m:
        specs.append({"parameter": "Storage", "required_value": storage_m.group(1), "category": "Hardware"})
    # OS
    if "WINDOWS 11" in upper or "WINDOWS 10" in upper:
        specs.append({"parameter": "Operating System", "required_value": "Windows 11 Professional", "category": "Software"})
    # Warranty
    warr_m = re.search(r'([0-9]+)\s*(?:year|yr)s?\s*(?:warranty|onsite)', upper)
    if warr_m:
        specs.append({"parameter": "Warranty", "required_value": f"{warr_m.group(1)} Years Onsite", "category": "Warranty"})
    # Volume / Capacity
    vol_m = re.search(r'([0-9]+(?:\.[0-9]+)?\s*m3)', upper)
    if vol_m:
        specs.append({"parameter": "Volume", "required_value": vol_m.group(1), "category": "Mechanical"})

    # 4. OEM Authorization
    if any(k in upper for k in ["OEM", "MANUFACTURER AUTHORIZATION", "MAF"]):
        conditions.append({
            "title": "OEM Manufacturer Authorization (MAF)",
            "category": "technical",
            "description": "Original Equipment Manufacturer (OEM) authorization certificate required for authorized sellers.",
            "mandatory": True,
            "rule_condition": {
                "field": "is_oem_authorized",
                "operator": "==",
                "value": True
            }
        })
        needed_docs.append({
            "document_name": "OEM Authorization Certificate (MAF)",
            "category": "technical",
            "mandatory": True,
            "purpose": "Validation that bidder is authorized by OEM to quote and support products."
        })

    # 5. Certifications (BIS, ISO, RoHS, EPR, BEE)
    for cert in ["ISO 9001", "BIS", "EPR", "ROHS", "BEE"]:
        if cert in upper:
            conditions.append({
                "title": f"{cert} Quality Certification",
                "category": "technical",
                "description": f"Valid {cert} compliance certificate required from recognized testing laboratory/authority.",
                "mandatory": True,
                "rule_condition": {"field": "iso_certified", "operator": "==", "value": True}
            })
            needed_docs.append({
                "document_name": f"{cert} Compliance Certificate",
                "category": "technical",
                "mandatory": True,
                "purpose": f"Proof of compliance with {cert} standards."
            })

    # 6. Statutory documents
    needed_docs.append({
        "document_name": "GST Registration Certificate",
        "category": "statutory",
        "mandatory": True,
        "purpose": "Proof of active GST compliance with GSTIN."
    })
    needed_docs.append({
        "document_name": "Permanent Account Number (PAN) Card",
        "category": "statutory",
        "mandatory": True,
        "purpose": "Income Tax registration and legal identity of bidder."
    })

    # 7. MSME / Udyam
    if any(k in upper for k in ["MSME", "UDYAM", "MICRO AND SMALL"]):
        conditions.append({
            "title": "MSME / Udyam Policy Benefits",
            "category": "statutory",
            "description": "Exemptions in EMD and turnover criteria available for eligible registered Micro & Small Enterprises.",
            "mandatory": False,
            "rule_condition": {
                "field": "is_msme",
                "operator": "==",
                "value": True
            }
        })
        needed_docs.append({
            "document_name": "Udyam MSME Registration Certificate",
            "category": "statutory",
            "mandatory": False,
            "purpose": "Availing EMD exemption and procurement preference for MSMEs."
        })

    # Try extracting tender title
    title = filename.replace(".pdf", "").replace("_", " ").title() if filename else "GeM Bidding Procurement"
    for line in tender_text.splitlines()[:20]:
        cl = line.strip()
        if len(cl) > 10 and any(k in cl.upper() for k in ["PROCUREMENT", "TENDER FOR", "BID FOR", "SUPPLY OF", "INVITATION"]):
            title = cl
            break

    summary = (
        f"**Tender Overview:** {title}\n"
        f"• **Technical Specs:** {len(specs)} parameter requirements extracted.\n"
        f"• **Key Conditions:** {len(conditions)} specific eligibility conditions identified.\n"
        f"• **Needed Documents:** {len(needed_docs)} mandatory & supporting documents required from bidders."
    )

    return {
        "tender_title": title,
        "scope_of_work": f"Supply and execution per GeM tender specifications for {title}.",
        "estimated_value": None,
        "closing_date": None,
        "emd_amount": "Exempted for MSME / As per bid document",
        "technical_specifications": specs,
        "conditions": conditions,
        "needed_documents": needed_docs,
        "summary_markdown": summary
    }


# ---------------------------------------------------------------------------
# Main Functions
# ---------------------------------------------------------------------------

def analyze_tender_document(tender_text: str, filename: str = "") -> Dict[str, Any]:
    """
    Main tender document intelligence engine.
    Reads full tender document and produces:
    - technical specifications (parameters, required values, categories)
    - specific conditions (financial, technical, experience, statutory, warranty, exemptions)
    - needed documents list with verification purpose
    - executive summary for officer and bidders
    """
    if not tender_text or not tender_text.strip():
        logger.warning("Empty tender text passed to analyze_tender_document.")
        return fallback_tender_analysis(tender_text, filename)

    # Pass up to 45,000 characters to cover full schedule, tables, specs, and ATC clauses
    prompt = TENDER_ANALYSIS_PROMPT + f"\n\nTender Document Content:\n\"\"\"\n{tender_text[:45000]}\n\"\"\""

    raw = call_gemini_rest(prompt, model="gemini-2.5-flash", timeout_s=40.0)

    if raw:
        try:
            cleaned = raw.strip()
            # Strip code fences if present
            fence_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', cleaned, re.DOTALL)
            if fence_match:
                cleaned = fence_match.group(1).strip()
            elif cleaned.startswith("```"):
                parts = cleaned.split("```")
                if len(parts) >= 2:
                    cleaned = parts[1]
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:]
                    cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            if isinstance(parsed, dict) and ("conditions" in parsed or "technical_specifications" in parsed):
                # Ensure needed_documents exists
                if "needed_documents" not in parsed or not parsed["needed_documents"]:
                    parsed["needed_documents"] = fallback_tender_analysis(tender_text, filename)["needed_documents"]

                logger.info(
                    f"Successfully analyzed tender document with Gemini: "
                    f"{len(parsed.get('technical_specifications', []))} specs, "
                    f"{len(parsed.get('conditions', []))} conditions, "
                    f"{len(parsed.get('needed_documents', []))} needed docs."
                )
                return parsed
        except Exception as e:
            logger.warning(f"Failed to parse Gemini tender response as JSON: {e}")

    logger.info("Using deterministic fallback for tender analysis.")
    return fallback_tender_analysis(tender_text, filename)


def extract_tender_requirements(tender_text: str) -> List[Dict[str, Any]]:
    """
    Extract all eligibility requirements from a tender document for the compliance engine.
    """
    analysis = analyze_tender_document(tender_text)
    conditions = analysis.get("conditions", [])

    # Map to standard requirement objects
    reqs: List[Dict[str, Any]] = []
    for c in conditions:
        cat = c.get("category", "OTHER").upper()
        reqs.append({
            "requirement_text": f"{c.get('title', '')}: {c.get('description', '')}".strip(': '),
            "requirement_type": "FINANCIAL" if cat == "FINANCIAL" else ("TECHNICAL" if cat == "TECHNICAL" else ("EXPERIENCE" if "EXPERIENCE" in cat else "COMPLIANCE")),
            "rule_condition": c.get("rule_condition") or {
                "field": "compliance",
                "operator": "==",
                "value": True
            }
        })

    # Also add technical specs as requirements
    for s in analysis.get("technical_specifications", []):
        reqs.append({
            "requirement_text": f"{s.get('parameter', 'Specification')}: {s.get('required_value', '')}".strip(': '),
            "requirement_type": "TECHNICAL",
            "rule_condition": {
                "field": "technical_specification",
                "operator": "==",
                "value": s.get("required_value")
            }
        })

    return reqs


def summarize_tender_requirements(requirements: List[Dict[str, Any]]) -> str:
    """
    Generate a human-readable summary of all extracted requirements.
    """
    if not requirements:
        return "No specific eligibility requirements were extracted from this tender."

    lines = ["**Tender Eligibility Requirements:**\n"]
    for i, req in enumerate(requirements, 1):
        req_type = req.get("requirement_type", "OTHER")
        text = req.get("requirement_text", "No description")
        lines.append(f"{i}. [{req_type}] {text}")

    return "\n".join(lines)
