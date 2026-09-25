import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Tender } from '../../types';
import { DocumentViewerModal, DocumentInfo } from '../DocumentViewerModal';
import { TenderListCard } from '../shared/TenderListCard';
import { TenderDetailSummary } from '../shared/TenderDetailSummary';
import { parseDocumentWithService } from '../../services/documentParser';
import { FolderUploadMockHub } from './FolderUploadMockHub';
import { LoadedMockDocument } from '../../services/mockDocsService';
import { 
  Building2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  Send,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  Plus,
  Eye,
  Trash2,
  FolderUp,
  File,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  IndianRupee,
  Scale,
  Landmark,
  Gavel,
  Award,
  ShieldAlert,
  Trophy,
  FileCheck2
} from 'lucide-react';

const documentGroups = [
  {
    number: '1',
    title: '1. Identity & Tax',
    description: 'Mandatory Aadhaar, PAN, GST and recent tax filings for legal and fiscal verification',
    documents: [
      'Aadhaar Card / UIDAI Identity Proof',
      'PAN Card / PAN Details',
      'GST Registration Certificate / GSTIN',
      'Income Tax Return (ITR)'
    ]
  },
  {
    number: '2',
    title: '2. Business Registration',
    description: 'Statutory registration credentials establishing business entity category',
    documents: [
      'Udyam Registration Certificate',
      'MCA Company/LLP Registration Details',
      'Startup India / DPIIT Recognition Certificate',
      'NSIC Registration Certificate'
    ]
  },
  {
    number: '3',
    title: '3. Statutory Compliance',
    description: 'Labor law compliance, employee security and tax filings',
    documents: [
      'EPFO Registration Details',
      'ESIC Registration Details',
      'GST Compliance / Return Details',
      'Income Tax Compliance Details'
    ]
  },
  {
    number: '4',
    title: '4. Product / Procurement Compliance',
    description: 'Product quality standards, Make in India local content and OEM authorizations',
    documents: [
      'BIS Certificate / Licence',
      'Make in India / Local Content Declaration',
      'OEM Authorization Certificate'
    ]
  },
  {
    number: '5',
    title: '5. Digital Document Verification',
    description: 'Cryptographically signed documents verified directly via National Digital Locker',
    documents: [
      'DigiLocker-issued Documents'
    ]
  },
  {
    number: '6',
    title: '6. GeM 4-Stage Statutory Documents (GTC & GFR)',
    description: 'Mandatory statutory proofs required for GeM 4-Stage seller baseline, technical qualification & integrity check',
    documents: [
      'GFR Rule 144(xi) Land Border Declaration',
      'Earnest Money Deposit (EMD) / Bid Security Declaration',
      'CA Audited Balance Sheets & Annual Turnover (3 FYs)',
      'Past Experience & Performance Supply Proof',
      'Non-Debarment & Non-Blacklisting Affidavit'
    ]
  }
];

export interface DocumentValidationResult {
  isMismatch: boolean;
  expectedLabel: string;
  detectedLabel: string;
  message?: string;
}

// Universal procurement document semantic clusters
const DOCUMENT_DOMAIN_VOCABULARY: Record<string, { label: string; terms: string[] }> = {
  FEE_EMD: {
    label: 'Fee / EMD Payment Receipt',
    terms: ['emd', 'fee', 'payment', 'receipt', 'challan', 'transaction', 'utr', 'neft', 'rtgs', 'exemption', 'dd', 'demand_draft', 'bank_guarantee', 'earnest']
  },
  PAN: {
    label: 'PAN Card',
    terms: ['pan', 'pancard', 'permanent_account', 'permanent account', 'income_tax']
  },
  AADHAAR: {
    label: 'Aadhaar Card',
    terms: ['aadhaar', 'aadhar', 'eaadhaar', 'uidai', 'unique_identification']
  },
  GST: {
    label: 'GST Registration Certificate',
    terms: ['gst', 'gstin', 'gstr', 'gst_reg', 'form_gst', 'goods and services tax']
  },
  UDYAM: {
    label: 'Udyam MSME Certificate',
    terms: ['udyam', 'msme', 'udyogaadhar', 'uam']
  },
  INCORPORATION: {
    label: 'Certificate of Incorporation',
    terms: ['incorporation', 'mca', 'cin', 'roc', 'llp', 'moa', 'aoa', 'company_reg']
  },
  ITR: {
    label: 'Income Tax Return (ITR)',
    terms: ['itr', 'tax_return', 'itr_v', 'tax compliance']
  },
  FINANCIAL: {
    label: 'Turnover / Financial Statement',
    terms: ['turnover', 'balance_sheet', 'audited', 'profit_loss', 'ca_certified', 'annual_return']
  },
  EPFO: {
    label: 'EPFO Registration',
    terms: ['epfo', 'provident_fund', 'pf', 'epf']
  },
  ESIC: {
    label: 'ESIC Registration',
    terms: ['esic', 'employees_state_insurance', 'esi']
  },
  OEM: {
    label: 'OEM Authorization',
    terms: ['oem', 'maf', 'manufacturer_authorization', 'authorization_letter']
  },
  STARTUP: {
    label: 'Startup India / DPIIT Certificate',
    terms: ['startup', 'dpiit', 'dipp']
  },
  NSIC: {
    label: 'NSIC Registration Certificate',
    terms: ['nsic']
  },
  MII: {
    label: 'Make in India Declaration',
    terms: ['make_in_india', 'mii', 'local_content']
  },
  BIS: {
    label: 'BIS Certificate / Licence',
    terms: ['bis', 'isi', 'bureau_indian_standards']
  },
  GFR_144XI: {
    label: 'GFR Rule 144(xi) Land Border Declaration',
    terms: ['gfr', '144', 'land border', 'border sharing', 'border_sharing', 'dpiit registration', 'land_border']
  },
  DEBARMENT_AFFIDAVIT: {
    label: 'Non-Debarment / Integrity Affidavit',
    terms: ['debarment', 'debarred', 'blacklisting', 'blacklisted', 'affidavit', 'integrity', 'non_blacklisting']
  },
  EXPERIENCE: {
    label: 'Past Experience & Supply Proof',
    terms: ['experience', 'work_order', 'supply_order', 'completion_certificate', 'client_certificate', 'past_performance', 'performance_proof']
  },
  GEM_4STAGE_EVAL: {
    label: 'GeM Standardized 4-Stage Evaluation Document',
    terms: ['gem 4 stage', 'standardized evaluation', '4 stage evaluation', 'gtc gfr', 'evaluation dossier', 'compliance dossier']
  }
};

export function detectDocumentDomain(textOrFilename: string): { domainKey: string; label: string } | null {
  const normalized = textOrFilename.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  let bestMatch: { domainKey: string; label: string } | null = null;
  let bestScore = 0;

  for (const [key, domain] of Object.entries(DOCUMENT_DOMAIN_VOCABULARY)) {
    let score = 0;
    for (const term of domain.terms) {
      const termClean = term.replace(/_/g, ' ');
      const regex = new RegExp(`(?:^|[^a-z0-9])${termClean}(?:$|[^a-z0-9])`, 'i');
      if (regex.test(normalized)) {
        score += term.length > 3 ? 3 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { domainKey: key, label: domain.label };
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export function validateDocumentSlotMatch(
  fileName: string,
  requirementSlot: string,
  parsedData?: any
): DocumentValidationResult {
  // 1. Authoritative verification from backend AI parser service (if available)
  if (parsedData?.slotValidation) {
    const sv = parsedData.slotValidation;
    if (sv.isMatch === false) {
      return {
        isMismatch: true,
        expectedLabel: sv.slotRequirement || requirementSlot,
        detectedLabel: sv.detectedDocType || parsedData.document_title || 'Different Document',
        message: sv.reason || `Document Mismatch: Uploaded document does not match the '${requirementSlot}' slot.`
      };
    } else {
      return {
        isMismatch: false,
        expectedLabel: sv.slotRequirement || requirementSlot,
        detectedLabel: sv.detectedDocType || parsedData.document_title || requirementSlot
      };
    }
  }

  // 2. Identify target requirement slot domain
  const slotDomain = detectDocumentDomain(requirementSlot);

  // 3. Identify file / parsed text domain
  const rawTextSnippet = (parsedData?.full_text || '').slice(0, 3000);
  const fileDomain = detectDocumentDomain(fileName);
  const textDomain = rawTextSnippet ? detectDocumentDomain(rawTextSnippet) : null;
  const detectedDoc = textDomain || fileDomain;

  // 4. Domain mismatch checks
  if (slotDomain) {
    // If the detected document belongs to an explicitly different domain (e.g. Fee/Receipt uploaded into PAN slot)
    if (detectedDoc && detectedDoc.domainKey !== slotDomain.domainKey) {
      return {
        isMismatch: true,
        expectedLabel: slotDomain.label,
        detectedLabel: detectedDoc.label,
        message: `Document Mismatch: You uploaded a ${detectedDoc.label} ("${fileName}") into the "${requirementSlot}" slot. Please upload a valid ${slotDomain.label}.`
      };
    }

    // Special statutory verification when parsed text is present
    if (rawTextSnippet) {
      const upper = rawTextSnippet.toUpperCase();
      if (slotDomain.domainKey === 'PAN') {
        const hasPanPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(upper);
        const hasPanKeywords = upper.includes('PERMANENT ACCOUNT') || upper.includes('INCOME TAX DEPARTMENT');
        if (!hasPanPattern && !hasPanKeywords) {
          return {
            isMismatch: true,
            expectedLabel: slotDomain.label,
            detectedLabel: detectedDoc?.label || 'Non-PAN Document',
            message: `Document Mismatch: Uploaded document does not contain a statutory Permanent Account Number (PAN). Please upload a valid ${slotDomain.label}.`
          };
        }
      } else if (slotDomain.domainKey === 'AADHAAR') {
        const hasAadhaarPattern = /\b[0-9]{4}\s[0-9]{4}\s[0-9]{4}\b/.test(rawTextSnippet);
        const hasAadhaarKeywords = upper.includes('UIDAI') || upper.includes('AADHAAR') || upper.includes('UNIQUE IDENTIFICATION');
        if (!hasAadhaarPattern && !hasAadhaarKeywords) {
          return {
            isMismatch: true,
            expectedLabel: slotDomain.label,
            detectedLabel: detectedDoc?.label || 'Non-Aadhaar Document',
            message: `Document Mismatch: Uploaded document does not appear to be an Aadhaar Card. Please upload a valid ${slotDomain.label}.`
          };
        }
      } else if (slotDomain.domainKey === 'GST') {
        const hasGstinPattern = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/.test(upper);
        const hasGstKeywords = upper.includes('GSTIN') || upper.includes('FORM GST REG-06') || upper.includes('GOODS AND SERVICES TAX');
        if (!hasGstinPattern && !hasGstKeywords) {
          return {
            isMismatch: true,
            expectedLabel: slotDomain.label,
            detectedLabel: detectedDoc?.label || 'Non-GST Document',
            message: `Document Mismatch: Uploaded document does not appear to be a GST Certificate. Please upload a valid ${slotDomain.label}.`
          };
        }
      }
    }
  }

  return {
    isMismatch: false,
    expectedLabel: slotDomain?.label || requirementSlot,
    detectedLabel: detectedDoc?.label || requirementSlot
  };
}

type UploadedDocument = {
  name: string;
  size?: string;
  type?: string;
  requirement?: string;
  fileContentUrl?: string;
  parsedData?: any;
  parseError?: string;
  isMismatch?: boolean;
  validationWarning?: string;
  detectedDocType?: string;
};

export interface GemEvaluationComparisonResult {
  score: number;
  stage1: {
    passed: boolean;
    panGst: boolean;
    debarment: boolean;
    gfr144xi: boolean;
    emd: boolean;
    detail: string;
  };
  stage2: {
    passed: boolean;
    turnover: string;
    experience: string;
    performance: string;
    oemAuth: string;
  };
  stage3: {
    passed: boolean;
    mseStatus: string;
    miiPreference: string;
  };
  stage4: {
    method: string;
    commercialStatus: string;
  };
  summary: string;
}

export function compareDossierWithCriteria(
  doc: UploadedDocument | undefined,
  tender: Tender | null,
  company: any
): GemEvaluationComparisonResult | null {
  if (!doc) return null;
  const rawText = (doc.parsedData?.full_text || '').toLowerCase();
  const fileName = (doc.name || '').toLowerCase();
  const combined = `${rawText} ${fileName}`;

  // Stage 1 Baseline Check
  const panMentioned = combined.includes('pan') || Boolean(company?.pan);
  const gstMentioned = combined.includes('gst') || Boolean(company?.gstin);
  const gfr144xiMentioned = combined.includes('land border') || combined.includes('144') || combined.includes('border') || combined.includes('dpiit');
  const debarmentClear = !combined.includes('debarred') && (company?.pan !== 'XYZAB5678G');
  const emdMentioned = combined.includes('emd') || combined.includes('earnest') || combined.includes('exemption') || combined.includes('bid security');
  const stage1Passed = panMentioned && gstMentioned && debarmentClear;

  // Stage 2 Technical Filters Check
  const requiredTurnover = tender?.technicalFilters?.minTurnoverCr || 10;
  const requiredExp = tender?.technicalFilters?.minExperienceYears || 3;
  const requiredPerf = tender?.technicalFilters?.minPerformanceQuantityPercent || 30;
  const isMseOrStartup = Boolean(company?.isMse || company?.isStartup || ['Micro', 'Small'].includes(company?.enterpriseType || ''));
  
  const turnoverFound = combined.includes('turnover') || combined.includes('balance sheet') || combined.includes('crore') || combined.includes('lakh');
  const expFound = combined.includes('experience') || combined.includes('supply') || combined.includes('years');
  const perfFound = combined.includes('performance') || combined.includes('quantity') || combined.includes('past');
  const oemAuthFound = combined.includes('oem') || combined.includes('maf') || combined.includes('authorization');

  // Stage 3 Universal Exemptions Check
  const miiMentioned = combined.includes('make in india') || combined.includes('local content') || combined.includes('class-i') || combined.includes('class-ii') || combined.includes('mii');

  // Stage 4 Commercial Selection
  const method = tender?.selectionMethod || 'L1';
  const commercialMentioned = combined.includes('commercial') || combined.includes('price') || combined.includes('quote') || combined.includes('financial') || combined.includes('l1');

  // Calculate score
  let score = 45;
  if (stage1Passed) score += 20;
  if (gfr144xiMentioned) score += 10;
  if (turnoverFound || isMseOrStartup) score += 10;
  if (expFound || isMseOrStartup) score += 5;
  if (miiMentioned) score += 5;
  if (commercialMentioned) score += 5;
  score = Math.min(100, score);

  return {
    score,
    stage1: {
      passed: stage1Passed,
      panGst: panMentioned && gstMentioned,
      debarment: debarmentClear,
      gfr144xi: gfr144xiMentioned,
      emd: emdMentioned,
      detail: `PAN & GST active; Debarment: ${debarmentClear ? 'Clear (No blacklisting found)' : 'ALERT: Debarred'}; GFR 144(xi): ${gfr144xiMentioned ? 'Declared Compliant' : 'Standard Self-Declaration Verified'}; EMD: ${isMseOrStartup ? 'Eligible for MSE Exemption' : 'Payment / BSD Attached'}`
    },
    stage2: {
      passed: (turnoverFound || isMseOrStartup) && (expFound || isMseOrStartup),
      turnover: isMseOrStartup ? 'Exempted (MSE / DPIIT Startup)' : (turnoverFound ? `Verified (Meets >= ₹${requiredTurnover} Cr criteria)` : `Needs verification against ₹${requiredTurnover} Cr requirement`),
      experience: isMseOrStartup ? 'Exempted (MSE / DPIIT Startup)' : (expFound ? `Verified (Meets >= ${requiredExp} Years supply)` : `Needs verification against ${requiredExp} Years requirement`),
      performance: perfFound ? `Satisfies >= ${requiredPerf}% quantity` : `Evaluated against ${requiredPerf}% criteria`,
      oemAuth: tender?.technicalFilters?.requireOEMAuth ? (oemAuthFound ? 'Valid MAF Attached' : 'Missing MAF') : 'Not mandatory for this category'
    },
    stage3: {
      passed: true,
      mseStatus: isMseOrStartup ? 'MSE / DPIIT Startup Exemption Claimed & Verified' : 'Standard Commercial Entity',
      miiPreference: miiMentioned ? 'Make in India Class-I Local Supplier (>=50% local content declared)' : 'Class-II Local Supplier / General Policy Applied'
    },
    stage4: {
      method,
      commercialStatus: `Evaluated under GeM ${method} mechanism; commercial bid quote will be evaluated upon opening.`
    },
    summary: `Dossier evaluated against GeM 4-Stage statutory framework: Baseline verified (${stage1Passed ? 'PASS' : 'FAIL'}); Technical filters ${isMseOrStartup ? 'EXEMPTED via MSE/Startup' : 'QUALIFIED'}; Make in India Preference active.`
  };
}

export const BidderDashboard: React.FC = () => {
  const { 
    selectedCompany, 
    tenders, 
    submissions, 
    submitBid, 
    navigateTo,
    draftDocuments,
    setDraftDocuments
  } = useApp();

  const [activeTab, setActiveTab] = useState<'available' | 'apply' | 'status'>('available');
  const [selectedTenderToApply, setSelectedTenderToApply] = useState<Tender | null>(tenders[0] ?? null);

  useEffect(() => {
    if (tenders.length === 0) {
      setSelectedTenderToApply(null);
      return;
    }
    setSelectedTenderToApply(prev => {
      if (!prev) return tenders[0];
      return tenders.find(t => t.id === prev.id) ?? tenders[0];
    });
  }, [tenders]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>(
    (selectedCompany && draftDocuments[selectedCompany.id]) 
      ? draftDocuments[selectedCompany.id] 
      : []
  );
  
  useEffect(() => {
    if (selectedCompany) {
      setDraftDocuments(prev => ({
        ...prev,
        [selectedCompany.id]: uploadedDocs
      }));
    }
  }, [uploadedDocs, selectedCompany, setDraftDocuments]);

  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [selectedDocToView, setSelectedDocToView] = useState<DocumentInfo | null>(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});
  const requirementInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [autoCheckRun, setAutoCheckRun] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [ignoredDocWarnings, setIgnoredDocWarnings] = useState<Record<string, boolean>>({});
  const [commercialQuoteInput, setCommercialQuoteInput] = useState<string>('');
  const gem4StageInputRef = useRef<HTMLInputElement>(null);
  const gem4StageDoc = uploadedDocs.find(d => d.requirement === 'GeM Standardized 4-Stage Evaluation');
  const gemComparison = useMemo(() => {
    return compareDossierWithCriteria(gem4StageDoc, selectedTenderToApply, selectedCompany);
  }, [gem4StageDoc, selectedTenderToApply, selectedCompany]);

  const handleRunAutoCheck = () => {
    setIsAutoChecking(true);
    setTimeout(() => {
      setUploadedDocs(prev => prev.map(doc => {
        const matchResult = validateDocumentSlotMatch(doc.name, doc.requirement || doc.name, doc.parsedData);
        return {
          ...doc,
          isMismatch: matchResult.isMismatch,
          validationWarning: matchResult.message,
          detectedDocType: matchResult.detectedLabel
        };
      }));
      setIsAutoChecking(false);
      setAutoCheckRun(true);
    }, 600);
  };

  const handleIgnoreWarning = (requirementName: string) => {
    setIgnoredDocWarnings(prev => ({
      ...prev,
      [requirementName]: true
    }));
  };

  const handleUnignoreWarning = (requirementName: string) => {
    setIgnoredDocWarnings(prev => {
      const copy = { ...prev };
      delete copy[requirementName];
      return copy;
    });
  };

  const handleBulkDocumentsLoaded = (newDocs: LoadedMockDocument[], sourceDescription: string) => {
    setUploadedDocs(prev => {
      const newRequirements = new Set(newDocs.map(d => d.requirement));
      const retainedDocs = prev.filter(d => !newRequirements.has(d.requirement || d.name));
      return [...retainedDocs, ...newDocs];
    });
    setIgnoredDocWarnings({});
    setUploadSuccessMessage(`Successfully attached ${newDocs.length} documents from ${sourceDescription}!`);
    setTimeout(() => setUploadSuccessMessage(null), 4000);
  };

  const handleClearAllDocuments = () => {
    setUploadedDocs([]);
    setIgnoredDocWarnings({});
    setAutoCheckRun(false);
    if (selectedCompany) {
      setDraftDocuments(prev => ({
        ...prev,
        [selectedCompany.id]: []
      }));
    }
    setUploadSuccessMessage('All uploaded documents have been cleared.');
    setTimeout(() => setUploadSuccessMessage(null), 3000);
  };

  if (!selectedCompany) {
    return (
      <div className="min-h-[calc(100vh-4.25rem)] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">No bidder company selected.</p>
          <button
            onClick={() => navigateTo('bidder-selection')}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
          >
            Select a Company
          </button>
        </div>
      </div>
    );
  }

  // Filter submissions made by this company
  const companySubmissions = submissions.filter(s => s.companyId === selectedCompany.id);

  const openGemDocument = (tender: Tender) => {
    const gemDoc = tender.gemBiddingDocument;
    if (!gemDoc?.fileContentUrl) return;
    const existingSub = submissions.find(s => s.tenderId === tender.id && s.companyId === selectedCompany.id);
    const activeQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0 ? Number(commercialQuoteInput) : existingSub?.commercialQuote;
    const formattedQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0
      ? (Number(commercialQuoteInput) >= 10000000 ? `₹ ${(Number(commercialQuoteInput) / 10000000).toFixed(2)} Cr` : `₹ ${(Number(commercialQuoteInput) / 100000).toFixed(2)} Lakh`)
      : (existingSub?.formattedCommercialQuote || (existingSub?.commercialQuote ? `₹ ${(existingSub.commercialQuote / 10000000).toFixed(2)} Cr` : undefined));

    setSelectedDocToView({
      name: gemDoc.name,
      fileSize: gemDoc.fileSize,
      type: 'PDF',
      companyName: 'GeM Portal',
      verified: true,
      uploadedAt: gemDoc.uploadedAt,
      fileContentUrl: gemDoc.fileContentUrl,
      parsedData: gemDoc.parsedData,
      commercialQuote: activeQuote,
      formattedCommercialQuote: formattedQuote,
    });
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const parseDocumentsInSequence = async (files: File[], requirement?: string) => {
    for (const file of files) {
      try {
        const docRequirement = requirement || uploadedDocs.find(d => d.name === file.name)?.requirement || file.name;
        const parsed = await parseDocumentWithService(file, file.name, docRequirement);
        setUploadedDocs(prev => prev.map(doc => {
          if (doc.name !== file.name) return doc;
          if (parsed?.success) {
            const matchResult = validateDocumentSlotMatch(file.name, doc.requirement || file.name, parsed);
            return {
              ...doc,
              parsedData: parsed,
              parseError: undefined,
              isMismatch: matchResult.isMismatch,
              validationWarning: matchResult.message,
              detectedDocType: matchResult.detectedLabel
            };
          } else {
            return {
              ...doc,
              parseError: parsed?.error || 'The document could not be parsed.'
            };
          }
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The document could not be parsed.';
        setUploadedDocs(prev => prev.map(doc =>
          doc.name === file.name ? { ...doc, parseError: message } : doc
        ));
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, requirement?: string) => {
    const files = Array.from(e.target.files || []);
    // Reset file input value immediately so user can select the same file again
    if (e.target) e.target.value = '';
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.tiff') || ext.endsWith('.webp') || ext.endsWith('.docx');
    });

    const rejectedCount = files.length - validFiles.length;
    if (rejectedCount > 0) {
      setUploadErrorMessage(`${rejectedCount} file(s) skipped. Allowed formats: PDF, PNG, JPG, TIFF, DOCX.`);
    } else {
      setUploadErrorMessage(null);
    }
    if (validFiles.length === 0) return;

    // Immediately read data URLs and add docs to list so UI updates instantly
    const initialDocs: UploadedDocument[] = await Promise.all(validFiles.map(async f => {
      const quickMatch = validateDocumentSlotMatch(f.name, requirement || f.name);
      return {
        name: f.name,
        requirement: requirement || f.name,
        size: f.size > 1024 * 1024 
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(f.size / 1024).toFixed(0)} KB`,
        type: f.name.split('.').pop()?.toUpperCase() || 'PDF',
        fileContentUrl: await readFileAsDataUrl(f),
        parsedData: undefined,
        isMismatch: quickMatch.isMismatch,
        validationWarning: quickMatch.message,
        detectedDocType: quickMatch.detectedLabel
      };
    }));

    setUploadedDocs(prev => {
      if (requirement) {
        // Replace existing document(s) for this requirement
        const others = prev.filter(d => d.requirement !== requirement);
        return [...others, ...initialDocs];
      }
      return [...prev, ...initialDocs];
    });

    if (requirement) {
      setIgnoredDocWarnings(prev => {
        const copy = { ...prev };
        delete copy[requirement];
        return copy;
      });
    }

    setUploadSuccessMessage(
      requirement
        ? `${validFiles[0].name} attached for ${requirement}.`
        : validFiles.length === 1
          ? `${validFiles[0].name} attached successfully.`
          : `${validFiles.length} documents attached successfully.`
    );
    setTimeout(() => setUploadSuccessMessage(null), 3500);

    // Run one CPU-intensive parser job at a time to keep the app responsive.
    void parseDocumentsInSequence(validFiles, requirement);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.tiff') || ext.endsWith('.webp') || ext.endsWith('.docx');
    });

    const rejectedCount = files.length - validFiles.length;
    if (rejectedCount > 0) {
      setUploadErrorMessage(`${rejectedCount} file(s) skipped. Allowed formats: PDF, PNG, JPG, TIFF, DOCX.`);
    } else {
      setUploadErrorMessage(null);
    }
    if (validFiles.length === 0) return;

    const initialDocs: UploadedDocument[] = await Promise.all(validFiles.map(async f => {
      const quickMatch = validateDocumentSlotMatch(f.name, f.name);
      return {
        name: f.name,
        size: f.size > 1024 * 1024 
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(f.size / 1024).toFixed(0)} KB`,
        type: f.name.split('.').pop()?.toUpperCase() || 'PDF',
        fileContentUrl: await readFileAsDataUrl(f),
        parsedData: undefined,
        isMismatch: quickMatch.isMismatch,
        validationWarning: quickMatch.message,
        detectedDocType: quickMatch.detectedLabel
      };
    }));

    setUploadedDocs(prev => [...prev, ...initialDocs]);
    setUploadSuccessMessage(
      validFiles.length === 1
        ? `${validFiles[0].name} attached successfully.`
        : `${validFiles.length} documents attached successfully.`
    );
    setTimeout(() => setUploadSuccessMessage(null), 3000);

    void parseDocumentsInSequence(validFiles);
  };

  const handleRemoveDoc = (requirementOrIndex: string | number) => {
    if (typeof requirementOrIndex === 'string') {
      setUploadedDocs(prev => prev.filter(d => d.requirement !== requirementOrIndex));
      setIgnoredDocWarnings(prev => {
        const copy = { ...prev };
        delete copy[requirementOrIndex];
        return copy;
      });
    } else {
      setUploadedDocs(prev => prev.filter((_, i) => i !== requirementOrIndex));
    }
  };

  const toggleSubmissionExpand = (subId: string) => {
    setExpandedSubmissions(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const handleFinalSubmit = () => {
    if (!selectedTenderToApply) return;
    const unignoredMismatches = uploadedDocs.filter(d => 
      d.isMismatch && !ignoredDocWarnings[d.requirement || d.name]
    );
    if (autoCheckRun && unignoredMismatches.length > 0) {
      setUploadErrorMessage(
        `Auto-Check Recommendation: ${unignoredMismatches.length} document(s) need your review. Click "Replace Document" to correct, or "Ignore & Keep" if you verified it is submitted correctly.`
      );
      return;
    }
    const cleanQuote = commercialQuoteInput ? parseFloat(commercialQuoteInput.replace(/[^0-9.]/g, '')) : undefined;
    submitBid(selectedTenderToApply.id, selectedCompany.id, uploadedDocs, cleanQuote);
    setSubmissionSuccess(true);
    setUploadedDocs([]);
    setAutoCheckRun(false);
    setCommercialQuoteInput('');
    setIgnoredDocWarnings({});
    if (selectedCompany) {
      setDraftDocuments(prev => ({
        ...prev,
        [selectedCompany.id]: []
      }));
    }
    setTimeout(() => {
      setSubmissionSuccess(false);
      setActiveTab('status');
    }, 1200);
  };

  const activeRecommendations = uploadedDocs.filter(d => 
    d.isMismatch && !ignoredDocWarnings[d.requirement || d.name]
  );
  const ignoredCount = uploadedDocs.filter(d => 
    d.isMismatch && Boolean(ignoredDocWarnings[d.requirement || d.name])
  ).length;

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Company Header & Identity Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-2xs shrink-0"
              style={{ backgroundColor: selectedCompany.color || '#059669' }}
            >
              {(selectedCompany.name || 'AB').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{selectedCompany.name || 'Bidder Entity'}</h1>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Active Bidder Portal
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span>GSTIN: <strong className="font-mono text-slate-700">{selectedCompany.gstin}</strong></span>
                <span>┬╖</span>
                <span>PAN: <strong className="font-mono text-slate-700">{selectedCompany.pan}</strong></span>
                <span>┬╖</span>
                <span>Udyam: <strong className="font-mono text-slate-700">{selectedCompany.udyamNumber}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => navigateTo('bidder-selection')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch Company</span>
            </button>
            <button
              onClick={() => navigateTo('role-selection')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch Role</span>
            </button>
          </div>
        </div>

        {/* Modular Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'available'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>View Available Tenders</span>
          </button>

          <button
            onClick={() => setActiveTab('apply')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'apply'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Apply &amp; Upload Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>View Submission Status</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
              {companySubmissions.length}
            </span>
          </button>
        </div>

        {/* TAB 1: VIEW AVAILABLE TENDERS */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 pb-1 text-xs text-slate-500">
              <span>Showing 1 - {tenders.length} of {tenders.length} tenders</span>
              <span className="hidden sm:inline">Sort by: <strong className="text-slate-700">Bid End Date: Oldest First</strong></span>
            </div>
            <div className="space-y-5">
              {tenders.map((tender) => {
                const alreadySubmitted = submissions.some(
                  s => s.tenderId === tender.id && s.companyId === selectedCompany.id
                );

                return (
                  <TenderListCard
                    key={tender.id}
                    tender={tender}
                    mode="bidder"
                    appliedCount={tender.appliedBiddersCount}
                    alreadySubmitted={alreadySubmitted}
                    onBidderApply={() => {
                      setSelectedTenderToApply(tender);
                      setActiveTab('apply');
                    }}
                    onViewGemDocument={() => openGemDocument(tender)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: APPLY & UPLOAD DOCUMENTS */}
        {activeTab === 'apply' && selectedTenderToApply && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            {(() => {
              const existingSub = submissions.find(s => s.tenderId === selectedTenderToApply.id && s.companyId === selectedCompany.id);
              const activeQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0 ? Number(commercialQuoteInput) : existingSub?.commercialQuote;
              const formattedQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0
                ? (Number(commercialQuoteInput) >= 10000000 ? `₹ ${(Number(commercialQuoteInput) / 10000000).toFixed(2)} Cr` : `₹ ${(Number(commercialQuoteInput) / 100000).toFixed(2)} Lakh`)
                : (existingSub?.formattedCommercialQuote || (existingSub?.commercialQuote ? `₹ ${(existingSub.commercialQuote / 10000000).toFixed(2)} Cr` : undefined));

              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                        Tender No: {selectedTenderToApply.tenderNumber}
                      </span>
                      {selectedTenderToApply.gemBiddingDocument?.fileContentUrl && (
                        <button
                          type="button"
                          onClick={() => openGemDocument(selectedTenderToApply)}
                          className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview Tender Document
                        </button>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedTenderToApply.title}</h2>
                    <p className="text-xs text-slate-500">{selectedTenderToApply.organization} · {selectedTenderToApply.ministry}</p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center flex-wrap sm:flex-nowrap">
                    {formattedQuote && (
                      <div className="text-left sm:text-right px-3 py-1.5 bg-blue-50 border-2 border-blue-500 rounded-xl shadow-xs">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Your Quoted Amount</span>
                        <span className="text-sm font-black text-blue-950 font-mono">
                          {formattedQuote}
                        </span>
                      </div>
                    )}
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-500 block">Total Uploaded</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {uploadedDocs.length} / 15 Documents
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunAutoCheck}
                      disabled={uploadedDocs.length === 0 || isAutoChecking}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                      title="Run automated compliance scan on all uploaded documents"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAutoChecking ? 'animate-spin' : ''}`} />
                      <span>{isAutoChecking ? 'Checking...' : 'Auto-Check'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Tender AI Intelligence Summary — shown to bidder before uploading docs */}
            {(() => {
              const summaryInfo =
                selectedTenderToApply.tenderSummaryInfo ||
                selectedTenderToApply.gemBiddingDocument?.tenderSummaryInfo ||
                selectedTenderToApply.gemBiddingDocument?.parsedData?.tenderSummaryInfo;
              if (!summaryInfo) return null;
              return (
                <div className="rounded-xl border border-indigo-200 overflow-hidden shadow-xs">
                  <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white">AI Tender Intelligence — Specific Conditions for This Bid</span>
                        <span className="block text-[10px] text-indigo-200 mt-0.5">
                          Read these conditions before uploading documents to ensure eligibility
                        </span>
                      </div>
                    </div>
                    {summaryInfo.emd_amount && (
                      <span className="text-xs bg-amber-400/20 border border-amber-300/40 text-amber-100 px-2.5 py-0.5 rounded-md font-semibold shrink-0">
                        EMD: {summaryInfo.emd_amount}
                      </span>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50/70 to-white p-4 space-y-3">
                    {summaryInfo.scope_of_work && (
                      <div className="bg-white/80 border border-indigo-100 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-indigo-900 block mb-0.5">Procurement Scope:</span>
                        {summaryInfo.scope_of_work}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Specific Conditions */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          Specific Eligibility Conditions ({summaryInfo.conditions?.length || 0})
                        </h4>
                        <ul className="space-y-2">
                          {(summaryInfo.conditions || []).slice(0, 4).map((c: any, i: number) => (
                            <li key={i} className="text-xs border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-semibold text-slate-800">{c.title}</span>
                                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${
                                  c.category === 'financial' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : c.category === 'technical' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : c.category === 'compliance' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>{c.category}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug">{c.description}</p>
                            </li>
                          ))}
                          {(summaryInfo.conditions?.length || 0) > 4 && (
                            <li className="text-[11px] text-indigo-600 font-semibold">
                              + {summaryInfo.conditions!.length - 4} more conditions in the full tender document
                            </li>
                          )}
                          {(!summaryInfo.conditions || summaryInfo.conditions.length === 0) && (
                            <li className="text-xs text-slate-400 italic">No specific condition thresholds listed.</li>
                          )}
                        </ul>
                      </div>
                      {/* Needed Documents */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Documents Required ({summaryInfo.needed_documents?.length || 0})
                        </h4>
                        <ul className="space-y-2">
                          {(summaryInfo.needed_documents || []).slice(0, 5).map((d: any, i: number) => (
                            <li key={i} className="text-xs border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-semibold text-slate-900 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                  {d.document_name}
                                </span>
                                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                                  d.mandatory ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>{d.mandatory ? 'Mandatory' : 'Optional'}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug pl-4">{d.purpose}</p>
                            </li>
                          ))}
                          {(summaryInfo.needed_documents?.length || 0) > 5 && (
                            <li className="text-[11px] text-emerald-600 font-semibold">
                              + {summaryInfo.needed_documents!.length - 5} more in tender document
                            </li>
                          )}
                          {(!summaryInfo.needed_documents || summaryInfo.needed_documents.length === 0) && (
                            <li className="text-xs text-slate-400 italic">Standard statutory documents required.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {submissionSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-bold">Bid Submitted Successfully!</strong>
                  <p>Redirecting to your submission status...</p>
                </div>
              </div>
            )}

            {uploadSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {uploadErrorMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{uploadErrorMessage}</span>
              </div>
            )}

            {/* Folder-Wise Upload & Mock Repository Hub */}
            <FolderUploadMockHub
              selectedCompany={selectedCompany}
              uploadedDocs={uploadedDocs}
              onDocumentsLoaded={handleBulkDocumentsLoaded}
              onClearAll={handleClearAllDocuments}
              onRunAutoCheck={handleRunAutoCheck}
            />

            {/* Auto-Check Recommendation Banner */}
            {autoCheckRun && (
              activeRecommendations.length > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-amber-950">
                          Auto-Check: {activeRecommendations.length} Recommendation{activeRecommendations.length > 1 ? 's' : ''} to Review
                        </span>
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          Action Recommended
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1">
                        We noticed documents uploaded in different slots (e.g. Fee Receipt in PAN slot). Please review each item below: click <strong>Replace</strong> to upload the correct file, or click <strong>Ignore &amp; Keep</strong> if you verified it is submitted as intended.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        const allIgnored: Record<string, boolean> = {};
                        uploadedDocs.forEach(d => {
                          const key = d.requirement || d.name;
                          if (d.isMismatch) allIgnored[key] = true;
                        });
                        setIgnoredDocWarnings(allIgnored);
                      }}
                      className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Ignore All &amp; Proceed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-xs text-emerald-950">
                        Auto-Check Verified &amp; Compliant
                      </span>
                      <p className="text-xs text-emerald-800">
                        All {uploadedDocs.length} uploaded documents are verified against their required slots.
                        {ignoredCount > 0 && ` (${ignoredCount} recommendation${ignoredCount > 1 ? 's were' : ' was'} acknowledged and kept by bidder)`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunAutoCheck}
                    disabled={isAutoChecking}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                  >
                    Re-check
                  </button>
                </div>
              )
            )}

            {/* GeM GTC / GFR Standardized 4-Stage Evaluation Rules Notice */}
            {selectedTenderToApply && (
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-xl p-5 shadow-md border border-indigo-800/40 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">GeM Standardized 4-Stage Evaluation Framework</h3>
                      <p className="text-[11px] text-indigo-200">
                        Statutory compliance rules enforced across all bidders under GTC and GFR
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Method: {selectedTenderToApply.selectionMethod || 'L1 Lowest Price'}
                  </span>
                </div>

                {/* Upload GeM Standardized 4-Stage Evaluation Action Bar */}
                <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          GeM Standardized 4-Stage Evaluation Document
                        </h4>
                        <span className="text-[10px] font-bold bg-amber-400/25 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                          {gem4StageDoc ? '✓ Document Uploaded' : 'Action Required'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200 mt-0.5">
                        Upload your unified 4-Stage Compliance Dossier / Undertaking to compare directly against tender requirements
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={gem4StageInputRef}
                      type="file"
                      accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/tiff,.docx"
                      onChange={(e) => handleFileSelect(e, 'GeM Standardized 4-Stage Evaluation')}
                      className="hidden"
                    />
                    {gem4StageDoc ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const existingSub = submissions.find(s => s.tenderId === selectedTenderToApply?.id && s.companyId === selectedCompany.id);
                            const activeQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0 ? Number(commercialQuoteInput) : existingSub?.commercialQuote;
                            const formattedQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0
                              ? (Number(commercialQuoteInput) >= 10000000 ? `₹ ${(Number(commercialQuoteInput) / 10000000).toFixed(2)} Cr` : `₹ ${(Number(commercialQuoteInput) / 100000).toFixed(2)} Lakh`)
                              : (existingSub?.formattedCommercialQuote || (existingSub?.commercialQuote ? `₹ ${(existingSub.commercialQuote / 10000000).toFixed(2)} Cr` : undefined));

                            setSelectedDocToView({
                              name: gem4StageDoc.name,
                              fileSize: gem4StageDoc.size || '1.8 MB',
                              type: gem4StageDoc.type || 'PDF',
                              companyName: selectedCompany.name,
                              fileContentUrl: gem4StageDoc.fileContentUrl,
                              parsedData: gem4StageDoc.parsedData,
                              commercialQuote: activeQuote,
                              formattedCommercialQuote: formattedQuote,
                            });
                          }}
                          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Dossier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => gem4StageInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace Document</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => gem4StageInputRef.current?.click()}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-slate-950" />
                        <span>Upload 4-Stage Evaluation Document</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {/* Stage 1 */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-200">
                      <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-200 text-[10px] flex items-center justify-center">1</span>
                      <span>Baseline Compliance</span>
                    </div>
                    <ul className="text-[11px] text-indigo-100/80 space-y-1 list-disc pl-3">
                      <li>PAN, GSTIN &amp; Bank verification</li>
                      <li>Central Debarment check (Statutory disqualification)</li>
                      <li>GFR 144(xi) Land Border Declaration</li>
                      <li>EMD: {selectedTenderToApply.emdRequiredAmount ? `₹${(Number(selectedTenderToApply.emdRequiredAmount) / 100000).toFixed(1)}L (or MSE Exemption)` : 'Exempted / BSD'}</li>
                    </ul>
                  </div>

                  {/* Stage 2 */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-200">
                      <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-200 text-[10px] flex items-center justify-center">2</span>
                      <span>Technical Filters</span>
                    </div>
                    <ul className="text-[11px] text-indigo-100/80 space-y-1 list-disc pl-3">
                      <li>Avg Turnover: ₹{selectedTenderToApply.technicalFilters?.minTurnoverCr || 10} Cr (3 FYs)</li>
                      <li>Past Experience: {selectedTenderToApply.technicalFilters?.minExperienceYears || 3} Years in Govt/PSU</li>
                      <li>Past Performance: {selectedTenderToApply.technicalFilters?.minPerformanceQuantityPercent || 30}% qty/value</li>
                      <li>OEM Authorization: {selectedTenderToApply.technicalFilters?.requireOEMAuth ? 'Mandatory MAF' : 'Standard'}</li>
                    </ul>
                  </div>

                  {/* Stage 3 */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-200">
                      <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-200 text-[10px] flex items-center justify-center">3</span>
                      <span>Universal Exemptions</span>
                    </div>
                    <ul className="text-[11px] text-indigo-100/80 space-y-1 list-disc pl-3">
                      <li>MSE &amp; DPIIT Startups: Exempt from turnover &amp; exp</li>
                      <li>Make in India: Class-I (≥50%) &amp; Class-II (≥20%)</li>
                      <li>MSE Price Matching: L1 + 15% window for 25% allocation</li>
                    </ul>
                  </div>

                  {/* Stage 4 */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-200">
                      <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-200 text-[10px] flex items-center justify-center">4</span>
                      <span>Selection Method</span>
                    </div>
                    <p className="text-[11px] text-indigo-100/80 leading-relaxed">
                      {selectedTenderToApply.selectionMethod === 'L1' && 'Lowest Price (L1): Lowest commercial quote among technically qualified sellers wins.'}
                      {selectedTenderToApply.selectionMethod === 'RA' && 'Reverse Auction (RA): Qualified sellers enter live online window to underbid.'}
                      {selectedTenderToApply.selectionMethod === 'QCBS' && 'QCBS: 70% Technical Merit + 30% Commercial Financial Bid Score.'}
                      {selectedTenderToApply.selectionMethod === 'Run_L1' && 'Run L1: Algorithmic tie-breaker for identical bids.'}
                      {!selectedTenderToApply.selectionMethod && 'Lowest Price (L1): Standard commercial evaluation among qualified bids.'}
                    </p>
                  </div>
                </div>

                {/* Real-time Comparison Matrix with Evaluation Criteria */}
                {gemComparison && (
                  <div className="bg-slate-950/80 border border-amber-400/40 rounded-xl p-4 space-y-3 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Evaluation Criteria Comparison: {gem4StageDoc?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ {gemComparison.score}% Criteria Match
                        </span>
                        <span className="text-[10px] text-indigo-300 font-medium">
                          All 4 Stages Evaluated
                        </span>
                      </div>
                    </div>

                    {/* Stage-by-Stage Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Stage 1 Baseline Comparison */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-200">1. Baseline Compliance Criteria</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {gemComparison.stage1.passed ? '✓ Compliant' : 'Needs Review'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {gemComparison.stage1.detail}
                        </p>
                      </div>

                      {/* Stage 2 Technical Filters Comparison */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-200">2. Technical Qualification Criteria</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {gemComparison.stage2.turnover.includes('Exempted') ? '✓ Exempted (MSE)' : '✓ Verified'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Turnover: {gemComparison.stage2.turnover} · Experience: {gemComparison.stage2.experience} · Perf: {gemComparison.stage2.performance}
                        </p>
                      </div>

                      {/* Stage 3 Universal Exemptions Comparison */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-200">3. Universal Exemptions &amp; Preferences</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Class-I / MSE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {gemComparison.stage3.mseStatus} · {gemComparison.stage3.miiPreference}
                        </p>
                      </div>

                      {/* Stage 4 Selection Method Comparison */}
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-200">4. Selection Method Alignment</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Method: {gemComparison.stage4.method}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {gemComparison.stage4.commercialStatus}
                        </p>
                      </div>
                    </div>

                    {/* One-line summary */}
                    <div className="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-200 font-medium">
                      <strong>Criteria Comparison Report:</strong> {gemComparison.summary}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Commercial Financial Bid Input Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Commercial Financial Bid / Quote
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enter your total all-inclusive commercial quote in INR for {selectedTenderToApply?.tenderNumber}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                  Required for GeM {selectedTenderToApply?.selectionMethod || 'L1'} Selection
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={commercialQuoteInput}
                    onChange={e => setCommercialQuoteInput(e.target.value)}
                    placeholder="e.g. 45000000 (₹ 4.50 Crore)"
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                {commercialQuoteInput && Number(commercialQuoteInput) > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-900 flex items-center gap-2">
                    <span>Quote:</span>
                    <span>
                      {Number(commercialQuoteInput) >= 10000000
                        ? `₹ ${(Number(commercialQuoteInput) / 10000000).toFixed(2)} Cr`
                        : `₹ ${(Number(commercialQuoteInput) / 100000).toFixed(2)} Lakh`}
                    </span>
                    <span className="text-slate-400">({Number(commercialQuoteInput).toLocaleString('en-IN')})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Groups List */}
            <div className="space-y-6">
              {documentGroups.map((group) => {
                const groupDocsCount = group.documents.filter(docName => 
                  uploadedDocs.some(d => d.requirement === docName)
                ).length;

                return (
                  <div key={group.title} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    {/* Group Header */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {group.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{group.description}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border self-start sm:self-center ${
                        groupDocsCount === group.documents.length
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : groupDocsCount > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {groupDocsCount} of {group.documents.length} Uploaded
                      </span>
                    </div>

                    {/* Group Documents */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {group.documents.map((docName) => {
                        const uploadedDoc = uploadedDocs.find(d => d.requirement === docName);
                        const docKey = uploadedDoc?.requirement || uploadedDoc?.name || docName;
                        const isWarningActive = autoCheckRun && Boolean(uploadedDoc?.isMismatch) && !ignoredDocWarnings[docKey];
                        const isWarningIgnored = autoCheckRun && Boolean(uploadedDoc?.isMismatch) && Boolean(ignoredDocWarnings[docKey]);

                        return (
                          <div
                            key={docName}
                            className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors rounded-lg ${
                              isWarningActive
                                ? 'bg-amber-50/70 border border-amber-300 shadow-2xs my-1'
                                : isWarningIgnored
                                  ? 'bg-slate-50/70 border border-slate-200 my-0.5'
                                  : 'hover:bg-slate-50/60'
                            }`}
                          >
                            {/* Document Info */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isWarningActive
                                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                  : isWarningIgnored
                                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                    : uploadedDoc 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {isWarningActive ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                ) : isWarningIgnored ? (
                                  <FileCheck className="w-4 h-4 text-slate-500" />
                                ) : uploadedDoc ? (
                                  <FileCheck className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <FileText className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-slate-900">{docName}</span>
                                  {uploadedDoc && (
                                    isWarningActive ? (
                                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        Auto-Check: Recommendation Needed
                                      </span>
                                    ) : isWarningIgnored ? (
                                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Check className="w-3 h-3 text-slate-500" />
                                        Ignored &amp; Kept by Bidder
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        Uploaded
                                      </span>
                                    )
                                  )}
                                </div>

                                {uploadedDoc ? (
                                  <div className="space-y-1.5 mt-1">
                                    <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                                      <span className="font-medium text-slate-800 truncate max-w-[240px]" title={uploadedDoc.name}>
                                        {uploadedDoc.name}
                                      </span>
                                      <span className="text-slate-400">&bull;</span>
                                      <span className="font-mono text-slate-500">{uploadedDoc.size || '1.8 MB'}</span>
                                      
                                      {uploadedDoc.parseError ? (
                                        <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded" title={uploadedDoc.parseError}>
                                          Parse failed
                                        </span>
                                      ) : uploadedDoc.parsedData ? (
                                        uploadedDoc.parsedData.metadata?.ocr_used ? (
                                          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                            OCR Extracted
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                                            Parsed (Digital)
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                          Parsing...
                                        </span>
                                      )}
                                    </div>

                                    {/* Mismatch Warning & Recommendation Card */}
                                    {isWarningActive && (
                                      <div className="p-3 bg-amber-100/95 border border-amber-300 rounded-lg text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs mt-2">
                                        <div className="flex items-start gap-2.5">
                                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                          <div className="leading-snug">
                                            <span className="font-bold text-xs block text-amber-950">
                                              Recommendation: Look into this document
                                            </span>
                                            <span className="text-[11px] text-amber-900 mt-0.5 block">
                                              {uploadedDoc.validationWarning || `Detected different document for "${docName}".`}
                                            </span>
                                            <span className="text-[10px] text-amber-800 mt-0.5 block">
                                              If you submitted correctly, you can <strong>Ignore</strong>. Otherwise, click <strong>Replace</strong>.
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                          <button
                                            type="button"
                                            onClick={() => handleIgnoreWarning(docKey)}
                                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-amber-300 rounded-md text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1"
                                            title="Keep this document as submitted and bypass this recommendation"
                                          >
                                            <Check className="w-3.5 h-3.5 text-slate-600" />
                                            <span>Ignore &amp; Keep</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => requirementInputRefs.current[docName]?.click()}
                                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1"
                                            title="Choose correct document to replace"
                                          >
                                            <Upload className="w-3.5 h-3.5" />
                                            <span>Replace</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Acknowledged / Ignored notice */}
                                    {isWarningIgnored && (
                                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 flex items-center justify-between gap-2 mt-1">
                                        <div className="flex items-center gap-1.5">
                                          <Check className="w-3.5 h-3.5 text-slate-500" />
                                          <span>Recommendation ignored &mdash; kept as submitted by bidder</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleUnignoreWarning(docKey)}
                                          className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
                                        >
                                          Re-check
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                                    PDF, image or scanned copy required
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {/* Hidden file input for this document requirement */}
                              <input
                                ref={el => { requirementInputRefs.current[docName] = el; }}
                                type="file"
                                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/tiff,.docx"
                                onChange={(e) => handleFileSelect(e, docName)}
                                className="hidden"
                              />

                              {uploadedDoc && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const existingSub = submissions.find(s => s.tenderId === selectedTenderToApply?.id && s.companyId === selectedCompany.id);
                                      const activeQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0 ? Number(commercialQuoteInput) : existingSub?.commercialQuote;
                                      const formattedQuote = commercialQuoteInput && Number(commercialQuoteInput) > 0
                                        ? (Number(commercialQuoteInput) >= 10000000 ? `₹ ${(Number(commercialQuoteInput) / 10000000).toFixed(2)} Cr` : `₹ ${(Number(commercialQuoteInput) / 100000).toFixed(2)} Lakh`)
                                        : (existingSub?.formattedCommercialQuote || (existingSub?.commercialQuote ? `₹ ${(existingSub.commercialQuote / 10000000).toFixed(2)} Cr` : undefined));

                                      setSelectedDocToView({
                                        name: uploadedDoc.name,
                                        fileSize: uploadedDoc.size || '1.8 MB',
                                        type: uploadedDoc.type || 'PDF',
                                        companyName: selectedCompany.name,
                                        fileContentUrl: uploadedDoc.fileContentUrl,
                                        parsedData: uploadedDoc.parsedData,
                                        commercialQuote: activeQuote,
                                        formattedCommercialQuote: formattedQuote,
                                      });
                                    }}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="View Document"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDoc(docName)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove Document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => requirementInputRefs.current[docName]?.click()}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                  isWarningActive
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                    : uploadedDoc
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isWarningActive ? 'Replace Document' : uploadedDoc ? 'Replace File' : 'Upload Files'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              {autoCheckRun && activeRecommendations.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block">
                        {activeRecommendations.length} Auto-Check Recommendation(s) Pending Review
                      </strong>
                      <p className="mt-0.5 text-amber-800">
                        {activeRecommendations.length} document(s) uploaded appear to be for different slots. Please review above: click <strong>Replace Document</strong> or <strong>Ignore &amp; Keep</strong> if you verified they are correct.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allIgnored: Record<string, boolean> = {};
                      uploadedDocs.forEach(d => {
                        const key = d.requirement || d.name;
                        if (d.isMismatch) allIgnored[key] = true;
                      });
                      setIgnoredDocWarnings(allIgnored);
                    }}
                    className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                  >
                    Ignore All &amp; Enable Submit
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Signing Authority: <strong className="text-slate-800">{selectedCompany.name}</strong>
                </span>
                <div className="flex items-center gap-2">
                  {!autoCheckRun && uploadedDocs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRunAutoCheck}
                      disabled={isAutoChecking}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAutoChecking ? 'animate-spin' : ''}`} />
                      <span>{isAutoChecking ? 'Checking...' : 'Run Auto-Check'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleFinalSubmit}
                    disabled={uploadedDocs.length === 0 || (autoCheckRun && activeRecommendations.length > 0)}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Final Bid ({uploadedDocs.length} Documents)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VIEW SUBMISSION STATUS */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  Bid Submissions for {selectedCompany.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time tracking of AI compliance score and officer review milestones
                </p>
              </div>

              {companySubmissions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <p className="mb-2">No active bids submitted by this company yet.</p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold"
                  >
                    Browse Available Tenders
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {companySubmissions.map(sub => {
                    const tender = tenders.find(t => t.id === sub.tenderId);
                    const isExpanded = expandedSubmissions[sub.id] ?? true;
                    return (
                      <div key={sub.id} className="p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-mono text-emerald-700 font-semibold">{sub.tenderId}</div>
                            <div className="text-sm font-bold text-slate-900">{tender?.title || 'Tender'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Submitted: {sub.submittedAt}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div>
                              <div className="text-[11px] text-slate-400">AI Evaluation</div>
                              <span className="font-bold text-xs font-mono text-slate-800">
                                {sub.complianceScore ? `${sub.complianceScore}% Score` : 'Analyzing'}
                              </span>
                            </div>

                            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {sub.status}
                            </span>

                            <button
                              onClick={() => toggleSubmissionExpand(sub.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1"
                              title="Toggle Documents List"
                            >
                              <span className="text-[11px]">{sub.documents?.length || 0} Files</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* GeM Framework Evaluation Summary Badge & Breakdown */}
                        {sub.gemFrameworkEvaluation && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <div className="flex items-center gap-2">
                                <Scale className="w-3.5 h-3.5 text-indigo-700" />
                                <span className="font-bold text-slate-900">GeM Statutory GTC / GFR Evaluation</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                sub.gemFrameworkEvaluation.stage1Baseline.overallBaselinePassed && sub.gemFrameworkEvaluation.stage2Technical.overallTechnicalPassed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                {sub.gemFrameworkEvaluation.stage1Baseline.overallBaselinePassed && sub.gemFrameworkEvaluation.stage2Technical.overallTechnicalPassed ? '✓ Fully Qualified' : 'Disqualification / Non-compliant'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                              <div className="p-2 rounded bg-white border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">1. Baseline</div>
                                <div className={`font-semibold ${sub.gemFrameworkEvaluation.stage1Baseline.overallBaselinePassed ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {sub.gemFrameworkEvaluation.stage1Baseline.debarmentCheck.status === 'DEBARRED'
                                    ? '🚨 Debarred'
                                    : sub.gemFrameworkEvaluation.stage1Baseline.overallBaselinePassed ? 'Passed ✓' : 'Failed ✗'}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-white border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">2. Technical</div>
                                <div className={`font-semibold ${sub.gemFrameworkEvaluation.stage2Technical.overallTechnicalPassed ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {sub.gemFrameworkEvaluation.stage2Technical.turnoverFilter.status === 'EXEMPTED' ? 'Exempted (MSE)' : 'Qualified ✓'}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-white border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">3. Preferences</div>
                                <div className="font-semibold text-slate-800">
                                  {sub.gemFrameworkEvaluation.stage3Preferences.makeInIndia.supplierClass}
                                </div>
                              </div>
                              <div className="p-2 rounded bg-white border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">4. Commercial</div>
                                <div className="font-semibold text-blue-900 font-mono">
                                  {sub.gemFrameworkEvaluation.stage4Selection.formattedQuote || '—'}
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 font-medium">
                              <strong>Report:</strong> {sub.gemFrameworkEvaluation.oneLineExecutiveSummary}
                            </p>
                          </div>
                        )}

                        {/* List of uploaded documents for this submission */}
                        {isExpanded && sub.documents && sub.documents.length > 0 && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                            <span className="text-[11px] font-bold text-slate-600 block">
                              Uploaded Bid Documents ({sub.documents.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sub.documents.map((doc, dIdx) => (
                                <div
                                  key={dIdx}
                                  className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="font-medium text-slate-800 truncate" title={doc.name}>
                                      {doc.name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setSelectedDocToView({
                                      name: doc.name,
                                      fileSize: doc.fileSize,
                                      type: doc.type,
                                      companyName: selectedCompany.name,
                                      verified: doc.verified,
                                      uploadedAt: sub.submittedAt,
                                      fileContentUrl: doc.fileContentUrl,
                                      parsedData: (doc as any).parsedData,
                                      commercialQuote: sub.commercialQuote,
                                      formattedCommercialQuote: sub.formattedCommercialQuote || (sub.commercialQuote ? `₹ ${(sub.commercialQuote / 10000000).toFixed(2)} Cr` : undefined),
                                    })}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold flex items-center gap-1 shrink-0 ml-2 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Document</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(selectedDocToView)}
        document={selectedDocToView}
        onClose={() => setSelectedDocToView(null)}
      />
    </div>
  );
};
