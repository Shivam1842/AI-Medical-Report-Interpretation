import json
import logging

from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from ai_service import process_document_with_ai
from database import ReportHistory, SessionLocal


# ==========================================
# 1. APPLICATION SETUP
# ==========================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ReportMitra Core Engine",
    version="2.0.0"
)


# ==========================================
# 2. CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-domain.vercel.app",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ==========================================
# 3. CONSTANTS
# ==========================================

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_FILES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


# ==========================================
# 4. DATABASE CONNECTION
# ==========================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==========================================
# 5. ROOT HEALTH CHECK
# ==========================================

@app.get("/")
def root():
    return {
        "message": "ReportMitra API is running",
        "status": "online"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ==========================================
# 6. MEDICAL REPORT ANALYSIS
# ==========================================

@app.post("/api/analyze")
async def analyze_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    filename = file.filename.lower()
    extension = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""

    if extension not in ALLOWED_FILES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, JPG, JPEG and PNG files are allowed."
        )

    # Check MIME type
    expected_mime = ALLOWED_FILES[extension]

    if file.content_type != expected_mime:
        raise HTTPException(
            status_code=400,
            detail="File type does not match its extension."
        )

    try:

        # ==================================
        # READ FILE
        # ==================================

        file_bytes = await file.read(MAX_FILE_SIZE + 1)

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File size must be less than 10 MB."
            )

        mime_type = expected_mime

        # ==================================
        # GEMINI AI PROCESSING
        # ==================================

        try:

            logger.info(
                "Starting medical report analysis."
            )

            raw_json_string = process_document_with_ai(
                file_bytes=file_bytes,
                mime_type=mime_type
            )

            extracted_data = json.loads(raw_json_string)

            logger.info(
                "Medical report analysis completed."
            )

        except HTTPException:
            raise

        except Exception as e:

            logger.exception(
                "AI service processing failed."
            )

            raise HTTPException(
                status_code=503,
                detail=(
                    "Medical report analysis is temporarily "
                    "unavailable. Please try again later."
                )
            ) from e

        # ==================================
        # EXTRACT REPORT INFORMATION
        # ==================================

        report_info = extracted_data.get(
            "report_info", {}
        )

        report_name = report_info.get(
            "name", "Unknown Report"
        )

        report_date = report_info.get(
            "date", "Unknown Date"
        )

        # ==================================
        # SAVE TO DATABASE
        # ==================================

        try:

            new_record = ReportHistory(
                report_name=report_name,
                report_date=report_date,
                raw_json_data=raw_json_string,
                user_id=None,
            )

            db.add(new_record)
            db.commit()
            db.refresh(new_record)

            logger.info(
                "Report saved successfully. ID: %s",
                new_record.id
            )

        except Exception as e:

            db.rollback()

            logger.exception(
                "Database save failed."
            )

            raise HTTPException(
                status_code=500,
                detail="Failed to save report history."
            ) from e

        # ==================================
        # RETURN RESPONSE
        # ==================================

        return extracted_data

    except HTTPException:
        raise

    except Exception as e:

        logger.exception(
            "Unexpected report processing error."
        )

        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred."
        ) from e

    finally:
        await file.close()


# ==========================================
# 7. GET ALL REPORTS
# ==========================================

@app.get("/api/reports")
def get_reports(
    db: Session = Depends(get_db)
):

    try:

        records = (
            db.query(ReportHistory)
            .order_by(ReportHistory.id.desc())
            .all()
        )

        return [
            {
                "id": record.id,
                "report_name": record.report_name,
                "report_date": record.report_date,
                "data": json.loads(
                    record.raw_json_data
                ),
            }
            for record in records
        ]

    except Exception as e:

        logger.exception(
            "Failed to retrieve reports."
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve report history."
        ) from e


# ==========================================
# 8. GET REPORT HISTORY
# ==========================================

@app.get("/api/history")
def get_history(
    db: Session = Depends(get_db)
):
    return get_reports(db)