# GeM Portal Integration

## 🐳 Quick Start with Docker (Recommended)

> **No Python or Node.js needed** — just Docker Desktop!

### 1. Install Docker Desktop
Download from 👉 https://www.docker.com/products/docker-desktop/ and start it.

### 2. Set up environment
```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```
Open `.env` and set your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```
Get a free key at 👉 https://aistudio.google.com/app/apikey

### 3. Start everything
```bash
docker compose up --build
```
First run takes ~5–10 minutes (downloads images). Next runs take ~30 seconds.

### 4. Open the app
```
http://localhost:5000
```

### 5. Stop
```bash
docker compose down
```

---

## Service Ports

| Service | URL |
|---|---|
| Main App (React + Express) | http://localhost:5000 |
| Document Service API docs | http://localhost:8000/docs |
| Mock Government API docs | http://localhost:9000/docs |

---

## Manual Setup (without Docker)

This project contains a React/Vite frontend, an Express API server, and a Python
document-processing service. The document service extracts structured content
with **Docling** and uses **RapidOCR** as a fallback for scanned PDFs and images.

## Prerequisites

- Node.js 20 or newer
- Python 3.10 or newer
- `pip`

## Install dependencies

Install the frontend and Express server dependencies from the repository root:

```powershell
npm install
```

Create and activate a Python virtual environment, then install the document
service dependencies:

```powershell
cd document-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

On macOS/Linux, activate the environment with:

```bash
source document-service/.venv/bin/activate
```

## Run the application locally

Use three terminals from the repository root.

1. Start the Python Docling/OCR service on port `8000`:

   ```powershell
   cd document-service
   .\.venv\Scripts\Activate.ps1
   python main.py
   ```

   Check that it is available at `http://127.0.0.1:8000/health`.

2. Start the Express API server on port `5000`:

   ```powershell
   npm run server
   ```

3. Start the Vite frontend on port `3000`:

   ```powershell
   npm run dev
   ```

Open the URL displayed by Vite, normally `http://localhost:3000`.

## Document parsing flow

```text
Browser -> Vite frontend -> Express server (:5000) -> Python service (:8000)
                                                    -> PyPDF (digital PDFs)
                                                    -> RapidOCR (scans/images)
                                                    -> Docling (optional detailed layout)
```

- The frontend sends uploads to `POST /api/parse-document`.
- The Express server forwards each file to the Python service at
  `http://127.0.0.1:8000/parse-document`.
- Digital PDFs use fast embedded-text extraction by default.
- Scanned documents and images use RapidOCR when available.
- Docling is available for detailed layout/table extraction, but is disabled for
  normal uploads because its CPU model can make even small files slow.

For tender documents uploaded by a Procurement Officer, the extracted result is
stored with the tender as `gemBiddingDocument.parsedData` and shown in the
Officer Dashboard. This is the handoff data for the LLM requirement-extraction
stage and the later embedding/RAG workflow; those AI stages do not run inside
the upload handler.

The supported file types are PDF, PNG, JPG/JPEG, TIFF, WEBP, BMP, DOCX, and TXT.
The current maximum upload size is 25 MB.

## Environment variables

- `GEMINI_API_KEY` — add this to `.env.local` if the Gemini-powered features are used.
- `PORT` — optional Express server port; defaults to `5000`.
- `PYTHON_DOC_SERVICE_URL` — optional Python parse endpoint; defaults to
  `http://127.0.0.1:8000/parse-document`.
- `DOCLING_TABLES_ENABLED` — set to `true` only when table-cell extraction is
  required. It defaults to `false` to keep normal document parsing responsive.
- `DOCLING_DIGITAL_ENABLED` — set to `true` to use Docling's detailed visual
  layout pipeline for digital PDFs. It defaults to `false`; the fast PyPDF path
  is recommended for normal uploads.

## PostgreSQL Database Setup

The backend uses PostgreSQL via **SQLAlchemy** and **psycopg2** to store Bidders, Tenders, and Bids (including certificates and Docling OCR parsed data).

### Database Configuration & Environment Variables

Create `document-service/.env` (or copy from `document-service/.env.example`):

```bash
# PostgreSQL Database Settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gem_portal
DB_USER=postgres
DB_PASSWORD=postgres

# Alternatively, set full connection string:
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/gem_portal
```

> **Note:** If PostgreSQL is not currently running locally, the service automatically uses a local SQLite fallback (`gem_portal.db`) so development continues without disruption.

### Initialize PostgreSQL Database & Seed Tables

Run the database setup script to create the database and initialize tables:

```powershell
cd document-service
python init_postgres.py
cd ..
```

### Database Tables & Stored Data

- **`bidders`**: Bidder company profiles (`id`, `name`, `email`, `contact_number`, `gstin`, `pan`, `udyam_number`, `cin`, `city`, `sector`, `registered_date`).
- **`tenders`**: Government published tenders (`tender_number`, `title`, `organization`, `ministry`, `estimated_value`, `closing_date`, `requirements` JSON, and `gem_bidding_document` with Docling parsed data).
- **`bid_submissions`**: Bidder tender submissions (`tender_id`, `company_id`, `status`, `compliance_score`, `ai_verification_stage`, `flags`).
- **`bid_documents`**: Bidder certificates and documents (`name`, `type`, `file_size`, `verified`, `file_content_url`, `parsed_data` from OCR/Docling).

### Database Endpoints (FastAPI on Port 8000)

- `GET /health` & `GET /api/db/status` — Database connection status and health check.
- `GET /api/bidders` & `POST /api/bidders` — Fetch and register bidders.
- `GET /api/tenders` & `POST /api/tenders` — Fetch and create Government tenders.
- `POST /api/tenders/document` — Attach parsed GeM bidding specification to a tender.
- `GET /api/bids` & `POST /api/bids` — Fetch and submit bids with certificates and parsed data.
- `POST /api/bids/{bid_id}/verify` — Update verification status, score, and flags.
- `POST /parse-document` — Docling and RapidOCR document parsing endpoint.

## Troubleshooting

- If the frontend reports `PYTHON_SERVICE_UNAVAILABLE`, start `document-service/main.py`
  and ensure it is listening on port `8000`.
- If `rapidocr` fails to install, update `pip` with `python -m pip install --upgrade pip`,
  then rerun `pip install -r requirements.txt`.
- Run `npm run lint` to check the TypeScript code before committing changes.
