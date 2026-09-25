import { Company } from '../types';
import { mapFilenameToRequirementSlot, normalizeCompanyFolderName, ALL_REQUIREMENT_SLOTS } from '../utils/mockDocMapper';

export interface MockFolderInfo {
  folderName: string;
  matchedCompanyName: string;
  matchedCompanyId?: string;
  fileCount: number;
  files: Array<{
    fileName: string;
    fileSize: string;
    mappedSlot: string;
  }>;
}

export interface LoadedMockDocument {
  name: string;
  size: string;
  type: string;
  requirement: string;
  fileContentUrl: string;
  parsedData?: any;
  isMismatch?: boolean;
  validationWarning?: string;
  detectedDocType?: string;
}

export interface MockFolderDataResponse {
  success: boolean;
  folderName: string;
  companyName: string;
  totalDocuments: number;
  documents: LoadedMockDocument[];
  error?: string;
}

/**
 * Reads browser file as base64 Data URL
 */
export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Format byte count to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  if (bytes < k * 1024) {
    return `${(bytes / k).toFixed(1)} KB`;
  }
  return `${(bytes / (k * k)).toFixed(1)} MB`;
}

/**
 * Fetches list of mock company folders available in cloud_tender_docs from backend
 */
export async function fetchAvailableMockFolders(): Promise<MockFolderInfo[]> {
  try {
    const response = await fetch('/api/mock-tender-docs/folders');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();
    if (data.success && Array.isArray(data.folders)) {
      return data.folders;
    }
    return [];
  } catch (error) {
    console.warn('[MockDocsService] Failed to fetch folders from backend, falling back to static list:', error);
    // Fallback static list of the 10 known mock folders
    return [
      { folderName: '01_ABC_Technologies_Pvt_Ltd', matchedCompanyName: 'ABC Technologies Pvt Ltd', fileCount: 22, files: [] },
      { folderName: '02_XYZ_Solutions_Private_Limited', matchedCompanyName: 'XYZ Solutions Private Limited', fileCount: 22, files: [] },
      { folderName: '03_PQR_Electronics_Private_Limited', matchedCompanyName: 'PQR Electronics Private Limited', fileCount: 22, files: [] },
      { folderName: '04_LMN_Industrial_Solutions_Pvt_Ltd', matchedCompanyName: 'LMN Industrial Solutions Pvt Ltd', fileCount: 22, files: [] },
      { folderName: '05_RST_Technologies_Limited', matchedCompanyName: 'RST Technologies Limited', fileCount: 22, files: [] },
      { folderName: '06_WXYZ_Computer_Systems_Pvt_Ltd', matchedCompanyName: 'WXYZ Computer Systems Pvt Ltd', fileCount: 22, files: [] },
      { folderName: '07_MNO_Office_Equipment_Pvt_Ltd', matchedCompanyName: 'MNO Office Equipment Pvt Ltd', fileCount: 22, files: [] },
      { folderName: '08_QRS_Digital_Systems_Pvt_Ltd', matchedCompanyName: 'QRS Digital Systems Pvt Ltd', fileCount: 22, files: [] },
      { folderName: '09_ABC_Industrial_Automation_Pvt_Ltd', matchedCompanyName: 'ABC Industrial Automation Pvt Ltd', fileCount: 22, files: [] },
      { folderName: '10_FGH_Infrastructure_Solutions_Pvt_Ltd', matchedCompanyName: 'FGH Infrastructure Solutions Pvt Ltd', fileCount: 22, files: [] },
    ];
  }
}

/**
 * Loads all documents for a specific mock folder from the backend
 */
export async function loadMockFolderDocuments(folderName: string, company?: Company): Promise<MockFolderDataResponse> {
  try {
    const response = await fetch(`/api/mock-tender-docs/folder-data/${encodeURIComponent(folderName)}`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data: MockFolderDataResponse = await response.json();
    return data;
  } catch (error: any) {
    console.warn(`[MockDocsService] Failed to load documents from backend for ${folderName}:`, error);
    throw error;
  }
}

/**
 * Helper to match a selected company with the best mock folder in cloud_tender_docs
 */
export function findBestMatchingMockFolder(company: Company | null, folders: MockFolderInfo[]): MockFolderInfo | null {
  if (!company || folders.length === 0) return null;

  const targetName = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct exact or substring match
  for (const folder of folders) {
    const norm = normalizeCompanyFolderName(folder.folderName).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm === targetName || norm.includes(targetName) || targetName.includes(norm)) {
      return folder;
    }
  }

  // 2. Initial letters / keyword match (e.g. "ABC", "XYZ", "PQR")
  const firstWord = company.name.split(' ')[0].toLowerCase();
  for (const folder of folders) {
    if (folder.folderName.toLowerCase().includes(firstWord)) {
      return folder;
    }
  }

  // Fallback to first folder
  return folders[0] || null;
}

/**
 * Processes a list of browser files from a folder selection or drag-drop,
 * and automatically maps each file to its exact requirement slot.
 */
export async function processLocalFolderFiles(
  files: File[],
  onProgress?: (processed: number, total: number, currentFile: string) => void
): Promise<{
  mappedDocs: LoadedMockDocument[];
  unmappedFiles: File[];
  slotsCoveredCount: number;
}> {
  const validFiles = files.filter(file => {
    const ext = file.name.toLowerCase();
    return ext.endsWith('.pdf') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.tiff') || ext.endsWith('.webp') || ext.endsWith('.docx') || ext.endsWith('.txt');
  });

  const mappedDocs: LoadedMockDocument[] = [];
  const unmappedFiles: File[] = [];

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    if (onProgress) {
      onProgress(i + 1, validFiles.length, file.name);
    }

    const { slotName, confidence } = mapFilenameToRequirementSlot(file.name);
    const dataUrl = await readFileAsDataUrl(file);

    const doc: LoadedMockDocument = {
      name: file.name,
      size: formatBytes(file.size),
      type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
      requirement: slotName,
      fileContentUrl: dataUrl,
      parsedData: {
        success: true,
        filename: file.name,
        full_text: `[Local File: ${file.name}] Uploaded for requirement slot: ${slotName}`,
        document_title: slotName,
        metadata: {
          parser: 'Folder Auto-Detector',
          ocr_used: false,
          confidence,
        }
      },
      isMismatch: false,
    };

    mappedDocs.push(doc);
  }

  const uniqueSlots = new Set(mappedDocs.map(d => d.requirement));

  return {
    mappedDocs,
    unmappedFiles,
    slotsCoveredCount: uniqueSlots.size,
  };
}
