import os
import time
from dotenv import load_dotenv, find_dotenv
from google import genai
from google.genai import types
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List
import json

env_path = find_dotenv()
load_dotenv(env_path)

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    raise ValueError(f"CRITICAL ERROR: Still cannot find the API key. Python looked for the .env file here: {env_path}")

client = genai.Client(api_key=api_key)

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

def generate_content_with_retry(prompt: str, file_bytes: bytes, mime_type: str):
    # gemini-3.8-flash is the correct active model; retry with backoff for 503 high demand
    for attempt in range(3):
        try:
            print(f"Attempting analysis with gemini-3.8-flash (Attempt {attempt+1})")
            return client.models.generate_content(
                model='gemini-3.8-flash',
                contents=[
                    prompt,
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
                ],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type='application/json',
                    response_schema=MedicalReportExtraction,
                )
            )
        except Exception as error:
            print(f"Attempt {attempt+1} failed: {error}")
            if attempt < 2:
                time.sleep(2)  # Wait 2 seconds before retrying on high demand
            else:
                raise HTTPException(
                    status_code=503,
                    detail="Gemini AI is experiencing high traffic. Please try again in a moment.",
                )

def parse_raw_text_to_json(raw_text: str) -> str:
    cleaned_text = raw_text.strip()
    if cleaned_text.startswith('```'):
        cleaned_text = cleaned_text.split('\n', 1)[1].rsplit('```', 1)[0].strip()

    data = json.loads(cleaned_text)
    validated_data = MedicalReportExtraction.model_validate(data)
    return validated_data.model_dump_json()

def process_document_with_ai(file_bytes: bytes, mime_type: str) -> str:
    prompt = """
        Analyze the medical report and return ONLY valid JSON. Do not include markdown fences,
        commentary, or any text outside the JSON object. Follow this exact schema:

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

        Include an ai_explanations entry for each abnormal or borderline parameter.
        Use empty strings only when a field cannot be determined from the report.
        Keep all JSON keys and string values valid JSON.
    """
    
    response = generate_content_with_retry(prompt, file_bytes, mime_type)
    return parse_raw_text_to_json(response.text)