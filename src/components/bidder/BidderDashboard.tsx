import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Tender } from '../../types';
import { DocumentViewerModal, DocumentInfo } from '../DocumentViewerModal';
import { TenderListCard } from '../shared/TenderListCard';
import { TenderDetailSummary } from '../shared/TenderDetailSummary';
import { parseDocumentWithService } from '../../services/documentParser';
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
  FileCheck,
  Plus,
  Eye,
  Trash2,
  FolderUp,
  File,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const documentGroups = [
  {
    number: '1',
    title: '1. Identity & Tax',
    description: 'Mandatory PAN, GST and recent tax filings for legal and fiscal verification',
    documents: [
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
  }
];

type UploadedDocument = {
  name: string;
  size?: string;
  type?: string;
  requirement?: string;
  fileContentUrl?: string;
  parsedData?: any;
  parseError?: string;
};

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
    setSelectedDocToView({
      name: gemDoc.name,
      fileSize: gemDoc.fileSize,
      type: 'PDF',
      companyName: 'GeM Portal',
      verified: true,
      uploadedAt: gemDoc.uploadedAt,
      fileContentUrl: gemDoc.fileContentUrl,
      parsedData: gemDoc.parsedData,
    });
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const parseDocumentsInSequence = async (files: File[]) => {
    for (const file of files) {
      try {
        const parsed = await parseDocumentWithService(file, file.name);
        if (parsed?.success) {
          setUploadedDocs(prev => prev.map(doc =>
            doc.name === file.name ? { ...doc, parsedData: parsed, parseError: undefined } : doc
          ));
        } else {
          setUploadedDocs(prev => prev.map(doc =>
            doc.name === file.name
              ? { ...doc, parseError: parsed?.error || 'The document could not be parsed.' }
              : doc
          ));
        }
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
    const initialDocs: UploadedDocument[] = await Promise.all(validFiles.map(async f => ({
      name: f.name,
      requirement: requirement || f.name,
      size: f.size > 1024 * 1024 
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(f.size / 1024).toFixed(0)} KB`,
      type: f.name.split('.').pop()?.toUpperCase() || 'PDF',
      fileContentUrl: await readFileAsDataUrl(f),
      parsedData: undefined
    })));

    setUploadedDocs(prev => {
      if (requirement) {
        // Replace existing document(s) for this requirement
        const others = prev.filter(d => d.requirement !== requirement);
        return [...others, ...initialDocs];
      }
      return [...prev, ...initialDocs];
    });

    setUploadSuccessMessage(
      requirement
        ? `${validFiles[0].name} attached for ${requirement}.`
        : validFiles.length === 1
          ? `${validFiles[0].name} attached successfully.`
          : `${validFiles.length} documents attached successfully.`
    );
    setTimeout(() => setUploadSuccessMessage(null), 3500);

    // Run one CPU-intensive parser job at a time to keep the app responsive.
    void parseDocumentsInSequence(validFiles);
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

    const initialDocs: UploadedDocument[] = await Promise.all(validFiles.map(async f => ({
      name: f.name,
      size: f.size > 1024 * 1024 
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(f.size / 1024).toFixed(0)} KB`,
      type: f.name.split('.').pop()?.toUpperCase() || 'PDF',
      fileContentUrl: await readFileAsDataUrl(f),
      parsedData: undefined
    })));

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
    submitBid(selectedTenderToApply.id, selectedCompany.id, uploadedDocs);
    setSubmissionSuccess(true);
    setUploadedDocs([]);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  Tender No: {selectedTenderToApply.tenderNumber}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedTenderToApply.title}</h2>
                <p className="text-xs text-slate-500">{selectedTenderToApply.organization} · {selectedTenderToApply.ministry}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 block">Total Uploaded</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {uploadedDocs.length} / 15 Documents
                </span>
              </div>
            </div>

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

                        return (
                          <div
                            key={docName}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                          >
                            {/* Document Info */}
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                uploadedDoc 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {uploadedDoc ? (
                                  <FileCheck className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <FileText className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-slate-900">{docName}</span>
                                  {uploadedDoc && (
                                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Uploaded
                                    </span>
                                  )}
                                </div>

                                {uploadedDoc ? (
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 flex-wrap">
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
                                    onClick={() => setSelectedDocToView({
                                      name: uploadedDoc.name,
                                      fileSize: uploadedDoc.size || '1.8 MB',
                                      type: uploadedDoc.type || 'PDF',
                                      companyName: selectedCompany.name,
                                      fileContentUrl: uploadedDoc.fileContentUrl,
                                      parsedData: uploadedDoc.parsedData
                                    })}
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
                                  uploadedDoc
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Files</span>
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
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Signing Authority: <strong className="text-slate-800">{selectedCompany.name}</strong>
              </span>
              <button
                onClick={handleFinalSubmit}
                disabled={uploadedDocs.length === 0}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Final Bid ({uploadedDocs.length} Documents)</span>
              </button>
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
                                      parsedData: (doc as any).parsedData
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
