import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Tender } from '../../types';
import { DocumentViewerModal, DocumentInfo } from '../DocumentViewerModal';
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

const requiredDocuments = documentGroups.flatMap(group => group.documents);

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
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; size?: string; type?: string; fileContentUrl?: string; requirement?: string }[]>([]);
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
  const uploadedRequirementCount = requiredDocuments.filter(requirement =>
    uploadedDocs.some(document => document.requirement === requirement)
  ).length;
  const allDocumentsUploaded = uploadedRequirementCount === requiredDocuments.length;

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, requirement: string) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    const rejectedCount = files.length - pdfFiles.length;
    if (rejectedCount > 0) {
      setUploadErrorMessage(`${rejectedCount} file${rejectedCount === 1 ? '' : 's'} skipped. Only PDF files are allowed.`);
    } else {
      setUploadErrorMessage(null);
    }
    if (pdfFiles.length === 0) {
      if (requirementInputRefs.current[requirement]) requirementInputRefs.current[requirement]!.value = '';
      return;
    }
    const newDocs = await Promise.all(pdfFiles.map(async f => ({
      name: f.name,
      size: f.size > 1024 * 1024 
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(f.size / 1024).toFixed(0)} KB`,
      type: f.name.split('.').pop()?.toUpperCase() || 'PDF',
      fileContentUrl: await readFileAsDataUrl(f),
      requirement
    })));
    setUploadedDocs(prev => [
      ...prev.filter(document => document.requirement !== requirement),
      newDocs[0]
    ]);
    setUploadSuccessMessage(
      pdfFiles.length === 1
        ? `${pdfFiles[0].name} uploaded successfully.`
        : `${pdfFiles.length} documents uploaded successfully. The first PDF was attached to this requirement.`
    );
    setTimeout(() => setUploadSuccessMessage(null), 2500);
    if (requirementInputRefs.current[requirement]) requirementInputRefs.current[requirement]!.value = '';
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
    if (!selectedTenderToApply || !allDocumentsUploaded) return;
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
                <span>·</span>
                <span>PAN: <strong className="font-mono text-slate-700">{selectedCompany.pan}</strong></span>
                <span>·</span>
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
                          <button
                            type="button"
                            onClick={() => setActiveTab('status')}
                            className="inline-flex items-center gap-1 mt-3 text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Bid Submitted
                          </button>
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
          <div className="bg-white border border-slate-200 border-t-4 border-t-amber-400 shadow-2xs space-y-6 p-4 sm:p-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                Application for {selectedTenderToApply.tenderNumber}
              </span>
              <div className="sm:text-right">
                <h2 className="text-sm font-bold text-slate-900">{selectedTenderToApply.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedTenderToApply.ministry} · {selectedTenderToApply.organization}</p>
              </div>
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
              <div className="bg-white border border-slate-200 border-t-4 border-t-amber-400 px-4 py-4">
                <h3 className="text-sm font-bold text-slate-900">Upload Required Bid Documents <span className="text-red-600">*</span></h3>
                <p className="text-xs text-slate-500 mt-1">
                  Every document below is compulsory. Upload one PDF for each requirement.
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-2">
                  Uploaded: {uploadedRequirementCount} / {requiredDocuments.length} required documents
                </p>
              </div>

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

              <div className="space-y-5">
                {documentGroups.map(group => (
                  <section key={group.title} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
                      <h4 className="text-sm font-bold text-slate-800">{group.title} <span className="text-red-600">*</span></h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {group.documents.map(requirement => {
                        const uploadedDoc = uploadedDocs.find(doc => doc.requirement === requirement);
                        const requirementId = requirement.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
                        return (
                          <div key={requirement} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 text-xs block">{requirement} <span className="text-red-600">*</span></span>
                                {uploadedDoc ? (
                                  <span className="text-[10px] text-emerald-700 block truncate">{uploadedDoc.name} · {uploadedDoc.size}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 block">PDF required</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {uploadedDoc && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDocToView({ name: uploadedDoc.name, fileSize: uploadedDoc.size, type: uploadedDoc.type, companyName: selectedCompany.name, fileContentUrl: uploadedDoc.fileContentUrl })}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </button>
                                  <button type="button" onClick={() => handleRemoveDoc(uploadedDocs.indexOf(uploadedDoc))} className="p-1 text-slate-400 hover:text-red-600 rounded" title="Remove document">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <input ref={element => { requirementInputRefs.current[requirement] = element; }} id={requirementId} type="file" accept="application/pdf,.pdf" onChange={event => handleFileSelect(event, requirement)} className="hidden" />
                              <button type="button" onClick={() => requirementInputRefs.current[requirement]?.click()} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" /> Upload File
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
                disabled={!allDocumentsUploaded}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{allDocumentsUploaded ? `Submit Final Bid (${uploadedDocs.length} Documents)` : `Upload All Required Documents (${uploadedRequirementCount}/${requiredDocuments.length})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: VIEW SUBMISSION STATUS */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 border-t-4 border-t-amber-400 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
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
                      <div key={sub.id} className="p-4 space-y-3 border-t-4 border-t-amber-400">
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
                                      fileContentUrl: doc.fileContentUrl
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
