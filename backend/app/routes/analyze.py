from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from app.services.ocr import extract_text_from_image, extract_text_from_pdf_bytes
from app.services.llm import (
    detect_document_type,
    analyze_clauses,
    generate_lawyer_card,
    generate_overall_risk
)
from app.services.tts import generate_marathi_audio, build_audio_summary
from app.models.schemas import AnalyzeResponse, Clause, LawyerCard, SchemeEligibility
import json
import uuid
import os

router = APIRouter()

# Load schemes data once
SCHEMES_PATH = os.path.join(os.path.dirname(__file__), "../data/schemes.json")
with open(SCHEMES_PATH, "r", encoding="utf-8") as f:
    ALL_SCHEMES = json.load(f)


def get_eligible_schemes(doc_type: str) -> list[SchemeEligibility]:
    """Return schemes relevant to this document type."""
    eligible = []
    for scheme in ALL_SCHEMES:
        if doc_type in scheme["eligible_doc_types"] or scheme["conditions"] == "all":
            eligible.append(SchemeEligibility(
                scheme_name=scheme["marathi_name"],
                eligible=True,
                reason=scheme["description"],
                apply_url=scheme["apply_url"]
            ))
    return eligible


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_document(
    file: UploadFile = File(...),
    language: str = Form(default="mr")
):
    """
    Main endpoint — upload a document image or PDF and get full analysis.
    
    - Accepts: JPG, PNG, PDF
    - Returns: clause analysis, risk levels, lawyer card, scheme eligibility, audio
    """

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, or PDF files are accepted"
        )

    # Read file bytes
    file_bytes = await file.read()

    # Step 1: OCR — extract text
    try:
        if file.content_type == "application/pdf":
            extracted_text = extract_text_from_pdf_bytes(file_bytes)
        else:
            extracted_text = extract_text_from_image(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

    if not extracted_text or len(extracted_text) < 50:
        raise HTTPException(
            status_code=422,
            detail="Could not extract enough text from the document. Please upload a clearer image."
        )

    # Step 2: Detect document type
    doc_type = detect_document_type(extracted_text)

    # Step 3: Analyze clauses with LLM
    try:
        raw_clauses = analyze_clauses(extracted_text, doc_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Step 4: Build structured clause objects
    clauses = []
    for c in raw_clauses:
        clauses.append(Clause(
            clause_number=c.get("clause_number", 0),
            original_text=c.get("original_text", ""),
            simple_marathi=c.get("simple_marathi", ""),
            risk_level=c.get("risk_level", "YELLOW"),
            risk_reason=c.get("risk_reason", ""),
            negotiation_tip=c.get("negotiation_tip")
        ))

    # Step 5: Generate lawyer card
    lawyer_card_data = generate_lawyer_card(raw_clauses, doc_type)
    lawyer_card = LawyerCard(**lawyer_card_data)

    # Step 6: Get scheme eligibility
    schemes = get_eligible_schemes(doc_type)

    # Step 7: Generate overall risk
    overall_risk = generate_overall_risk(raw_clauses)

    # Step 8: Generate Marathi audio summary
    document_id = str(uuid.uuid4())
    audio_summary_text = build_audio_summary(raw_clauses)
    audio_path = generate_marathi_audio(audio_summary_text, document_id)
    audio_url = f"/api/audio/{document_id}" if audio_path else None

    return AnalyzeResponse(
        document_id=document_id,
        document_type=doc_type,
        extracted_text=extracted_text,
        clauses=clauses,
        lawyer_card=lawyer_card,
        schemes=schemes,
        audio_url=audio_url,
        overall_risk=overall_risk
    )


@router.get("/audio/{document_id}")
async def get_audio(document_id: str):
    """Serve the generated Marathi audio file."""
    audio_path = f"audio_files/{document_id}.wav"
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(audio_path, media_type="audio/wav")


@router.get("/schemes")
async def get_all_schemes():
    """Return all government schemes (for frontend display)."""
    return ALL_SCHEMES