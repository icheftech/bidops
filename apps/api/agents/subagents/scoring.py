"""
BidOps Scoring Sub-Agent
Scores opportunities against tenant criteria with HUB/certification weighting.

Score breakdown (max 100 pts):
  +25  HUB set-aside or HUB participation goal
  +20  NAICS code matches primary catalog
  +20  Federal small business set-aside (SBA, SBP)
  +15  ESBD Texas source (inherently HUB-oriented)
  +15  Past performance match (same NAICS + agency type)
  +10  Local Houston-metro agency (existing vendor account)
  +10  Low dollar value (auto-qualify potential)
  +10  Catalog coverage ≥ 80%
  -50  Compliance hard block (missing cert, disqualifying clause)
"""

from typing import Optional
import anthropic
import json
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Scoring weights ───────────────────────────────────────────────────────────

WEIGHTS = {
    "hub_set_aside":       25,
    "naics_match":         20,
    "small_biz_set_aside": 20,
    "esbd_source":         15,
    "past_perf_match":     15,
    "local_agency":        10,
    "low_value":           10,
    "catalog_coverage":    10,
    "compliance_block":   -50,
}

AI_NAICS = {"541511", "541512", "541519", "541715", "541330"}
AI_PSC   = {"D399", "R425", "D302", "D307", "AC14"}

LOCAL_AGENCIES = {
    "city of houston", "houston", "harris county",
    "metro", "metropolitan transit authority",
    "h-gac", "houston-galveston area council",
}

HUB_SET_ASIDE_CODES = {
    "SBA", "SBP", "WOSB", "EDWOSB", "HZC", "VSB",
    "SDVOSB", "HUB", "8A",
}


def score_opportunity(
    opportunity: dict,
    tenant_criteria: dict,
    pricing_catalog: list[dict],
    past_performance: list[dict],
) -> dict:
    """
    Score an opportunity against tenant criteria.
    Returns a structured score breakdown with recommendation.
    """

    breakdown = {k: 0 for k in WEIGHTS}
    flags = []

    naics_code    = opportunity.get("naics_code", "")
    source        = opportunity.get("source", "")
    set_asides    = opportunity.get("set_aside_type", "") or ""
    agency        = (opportunity.get("issuing_agency") or "").lower()
    value         = opportunity.get("estimated_value") or 0
    hub_applicable = opportunity.get("hub_applicable", False)

    # ── HUB set-aside (+25) ───────────────────────────────────────────────────
    if hub_applicable or any(code in set_asides.upper() for code in HUB_SET_ASIDE_CODES):
        breakdown["hub_set_aside"] = WEIGHTS["hub_set_aside"]
        flags.append({"type": "HUB", "msg": "HUB set-aside or participation goal detected"})

    # ── NAICS match (+20) ─────────────────────────────────────────────────────
    preferred_naics = set(tenant_criteria.get("preferred_naics", []))
    if naics_code in preferred_naics or naics_code in AI_NAICS:
        breakdown["naics_match"] = WEIGHTS["naics_match"]

    # ── Small business set-aside (+20) ────────────────────────────────────────
    if any(s in set_asides.upper() for s in ["SBA", "SBP", "SMALL BUSINESS"]):
        breakdown["small_biz_set_aside"] = WEIGHTS["small_biz_set_aside"]

    # ── ESBD source (+15) ─────────────────────────────────────────────────────
    if source == "ESBD_TEXAS":
        breakdown["esbd_source"] = WEIGHTS["esbd_source"]

    # ── Past performance match (+15) ─────────────────────────────────────────
    for pp in past_performance:
        if pp.get("naics_code") == naics_code:
            breakdown["past_perf_match"] = WEIGHTS["past_perf_match"]
            break

    # ── Local Houston-metro agency (+10) ──────────────────────────────────────
    if any(local in agency for local in LOCAL_AGENCIES):
        breakdown["local_agency"] = WEIGHTS["local_agency"]

    # ── Low dollar value (+10) ────────────────────────────────────────────────
    max_value = tenant_criteria.get("max_dollar_value", 500_000)
    auto_submit_threshold = tenant_criteria.get("auto_submit_threshold", 25_000)
    if 0 < value <= auto_submit_threshold:
        breakdown["low_value"] = WEIGHTS["low_value"]

    # ── Catalog coverage (+10) ────────────────────────────────────────────────
    catalog_coverage = estimate_catalog_coverage(opportunity, pricing_catalog)
    if catalog_coverage >= 0.8:
        breakdown["catalog_coverage"] = WEIGHTS["catalog_coverage"]

    # ── Compliance check (−50 if blocked) ────────────────────────────────────
    compliance_issues = check_compliance(opportunity, tenant_criteria)
    hard_blocks = [c for c in compliance_issues if c["severity"] == "HARD_BLOCK"]
    if hard_blocks:
        breakdown["compliance_block"] = WEIGHTS["compliance_block"]
        flags.extend(hard_blocks)

    # ── Total + recommendation ────────────────────────────────────────────────
    total = max(0, sum(breakdown.values()))

    pursue_threshold = tenant_criteria.get("pursue_threshold", 60)
    pass_threshold   = tenant_criteria.get("pass_threshold",   30)

    if hard_blocks:
        recommendation = "PASS"
    elif total >= pursue_threshold:
        recommendation = "PURSUE"
    elif total <= pass_threshold:
        recommendation = "PASS"
    else:
        recommendation = "MONITOR"

    # ── Auto-qualify check ────────────────────────────────────────────────────
    auto_qualifies = (
        not hard_blocks
        and catalog_coverage >= 1.0
        and 0 < value <= auto_submit_threshold
        and recommendation == "PURSUE"
    )

    # ── AI reasoning (for briefing) ───────────────────────────────────────────
    reasoning = generate_reasoning(
        opportunity, breakdown, total, recommendation, flags, catalog_coverage
    )

    return {
        "total":            total,
        "breakdown":        breakdown,
        "recommendation":   recommendation,
        "hub_applicable":   breakdown["hub_set_aside"] > 0,
        "catalog_coverage": catalog_coverage,
        "auto_qualifies":   auto_qualifies,
        "compliance_flags": compliance_issues,
        "reasoning":        reasoning,
    }


def estimate_catalog_coverage(opportunity: dict, catalog: list[dict]) -> float:
    """
    Rough catalog coverage estimate based on NAICS match.
    Phase 2 will do line-item-level matching from parsed RFP documents.
    """
    if not catalog:
        return 0.0

    naics = opportunity.get("naics_code", "")
    domain = opportunity.get("domain", "")

    matched = sum(
        1 for item in catalog
        if item.get("naics_code") == naics or item.get("domain") == domain
    )

    return min(1.0, matched / max(len(catalog), 1))


def check_compliance(opportunity: dict, tenant_criteria: dict) -> list[dict]:
    """Basic compliance pre-check. Full compliance agent runs in bid prep phase."""
    flags = []

    # Check value range
    value = opportunity.get("estimated_value", 0) or 0
    max_val = tenant_criteria.get("max_dollar_value")
    if max_val and value > max_val:
        flags.append({
            "severity":    "WARNING",
            "code":        "VALUE_EXCEEDS_CAPACITY",
            "message":     f"Estimated value ${value:,.0f} exceeds configured max ${max_val:,.0f}",
            "remediation": "Review capacity or increase max_dollar_value threshold",
        })

    # Check deadline viability (< 3 days)
    from datetime import datetime, timezone
    deadline_str = opportunity.get("response_deadline")
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            days_left = (deadline - datetime.now(timezone.utc)).days
            if days_left < 0:
                flags.append({
                    "severity":    "HARD_BLOCK",
                    "code":        "DEADLINE_PASSED",
                    "message":     "Response deadline has already passed",
                    "remediation": None,
                })
            elif days_left < 3:
                flags.append({
                    "severity":    "WARNING",
                    "code":        "TIGHT_DEADLINE",
                    "message":     f"Only {days_left} days until response deadline",
                    "remediation": "Consider manual fast-track or pass",
                })
        except Exception:
            pass

    return flags


def generate_reasoning(
    opportunity: dict,
    breakdown: dict,
    total: int,
    recommendation: str,
    flags: list,
    catalog_coverage: float,
) -> str:
    """Generate a human-readable reasoning summary using Claude."""

    prompt = f"""You are a government contracting analyst for Southern Shade LLC, 
a Texas HUB-certified AI & Robotics firm based in Houston.

Opportunity: {opportunity.get('title', 'Unknown')}
Agency: {opportunity.get('issuing_agency', 'Unknown')}
NAICS: {opportunity.get('naics_code', 'Unknown')}
Domain: {opportunity.get('domain', 'Unknown')}
Estimated Value: ${opportunity.get('estimated_value', 0):,.0f}
Set-Aside: {opportunity.get('set_aside_type', 'None')}
HUB Applicable: {opportunity.get('hub_applicable', False)}

Score breakdown: {json.dumps(breakdown, indent=2)}
Total score: {total}/100
Catalog coverage: {catalog_coverage:.0%}
Recommendation: {recommendation}
Flags: {json.dumps(flags, indent=2)}

Write a 3-4 sentence briefing summary explaining this recommendation to the founder.
Be direct and specific. Mention the strongest factors. If recommending PURSUE, note what makes it a fit.
If PASS, explain the key blockers. Keep it under 100 words."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.content[0].text


# ── Batch scoring ─────────────────────────────────────────────────────────────

def batch_score_opportunities(
    opportunities: list[dict],
    tenant_criteria: dict,
    pricing_catalog: list[dict],
    past_performance: list[dict],
) -> list[dict]:
    """Score a batch of opportunities and return sorted results."""
    results = []

    for opp in opportunities:
        score = score_opportunity(opp, tenant_criteria, pricing_catalog, past_performance)
        results.append({**opp, "score_result": score})

    # Sort: PURSUE first by score desc, then MONITOR, then PASS
    order = {"PURSUE": 0, "MONITOR": 1, "PASS": 2}
    results.sort(
        key=lambda x: (
            order.get(x["score_result"]["recommendation"], 3),
            -x["score_result"]["total"],
        )
    )

    return results
