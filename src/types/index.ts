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

export interface GemBiddingDocument {
  name: string;
  fileSize: string;
  fileContentUrl?: string;
  uploadedAt: string;
  parsedData?: ParsedDocumentResult;
  parsingStatus?: 'processing' | 'complete' | 'failed';
  parseError?: string;
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
    fileContentUrl?: string;
    parsedData?: any;
  }[];
  complianceScore?: number;
  aiVerificationStage?: 'Pending' | 'OCR' | 'Govt_API' | 'Embeddings' | 'LLM_Analysis' | 'Completed';
  flags?: string[];
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
  extractedData?: Record<string, string>;
  aiInsights?: string;
  ocrSampleText?: string;
}
