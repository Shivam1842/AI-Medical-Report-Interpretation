from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import json
from sqlalchemy.orm import Session
from ai_service import process_document_with_ai
from database import SessionLocal, ReportHistory

app = FastAPI(title="MedAI Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-medical-report-interpretation.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/analyze")
async def analyze_report(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="Invalid file format.")
    
    try:
        file_bytes = await file.read()
        mime_type = file.content_type
        
        # Run your optimized AI extraction
        raw_json_string = process_document_with_ai(file_bytes, mime_type)
        extracted_data = json.loads(raw_json_string)
        
        report_name = extracted_data.get("report_info", {}).get("name", "Unknown Report")
        report_date = extracted_data.get("report_info", {}).get("date", "Unknown Date")
        
        # Save the analysis into SQLite
        new_record = ReportHistory(
            report_name=report_name,
            report_date=report_date,
            raw_json_data=raw_json_string
        )
        db.add(new_record)
        db.commit()
        
        return extracted_data
        
    except Exception as e:
        print(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the report.")

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(ReportHistory).order_by(ReportHistory.id.desc()).all()
    
    return [
        {
            "id": record.id,
            "report_name": record.report_name,
            "report_date": record.report_date,
            "data": json.loads(record.raw_json_data)
        }
        for record in records
    ]