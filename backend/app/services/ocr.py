import cv2
import numpy as np
import io

_ocr_engine = None

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        from paddleocr import PaddleOCR
        _ocr_engine = PaddleOCR(use_angle_cls=True, lang='hi')
    return _ocr_engine


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise Exception("Could not read image. Please upload a valid JPG or PNG.")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    binary = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    coords = np.column_stack(np.where(binary > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) < 15:
            (h, w) = binary.shape
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            binary = cv2.warpAffine(binary, M, (w, h),
                flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return binary


def extract_text_from_image(image_bytes: bytes) -> str:
    try:
        processed = preprocess_image(image_bytes)
        _, buffer = cv2.imencode('.png', processed)
        processed_bytes = buffer.tobytes()

        ocr = get_ocr_engine()
        result = ocr.ocr(processed_bytes, cls=True)

        lines = []
        if result and result[0]:
            for line in result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]
                    confidence = line[1][1]
                    if confidence > 0.5:
                        lines.append(text)

        return '\n'.join(lines).strip()
    except Exception as e:
        raise Exception(f"OCR failed: {str(e)}")


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        pages = convert_from_bytes(pdf_bytes, dpi=200)
        all_text = []
        for page in pages:
            img_byte_arr = io.BytesIO()
            page.save(img_byte_arr, format='PNG')
            page_text = extract_text_from_image(img_byte_arr.getvalue())
            all_text.append(page_text)
        return '\n\n--- Page Break ---\n\n'.join(all_text)
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")