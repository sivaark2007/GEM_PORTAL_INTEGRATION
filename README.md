# 🏛️ GeM Portal Integration - AI-Powered Tender Compliance & Verification System

Welcome to the **GeM (Government e-Marketplace) Portal Integration**! This enterprise platform enables **Procurement Officers** to create and parse tenders with automated compliance extraction, and allows **Bidders** to upload certificates, verify statutory credentials via mock government registries, and run a comprehensive 4-stage AI compliance engine.

---

## ⚡ Quick Service Reference & Ports

| Service | Port / URL | Description | Tech Stack |
|---|---|---|---|
| **Frontend UI** | [http://localhost:3000](http://localhost:3000) | Interactive React + Vite Client | React 19, TypeScript, Tailwind CSS, Lucide |
| **Express API Gateway** | [http://localhost:5000](http://localhost:5000) | Document uploads & backend orchestration | Node.js, Express, TSX |
| **Python Document Service** | [http://localhost:8000/docs](http://localhost:8000/docs) | Fast document extraction, OCR, DB & compliance API | FastAPI, PyPDF, RapidOCR, SQLAlchemy, SQLite/PostgreSQL |
| **Mock Government API** | [http://localhost:9000/docs](http://localhost:9000/docs) | Synthetic PAN, GST, Udyam, DigiLocker verification | FastAPI, Uvicorn |

---

## 📋 Prerequisites

Before starting, ensure your system has the following installed:

1. **Node.js**: `v20.x` or higher (Recommended: LTS) & `npm`
2. **Python**: `3.10` or higher & `pip`
3. **Git**
4. *(Optional)* **PostgreSQL** (The application defaults to automatic **SQLite** (`gem_portal.db`) if PostgreSQL is not active, ensuring zero-friction setup!)

---

## 🚀 Step-by-Step Installation & Setup

### 1️⃣ Clone & Configure Environment

1. Navigate to the project root directory:
   ```bash
   cd GEM_INTEGRATION
   ```

2. Create `.env` file by copying `.env.example`:
   - **Windows (PowerShell/CMD):**
     ```powershell
     copy .env.example .env
     ```
   - **macOS / Linux:**
     ```bash
     cp .env.example .env
     ```

3. Open `.env` and set your **Gemini API Key**:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   PYTHON_DOC_SERVICE_URL=http://127.0.0.1:8000/parse-document
   ```

---

### 2️⃣ Install Node.js Dependencies

In the root directory, install the required packages for the frontend and Express backend:

```powershell
npm install
```

---

### 3️⃣ Setup Python Document Service (Port 8000)

1. Open a new terminal and navigate to the `document-service` directory:
   ```powershell
   cd document-service
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
     *(If script execution is disabled on PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*
   - **Windows (CMD):**
     ```cmd
     python -m venv .venv
     .venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install the dependencies:
   ```powershell
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

### 4️⃣ Setup Mock Government API (Port 9000)

1. Open another terminal and navigate to `MOCK-API-main`:
   ```powershell
   cd MOCK-API-main
   ```

2. *(Optional)* Create or reuse a virtual environment and install requirements:
   ```powershell
   pip install -r requirements.txt
   ```

---

## 🏃 Running the Application

To run the full stack, open **4 separate terminal windows** (or tabs) and launch each service:

### 🟢 Terminal 1: Python Document & Compliance Service (Port 8000)
```powershell
cd document-service
.\.venv\Scripts\Activate.ps1   # (or source .venv/bin/activate on Mac/Linux)
python main.py
```
> *API interactive Swagger docs will be live at `http://localhost:8000/docs`*

### 🟡 Terminal 2: Mock Government Verification API (Port 9000)
```powershell
cd MOCK-API-main
uvicorn main:app --host 127.0.0.1 --port 9000 --reload
```
> *Swagger docs will be live at `http://localhost:9000/docs`*

### 🔵 Terminal 3: Express Backend Gateway (Port 5000)
```powershell
# From root directory
npm run server
```

### 🟣 Terminal 4: Frontend Web App (Port 3000)
```powershell
# From root directory
npm run dev
```

---

## 🌐 Accessing the Application

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

From the home interface, you can explore:
- **Procurement Officer Portal**: Create tenders, upload tender notices (PDF/Images), run AI extraction for technical and financial parameters.
- **Bidder Portal**: Select a registered company, upload and view statutory certificates (Aadhaar, PAN, GST, Udyam, Make in India, Turnover proofs), and run the **4-Stage Compliance Engine** with real-time discrepancy highlighting.
- **Mock Document Cloud Hub**: Preloaded high-fidelity mock tender compliance sets for rapid testing and demonstrations.

---

## 🗄️ Database Options (SQLite vs PostgreSQL)

- **Default (Zero-Config)**: The application starts seamlessly using a local SQLite database (`gem_portal.db`) in `document-service/`. No database server installation is needed!
- **PostgreSQL (Optional)**: If you want to connect to a live PostgreSQL instance, simply configure `DATABASE_URL` in `document-service/.env`:
  ```env
  DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/gem_portal
  ```
  Then run:
  ```powershell
  cd document-service
  python init_postgres.py
  ```

---

## 🛠️ Troubleshooting & FAQ

| Issue | Solution |
|---|---|
| **Python service unavailable on upload** | Ensure Terminal 1 (`document-service/main.py`) is running on port 8000. Test with `curl http://127.0.0.1:8000/health`. |
| **PowerShell execution policy error** | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in PowerShell before activating `.venv`. |
| **Gemini API Error** | Verify that `GEMINI_API_KEY` is correctly defined in `.env` in the root folder. |
| **Port already in use** | Kill processes occupying ports 3000, 5000, 8000, or 9000 using Task Manager or `netstat -ano \| findstr :<PORT>`. |

---

## 💡 Tech Stack Summary
- **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS v4, Motion (Framer), Lucide Icons
- **Backend**: Express 4, TSX, Multer, Axios, CORS
- **AI & Document Processing**: Google Gemini Flash, PyPDF, RapidOCR, Docling, SQLAlchemy
- **Mock Verification**: FastAPI, Uvicorn, Synthetic Statutory Registries (PAN, GSTIN, Udyam, DigiLocker, Land Border declarations)
