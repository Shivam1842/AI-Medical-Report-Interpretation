from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import sessionmaker, declarative_base

# Creates a local database file named medai_history.db in your backend folder
DATABASE_URL = "sqlite:///./medai_history.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    report_name = Column(String, index=True)
    report_date = Column(String)
    raw_json_data = Column(Text) # Stores the full AI output as a JSON string

# Instantly creates the table when the backend starts
Base.metadata.create_all(bind=engine)