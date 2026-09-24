# ── Stage: Document Service (FastAPI + ML + PostgreSQL) ──────────────────────
# Uses a full Python image because docling, rapidocr, and numpy need
# native build tools (gcc, etc.)
FROM python:3.11

# Set working directory
WORKDIR /app

# Install OS-level dependencies needed by:
#   - psycopg2 (libpq-dev)
#   - Pillow / image processing (libjpeg, libpng, libfreetype)
#   - rapidocr (libglib2.0)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first so Docker can cache this layer
# (only re-installs when requirements.txt changes)
COPY requirements.txt .

# Install all Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the source code
COPY . .

# Expose port 8000 (document-service API port)
EXPOSE 8000

# Start the FastAPI document service with uvicorn
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
