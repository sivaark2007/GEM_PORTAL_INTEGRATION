"""
Database connection and session management for GeM Portal Integration.
Supports PostgreSQL with automatic schema creation and fallback to SQLite if PostgreSQL is not reachable.
"""

import os
import logging
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import declarative_base, sessionmaker, Session

load_dotenv()

logger = logging.getLogger("document-service.database")

# Build PostgreSQL connection URL from environment variables
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "gem_portal")

DEFAULT_PG_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_PG_URL)

Base = declarative_base()

# Attempt connection to PostgreSQL, with graceful fallback
active_db_type = "unknown"
engine = None

def get_engine():
    global engine, active_db_type
    if engine is not None:
        return engine

    # First attempt: Primary DATABASE_URL (PostgreSQL)
    try:
        logger.info(f"Attempting to connect to PostgreSQL at {DB_HOST}:{DB_PORT}/{DB_NAME}...")
        test_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"connect_timeout": 3} if "postgresql" in DATABASE_URL else {}
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL database!")
        engine = test_engine
        active_db_type = "postgresql"
        return engine
    except Exception as pg_err:
        logger.warning(
            f"Could not connect to PostgreSQL ({pg_err}). "
            "Falling back to local SQLite database 'gem_portal.db' so the service continues running smoothly. "
            "To use PostgreSQL, ensure PostgreSQL is running and credentials in .env are correct."
        )
        fallback_url = "sqlite:///./gem_portal.db"
        engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
        active_db_type = "sqlite_fallback"
        return engine

def get_session_factory():
    current_engine = get_engine()
    return sessionmaker(autocommit=False, autoflush=False, bind=current_engine)

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency to yield database session."""
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_status() -> dict:
    """Returns information about active database connection."""
    current_engine = get_engine()
    return {
        "active_db_type": active_db_type,
        "database_url": str(current_engine.url).split("@")[-1] if "@" in str(current_engine.url) else str(current_engine.url),
        "is_postgres": active_db_type == "postgresql",
        "configured_postgres_host": f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
    }
