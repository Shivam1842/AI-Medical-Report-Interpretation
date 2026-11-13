import os
import base64
from dotenv import load_dotenv, find_dotenv
from groq import Groq
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List
import json

load_dotenv(find_dotenv())

groq_api_key = os.environ.get("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("CRITICAL ERROR: Groq API key not found in environment variables.")

client = Groq(api_key=groq_api_key)

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
    base64_image = base64.b64encode(file_bytes).decode('utf-8')
    data_url = f"data:{mime_type};base64,{base64_image}"

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
        completion = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}}
                    ],
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        raw_text = completion.choices[0].message.content
        cleaned_text = raw_text.strip()
        if cleaned_text.startswith('```'):
            cleaned_text = cleaned_text.split('\n', 1)[1].rsplit('```', 1)[0].strip()

        data = json.loads(cleaned_text)
        validated_data = MedicalReportExtraction.model_validate(data)
        return validated_data.model_dump_json()

    except Exception as error:
        print(f"Groq API error: {error}")
        raise HTTPException(
            status_code=503,
            detail=f"Groq AI error: {str(error)}",
        )