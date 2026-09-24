import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_DOC_SERVICE_URL = process.env.PYTHON_DOC_SERVICE_URL || 'http://127.0.0.1:8000/parse-document';
const MOCK_GOV_API_URL = process.env.MOCK_GOV_API_URL || 'http://127.0.0.1:9000';

type VerificationStatus = 'VALID' | 'NOT_VALID' | 'NOT_FOUND' | 'REVIEW_REQUIRED';

interface RegistryCheckResult {
  source: string;
  endpoint: string;
  identifier: string;
  status: VerificationStatus;
  message: string;
  rawResponse?: any;
}

interface VerificationDocumentInput {
  name: string;
  parsedText?: string;
}

interface CompanyInput {
  name?: string;
  gstin?: string;
  pan?: string;
  udyamNumber?: string;
  cin?: string;
}

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
    mockGovApiUrl: MOCK_GOV_API_URL,
    timestamp: new Date().toISOString()
  });
});

const unique = (values: Array<string | undefined | null>) =>
  Array.from(new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean)));

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const extractIdentifiers = (document: VerificationDocumentInput, company: CompanyInput) => {
  const text = `${document.name || ''}\n${document.parsedText || ''}`;
  const compactText = text.toUpperCase().replace(/\s+/g, ' ');

  return {
    gstin: unique([
      ...(compactText.match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g) || []),
      company.gstin,
    ]),
    pan: unique([
      ...(compactText.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g) || []),
      company.pan,
    ]),
    udyam: unique([
      ...(compactText.match(/\bUDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}\b/g) || []),
      company.udyamNumber,
    ]),
    cin: unique([
      ...(compactText.match(/\b[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}\b/g) || []),
      company.cin,
    ]),
    epfo: unique(compactText.match(/\b[A-Z]{2}[A-Z]{3}[0-9]{7}[0-9A-Z]{0,3}\b/g) || []),
    esic: unique(compactText.match(/\b[0-9]{17}\b/g) || []),
    startupIndia: unique(compactText.match(/\bDIPP[0-9]{4,8}\b|\bDPIIT[0-9]{4,8}\b/g) || []),
    nsic: unique(compactText.match(/\bNSIC[-/A-Z0-9]{5,30}\b/g) || []),
    oem: unique(compactText.match(/\bOEM[-/A-Z0-9]{5,30}\b|\bMAF[-/A-Z0-9]{5,30}\b/g) || []),
    digilocker: unique(compactText.match(/\bDGL[-/A-Z0-9]{5,30}\b|\bDIGILOCKER[-/A-Z0-9]{5,30}\b/g) || []),
    enterpriseName: unique([company.name]),
  };
};

const documentNeedsSource = (documentName: string, parsedText: string | undefined, source: string) => {
  const haystack = `${documentName} ${parsedText || ''}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    GST: ['gst', 'gstin', 'gstr', 'tax'],
    PAN: ['pan', 'income tax', 'tax'],
    UDYAM: ['udyam', 'msme', 'micro', 'small enterprise'],
    MCA: ['mca', 'cin', 'company registration', 'llp'],
    EPFO: ['epfo', 'pf', 'provident fund'],
    ESIC: ['esic', 'insurance'],
    STARTUP_INDIA: ['startup', 'dpiit', 'dipp'],
    NSIC: ['nsic'],
    OEM: ['oem', 'maf', 'manufacturer authorization'],
    DIGILOCKER: ['digilocker'],
    MAKE_IN_INDIA: ['make in india', 'mii', 'local content'],
  };
  return (keywords[source] || []).some(keyword => haystack.includes(keyword));
};

const evaluateRegistryResponse = (source: string, identifier: string, data: any): Pick<RegistryCheckResult, 'status' | 'message'> => {
  if (!data || data.status === 'NOT_FOUND') {
    return { status: 'NOT_FOUND', message: `${source} record not found for ${identifier}.` };
  }

  if (source === 'DEBARMENT') {
    return { status: 'NOT_VALID', message: `Debarment record found for ${identifier}.` };
  }

  const status = String(data.status || data.compliance_status || data.filing_status || '').toUpperCase();
  const invalidTokens = ['INVALID', 'CANCELLED', 'SUSPENDED', 'INACTIVE', 'DEFAULT', 'DEFAULTER', 'EXPIRED'];

  if (invalidTokens.some(token => status.includes(token))) {
    return { status: 'NOT_VALID', message: `${source} returned ${status || 'an invalid status'} for ${identifier}.` };
  }

  return { status: 'VALID', message: `${source} verification passed for ${identifier}.` };
};

const callMockRegistry = async (source: string, endpoint: string, identifier: string): Promise<RegistryCheckResult> => {
  const encodedIdentifier = encodeURIComponent(identifier);
  const path = `${endpoint}/${encodedIdentifier}`;

  try {
    const response = await fetch(`${MOCK_GOV_API_URL}${path}`);
    const data = await response.json();
    const evaluation = evaluateRegistryResponse(source, identifier, data);

    return {
      source,
      endpoint: path,
      identifier,
      ...evaluation,
      rawResponse: data,
    };
  } catch (error: any) {
    return {
      source,
      endpoint: path,
      identifier,
      status: 'REVIEW_REQUIRED',
      message: `Could not reach mock government API for ${source}: ${error?.message || 'request failed'}.`,
    };
  }
};

const verifyDocumentAgainstMockApi = async (document: VerificationDocumentInput, company: CompanyInput) => {
  const identifiers = extractIdentifiers(document, company);
  const documentIdentifiers = extractIdentifiers(document, {});
  const checks: RegistryCheckResult[] = [];
  const addChecks = async (source: string, endpoint: string, values: string[], onlyWhenRelevant = true) => {
    if (onlyWhenRelevant && !documentNeedsSource(document.name, document.parsedText, source)) return;
    for (const value of values.slice(0, 2)) {
      checks.push(await callMockRegistry(source, endpoint, value));
    }
  };

  await addChecks('GST', '/gst', identifiers.gstin, false);
  await addChecks('PAN', '/pan', identifiers.pan, false);
  await addChecks('UDYAM', '/udyam', identifiers.udyam);
  await addChecks('MCA', '/mca', identifiers.cin);
  await addChecks('EPFO', '/epfo', identifiers.epfo);
  await addChecks('ESIC', '/esic', identifiers.esic);
  await addChecks('STARTUP_INDIA', '/startup-india', identifiers.startupIndia);
  await addChecks('NSIC', '/nsic', identifiers.nsic);
  await addChecks('OEM', '/oem', identifiers.oem);
  await addChecks('DIGILOCKER', '/digilocker', identifiers.digilocker);
  await addChecks('MAKE_IN_INDIA', '/make-in-india', identifiers.enterpriseName);

  const registeredIdentifiers: Array<[string, string, string[]]> = [
    ['GSTIN', company.gstin || '', documentIdentifiers.gstin],
    ['PAN', company.pan || '', documentIdentifiers.pan],
    ['Udyam Number', company.udyamNumber || '', documentIdentifiers.udyam],
    ['CIN', company.cin || '', documentIdentifiers.cin],
  ];
  for (const [label, registeredValue, extractedValues] of registeredIdentifiers) {
    for (const extractedValue of extractedValues) {
      const matchesRegisteredCompany = registeredValue.trim().toUpperCase() === extractedValue.trim().toUpperCase();
      checks.push({
        source: 'REGISTERED_BIDDER',
        endpoint: 'local-registered-company',
        identifier: extractedValue,
        status: matchesRegisteredCompany ? 'VALID' : 'NOT_VALID',
        message: matchesRegisteredCompany
          ? `${label} matches the registered bidder company.`
          : `${label} ${extractedValue} does not match the registered bidder company.`,
      });
    }
  }

  if (identifiers.pan.length > 0) {
    checks.push(await callMockRegistry('DEBARMENT', '/debarment', identifiers.pan[0]));
    if (documentNeedsSource(document.name, document.parsedText, 'PAN')) {
      checks.push(await callMockRegistry('INCOME_TAX', '/income-tax', identifiers.pan[0]));
    }
  }

  if (identifiers.gstin.length > 0 && documentNeedsSource(document.name, document.parsedText, 'GST')) {
    checks.push(await callMockRegistry('GST_RETURNS', '/gst-returns', identifiers.gstin[0]));
  }

  if (checks.length === 0) {
    checks.push({
      source: 'DOCUMENT_TEXT',
      endpoint: 'local-extraction',
      identifier: document.name,
      status: 'REVIEW_REQUIRED',
      message: 'No statutory identifier was found in parsed document text.',
    });
  }

  const finalStatus: VerificationStatus =
    checks.some(check => check.status === 'NOT_VALID') ? 'NOT_VALID'
    : checks.some(check => check.status === 'REVIEW_REQUIRED') ? 'REVIEW_REQUIRED'
    : checks.some(check => check.status === 'NOT_FOUND') ? 'NOT_FOUND'
    : 'VALID';

  const validCount = checks.filter(check => check.status === 'VALID').length;

  return {
    documentName: document.name,
    finalStatus,
    extractedIdentifiers: identifiers,
    checks,
    summary:
      finalStatus === 'VALID'
        ? `${validCount} registry check(s) passed.`
        : checks.find(check => check.status !== 'VALID')?.message || 'Document needs review.',
  };
};

app.post('/api/verify-submission-documents', async (req: Request, res: Response): Promise<void> => {
  const { submissionId, company, documents } = req.body || {};

  if (!submissionId || !company || !Array.isArray(documents)) {
    res.status(400).json({
      success: false,
      error: 'submissionId, company and documents are required.',
      code: 'INVALID_VERIFICATION_REQUEST',
    });
    return;
  }

  const results = [];
  for (const document of documents as VerificationDocumentInput[]) {
    results.push(await verifyDocumentAgainstMockApi({
      name: document.name,
      parsedText: normalizeText(document.parsedText || ''),
    }, company));
  }

  const flags = results.flatMap(result =>
    result.checks
      .filter(check => check.status !== 'VALID')
      .map(check => `${result.documentName}: ${check.message}`)
  );
  const invalidCount = results.filter(result => result.finalStatus === 'NOT_VALID').length;
  const reviewCount = results.filter(result => result.finalStatus === 'REVIEW_REQUIRED' || result.finalStatus === 'NOT_FOUND').length;
  const validCount = results.filter(result => result.finalStatus === 'VALID').length;
  const complianceScore = documents.length === 0
    ? 0
    : Math.max(0, Math.round(((validCount + reviewCount * 0.5) / documents.length) * 100));

  res.status(200).json({
    success: true,
    submissionId,
    overallStatus: invalidCount > 0 ? 'Disqualified' : reviewCount > 0 ? 'Under Review' : 'Verified',
    complianceScore,
    flags,
    documents: results,
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
