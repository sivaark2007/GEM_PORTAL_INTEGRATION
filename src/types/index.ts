export type AppRole = 'none' | 'officer' | 'bidder';

export type AppView =
  | 'role-selection'
  | 'bidder-selection'
  | 'officer-dashboard'
  | 'bidder-dashboard';

export interface Company {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  gstin: string;
  pan: string;
  udyamNumber: string;
  cin: string;
  city?: string;
  sector?: string;
  color?: string;
  registeredDate?: string;
  isCustom?: boolean;
}

export interface TenderRequirement {
  id: string;
  title: string;
  category: 'financial' | 'technical' | 'compliance' | 'statutory';
  description: string;
  mandatory: boolean;
}

export interface TenderCondition {
  title: string;
  category: 'financial' | 'technical' | 'compliance' | 'statutory';
  description: string;
  mandatory: boolean;
  rule_condition?: {
    field?: string;
    operator?: string;
    value?: any;
    unit?: string;
    years?: number;
  };
}

export interface NeededDocument {
  document_name: string;
  category: string;
  mandatory: boolean;
  purpose: string;
}

export interface TechnicalSpecification {
  parameter: string;
  required_value: string;
  category?: string;
}

export interface TenderSummaryInfo {
  tender_title?: string;
  scope_of_work?: string;
  estimated_value?: string | null;
  closing_date?: string | null;
  emd_amount?: string;
  technical_specifications?: TechnicalSpecification[];
  conditions: TenderCondition[];
  needed_documents: NeededDocument[];
  summary_markdown?: string;
}

export interface GemBiddingDocument {
  name: string;
  fileSize: string;
  fileContentUrl?: string;
  uploadedAt: string;
  parsedData?: ParsedDocumentResult;
  parsingStatus?: 'processing' | 'complete' | 'failed';
  parseError?: string;
  tenderSummaryInfo?: TenderSummaryInfo;
}

export type VerificationStatus = 'VALID' | 'NOT_VALID' | 'NOT_FOUND' | 'REVIEW_REQUIRED';

export interface RegistryCheckResult {
  source: string;
  endpoint: string;
  identifier: string;
  status: VerificationStatus;
  message: string;
  rawResponse?: any;
}

export interface DocumentVerificationResult {
  documentName: string;
  finalStatus: VerificationStatus;
  extractedIdentifiers: Record<string, string[]>;
  checks: RegistryCheckResult[];
  summary: string;
}

export interface Tender {
  id: string;
  tenderNumber: string;
  title: string;
  organization: string;
  ministry: string;
  estimatedValue: string;
  category: string;
  closingDate: string;
  startDate?: string;
  endDate?: string;
  items?: string;
  quantity?: number;
  status: 'Active' | 'Evaluation' | 'Closed';
  appliedBiddersCount: number;
  requirements: TenderRequirement[];
  gemBiddingDocument?: GemBiddingDocument;
  tenderSummaryInfo?: TenderSummaryInfo;
  selectionMethod?: 'L1' | 'RA' | 'QCBS' | 'Run_L1';
  emdRequiredAmount?: string;
  technicalFilters?: {
    minTurnoverCr?: number;
    minExperienceYears?: number;
    minPerformanceQuantityPercent?: number;
    requireOEMAuth?: boolean;
  };
}

export type GemSelectionMethod = 'L1' | 'RA' | 'QCBS' | 'Run_L1';

export interface BaselineComplianceEvaluation {
  gemProfileVerified: boolean;
  panStatus: { verified: boolean; panNumber: string; message: string };
  gstinStatus: { verified: boolean; gstinNumber: string; message: string };
  bankPfmsStatus: { linked: boolean; message: string };
  debarmentCheck: {
    cleared: boolean;
    status: 'NOT_DEBARRED' | 'DEBARRED' | 'UNDER_REVIEW';
    authority?: string;
    message: string;
  };
  gfr144xiCompliance: {
    compliant: boolean;
    declarationSubmitted: boolean;
    message: string;
  };
  emdCompliance: {
    status: 'COMPLIANT' | 'EXEMPTED' | 'NON_COMPLIANT';
    requiredAmount?: string;
    submitted: boolean;
    exempted: boolean;
    exemptionReason?: 'MSE' | 'STARTUP' | 'NONE';
    message: string;
  };
  overallBaselinePassed: boolean;
}

export interface TechnicalQualificationEvaluation {
  turnoverFilter: {
    requiredCr: number;
    bidderTurnoverCr: number;
    caCertified: boolean;
    meetsCriteria: boolean;
    mseStartupExempted: boolean;
    status: 'QUALIFIED' | 'EXEMPTED' | 'DISQUALIFIED';
    message: string;
  };
  experienceFilter: {
    requiredYears: number;
    bidderYears: number;
    meetsCriteria: boolean;
    mseStartupExempted: boolean;
    status: 'QUALIFIED' | 'EXEMPTED' | 'DISQUALIFIED';
    message: string;
  };
  performanceFilter: {
    requiredPercentage: number;
    bidderPercentage: number;
    meetsCriteria: boolean;
    status: 'QUALIFIED' | 'DISQUALIFIED' | 'NOT_APPLICABLE';
    message: string;
  };
  oemAuthFilter: {
    required: boolean;
    mafSubmitted: boolean;
    verified: boolean;
    status: 'QUALIFIED' | 'DISQUALIFIED' | 'NOT_APPLICABLE';
    message: string;
  };
  overallTechnicalPassed: boolean;
}

export interface PurchasePreferenceEvaluation {
  mseExemption: {
    eligible: boolean;
    udyamVerified: boolean;
    enterpriseCategory: 'Micro' | 'Small' | 'Medium' | 'None';
    turnoverExemptionApplied: boolean;
    expExemptionApplied: boolean;
    message: string;
  };
  startupExemption: {
    eligible: boolean;
    dpiitVerified: boolean;
    applied: boolean;
    message: string;
  };
  makeInIndia: {
    supplierClass: 'Class-I Local' | 'Class-II Local' | 'Non-Local';
    localContentPercentage: number;
    preferenceEligible: boolean;
    message: string;
  };
  msePriceMatching: {
    eligibleForL1Plus15: boolean;
    priceQuote: number;
    l1PriceQuote?: number;
    within15PercentWindow: boolean;
    allocationEligiblePercent: number; // typically 25%
    message: string;
  };
}

export interface CommercialSelectionEvaluation {
  selectionMethod: GemSelectionMethod;
  commercialQuote: number;
  formattedQuote: string;
  rank?: number;
  isL1?: boolean;
  qcbsScore?: {
    technicalMarks: number;
    financialMarks: number;
    combinedScore: number;
  };
  tieBreakerStatus?: {
    isTied: boolean;
    method: 'Algorithmic Random Run' | 'Matrix Technical Merit' | 'None';
    verdict: string;
  };
  selectionVerdict: string;
}

export interface GemFrameworkEvaluation {
  stage1Baseline: BaselineComplianceEvaluation;
  stage2Technical: TechnicalQualificationEvaluation;
  stage3Preferences: PurchasePreferenceEvaluation;
  stage4Selection: CommercialSelectionEvaluation;
  finalVerdict: 'Technically Qualified & Eligible' | 'Disqualified - Baseline Failure' | 'Disqualified - Technical Criteria' | 'Debarred from Public Procurement' | 'Under Review';
  oneLineExecutiveSummary: string;
}

export type ComplianceMatchStatus = 'Match' | 'Mismatch' | 'Missing';

export interface TenderComplianceVerificationItem {
  requirement: string;
  evidence_found: string;
  status: ComplianceMatchStatus;
  reason: string;
  source_document: string;
  category?: string;
}

export interface ConditionCheckResult {
  condition_title: string;
  category: string;
  mandatory: boolean;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NOT_VERIFIABLE';
  verdict: string;
  matched_in_doc: string | null;
  evidence_snippet: string | null;
}

export interface BidSubmission {
  id: string;
  tenderId: string;
  companyId: string;
  submittedAt: string;
  status: 'Submitted' | 'Verified' | 'Under Review' | 'Disqualified';
  documents: {
    name: string;
    type: string;
    fileSize: string;
    verified: boolean;
    requirement?: string;
    fileContentUrl?: string;
    parsedData?: any;
    verificationResult?: DocumentVerificationResult;
    isMismatch?: boolean;
    mismatchWarning?: string;
  }[];
  complianceScore?: number;
  aiVerificationStage?: 'Pending' | 'OCR' | 'Govt_API' | 'Embeddings' | 'LLM_Analysis' | 'Completed';
  flags?: string[];
  /** One-line AI summary of the full evaluation result */
  evaluationSummary?: string;
  /** Per-condition semantic compliance checks from the tender */
  conditionChecks?: ConditionCheckResult[];
  /** Dynamic Tender Compliance Verification Agent Results */
  complianceVerifications?: TenderComplianceVerificationItem[];
  /** Quoted price in INR for commercial evaluation */
  commercialQuote?: number;
  formattedCommercialQuote?: string;
  /** Standardized GeM GTC/GFR 4-Stage Compliance Evaluation */
  gemFrameworkEvaluation?: GemFrameworkEvaluation;
}

export interface ParsedDocumentResult {
  success: boolean;
  filename: string;
  full_text: string;
  pages?: any[];
  metadata?: {
    parser?: string;
    ocr_used?: boolean;
    [key: string]: any;
  };
  error?: string;
  code?: string;
  document_type?: string;
  document_title?: string;
  extractedData?: Record<string, string>;
  aiInsights?: string;
  ocrSampleText?: string;
  is_tender_document?: boolean;
  tenderSummaryInfo?: TenderSummaryInfo;
  slotValidation?: {
    isMatch: boolean;
    slotRequirement?: string;
    detectedDocType?: string;
    reason?: string;
  };
}
