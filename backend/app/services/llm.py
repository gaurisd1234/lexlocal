import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")


def detect_document_type(text: str) -> str:
    """
    Detect what kind of legal document this is.
    Returns: sale_deed | loan_agreement | insurance | lease | power_of_attorney | unknown
    """
    prompt = f"""
You are a legal document classifier for Indian documents.
Given this document text (may be in Marathi or Hindi), identify the document type.

Document text:
{text[:1500]}

Reply with ONLY one of these exact words (nothing else):
sale_deed
loan_agreement
insurance
lease
power_of_attorney
unknown
"""
    response = model.generate_content(prompt)
    doc_type = response.text.strip().lower()
    valid_types = ["sale_deed", "loan_agreement", "insurance", "lease", "power_of_attorney", "unknown"]
    return doc_type if doc_type in valid_types else "unknown"


def analyze_clauses(text: str, doc_type: str) -> list:
    """
    Extract and analyze every clause in the document.
    Returns a list of clause objects with risk levels and Marathi explanations.
    """

    # Type-specific instructions so the model knows what to watch for
    type_instructions = {
        "sale_deed": "Watch for: encumbrance clauses, seller's title guarantee, possession date, penalty for delay, registration requirements.",
        "loan_agreement": "Watch for: penal interest rate, personal guarantee clauses, lien on property, unilateral right to recall loan, compounding interest.",
        "insurance": "Watch for: exclusion clauses, claim filing deadlines, what is NOT covered, premium penalty clauses.",
        "lease": "Watch for: unilateral termination rights, rent escalation clauses, deposit forfeiture conditions, subletting restrictions.",
        "power_of_attorney": "Watch for: irrevocable clauses, scope of authority, financial transaction rights, property sale rights.",
    }

    special_watch = type_instructions.get(doc_type, "Watch for any unusual or unfair clauses.")

    prompt = f"""
You are LexLocal, an AI legal assistant helping rural Maharashtra farmers understand legal documents.
Document type: {doc_type}
Special attention: {special_watch}

Analyze the following document text and extract ALL important clauses.
For each clause:
1. Quote the original clause (or portion)
2. Explain it in SIMPLE MARATHI (as you would explain to a farmer who can read but not legalese)
3. Rate the risk: RED (dangerous/unfair), YELLOW (needs attention), GREEN (normal/safe)
4. Give the reason for the risk level in Marathi
5. If RED or YELLOW, give a negotiation tip in Marathi (what to ask the other party to change)

Document text:
{text}

IMPORTANT: Reply ONLY with a valid JSON array. No markdown, no explanation, just the JSON.
Format:
[
  {{
    "clause_number": 1,
    "original_text": "original clause text here",
    "simple_marathi": "साध्या मराठीत स्पष्टीकरण",
    "risk_level": "RED",
    "risk_reason": "मराठीत कारण",
    "negotiation_tip": "मराठीत सुचवणी (only for RED/YELLOW, null for GREEN)"
  }}
]
"""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Clean up if model wraps in markdown
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        clauses = json.loads(raw)
        return clauses
    except json.JSONDecodeError:
        # Fallback: return a single clause with the raw response
        return [{
            "clause_number": 1,
            "original_text": text[:500],
            "simple_marathi": "हा दस्तऐवज विश्लेषण करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.",
            "risk_level": "YELLOW",
            "risk_reason": "विश्लेषण अपूर्ण",
            "negotiation_tip": None
        }]


def generate_lawyer_card(clauses: list, doc_type: str) -> dict:
    """
    Based on clause analysis, generate a lawyer consultation recommendation.
    """
    red_count = sum(1 for c in clauses if c.get("risk_level") == "RED")
    yellow_count = sum(1 for c in clauses if c.get("risk_level") == "YELLOW")

    # Risk score 1-5
    if red_count >= 3:
        risk_score = 5
    elif red_count == 2:
        risk_score = 4
    elif red_count == 1:
        risk_score = 3
    elif yellow_count >= 2:
        risk_score = 2
    else:
        risk_score = 1

    recommendations = {
        5: {
            "recommendation": "वकिलाचा सल्ला घेणे आवश्यक आहे",
            "reason": f"या दस्तऐवजात {red_count} अत्यंत धोकादायक कलमे आहेत. हे दस्तऐवज न समजता सही करू नका."
        },
        4: {
            "recommendation": "वकिलाचा सल्ला घ्या",
            "reason": f"{red_count} लाल कलम आणि {yellow_count} पिवळी कलमे आढळली. सही करण्यापूर्वी वकिलाशी बोला."
        },
        3: {
            "recommendation": "सावधगिरीने पुढे जा",
            "reason": f"एक धोकादायक कलम आढळले. वकिलाशी किंवा बँक व्यवस्थापकाशी चर्चा करा."
        },
        2: {
            "recommendation": "काही बदल सुचवले जातात",
            "reason": f"{yellow_count} कलमांकडे लक्ष द्या. सही करण्यापूर्वी या कलमांबद्दल विचारणा करा."
        },
        1: {
            "recommendation": "हे दस्तऐवज सुरक्षित दिसते",
            "reason": "कोणतेही अत्यंत धोकादायक कलम आढळले नाही. तरीही सर्व कलमे वाचा."
        }
    }

    rec = recommendations[risk_score]
    return {
        "risk_score": risk_score,
        "recommendation": rec["recommendation"],
        "reason": rec["reason"],
        "dlsa_district": None   # Will be filled by frontend based on user location
    }


def generate_overall_risk(clauses: list) -> str:
    """Overall document risk based on clauses."""
    red = sum(1 for c in clauses if c.get("risk_level") == "RED")
    yellow = sum(1 for c in clauses if c.get("risk_level") == "YELLOW")
    if red > 0:
        return "RED"
    elif yellow > 0:
        return "YELLOW"
    return "GREEN"


def compare_documents(text1: str, text2: str) -> dict:
    """
    Compare two legal documents and highlight key differences.
    """
    prompt = f"""
You are LexLocal, comparing two legal documents for a rural farmer.
Find the key differences between Document 1 and Document 2.
Focus on: interest rates, penalties, rights given up, deadlines, property clauses.

Document 1:
{text1[:2000]}

Document 2:
{text2[:2000]}

Reply ONLY with valid JSON (no markdown):
{{
  "differences": [
    {{
      "topic": "topic in Marathi",
      "document_1": "what doc 1 says in Marathi",
      "document_2": "what doc 2 says in Marathi",
      "safer": "Document 1 or Document 2",
      "explanation": "why one is safer in Marathi"
    }}
  ],
  "summary": "overall comparison in simple Marathi",
  "safer_document": "Document 1 or Document 2"
}}
"""
    response = model.generate_content(prompt)
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "differences": [],
            "summary": "तुलना करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.",
            "safer_document": "Unknown"
        }