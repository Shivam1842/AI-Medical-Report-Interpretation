from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from ai_service import process_document_with_ai

app = FastAPI(title="MedAI Core Engine")

# Allow your React app to communicate with this server
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

@app.post("/api/analyze")
async def analyze_report(file: UploadFile = File(...)):
    # 1. Validate the file type
    if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a PDF or Image.")
    
    try:
        # 2. Read the uploaded file into memory
        file_bytes = await file.read()
        mime_type = file.content_type
        
        # 3. Send the file directly to Gemini AI
        raw_json_string = process_document_with_ai(file_bytes, mime_type)
        
        # 4. Convert the AI's string response into a Python dictionary
        extracted_data = json.loads(raw_json_string)
        
        # 5. Return the real data to the React frontend
        return extracted_data
        
    except Exception as e:
        print(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the report with AI.")