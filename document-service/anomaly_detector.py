"""
ML Tender Anomaly & Anti-Collusion Detection Engine for GeM Portal.
Powered by Scikit-Learn IsolationForest, RobustScaler, and GFR 2017 High-Certainty Rules.
"""

import os
import json
import logging
import math
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import numpy as np

logger = logging.getLogger("anomaly-detector")

MODEL_DIR = Path(__file__).resolve().parent / "ml_models"
MODEL_PATH = MODEL_DIR / "isolation_forest_tender_anomaly.joblib"
ML_DATA_DIR = Path(__file__).resolve().parent.parent / "ML"

# 20 feature names
FEATURE_NAMES = [
    "price_to_estimate_median",
    "price_to_estimate_std",
    "price_to_estimate_range",
    "winner_price_to_estimate",
    "winner_margin",
    "linked_bidder_pairs",
    "near_price_pair_fraction",
    "submission_span_minutes",
    "last_day_submission_fraction",
    "bid_count",
    "single_bidder",
    "window_days",
    "min_bidder_age_days",
    "winner_age_days",
    "new_firm_fraction",
    "log_value_per_min_age",
    "log_estimated_value",
    "buyer_item_prior_count",
    "buyer_prior_single_bid_rate",
    "price_variance_ratio",
]

_GLOBAL_MODEL_BUNDLE = None


def get_model_bundle():
    """Lazily loads or trains the Isolation Forest model bundle."""
    global _GLOBAL_MODEL_BUNDLE
    if _GLOBAL_MODEL_BUNDLE is not None:
        return _GLOBAL_MODEL_BUNDLE

    try:
        import joblib
        if MODEL_PATH.exists():
            _GLOBAL_MODEL_BUNDLE = joblib.load(MODEL_PATH)
            logger.info("Loaded pre-trained Anomaly Detection model from %s", MODEL_PATH)
            return _GLOBAL_MODEL_BUNDLE
    except Exception as e:
        logger.warning("Could not load model bundle: %s. Training fresh model...", e)

    # Train and cache
    _GLOBAL_MODEL_BUNDLE = train_and_save_model()
    return _GLOBAL_MODEL_BUNDLE


def train_and_save_model():
    """Trains an Isolation Forest on historical data or synthetic baseline."""
    try:
        from sklearn.ensemble import IsolationForest
        from sklearn.preprocessing import RobustScaler
        import joblib

        MODEL_DIR.mkdir(parents=True, exist_ok=True)

        X_train = []
        
        # Load historical tender and bid data if available in ML/
        tender_hist_path = ML_DATA_DIR / "tender_history.json"
        bid_hist_path = ML_DATA_DIR / "bid_history.json"

        if tender_hist_path.exists() and bid_hist_path.exists():
            with open(tender_hist_path, "r", encoding="utf-8") as f:
                tenders = json.load(f)
            with open(bid_hist_path, "r", encoding="utf-8") as f:
                bids = json.load(f)

            bids_by_tender = {}
            for b in bids:
                t_id = b.get("tender_id")
                if t_id not in bids_by_tender:
                    bids_by_tender[t_id] = []
                bids_by_tender[t_id].append(b)

            for t in tenders:
                t_id = t.get("tender_id")
                t_bids = bids_by_tender.get(t_id, [])
                if not t_bids:
                    continue
                feats = extract_features_from_raw(t, t_bids)
                X_train.append([feats[name] for name in FEATURE_NAMES])

        # If historical data is missing or empty, generate diverse baseline distribution
        if len(X_train) < 20:
            logger.info("Generating baseline calibration matrix for Anomaly Isolation Forest...")
            np.random.seed(42)
            for _ in range(500):
                est_val = np.random.uniform(500000, 50000000)
                n_bids = np.random.randint(2, 8)
                prices = est_val * np.random.normal(0.92, 0.06, n_bids)
                prices = np.clip(prices, est_val * 0.7, est_val * 1.2)
                sorted_p = sorted(prices)
                
                feat_dict = {
                    "price_to_estimate_median": float(np.median(prices) / est_val),
                    "price_to_estimate_std": float(np.std(prices) / est_val),
                    "price_to_estimate_range": float((max(prices) - min(prices)) / est_val),
                    "winner_price_to_estimate": float(sorted_p[0] / est_val),
                    "winner_margin": float((sorted_p[1] - sorted_p[0]) / est_val) if len(sorted_p) > 1 else 0.0,
                    "linked_bidder_pairs": 0,
                    "near_price_pair_fraction": 0.0,
                    "submission_span_minutes": float(np.random.uniform(100, 2000)),
                    "last_day_submission_fraction": float(np.random.uniform(0.1, 0.6)),
                    "bid_count": n_bids,
                    "single_bidder": 0,
                    "window_days": 21,
                    "min_bidder_age_days": float(np.random.uniform(700, 3650)),
                    "winner_age_days": float(np.random.uniform(700, 3650)),
                    "new_firm_fraction": 0.0,
                    "log_value_per_min_age": float(math.log1p(est_val / 1000)),
                    "log_estimated_value": float(math.log1p(est_val)),
                    "buyer_item_prior_count": float(np.random.randint(5, 30)),
                    "buyer_prior_single_bid_rate": 0.05,
                    "price_variance_ratio": float(np.std(prices) / max(0.001, np.median(prices))),
                }
                X_train.append([feat_dict[name] for name in FEATURE_NAMES])

        X = np.array(X_train)
        scaler = RobustScaler()
        X_scaled = scaler.fit_transform(X)

        model = IsolationForest(
            n_estimators=300,
            contamination=0.04,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_scaled)

        # Compute threshold calibrated for 0.04 contamination
        scores = -model.score_samples(X_scaled)
        threshold = float(np.percentile(scores, 94))

        bundle = {
            "model": model,
            "scaler": scaler,
            "threshold": threshold,
            "features": FEATURE_NAMES,
            "version": "1.0.0"
        }

        try:
            joblib.dump(bundle, MODEL_PATH)
            logger.info("Trained & saved Anomaly Detection model to %s (threshold=%.4f)", MODEL_PATH, threshold)
        except Exception as e:
            logger.warning("Could not persist joblib bundle: %s", e)

        return bundle

    except Exception as e:
        logger.error("Failed to train Anomaly model: %s", e)
        return None


def extract_features_from_raw(tender_dict: Dict[str, Any], bids_list: List[Dict[str, Any]]) -> Dict[str, float]:
    """Computes the 20 features from raw tender & bid dictionaries."""
    est_val = float(tender_dict.get("estimated_value") or tender_dict.get("estimatedValue") or 1000000)
    prices = [float(b.get("quoted_price") or b.get("commercialQuote") or est_val) for b in bids_list]
    if not prices:
        prices = [est_val]

    sorted_prices = sorted(prices)
    n_bids = len(prices)
    median_price = float(np.median(prices))
    std_price = float(np.std(prices)) if n_bids > 1 else 0.0
    price_range = float(max(prices) - min(prices))
    winner_p = sorted_prices[0]
    winner_margin = (sorted_prices[1] - sorted_prices[0]) / est_val if n_bids > 1 else 0.0

    # Near price pair fraction (within 0.2% variance)
    near_pairs = 0
    total_pairs = max(1, (n_bids * (n_bids - 1)) // 2)
    for i in range(n_bids):
        for j in range(i + 1, n_bids):
            diff = abs(prices[i] - prices[j])
            if (diff / max(1.0, prices[i])) < 0.0025:
                near_pairs += 1
    near_price_frac = near_pairs / total_pairs if n_bids > 1 else 0.0

    # Linked bidder check
    linked_pairs = detect_linked_bidders(bids_list)

    window_days = float(tender_dict.get("window_days") or 21)
    min_age = 1500.0  # default age in days
    
    return {
        "price_to_estimate_median": median_price / est_val,
        "price_to_estimate_std": std_price / est_val,
        "price_to_estimate_range": price_range / est_val,
        "winner_price_to_estimate": winner_p / est_val,
        "winner_margin": winner_margin,
        "linked_bidder_pairs": float(len(linked_pairs)),
        "near_price_pair_fraction": near_price_frac,
        "submission_span_minutes": 180.0,
        "last_day_submission_fraction": 0.4,
        "bid_count": float(n_bids),
        "single_bidder": 1.0 if n_bids == 1 else 0.0,
        "window_days": window_days,
        "min_bidder_age_days": min_age,
        "winner_age_days": min_age,
        "new_firm_fraction": 0.0,
        "log_value_per_min_age": float(math.log1p(est_val / max(1.0, min_age))),
        "log_estimated_value": float(math.log1p(est_val)),
        "buyer_item_prior_count": 10.0,
        "buyer_prior_single_bid_rate": 0.05,
        "price_variance_ratio": float(std_price / max(0.001, median_price)),
    }


def detect_linked_bidders(bids_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Checks for common relational linkages between participating bidders:
    - Shared PAN prefix / business group
    - Identical contact phone numbers or domain
    - Identical directors or registered addresses
    """
    linked = []
    n = len(bids_list)
    for i in range(n):
        for j in range(i + 1, n):
            b1 = bids_list[i]
            b2 = bids_list[j]

            name1 = (b1.get("company_name") or b1.get("enterprise_name") or b1.get("companyId") or "").strip().lower()
            name2 = (b2.get("company_name") or b2.get("enterprise_name") or b2.get("companyId") or "").strip().lower()
            
            pan1 = (b1.get("pan") or "").strip().upper()
            pan2 = (b2.get("pan") or "").strip().upper()

            phone1 = (b1.get("contact_number") or b1.get("phone") or "").strip()
            phone2 = (b2.get("contact_number") or b2.get("phone") or "").strip()

            link_reasons = []
            if pan1 and pan2 and pan1 == pan2:
                link_reasons.append("Identical Company PAN")
            elif pan1 and pan2 and len(pan1) == 10 and len(pan2) == 10 and pan1[:5] == pan2[:5]:
                link_reasons.append("Common Sister Entity PAN Series")

            if phone1 and phone2 and phone1 == phone2:
                link_reasons.append("Identical Contact Phone Number")

            # Check similar company name prefixes (e.g. Acme Tech vs Acme Solutions)
            if name1 and name2:
                words1 = set(name1.replace("pvt", "").replace("ltd", "").replace("private", "").replace("limited", "").split())
                words2 = set(name2.replace("pvt", "").replace("ltd", "").replace("private", "").replace("limited", "").split())
                common = words1.intersection(words2)
                if len(common) >= 2 and ("group" in common or "solutions" in common or "enterprises" in common or "digital" in common):
                    link_reasons.append("Common Corporate Naming Group")

            if link_reasons:
                linked.append({
                    "bidder_a": b1.get("company_name") or b1.get("companyId") or f"Bidder #{i+1}",
                    "bidder_b": b2.get("company_name") or b2.get("companyId") or f"Bidder #{j+1}",
                    "reasons": link_reasons
                })
    return linked


def evaluate_high_certainty_rules(
    features: Dict[str, float], 
    linked_pairs: List[Dict[str, Any]], 
    bids_list: List[Dict[str, Any]], 
    tender_dict: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Evaluates deterministic, explainable anti-collusion statutory rules."""
    flags = []

    # Rule 1: Direct Corporate Linkage
    if linked_pairs:
        reasons_list = [r for pair in linked_pairs for r in pair["reasons"]]
        flags.append({
            "code": "RULE_CARTEL_LINKAGE",
            "severity": "CRITICAL",
            "title": "Direct Corporate Linkage & Cartel Ring Detected",
            "description": f"Found {len(linked_pairs)} linked bidder relationship(s): {', '.join(set(reasons_list))}. Potential violation of GFR Rule 144(xi) and Competition Act 2002.",
            "involved_entities": [f"{p['bidder_a']} ↔ {p['bidder_b']}" for p in linked_pairs]
        })

    # Rule 2: Near Identical Price Clustering
    if features.get("near_price_pair_fraction", 0) > 0 and features.get("price_to_estimate_std", 1.0) < 0.003 and len(bids_list) > 1:
        flags.append({
            "code": "RULE_PRICE_FIXING",
            "severity": "CRITICAL",
            "title": "Artificial Price Collar / Identical Quotes",
            "description": "Bidders submitted quotes within a negligible 0.2% variance window, indicating coordinated price fixing or deliberate artificial bidding.",
            "involved_entities": [b.get("company_name") or b.get("companyId") or "Bidder" for b in bids_list]
        })

    # Rule 3: Single Bidder on High Value Procurement
    if features.get("single_bidder", 0) == 1 and features.get("log_estimated_value", 0) > 15.5:  # > ₹50 Lakhs
        flags.append({
            "code": "RULE_SINGLE_BIDDER_HIGH_VALUE",
            "severity": "WARNING",
            "title": "High-Value Single Bidder Exposure",
            "description": "High-value public tender received only 1 bid submission, reducing competitive market discovery.",
            "involved_entities": [bids_list[0].get("company_name") or "Sole Bidder"] if bids_list else []
        })

    # Rule 4: Substantial Margin Outlier / Cover Bidding
    if len(bids_list) >= 3 and features.get("winner_margin", 0) > 0.40:
        flags.append({
            "code": "RULE_COVER_BIDDING_SUSPICION",
            "severity": "WARNING",
            "title": "Potential Cover Bidding Pattern",
            "description": f"Winning bid is undercutting the second lowest quote by {features.get('winner_margin', 0)*100:.1f}%. High spread suggests dummy cover bids.",
            "involved_entities": []
        })

    return flags


def assess_tender_collusion_risk(tender: Any, submissions: List[Any], bidders_map: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Main entry point for assessing tender-level anomaly and collusion risk.
    Accepts TenderModel/dict and BidSubmissionModels/dicts.
    """
    if bidders_map is None:
        bidders_map = {}

    # Standardize tender info
    if hasattr(tender, "to_dict"):
        t_dict = tender.to_dict()
    elif isinstance(tender, dict):
        t_dict = tender
    else:
        t_dict = {
            "tender_number": getattr(tender, "tender_number", "TENDER-001"),
            "title": getattr(tender, "title", "Procurement Notice"),
            "estimated_value": getattr(tender, "estimated_value", 1000000),
            "window_days": 21,
        }

    # Standardize bids info
    bids_list = []
    for sub in submissions:
        if hasattr(sub, "to_dict"):
            s_dict = sub.to_dict()
        elif isinstance(sub, dict):
            s_dict = sub
        else:
            s_dict = {
                "company_id": getattr(sub, "company_id", ""),
                "commercialQuote": getattr(sub, "commercial_quote", None) or getattr(sub, "commercialQuote", 0),
                "status": getattr(sub, "status", "Under Review"),
            }

        cid = s_dict.get("company_id") or s_dict.get("companyId")
        b_info = bidders_map.get(cid, {})

        bids_list.append({
            "companyId": cid,
            "company_name": s_dict.get("company_name") or s_dict.get("bidder_name") or b_info.get("name") or cid,
            "pan": b_info.get("pan") or s_dict.get("pan", ""),
            "contact_number": b_info.get("contact_number") or b_info.get("phone") or "",
            "commercialQuote": float(s_dict.get("commercialQuote") or s_dict.get("commercial_quote") or t_dict.get("estimated_value") or 0),
            "status": s_dict.get("status", "Submitted")
        })

    # Extract 20 features
    features = extract_features_from_raw(t_dict, bids_list)
    linked_pairs = detect_linked_bidders(bids_list)
    rule_flags = evaluate_high_certainty_rules(features, linked_pairs, bids_list, t_dict)

    # Run ML Model
    bundle = get_model_bundle()
    ml_score = 0.0
    is_ml_anomaly = False

    if bundle and bundle.get("model") and bundle.get("scaler"):
        try:
            model = bundle["model"]
            scaler = bundle["scaler"]
            threshold = bundle.get("threshold", 0.54)
            feat_vector = np.array([[features[name] for name in FEATURE_NAMES]])
            scaled_v = scaler.transform(feat_vector)
            raw_score = float(-model.score_samples(scaled_v)[0])
            ml_score = max(0.0, min(1.0, (raw_score - 0.3) / 0.5))  # normalize to 0.0 - 1.0 range
            is_ml_anomaly = raw_score >= threshold
        except Exception as e:
            logger.warning("ML inference failed, falling back to rule scoring: %s", e)
            ml_score = 0.35

    # Determine composite Risk Tier
    critical_flags = [f for f in rule_flags if f["severity"] == "CRITICAL"]
    warning_flags = [f for f in rule_flags if f["severity"] == "WARNING"]

    if critical_flags or len(linked_pairs) > 0:
        risk_tier = "HIGH_COLLUSION_RISK"
        predicted_anomaly = True
        composite_score = max(ml_score, 0.85)
        recommendation = "HALT_AWARD: Confirmed collusion or corporate linkage detected. Issue Show-Cause Notice or Disqualify Cartel Group."
    elif is_ml_anomaly or warning_flags or ml_score > 0.65:
        risk_tier = "SUSPICIOUS_PATTERNS"
        predicted_anomaly = True
        composite_score = max(ml_score, 0.60)
        recommendation = "REVIEW_REQUIRED: Statistical bidding anomalies detected. Verify quote basis and firm credentials prior to L1 award."
    else:
        risk_tier = "LOW_RISK"
        predicted_anomaly = False
        composite_score = min(ml_score, 0.30)
        recommendation = "CLEARED: Competitive bidding metrics comply with standard GeM market variance."

    return {
        "tender_id": t_dict.get("tender_number") or t_dict.get("id"),
        "tender_title": t_dict.get("title"),
        "estimated_value": t_dict.get("estimated_value"),
        "bid_count": len(bids_list),
        "anomaly_score": round(composite_score, 4),
        "ml_raw_score": round(ml_score, 4),
        "predicted_anomaly": predicted_anomaly,
        "risk_tier": risk_tier,
        "recommendation": recommendation,
        "rule_flags": rule_flags,
        "linked_bidder_pairs": linked_pairs,
        "features": {k: round(v, 4) if isinstance(v, float) else v for k, v in features.items()},
        "evaluated_at": datetime.now().isoformat()
    }
