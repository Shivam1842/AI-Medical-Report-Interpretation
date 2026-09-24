import json
import random
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ai_service import process_document_with_ai
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import OTP, ReportHistory, SessionLocal, User

app = FastAPI(title="ReportMitra Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/send-otp")
def send_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    existing_otp = db.query(OTP).filter(OTP.email == email).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expires_at
    else:
        db.add(OTP(email=email, otp_code=otp_code, expires_at=expires_at))

    db.commit()
    print(f"OTP for {email}: {otp_code}")

    return {"message": "OTP sent successfully", "email": email}


@app.post("/api/auth/verify-otp")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    otp_record = db.query(OTP).filter(OTP.email == email).order_by(OTP.id.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found for this email.")

    if otp_record.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired.")

    return {"message": "OTP verified successfully", "email": email}


@app.post("/api/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="User already exists.")

    new_user = User(
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password),
        is_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email})
    return {"message": "Registration successful", "token": token, "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email}}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = create_access_token({"sub": user.email})
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}


@app.post("/api/analyze")
async def analyze_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="Invalid file format.")

    try:
        file_bytes = await file.read()
        mime_type = file.content_type

        try:
            raw_json_string = process_document_with_ai(file_bytes, mime_type)
        except HTTPException:
            raise
        except Exception as e:
            print(f"AI service error after retries: {e}")
            raise HTTPException(
                status_code=503,
                detail="The AI analysis service is experiencing extremely high volume. Please try again in a moment.",
            ) from e

        extracted_data = json.loads(raw_json_string)

        report_name = extracted_data.get("report_info", {}).get("name", "Unknown Report")
        report_date = extracted_data.get("report_info", {}).get("date", "Unknown Date")

        new_record = ReportHistory(
            report_name=report_name,
            report_date=report_date,
            raw_json_data=raw_json_string,
            user_id=current_user.id,
        )
        db.add(new_record)
        db.commit()

        return extracted_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the report.")


@app.get("/api/reports")
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(ReportHistory).filter(ReportHistory.user_id == current_user.id).order_by(ReportHistory.id.desc()).all()

    return [
        {
            "id": record.id,
            "report_name": record.report_name,
            "report_date": record.report_date,
            "data": json.loads(record.raw_json_data),
        }
        for record in records
    ]


@app.get("/api/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_reports(db, current_user)