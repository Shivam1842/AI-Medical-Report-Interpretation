from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI(title="MedAI Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "message": "MedAI API is actively running",
        "version": "1.0.0"
    }

# This is the new endpoint for file uploads
@app.post("/api/analyze")
async def analyze_report(file: UploadFile = File(...)):
    # 1. We read the basic file information
    filename = file.filename
    content_type = file.content_type
    
    # Simulate a small delay for processing
    time.sleep(2)
    
    # 2. We return this mock JSON so you can test your React frontend today!
    return {
        "report_info": {
            "name": filename,
            "date": "Today"
        },
        "summary": {
            "total": 24,
            "normal": 18,
            "abnormal": 4,
            "borderline": 2
        },
        "parameters": [
            {"name": "Hemoglobin (Hb)", "result": "13.2", "unit": "g/dL", "range": "12.0 - 15.5", "status": "Normal"},
            {"name": "WBC Count", "result": "11,200", "unit": "/µL", "range": "4,000 - 10,000", "status": "High"},
            {"name": "Fasting Blood Sugar", "result": "110", "unit": "mg/dL", "range": "70 - 100", "status": "High"}
        ],
        "ai_explanations": [
            {
                "parameter": "WBC Count",
                "status": "High",
                "explanation": "Your White Blood Cell count is higher than normal. This may indicate an infection, inflammation, or stress. Consult your doctor for confirmation."
            }
        ]
    }