import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# MySQL Database connection URL (SQLAlchemy)
# Example: mysql+pymysql://user:password@localhost:3306/it_helpdesk_db
MYSQL_USER = os.getenv("MYSQL_USER", "helpdesk_user")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "helpdesk_secret_2026")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "it_helpdesk_db")

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency injects a database session per request and ensures cleanup"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
