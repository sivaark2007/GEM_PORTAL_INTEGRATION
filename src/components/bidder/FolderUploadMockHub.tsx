import React, { useState, useRef, useEffect } from 'react';
import { Company } from '../../types';
import { 
  FolderUp, 
  Sparkles, 
  FileCheck2, 
  Layers, 
  FolderArchive, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ChevronRight, 
  RefreshCw, 
  UploadCloud, 
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { 
  fetchAvailableMockFolders, 
  loadMockFolderDocuments, 
  findBestMatchingMockFolder, 
  processLocalFolderFiles,
  MockFolderInfo,
  LoadedMockDocument
} from '../../services/mockDocsService';
import { ALL_REQUIREMENT_SLOTS } from '../../utils/mockDocMapper';

interface FolderUploadMockHubProps {
  selectedCompany: Company;
  uploadedDocs: Array<{
    name: string;
    requirement?: string;
    size?: string;
    type?: string;
    fileContentUrl?: string;
    parsedData?: any;
    parseError?: string;
    isMismatch?: boolean;
    validationWarning?: string;
    detectedDocType?: string;
  }>;
  onDocumentsLoaded: (docs: LoadedMockDocument[], sourceDescription: string) => void;
  onClearAll: () => void;
  onRunAutoCheck: () => void;
}

export const FolderUploadMockHub: React.FC<FolderUploadMockHubProps> = ({
  selectedCompany,
  uploadedDocs,
  onDocumentsLoaded,
  onClearAll,
  onRunAutoCheck,
}) => {
  const [mockFolders, setMockFolders] = useState<MockFolderInfo[]>([]);
  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);
  const [progressInfo, setProgressInfo] = useState<{ current: number; total: number; filename: string } | null>(null);
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);

  // Fetch available mock folders on mount
  useEffect(() => {
    let isMounted = true;
    fetchAvailableMockFolders().then(folders => {
      if (isMounted) setMockFolders(folders);
    });
    return () => { isMounted = false; };
  }, []);

  // Find best matching mock folder for active company
  const matchingMockFolder = findBestMatchingMockFolder(selectedCompany, mockFolders);

  // Calculate coverage stats
  const totalSlotsCount = 22;
  const uniqueFilledSlots = new Set(uploadedDocs.map(d => d.requirement).filter(Boolean));
  const filledCount = uniqueFilledSlots.size;
  const isComplete = filledCount >= totalSlotsCount;
  const completionPercentage = Math.min(100, Math.round((filledCount / totalSlotsCount) * 100));

  // Handler: 1-Click Load Mock Folder from cloud_tender_docs
  const handleLoadMockDossier = async (folderName?: string) => {
    const targetFolder = folderName || matchingMockFolder?.folderName || mockFolders[0]?.folderName || '01_ABC_Technologies_Pvt_Ltd';
    setIsLoadingMock(true);
    setStatusMessage({ type: 'info', text: `Loading mock dossier from cloud_tender_docs/${targetFolder}...` });

    try {
      const result = await loadMockFolderDocuments(targetFolder, selectedCompany);
      if (result.success && result.documents && result.documents.length > 0) {
        onDocumentsLoaded(result.documents, `Mock Dossier (${result.folderName})`);
        setStatusMessage({
          type: 'success',
          text: `Successfully loaded and auto-detected ${result.documents.length} mock documents from ${result.folderName} for ${selectedCompany.name}!`
        });
        setIsSelectorModalOpen(false);
      } else {
        throw new Error(result.error || 'No documents found in mock folder.');
      }
    } catch (err: any) {
      console.error('Error loading mock folder:', err);
      setStatusMessage({
        type: 'error',
        text: `Failed to load mock folder: ${err?.message || 'Check server connection'}`
      });
    } finally {
      setIsLoadingMock(false);
      setTimeout(() => {
        setStatusMessage(prev => prev?.type === 'success' ? null : prev);
      }, 5000);
    }
  };

  // Handler: Local Folder Upload via <input webkitdirectory />
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = '';
    if (files.length === 0) return;

    await processAndApplyLocalFiles(files);
  };

  // Handler: Drag and Drop folder or multiple files
  const handleFolderDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverFolder(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    await processAndApplyLocalFiles(files);
  };

  const processAndApplyLocalFiles = async (files: File[]) => {
    setIsProcessingFolder(true);
    setProgressInfo({ current: 0, total: files.length, filename: files[0]?.name || '' });

    try {
      const { mappedDocs, slotsCoveredCount } = await processLocalFolderFiles(
        files,
        (current, total, filename) => {
          setProgressInfo({ current, total, filename });
        }
      );

      if (mappedDocs.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No compatible documents (.pdf, .png, .jpg, .docx) found in the selected folder.'
        });
        return;
      }

      onDocumentsLoaded(mappedDocs, `Folder Upload (${mappedDocs.length} files)`);
      setStatusMessage({
        type: 'success',
        text: `Successfully scanned folder: ${mappedDocs.length} files processed, covering ${slotsCoveredCount} statutory requirement slots!`
      });
    } catch (err: any) {
      console.error('Error processing folder upload:', err);
      setStatusMessage({
        type: 'error',
        text: `Folder upload error: ${err?.message || 'Failed to process files'}`
      });
    } finally {
      setIsProcessingFolder(false);
      setProgressInfo(null);
      setTimeout(() => {
        setStatusMessage(prev => prev?.type === 'success' ? null : prev);
      }, 5000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-indigo-700/40 shadow-lg space-y-4">
      {/* Hidden webkitdirectory input for folder selection */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderInputChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-700/40 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
            <FolderUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Folder-Wise Bidder Document Auto-Upload &amp; Mock Repository
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                cloud_tender_docs Ready
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Upload an entire company folder or load verified mock dossiers with 1-click automatic requirement slot detection.
            </p>
          </div>
        </div>

        {/* Coverage Counter Badge */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-slate-200">Slots Filled:</span>
            <span className={`font-mono font-bold ${isComplete ? 'text-emerald-400' : 'text-amber-300'}`}>
              {filledCount} / {totalSlotsCount} ({completionPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Action Hub Cards: 2 Columns (Local Folder Upload + Mock Repository) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* Card 1: 📁 Local Folder Upload / Drop */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragOverFolder(true); }}
          onDragLeave={() => setIsDragOverFolder(false)}
          onDrop={handleFolderDrop}
          className={`relative p-4 rounded-xl border transition-all ${
            isDragOverFolder
              ? 'bg-indigo-600/30 border-amber-400 scale-[1.01]'
              : 'bg-white/5 hover:bg-white/[0.08] border-white/10'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Option 1: Upload Local Company Folder
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Select your local bidder folder (e.g. folder from <code className="text-amber-300 bg-black/30 px-1 rounded">cloud_tender_docs</code> or customized docs). Automatically detects and maps all 22 slots.
              </p>
            </div>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessingFolder}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <FolderUp className="w-3.5 h-3.5" />
              <span>{isProcessingFolder ? 'Scanning...' : 'Select Folder'}</span>
            </button>
          </div>

          {/* Progress Indicator for local folder parsing */}
          {isProcessingFolder && progressInfo && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-indigo-200 font-mono">
                <span className="truncate max-w-[200px]">Scanning: {progressInfo.filename}</span>
                <span>{progressInfo.current} of {progressInfo.total} files</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-200 rounded-full"
                  style={{ width: `${(progressInfo.current / progressInfo.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card 2: ⚡ One-Click Mock Dossier from cloud_tender_docs */}
        <div className="p-4 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Option 2: Mock Dossier from cloud_tender_docs
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Instantly populate all 22 statutory documents for <strong>{selectedCompany.name}</strong> from the pre-verified mock repository.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleLoadMockDossier()}
                disabled={isLoadingMock}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                {isLoadingMock ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                )}
                <span>{isLoadingMock ? 'Loading Docs...' : 'Auto-Load Mock Dossier'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSelectorModalOpen(true)}
                title="Choose from other mock company folders"
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Matched folder chip */}
          {matchingMockFolder && (
            <div className="text-[11px] text-indigo-200/90 flex items-center justify-between bg-black/20 px-2.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5 truncate">
                <FolderArchive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Matched folder: <code className="font-mono text-amber-300">{matchingMockFolder.folderName}</code></span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold shrink-0">22 / 22 PDFs</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Status Message Alert */}
      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-3 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
            : statusMessage.type === 'error'
              ? 'bg-rose-500/20 border border-rose-400/40 text-rose-200'
              : 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0 animate-spin" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Strip (Bottom bar with fast actions & slot breakdown) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-indigo-700/40 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-300 font-medium">Quick Actions:</span>
          {uploadedDocs.length > 0 && (
            <>
              <button
                type="button"
                onClick={onRunAutoCheck}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Run Slot Auto-Check</span>
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All Attached ({uploadedDocs.length})</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-indigo-200">
          <span>Individual uploads available below for each requirement slot.</span>
        </div>
      </div>

      {/* Modal: Select Any Mock Folder from cloud_tender_docs */}
      {isSelectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-white space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FolderArchive className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Select Mock Folder from cloud_tender_docs</h3>
                  <p className="text-xs text-slate-400">Choose any bidder entity folder to populate documents</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {mockFolders.map((folder) => {
                const isSelected = matchingMockFolder?.folderName === folder.folderName;
                return (
                  <div
                    key={folder.folderName}
                    onClick={() => handleLoadMockDossier(folder.folderName)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-amber-400/10 border-amber-400/50 hover:bg-amber-400/20' 
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-200'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-white truncate">{folder.matchedCompanyName}</span>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Active Entity Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{folder.folderName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-800">
                        {folder.fileCount || 22} Docs
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg shadow-xs"
                      >
                        Load Folder
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSelectorModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
