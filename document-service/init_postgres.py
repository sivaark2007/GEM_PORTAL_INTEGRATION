"""
Utility script to create the PostgreSQL database (if needed) and initialize all tables.
Usage:
    python init_postgres.py
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "gem_portal")

def create_postgres_database_if_not_exists():
    print(f"Connecting to PostgreSQL server at {DB_HOST}:{DB_PORT} as '{DB_USER}'...")
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{DB_NAME}'")
        exists = cursor.fetchone()
        if not exists:
            print(f"Creating database '{DB_NAME}'...")
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"Database '{DB_NAME}' created successfully!")
        else:
            print(f"Database '{DB_NAME}' already exists.")

        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"PostgreSQL connection error: {e}", file=sys.stderr)
        return False

def init_tables():
    from database import get_session_factory
    from crud import init_database

    print("Initializing tables and seeding initial data...")
    SessionFactory = get_session_factory()
    with SessionFactory() as db:
        init_database(db)
    print("All tables created and seeded successfully!")

if __name__ == "__main__":
    pg_ready = create_postgres_database_if_not_exists()
    if pg_ready:
        init_tables()
    else:
        print("\nNote: PostgreSQL is not currently running or credentials were not accepted.")
        print("Falling back to initializing local SQLite database...")
        init_tables()
