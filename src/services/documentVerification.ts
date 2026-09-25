import type { Company, DocumentVerificationResult, TenderCondition, GemFrameworkEvaluation, Tender, TenderComplianceVerificationItem } from '../types';

export interface VerificationDocumentInput {
  name: string;
  type?: string;
  fileSize?: string;
  parsedData?: {
    full_text?: string;
    [key: string]: any;
  };
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

export interface SubmissionVerificationResponse {
  success: boolean;
  submissionId: string;
  overallStatus: 'Verified' | 'Under Review' | 'Disqualified';
  complianceScore: number;
  apiScore?: number;
  conditionScore?: number | null;
  evaluationSummary?: string;
  flags: string[];
  documents: DocumentVerificationResult[];
  conditionChecks?: ConditionCheckResult[];
  complianceVerifications?: TenderComplianceVerificationItem[];
  gemFrameworkEvaluation?: GemFrameworkEvaluation;
}

export async function verifySubmissionDocuments(
  submissionId: string,
  company: Company,
  documents: VerificationDocumentInput[],
  tenderConditions?: TenderCondition[],
  tender?: Tender,
  commercialQuote?: number
): Promise<SubmissionVerificationResponse> {
  const response = await fetch('/api/verify-submission-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissionId,
      company,
      documents: documents.map(document => ({
        name: document.name,
        type: document.type,
        fileSize: document.fileSize,
        parsedText: document.parsedData?.full_text || '',
      })),
      tenderConditions: tenderConditions ?? [],
      tender,
      commercialQuote,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || 'Document verification failed.');
  }

  return data;
}
