import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Tender } from '../../types';
import { DocumentViewerModal, DocumentInfo } from '../DocumentViewerModal';
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
    title: 'Identity & Tax',
    documents: ['PAN Card / PAN Details', 'GST Registration Certificate / GSTIN', 'Income Tax Return (ITR)']
  },
  {
    title: 'Business Registration',
    documents: ['Udyam Registration Certificate', 'MCA Company/LLP Registration Details', 'Startup India / DPIIT Recognition Certificate', 'NSIC Registration Certificate']
  },
  {
    title: 'Statutory Compliance',
    documents: ['EPFO Registration Details', 'ESIC Registration Details', 'GST Compliance / Return Details', 'Income Tax Compliance Details']
  },
  {
    title: 'Product / Procurement Compliance',
    documents: ['BIS Certificate / Licence', 'Make in India / Local Content Declaration', 'OEM Authorization Certificate']
  },
  {
    title: 'Digital Document Verification',
    documents: ['DigiLocker-issued Documents']
  }
];

export const BidderDashboard: React.FC = () => {
  const { 
    selectedCompany, 
    tenders, 
    submissions, 
    submitBid, 
    navigateTo 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'available' | 'apply' | 'status'>('available');
  const [selectedTenderToApply, setSelectedTenderToApply] = useState<Tender | null>(tenders[0]);
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; size?: string; type?: string; fileContentUrl?: string; parsedData?: any }[]>([
    { name: 'Technical_Specification_Compliance.pdf', size: '2.4 MB', type: 'PDF' },
    { name: 'Make_in_India_Declaration_FY26.pdf', size: '1.1 MB', type: 'PDF' },
    { name: 'CA_Audited_Balance_Sheet.pdf', size: '3.8 MB', type: 'PDF' }
  ]);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [selectedDocToView, setSelectedDocToView] = useState<DocumentInfo | null>(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});
  const requirementInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
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

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, requirement: string) => {
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

    // 1. Immediately read data URLs and add docs to list so UI updates instantly
    const initialDocs = await Promise.all(validFiles.map(async f => ({
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

    // 2. Parse in background asynchronously without blocking UI
    validFiles.forEach(async (f) => {
      try {
        const parsed = await parseDocumentWithService(f, f.name);
        if (parsed && parsed.success) {
          setUploadedDocs(prev => prev.map(doc => 
            doc.name === f.name ? { ...doc, parsedData: parsed } : doc
          ));
        }
      } catch (err) {
        console.warn('Background parsing notice for', f.name, err);
      }
    });
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

    // 1. Immediately read data URLs and add docs to list so UI updates instantly
    const initialDocs = await Promise.all(validFiles.map(async f => ({
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

    // 2. Parse in background asynchronously without blocking UI
    validFiles.forEach(async (f) => {
      try {
        const parsed = await parseDocumentWithService(f, f.name);
        if (parsed && parsed.success) {
          setUploadedDocs(prev => prev.map(doc => 
            doc.name === f.name ? { ...doc, parsedData: parsed } : doc
          ));
        }
      } catch (err) {
        console.warn('Background parsing notice for', f.name, err);
      }
    });
  };

  const handleRemoveDoc = (idx: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== idx));
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
    setTimeout(() => {
      setSubmissionSuccess(false);
      setActiveTab('status');
    }, 1500);
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
              {selectedCompany.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{selectedCompany.name}</h1>
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
                  <div key={tender.id} className="bg-white border border-slate-200 border-t-4 border-t-amber-400 shadow-2xs hover:shadow-sm transition-shadow">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-800">
                        BID NO: <span className="text-sky-700 font-bold">{tender.tenderNumber}</span>
                      </div>
                      <span className="text-xs text-sky-700 font-semibold">{tender.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.35fr_0.9fr] gap-4 px-4 py-4 text-xs">
                      <div>
                        <div className="font-bold text-slate-800 mb-1">Items:</div>
                        <div className="text-slate-700 leading-relaxed">{tender.title}</div>
                        <div className="text-slate-500 mt-2">Category: <span className="text-slate-700">{tender.category}</span></div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 mb-1">Department Name And Address:</div>
                        <div className="text-slate-700">{tender.ministry}</div>
                        <div className="text-slate-700 mt-1">{tender.organization}</div>
                      </div>
                      <div className="md:text-right">
                        <div><span className="font-bold text-slate-800">Bid End Date:</span> <span className="text-amber-600">{tender.closingDate}</span></div>
                        <div className="mt-2"><span className="font-bold text-slate-800">Estimated Value:</span> <span className="text-slate-700">{tender.estimatedValue}</span></div>
                        {alreadySubmitted ? (
                          <div className="inline-flex items-center gap-1 mt-3 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Bid Submitted
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedTenderToApply(tender);
                              setActiveTab('apply');
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-900 font-semibold underline underline-offset-2"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> View / Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: APPLY & UPLOAD DOCUMENTS */}
        {activeTab === 'apply' && selectedTenderToApply && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                Application for {selectedTenderToApply.tenderNumber}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedTenderToApply.title}</h2>
              <p className="text-xs text-slate-500">{selectedTenderToApply.organization}</p>
            </div>

            {submissionSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-bold">Documents Submitted Successfully!</strong>
                  <p>Your documents have been routed to the GeM AI Compliance Evaluation queue.</p>
                </div>
              </div>
            )}

            {/* Document Upload Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Required Bid Documents</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload one PDF for each applicable document requirement.
                </p>
              </div>

              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/tiff,.docx"
              />

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

              {/* Drag & Drop Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[1.005]'
                    : 'border-slate-300 bg-slate-50/60 hover:border-emerald-500 hover:bg-emerald-50/20'
                }`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragging ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-semibold text-slate-700">
                  {isDragging ? 'Drop documents to attach...' : 'Drag & drop bid files here or click to browse'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PDF files only, up to 25 MB
                </p>
              </div>

              {/* Document List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Attached Documents ({uploadedDocs.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click "View" to preview document &amp; OCR metadata</span>
                </h4>

                {uploadedDocs.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                    No documents attached yet. Attach your required bid documents below.
                  </div>
                ) : (
                  uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-2xs hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 block truncate">{doc.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{doc.type || 'PDF'} &bull; {doc.size || '1.8 MB'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {doc.parsedData ? (
                          doc.parsedData.metadata?.ocr_used ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hidden sm:inline">
                              OCR Extracted
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden sm:inline">
                              Parsed (Digital)
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 hidden sm:flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Parsing...
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedDocToView({
                            name: doc.name,
                            fileSize: doc.size || '1.8 MB',
                            type: doc.type || 'PDF',
                            companyName: selectedCompany.name,
                            fileContentUrl: doc.fileContentUrl,
                            parsedData: (doc as any).parsedData
                          })}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Signing Authority: <strong className="text-slate-800">{selectedCompany.name}</strong>
              </span>
              <button
                onClick={handleFinalSubmit}
                disabled={uploadedDocs.length === 0}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
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
