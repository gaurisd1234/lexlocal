from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ocr import extract_text_from_image, extract_text_from_pdf_bytes
from app.services.llm import compare_documents
from app.models.schemas import CompareResponse

router = APIRouter()


@router.post("/compare", response_model=CompareResponse)
async def compare_two_documents(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    """
    Compare two legal documents side by side.
    E.g. compare a bank's loan agreement vs the RBI standard template.
    """
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]

    # Validate both files
    for f in [file1, file2]:
        if f.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type: {f.filename}")

    # Read both files
    bytes1 = await file1.read()
    bytes2 = await file2.read()

    # OCR both
    try:
        if file1.content_type == "application/pdf":
            text1 = extract_text_from_pdf_bytes(bytes1)
        else:
            text1 = extract_text_from_image(bytes1)

        if file2.content_type == "application/pdf":
            text2 = extract_text_from_pdf_bytes(bytes2)
        else:
            text2 = extract_text_from_image(bytes2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

    # Compare with LLM
    try:
        result = compare_documents(text1, text2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

    return CompareResponse(
        document_1_type=file1.filename or "Document 1",
        document_2_type=file2.filename or "Document 2",
        differences=result.get("differences", []),
        summary=result.get("summary", ""),
        safer_document=result.get("safer_document", "Unknown")
    )