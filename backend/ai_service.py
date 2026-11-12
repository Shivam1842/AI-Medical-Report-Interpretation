import os
import time
from dotenv import load_dotenv, find_dotenv
from google import genai
from google.genai import types
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List
import json

# 1. Force Python to aggressively find and load the .env file
env_path = find_dotenv()
load_dotenv(env_path)

# 2. Grab the key
api_key = os.environ.get("GEMINI_API_KEY")

# 3. Add a debug check to tell us EXACTLY what is going wrong
if not api_key:
    raise ValueError(f"CRITICAL ERROR: Still cannot find the API key. Python looked for the .env file here: {env_path}")

client = genai.Client(api_key=api_key)

# 3. Define the exact JSON structure your React app expects
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

# 4. The function that talks to Gemini with optimized retry and stable model priority
def generate_content_with_retry(prompt: str, file_bytes: bytes, mime_type: str):
    # gemini-1.5-flash is prioritized for better free tier stability, with gemini-2.0-flash as fallback
    models = ['gemini-1.5-flash', 'gemini-2.0-flash']

    for model_name in models:
        for attempt in range(3):  # Har model ke liye 3 baar try karega
            try:
                return client.models.generate_content(
                    model=model_name,
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
                print(f"Model {model_name} attempt {attempt+1} failed: {error}")
                time.sleep(2)  # 2 seconds ka gap taaki rate limit clear ho jaye

    raise HTTPException(
        status_code=503,
        detail="All AI analysis models are currently experiencing high traffic. Please try again later.",
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