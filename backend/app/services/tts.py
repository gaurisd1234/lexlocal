import requests
import os
import base64
import uuid
from dotenv import load_dotenv

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"


def generate_marathi_audio(text: str, document_id: str) -> str:
    """
    Convert Marathi text to speech using Sarvam AI.
    Saves the audio file and returns the file path.
    
    Args:
        text: Marathi text to convert to speech
        document_id: Used to create a unique filename
    
    Returns:
        Path to the saved audio file (serve this as a static file)
    """

    # Sarvam TTS has a character limit per request — split if needed
    MAX_CHARS = 500
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS] + "..."

    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": [text],
        "target_language_code": "mr-IN",    # Marathi
        "speaker": "meera",                  # Female Marathi voice
        "pitch": 0,
        "pace": 0.9,                          # Slightly slower for clarity
        "loudness": 1.5,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v1"
    }

    try:
        response = requests.post(SARVAM_TTS_URL, json=payload, headers=headers)
        response.raise_for_status()

        data = response.json()
        audio_base64 = data["audios"][0]

        # Save audio file
        os.makedirs("audio_files", exist_ok=True)
        filename = f"audio_files/{document_id}.wav"

        with open(filename, "wb") as f:
            f.write(base64.b64decode(audio_base64))

        return filename

    except requests.exceptions.RequestException as e:
        print(f"Sarvam TTS error: {e}")
        return None
    except Exception as e:
        print(f"Audio generation error: {e}")
        return None


def build_audio_summary(clauses: list) -> str:
    """
    Build a short Marathi summary of the risk findings for audio playback.
    This is what the farmer actually hears.
    """
    red_clauses = [c for c in clauses if c.get("risk_level") == "RED"]
    yellow_clauses = [c for c in clauses if c.get("risk_level") == "YELLOW"]
    green_clauses = [c for c in clauses if c.get("risk_level") == "GREEN"]

    summary_parts = ["नमस्कार! लेक्सलोकल तुमच्या दस्तऐवजाचे विश्लेषण पूर्ण झाले आहे."]

    total = len(clauses)
    summary_parts.append(f"एकूण {total} कलमे सापडली.")

    if red_clauses:
        summary_parts.append(
            f"{len(red_clauses)} अत्यंत धोकादायक कलमे आढळली. "
            f"हे दस्तऐवज सही करण्यापूर्वी वकिलाचा सल्ला घ्या."
        )
        # Read out the first red clause
        first_red = red_clauses[0]
        summary_parts.append(
            f"सर्वात महत्त्वाचे: {first_red.get('simple_marathi', '')}"
        )
    elif yellow_clauses:
        summary_parts.append(
            f"{len(yellow_clauses)} कलमांकडे लक्ष द्या. "
            f"सही करण्यापूर्वी या कलमांबद्दल विचारणा करा."
        )
    else:
        summary_parts.append(
            "हे दस्तऐवज सुरक्षित दिसते. "
            "तरीही सर्व कलमे नीट वाचा."
        )

    summary_parts.append("संपूर्ण विश्लेषण स्क्रीनवर पाहण्यासाठी खाली स्क्रोल करा.")

    return " ".join(summary_parts)