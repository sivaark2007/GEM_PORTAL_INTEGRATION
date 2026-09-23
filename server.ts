import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_DOC_SERVICE_URL = process.env.PYTHON_DOC_SERVICE_URL || 'http://127.0.0.1:8000/parse-document';

// Security and CORS
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Multer memory storage configuration (Max 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const isAllowedExt = /\.(pdf|png|jpg|jpeg|tiff|webp|docx|txt)$/i.test(file.originalname);
    if (allowedMime.includes(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format. Supported: PDF, Images (PNG/JPG/TIFF/WEBP), DOCX, TXT.`));
    }
  }
});

// Health check endpoint
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    backend: 'GeM Portal Express Backend',
    docServiceUrl: PYTHON_DOC_SERVICE_URL,
    timestamp: new Date().toISOString()
  });
});

// Document parsing endpoint: POST /parse-document & POST /api/parse-document
const handleParseDocument = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: 'No document file provided in request.',
      code: 'NO_FILE'
    });
    return;
  }

  try {
    console.log(`[Express Backend] Received document: '${file.originalname}' (${(file.size / 1024).toFixed(1)} KB)`);

    // Prepare multipart form data using native Node 18+ FormData and Blob
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'application/pdf' });
    formData.append('file', blob, file.originalname);

    console.log(`[Express Backend] Forwarding to Python Document Service (${PYTHON_DOC_SERVICE_URL})...`);

    const response = await fetch(PYTHON_DOC_SERVICE_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn(`[Express Backend] Python service returned HTTP ${response.status}:`, data);
      res.status(response.status).json(data);
      return;
    }

    console.log(`[Express Backend] Successfully parsed '${file.originalname}' (OCR used: ${data?.metadata?.ocr_used})`);
    res.status(200).json(data);
  } catch (error: any) {
    console.error(`[Express Backend] Error forwarding document to Python service:`, error?.message || error);
    
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('fetch failed')) {
      res.status(503).json({
        success: false,
        error: `Python document service is unavailable at ${PYTHON_DOC_SERVICE_URL}. Ensure 'document-service/main.py' is running on port 8000.`,
        code: 'PYTHON_SERVICE_UNAVAILABLE'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: `Internal server error during document parsing: ${error?.message || 'Unknown error'}`,
      code: 'SERVER_ERROR'
    });
  }
};

app.post('/parse-document', upload.single('file'), handleParseDocument);
app.post('/api/parse-document', upload.single('file'), handleParseDocument);

// Global error handler for multer / uploads
app.use((err: any, _req: Request, res: Response, _next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: 'File size exceeds maximum limit of 25MB.',
        code: 'FILE_TOO_LARGE'
      });
      return;
    }
  }
  res.status(400).json({
    success: false,
    error: err?.message || 'Invalid request or upload error.',
    code: 'UPLOAD_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GeM Express Backend Server listening on http://localhost:${PORT}`);
  console.log(`   Document Parser endpoint: POST http://localhost:${PORT}/api/parse-document`);
});
