"""
Compliance Engine for GeM Portal.
Orchestrates the full bid compliance verification pipeline:

Process 1 — Government Verification (Mock API):
  Bidder document fields (GSTIN, PAN, Udyam) → Mock Gov APIs → MATCH/MISMATCH

Process 2 — Tender Compliance (Vector + LLM):
  Tender requirements → RAG search in bidder chunks → LLM judge → Score

Final output: Compliance score (0–100) + per-requirement verdicts + summary report.
"""

import os
import uuid
import json
import logging
import httpx
from typing import List, Dict, Any, Optional

import google.generativeai as genai
from dotenv import load_dotenv

from embedder import get_query_embedding, cosine_similarity

load_dotenv()

logger = logging.getLogger("compliance-engine")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Mock Gov API base URL (from local env or fallback)
MOCK_GOV_API_URL = os.getenv("MOCK_GOV_API_URL", "http://127.0.0.1:9000")

MODEL_CANDIDATES = [
    os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest"
]

_judge_model = None
for candidate in MODEL_CANDIDATES:
    try:
        _judge_model = genai.GenerativeModel(candidate)
        break
    except Exception as err:
        logger.warning(f"Could not initialize judge model {candidate}: {err}")

if _judge_model is None:
    _judge_model = genai.GenerativeModel("gemini-3.6-flash")


# ---------------------------------------------------------------------------
# Mock Government API Router (Process 1)
# ---------------------------------------------------------------------------

# Maps requirement_type → (endpoint_template, field_key_in_extracted_data)
API_ROUTE_MAP = {
    "GST":        ("/gst/{value}",              "gstin"),
    "MSME":       ("/udyam/{value}",            "udyam_number"),
    "MCA":        ("/mca/{value}",              "cin"),
    "EPFO":       ("/epfo/{value}",             "establishment_id"),
    "ESIC":       ("/esic/{value}",             "esic_number"),
    "INCOME_TAX": ("/income-tax/{value}",       "pan"),
    "LEGAL":      ("/debarment/{value}",        "pan"),         # Check debarment
    "OEM":        ("/oem/{value}",              "authorization_number"),
    "STARTUP_INDIA": ("/startup-india/{value}", "recognition_number"),
}


async def call_mock_api(
    requirement_type: str,
    extracted_fields: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Call the appropriate Mock Government API endpoint for a requirement type.

    Args:
        requirement_type: e.g. "GST", "MSME", "MCA"
        extracted_fields: Structured fields extracted from bidder documents.

    Returns:
        Raw API response dict, or None if no applicable API / identifier missing.
    """
    route_info = API_ROUTE_MAP.get(requirement_type)
    if not route_info:
        return None  # No API call needed for this requirement type

    endpoint_template, field_key = route_info

    # Look for the identifier in extracted fields
    identifier = extracted_fields.get(field_key)
    if not identifier:
        logger.warning(
            f"Cannot call {requirement_type} API — field '{field_key}' not found in extracted data."
        )
        return None

    url = MOCK_GOV_API_URL + endpoint_template.format(value=identifier)
    logger.info(f"Calling Mock Gov API: GET {url}")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            data = response.json()
            logger.info(f"Mock API response for {requirement_type}: {data.get('status', 'N/A')}")
            return data
    except Exception as e:
        logger.error(f"Mock API call failed for {requirement_type}: {e}")
        return {"status": "API_ERROR", "message": str(e)}


def interpret_api_result(requirement_type: str, api_response: Dict) -> str:
    """
    Convert raw API response into a human-readable verification status.

    Returns: "VERIFIED" | "FAILED" | "NOT_FOUND" | "ERROR"
    """
    if not api_response:
        return "NOT_CHECKED"

    status = str(api_response.get("status", "")).upper()

    if status == "NOT_FOUND":
        return "NOT_FOUND"
    if status in ("API_ERROR",):
        return "ERROR"
    if requirement_type == "LEGAL":
        # For debarment check: NOT_FOUND is GOOD (not blacklisted)
        return "VERIFIED" if status == "NOT_FOUND" else "FAILED"
    # For all other APIs: having a record = VERIFIED
    if "gstin" in api_response or "udyam_number" in api_response \
            or "cin" in api_response or "pan" in api_response \
            or "establishment_id" in api_response:
        return "VERIFIED"

    return "NOT_FOUND"


# ---------------------------------------------------------------------------
# LLM Compliance Judge (Process 2)
# ---------------------------------------------------------------------------

COMPLIANCE_JUDGE_PROMPT = """
You are a senior GeM procurement compliance officer reviewing a bid submission.

Tender Requirement:
"{requirement_text}"

Evidence found in Bidder Documents (top matching chunks):
\"\"\"
{evidence_text}
\"\"\"

Government API Verification:
Status: {api_status}
API Response: {api_response}

Based on the evidence and API verification, determine if the bidder satisfies this requirement.

Return ONLY this JSON:
{{
  "status": "COMPLIANT" | "NON_COMPLIANT" | "REVIEW",
  "confidence": <0-100>,
  "reasoning": "<one sentence explanation>",
  "missing": "<what is missing, or null if COMPLIANT>"
}}

Decision rules:
- COMPLIANT: Evidence clearly satisfies the requirement AND (API is VERIFIED or not applicable)
- NON_COMPLIANT: Evidence clearly does NOT satisfy OR API returned FAILED/NOT_FOUND for a mandatory check
- REVIEW: Evidence is ambiguous, partial, or API is unavailable (needs human review)

Return ONLY the JSON. No markdown, no explanation.
"""


async def judge_compliance(
    requirement_text: str,
    evidence_text: str,
    api_status: str,
    api_response: Optional[Dict]
) -> Dict[str, Any]:
    """
    Use Gemini LLM to judge whether evidence satisfies a tender requirement.

    Args:
        requirement_text: The tender requirement (e.g. "GST registration required").
        evidence_text:    Top matching chunks from bidder documents (RAG result).
        api_status:       "VERIFIED" | "FAILED" | "NOT_FOUND" | "NOT_CHECKED"
        api_response:     Raw dict from mock API call.

    Returns:
        Dict with status, confidence, reasoning, missing.
    """
    prompt = COMPLIANCE_JUDGE_PROMPT.format(
        requirement_text=requirement_text,
        evidence_text=evidence_text[:2000],
        api_status=api_status,
        api_response=json.dumps(api_response or {}, indent=2)
    )

    try:
        response = _judge_model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        return json.loads(raw)

    except Exception as e:
        logger.error(f"LLM compliance judge failed: {e}")
        return {
            "status": "REVIEW",
            "confidence": 0,
            "reasoning": "LLM judgment unavailable — needs manual review.",
            "missing": None
        }


# ---------------------------------------------------------------------------
# Rule Engine (Numeric threshold checks)
# ---------------------------------------------------------------------------

def apply_rule(
    rule_condition: Dict[str, Any],
    extracted_fields: Dict[str, Any]
) -> Optional[str]:
    """
    Apply a quantitative rule check (e.g. turnover >= 50 Lakh).
    This overrides LLM judgment for clear numeric thresholds.

    Args:
        rule_condition: {"field": "annual_turnover", "operator": ">=", "value": 5000000}
        extracted_fields: Structured fields from bidder documents.

    Returns:
        "COMPLIANT" | "NON_COMPLIANT" | None (if field not found, let LLM decide)
    """
    field = rule_condition.get("field")
    operator = rule_condition.get("operator")
    threshold = rule_condition.get("value")

    if not field or not operator or threshold is None:
        return None

    actual = extracted_fields.get(field)
    if actual is None:
        return None  # Field not found — let LLM decide

    try:
        actual_num = float(str(actual).replace(",", "").replace("₹", "").strip())
        threshold_num = float(threshold)

        if operator == ">=":
            return "COMPLIANT" if actual_num >= threshold_num else "NON_COMPLIANT"
        elif operator == "<=":
            return "COMPLIANT" if actual_num <= threshold_num else "NON_COMPLIANT"
        elif operator == "==":
            return "COMPLIANT" if actual_num == threshold_num else "NON_COMPLIANT"
        elif operator == "exists":
            return "COMPLIANT" if actual else "NON_COMPLIANT"
    except (ValueError, TypeError):
        return None  # Non-numeric comparison — let LLM decide

    return None


# ---------------------------------------------------------------------------
# Core Compliance Pipeline
# ---------------------------------------------------------------------------

async def run_compliance_pipeline(
    requirements: List[Dict[str, Any]],
    bidder_chunks: List[Dict[str, Any]],
    extracted_fields: Dict[str, Any],
    top_k: int = 3
) -> Dict[str, Any]:
    """
    Run the full compliance check for one bid submission.

    Args:
        requirements:    List of tender requirements (from requirement_extractor).
        bidder_chunks:   List of {chunk_text, chunk_index, embedding} from bidder docs.
        extracted_fields: Merged structured fields from all bidder documents.
        top_k:           Number of top RAG results to use as evidence.

    Returns:
        {
          "compliance_score": int (0–100),
          "total_requirements": int,
          "compliant": int,
          "non_compliant": int,
          "review": int,
          "results": [ per-requirement verdict dicts ],
          "summary": str
        }
    """
    results = []
    compliant_count = 0
    non_compliant_count = 0
    review_count = 0

    for req in requirements:
        req_text = req.get("requirement_text", "")
        req_type = req.get("requirement_type", "OTHER")
        rule_cond = req.get("rule_condition")

        # ── Step 1: RAG — find top-k most relevant bidder chunks ──────────────
        if bidder_chunks:
            query_vec = get_query_embedding(req_text)
            # Score all chunks by cosine similarity to requirement
            scored = [
                {
                    "chunk_text": c["chunk_text"],
                    "score": cosine_similarity(query_vec, c["embedding"])
                }
                for c in bidder_chunks
                if c.get("embedding")
            ]
            scored.sort(key=lambda x: x["score"], reverse=True)
            top_chunks = scored[:top_k]
            evidence_text = "\n---\n".join([c["chunk_text"] for c in top_chunks])
            similarity_score = int(top_chunks[0]["score"] * 100) if top_chunks else 0
        else:
            evidence_text = "No bidder document chunks available."
            similarity_score = 0

        # ── Step 2: Mock Government API call ──────────────────────────────────
        api_response = await call_mock_api(req_type, extracted_fields)
        api_status = interpret_api_result(req_type, api_response)

        # ── Step 3: Rule engine (numeric threshold check) ─────────────────────
        rule_verdict = None
        if rule_cond:
            rule_verdict = apply_rule(rule_cond, extracted_fields)

        # ── Step 4: LLM compliance judge ──────────────────────────────────────
        if rule_verdict:
            # Rule engine gives a definitive answer — use it directly
            verdict = {
                "status": rule_verdict,
                "confidence": 95,
                "reasoning": f"Rule engine: {rule_cond.get('field')} {rule_cond.get('operator')} "
                             f"{rule_cond.get('value')} {rule_cond.get('unit', '')}",
                "missing": None if rule_verdict == "COMPLIANT" else
                           f"{rule_cond.get('field')} does not meet threshold {rule_cond.get('value')}"
            }
        else:
            # No clear numeric rule — let LLM judge based on evidence + API
            verdict = await judge_compliance(req_text, evidence_text, api_status, api_response)

        # ── Tally results ──────────────────────────────────────────────────────
        status = verdict.get("status", "REVIEW")
        if status == "COMPLIANT":
            compliant_count += 1
        elif status == "NON_COMPLIANT":
            non_compliant_count += 1
        else:
            review_count += 1

        results.append({
            "requirement_text": req_text,
            "requirement_type": req_type,
            "status": status,
            "confidence": verdict.get("confidence", 0),
            "similarity_score": similarity_score,
            "api_status": api_status,
            "api_response": api_response,
            "evidence_text": evidence_text,
            "reasoning": verdict.get("reasoning", ""),
            "missing": verdict.get("missing"),
        })

    # ── Compute final compliance score ─────────────────────────────────────────
    total = len(requirements)
    if total == 0:
        score = 0
    else:
        # Scoring formula:
        # - COMPLIANT requirements contribute fully (weight 1.0)
        # - REVIEW requirements contribute partially (weight 0.5)
        # - NON_COMPLIANT contribute nothing (weight 0.0)
        weighted = (compliant_count * 1.0) + (review_count * 0.5)
        score = int((weighted / total) * 100)

    # ── Generate summary ──────────────────────────────────────────────────────
    summary = generate_compliance_summary(score, results, total, compliant_count, non_compliant_count, review_count)

    return {
        "compliance_score": score,
        "total_requirements": total,
        "compliant": compliant_count,
        "non_compliant": non_compliant_count,
        "review": review_count,
        "results": results,
        "summary": summary
    }


def generate_compliance_summary(
    score: int,
    results: List[Dict],
    total: int,
    compliant: int,
    non_compliant: int,
    review: int
) -> str:
    """
    Generate a human-readable compliance report summary.
    """
    if score >= 80:
        verdict_line = "✅ This bid appears largely COMPLIANT with tender requirements."
    elif score >= 50:
        verdict_line = "⚠️ This bid is PARTIALLY COMPLIANT — several items need review."
    else:
        verdict_line = "❌ This bid appears NON-COMPLIANT with key tender requirements."

    non_compliant_items = [
        f"  • {r['requirement_text']} ({r.get('missing', 'N/A')})"
        for r in results if r["status"] == "NON_COMPLIANT"
    ]
    review_items = [
        f"  • {r['requirement_text']}"
        for r in results if r["status"] == "REVIEW"
    ]

    lines = [
        f"Compliance Score: {score}/100",
        verdict_line,
        f"\nRequirements: {total} total | {compliant} compliant | {non_compliant} failed | {review} needs review",
    ]

    if non_compliant_items:
        lines.append("\nFailed Requirements:")
        lines.extend(non_compliant_items)

    if review_items:
        lines.append("\nNeeds Human Review:")
        lines.extend(review_items)

    return "\n".join(lines)
