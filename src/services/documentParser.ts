import { ParsedDocumentResult } from '../types';

export async function parseDocumentWithService(
  fileOrBlob: File | Blob,
  filename: string
): Promise<ParsedDocumentResult> {
  const formData = new FormData();
  formData.append('file', fileOrBlob, filename);

  try {
    const response = await fetch('/api/parse-document', {
      method: 'POST',
      body: formData,
    });

    const data: ParsedDocumentResult = await response.json();
    return data;
  } catch (error: any) {
    console.warn('[DocumentParser] Error contacting backend parser service:', error);
    return {
      success: false,
      filename,
      full_text: '',
      pages: [],
      metadata: {
        parser: 'Docling',
        ocr_used: false,
      },
      error: error?.message || 'Failed to connect to parser service. Make sure backend is running.',
      code: 'NETWORK_ERROR'
    };
  }
}
