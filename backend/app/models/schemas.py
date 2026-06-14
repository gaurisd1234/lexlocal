from pydantic import BaseModel
from typing import List, Optional


class Clause(BaseModel):
    clause_number: int
    original_text: str
    simple_marathi: str         # Plain Marathi explanation
    risk_level: str             # RED, YELLOW, GREEN
    risk_reason: str            # Why this risk level
    negotiation_tip: Optional[str] = None   # What to ask to change


class LawyerCard(BaseModel):
    risk_score: int             # 1-5
    recommendation: str         # "Consult lawyer", "Safe to sign", etc.
    reason: str
    dlsa_district: Optional[str] = None


class SchemeEligibility(BaseModel):
    scheme_name: str
    eligible: bool
    reason: str
    apply_url: str


class AnalyzeResponse(BaseModel):
    document_id: str
    document_type: str          # sale_deed, loan, insurance, lease
    extracted_text: str
    clauses: List[Clause]
    lawyer_card: LawyerCard
    schemes: List[SchemeEligibility]
    audio_url: Optional[str] = None
    overall_risk: str           # RED, YELLOW, GREEN


class CompareResponse(BaseModel):
    document_1_type: str
    document_2_type: str
    differences: List[dict]
    summary: str
    safer_document: str         # "Document 1" or "Document 2"