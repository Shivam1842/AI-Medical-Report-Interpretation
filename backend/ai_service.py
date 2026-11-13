import os
from google import genai
from google.genai import types
from dotenv import load_dotenv, find_dotenv
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List
import json

load_dotenv(find_dotenv())

gemini_api_key = os.environ.get("GEMINI_API_KEY")

if not gemini_api_key:
    raise ValueError("CRITICAL ERROR: GEMINI_API_KEY not found in environment variables.")

client = genai.Client(api_key=gemini_api_key)

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

def process_document_with_ai(file_bytes: bytes, mime_type: str) -> str:
    prompt = """
        Analyze the medical report image and return ONLY valid JSON matching this exact schema:
        {
            "report_info": {"name": "string", "date": "string"},
            "summary": {"total": 0, "normal": 0, "abnormal": 0, "borderline": 0},
            "parameters": [
                {"name": "string", "result": "string", "unit": "string", "range": "string", "status": "string"}
            ],
            "ai_explanations": [
                {
                    "parameter": "string",
                    "status": "string",
                    "explanation": "Brief overview of what the abnormal value means.",
                    "causes": "Common medical or lifestyle causes.",
                    "precautions": "Immediate steps or lifestyle changes to consider.",
                    "food_sources": "Specific dietary recommendations to help correct the level."
                }
            ]
        }
        Include an ai_explanations entry for each abnormal or borderline parameter. Return pure JSON only without markdown code blocks.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=file_bytes,
                    mime_type=mime_type,
                )
            ]
        )

        raw_text = response.text.strip()
        if raw_text.startswith('```'):
            raw_text = raw_text.split('\n', 1)[1].rsplit('```', 1)[0].strip()

        data = json.loads(raw_text)
        validated_data = MedicalReportExtraction.model_validate(data)
        return validated_data.model_dump_json()

    except Exception as error:
        print(f"Gemini API error: {error}")
        raise HTTPException(
            status_code=503,
            detail=f"Gemini AI error: {str(error)}",
        )