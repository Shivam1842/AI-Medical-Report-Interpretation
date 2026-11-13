import os
import json
import time
import logging

from google import genai
from google.genai import types
from dotenv import load_dotenv, find_dotenv
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List


# ==========================================
# 1. ENVIRONMENT SETUP
# ==========================================

load_dotenv(find_dotenv())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found in environment variables."
    )

client = genai.Client(api_key=GEMINI_API_KEY)


# ==========================================
# 2. PYDANTIC DATA MODELS
# ==========================================

class ReportInfo(BaseModel):
    name: str
    date: str


class ReportSummary(BaseModel):
    total: int
    normal: int
    abnormal: int
    borderline: int


class Parameter(BaseModel):
    name: str
    result: str
    unit: str
    range: str
    status: str


class AIExplanation(BaseModel):
    parameter: str
    status: str
    explanation: str
    causes: str
    precautions: str
    food_sources: str


class MedicalReportExtraction(BaseModel):
    report_info: ReportInfo
    summary: ReportSummary
    parameters: List[Parameter]
    ai_explanations: List[AIExplanation]


# ==========================================
# 3. GEMINI CONFIGURATION
# ==========================================

# Confirm model availability for your API key
# using Google AI Studio before deployment.

MODELS_TO_TRY = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
]

MAX_RETRIES = 2


# ==========================================
# 4. ERROR CLASSIFICATION
# ==========================================

def get_error_code(error):

    code = getattr(error, "code", None)

    if code is not None:
        return code

    text = str(error).lower()

    for status_code in [400, 401, 403, 404, 429, 500, 502, 503, 504]:

        if str(status_code) in text:
            return status_code

    return None


# ==========================================
# 5. MEDICAL REPORT ANALYSIS
# ==========================================

def process_document_with_ai(
    file_bytes: bytes,
    mime_type: str
) -> str:

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    allowed_mime_types = [
        "application/pdf",
        "image/jpeg",
        "image/png",
    ]

    if mime_type not in allowed_mime_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format."
        )

    # ======================================
    # PROMPT
    # ======================================

    prompt = """
    You are a medical report explanation assistant.

    Carefully analyze the uploaded medical report.

    Return ONLY valid JSON matching this exact schema:

    {
        "report_info": {
            "name": "string",
            "date": "string"
        },

        "summary": {
            "total": 0,
            "normal": 0,
            "abnormal": 0,
            "borderline": 0
        },

        "parameters": [
            {
                "name": "string",
                "result": "string",
                "unit": "string",
                "range": "string",
                "status": "string"
            }
        ],

        "ai_explanations": [
            {
                "parameter": "string",
                "status": "string",
                "explanation": "string",
                "causes": "string",
                "precautions": "string",
                "food_sources": "string"
            }
        ]
    }

    INSTRUCTIONS:

    1. Extract all readable medical parameters.
    2. Identify normal, abnormal and borderline values.
    3. Use the reference ranges printed in the report.
    4. Never invent missing values or reference ranges.
    5. Include explanations for every abnormal and
       borderline parameter.
    6. Explain medical terms in simple language.
    7. Mention possible causes, not definite diagnoses.
    8. Provide general precautions.
    9. Give general dietary information where relevant.
    10. Never prescribe medicines or treatment.
    11. Mark unreadable values as unclear.
    12. Ensure summary counts match extracted parameters.
    13. Do not assume that a missing value is normal.
    14. Recommend consulting a qualified doctor for
        concerning results.

    Return pure JSON only.
    Do not include markdown code blocks.
    """

    # ======================================
    # MODEL FALLBACK
    # ======================================

    last_error = None

    for model_name in MODELS_TO_TRY:

        logger.info(
            "Attempting Gemini model: %s",
            model_name
        )

        for attempt in range(MAX_RETRIES):

            try:

                logger.info(
                    "Attempt %s for %s",
                    attempt + 1,
                    model_name
                )

                response = client.models.generate_content(

                    model=model_name,

                    contents=[
                        prompt,

                        types.Part.from_bytes(
                            data=file_bytes,
                            mime_type=mime_type
                        )
                    ],

                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )

                # ==================================
                # EXTRACT RESPONSE
                # ==================================

                if not response.text:
                    raise ValueError(
                        "Empty response from Gemini."
                    )

                raw_text = response.text.strip()

                # Remove accidental markdown
                if raw_text.startswith("```"):

                    raw_text = raw_text.split(
                        "\n", 1
                    )[1].rsplit(
                        "```", 1
                    )[0].strip()

                # ==================================
                # JSON VALIDATION
                # ==================================

                data = json.loads(raw_text)

                validated_data = (
                    MedicalReportExtraction.model_validate(data)
                )

                logger.info(
                    "SUCCESS: Analysis completed using %s",
                    model_name
                )

                return validated_data.model_dump_json()

            except Exception as error:

                last_error = error

                error_code = get_error_code(error)

                logger.exception(
                    "Model %s failed",
                    model_name
                )

                # ==================================
                # AUTHENTICATION / REQUEST ERRORS
                # ==================================

                if error_code in (400, 401, 403):

                    raise HTTPException(
                        status_code=502,
                        detail=(
                            "Gemini API request or authentication "
                            "failed. Check API configuration."
                        )
                    ) from error

                # ==================================
                # MODEL NOT AVAILABLE
                # ==================================

                if error_code == 404:

                    logger.warning(
                        "Model %s not found. Switching model.",
                        model_name
                    )

                    break

                # ==================================
                # TEMPORARY SERVER ERRORS
                # ==================================

                if error_code in (
                    429, 500, 502, 503, 504
                ):

                    if attempt < MAX_RETRIES - 1:

                        wait_time = 2 ** attempt

                        logger.warning(
                            "Temporary error. Retrying in %s seconds.",
                            wait_time
                        )

                        time.sleep(wait_time)

                    else:

                        logger.warning(
                            "Retries exhausted for %s.",
                            model_name
                        )

                        break

                # ==================================
                # INVALID JSON / OTHER ERRORS
                # ==================================

                else:

                    logger.warning(
                        "Unexpected response error. "
                        "Switching model."
                    )

                    break

    # ======================================
    # ALL MODELS FAILED
    # ======================================

    logger.error(
        "All Gemini models failed. Last error: %s",
        last_error
    )

    raise HTTPException(
        status_code=503,
        detail=(
            "Medical report analysis is temporarily unavailable. "
            "Please try again later."
        )
    )