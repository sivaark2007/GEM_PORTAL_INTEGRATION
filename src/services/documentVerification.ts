import type { Company, DocumentVerificationResult } from '../types';

export interface VerificationDocumentInput {
  name: string;
  type?: string;
  fileSize?: string;
  parsedData?: {
    full_text?: string;
    [key: string]: any;
  };
}

export interface SubmissionVerificationResponse {
  success: boolean;
  submissionId: string;
  overallStatus: 'Verified' | 'Under Review' | 'Disqualified';
  complianceScore: number;
  flags: string[];
  documents: DocumentVerificationResult[];
}

export async function verifySubmissionDocuments(
  submissionId: string,
  company: Company,
  documents: VerificationDocumentInput[]
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
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || 'Document verification failed.');
  }

  return data;
}
