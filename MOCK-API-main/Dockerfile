# ── Stage: Mock Government Verification API ──────────────────────────────────
# Lightweight Python image for the FastAPI mock API server.
# No heavy ML libraries needed here — only FastAPI + uvicorn.
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install only the required packages (no requirements.txt in this service,
# so we install directly)
RUN pip install --no-cache-dir fastapi uvicorn

# Copy all source files into the container
COPY . .

# Expose port 9000 (the mock API port)
EXPOSE 9000

# Start the FastAPI app with uvicorn
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
