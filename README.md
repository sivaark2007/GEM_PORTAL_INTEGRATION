# GeM Portal Integration

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
                                                    -> Docling
                                                    -> RapidOCR fallback
```

- The frontend sends uploads to `POST /api/parse-document`.
- The Express server forwards each file to the Python service at
  `http://127.0.0.1:8000/parse-document`.
- Docling is tried first for structured text, headings, tables, and metadata.
- For scanned documents, or if Docling cannot process a file, RapidOCR is used
  when available. A basic text fallback is used if neither parser can process it.

The supported file types are PDF, PNG, JPG/JPEG, TIFF, WEBP, BMP, DOCX, and TXT.
The current maximum upload size is 25 MB.

## Environment variables

- `GEMINI_API_KEY` — add this to `.env.local` if the Gemini-powered features are used.
- `PORT` — optional Express server port; defaults to `5000`.
- `PYTHON_DOC_SERVICE_URL` — optional Python parse endpoint; defaults to
  `http://127.0.0.1:8000/parse-document`.

## Troubleshooting

- If the frontend reports `PYTHON_SERVICE_UNAVAILABLE`, start `document-service/main.py`
  and ensure it is listening on port `8000`.
- If `rapidocr` fails to install, update `pip` with `python -m pip install --upgrade pip`,
  then rerun `pip install -r requirements.txt`.
- Run `npm run lint` to check the TypeScript code before committing changes.
