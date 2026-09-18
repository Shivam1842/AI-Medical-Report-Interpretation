import os
from dotenv import load_dotenv, find_dotenv
from google import genai
from google.genai import types
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

# ... (keep all your class definitions starting with class ReportInfo(BaseModel): below this)

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

class MedicalReportExtraction(BaseModel):
    report_info: ReportInfo
    summary: ReportSummary
    parameters: List[Parameter]
    ai_explanations: List[AIExplanation]

# 4. The function that actually talks to Gemini


def parse_raw_text_to_json(raw_text: str) -> str:
    lines = [line.strip() for line in raw_text.strip().replace('```', '').split('\n') if line.strip()]
    
    data = {
        "report_info": {},
        "summary": {},
        "parameters": [],
        "ai_explanations": []
    }
    
    current_section = None
    
    # 1. Parse the text as usual
    for line in lines:
        if line in ["REPORT_INFO", "SUMMARY", "PARAMETERS", "EXPLANATIONS"]:
            current_section = line
            continue
            
        if line.startswith("Name|Date") or line.startswith("Total|Normal") or line.startswith("Name|Result") or line.startswith("Parameter|Status"):
            continue
            
        parts = line.split('|')
        
        try:
            if current_section == "REPORT_INFO" and len(parts) >= 2:
                data["report_info"] = {"name": parts[0].strip(), "date": parts[1].strip()}
            # Note: We completely ignore the AI's "SUMMARY" section now
            elif current_section == "PARAMETERS" and len(parts) >= 5:
                data["parameters"].append({
                    "name": parts[0].strip(), "result": parts[1].strip(), "unit": parts[2].strip(), "range": parts[3].strip(), "status": parts[4].strip()
                })
            elif current_section == "EXPLANATIONS" and len(parts) >= 3:
                data["ai_explanations"].append({
                    "parameter": parts[0].strip(), "status": parts[1].strip(), "explanation": parts[2].strip()
                })
        except ValueError:
            continue
            
    # 2. Programmatically calculate 100% accurate summary metrics
    total_params = len(data["parameters"])
    normal_count = sum(1 for p in data["parameters"] if p["status"].lower() == "normal")
    borderline_count = sum(1 for p in data["parameters"] if p["status"].lower() == "borderline")
    
    # Everything else is considered abnormal (High, Low, Abnormal)
    abnormal_count = total_params - normal_count - borderline_count
    
    data["summary"] = {
        "total": total_params,
        "normal": normal_count,
        "abnormal": abnormal_count,
        "borderline": borderline_count
    }
    
    return json.dumps(data)

def process_document_with_ai(file_bytes: bytes, mime_type: str) -> str:
    prompt = """
    Analyze the medical report and return the extracted data EXACTLY in the following plain text format, separated by pipes (|). 
    Do not use markdown formatting, conversational words, or curly braces.
    
    REPORT_INFO
    Name|Date
    
    SUMMARY
    Total|Normal|Abnormal|Borderline
    
    PARAMETERS
    Name|Result|Unit|Range|Status
    
    EXPLANATIONS
    Parameter|Status|Explanation
    """
    
    response = client.models.generate_content(
        model='gemini-3.5-flash-lite',
        contents=[
            prompt,
            types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
        ],
        config=types.GenerateContentConfig(
            temperature=0.1
            # Note: response_schema and response_mime_type have been removed for maximum speed
        )
    )
    
    return parse_raw_text_to_json(response.text)