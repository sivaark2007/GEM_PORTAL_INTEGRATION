# =============================================================================
# Document Service — Optimized Multi-Layer Dockerfile
# =============================================================================
# KEY OPTIMIZATION: Dependencies are split into 3 separate cached layers:
#
#   Layer 1 — OS packages     (cached unless apt packages change)
#   Layer 2 — Light packages  (fastapi, sqlalchemy, etc. — installs in ~1 min)
#   Layer 3 — Heavy ML pkgs   (docling, rapidocr, PyTorch — ~20 min FIRST TIME,
#                               then INSTANT from Docker cache on every rebuild)
#
# After the first build, rebuilding only re-runs layers that changed.
# If you only change .py source files → rebuild takes ~5 seconds.
# If you add a light dependency → only Layer 2 re-runs (~1 min).
# If you update docling/rapidocr → only Layer 3 re-runs (~20 min).
# =============================================================================

FROM python:3.11

WORKDIR /app

# ── Layer 1: OS-level system dependencies ─────────────────────────────────────
# libpq-dev   → needed by psycopg2 (PostgreSQL driver)
# libjpeg-dev → needed by Pillow (image processing)
# libglib2.0  → needed by rapidocr
# gcc         → needed to compile some Python C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# ── Layer 2: Light Python packages (~1 min, cached after first build) ─────────
# Copy ONLY the light requirements file first.
# Docker will cache this layer and skip re-installing if the file hasn't changed.
COPY requirements-light.txt .
RUN pip install --no-cache-dir -r requirements-light.txt

# ── Layer 3: Heavy ML packages (~20 min FIRST TIME, then cached) ──────────────
# docling pulls in PyTorch (~2GB) + transformer models.
# rapidocr pulls in onnxruntime + OCR models.
# By keeping this as a separate COPY+RUN, Docker caches this expensive layer.
# As long as requirements-heavy.txt doesn't change, this layer is NEVER re-run.
COPY requirements-heavy.txt .
RUN pip install --no-cache-dir -r requirements-heavy.txt

# ── Source code (changes frequently — always last for best cache usage) ────────
# Copying source AFTER dependencies means code changes don't invalidate
# the expensive dependency layers above.
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Start the document service
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
