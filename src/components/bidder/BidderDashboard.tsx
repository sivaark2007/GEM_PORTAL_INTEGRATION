import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tender } from '../../types';
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
  Plus
} from 'lucide-react';

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
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([
    'Technical_Specification_Compliance.pdf',
    'Make_in_India_Declaration_FY26.pdf',
    'CA_Audited_Balance_Sheet.pdf'
  ]);
  const [customDocName, setCustomDocName] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

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

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocName.trim()) return;
    setUploadedDocs(prev => [...prev, customDocName.trim().endsWith('.pdf') ? customDocName.trim() : `${customDocName.trim()}.pdf`]);
    setCustomDocName('');
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tenders.map((tender) => {
                const alreadySubmitted = submissions.some(
                  s => s.tenderId === tender.id && s.companyId === selectedCompany.id
                );

                return (
                  <div key={tender.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-mono text-slate-600">{tender.tenderNumber}</span>
                        <span className="font-semibold text-emerald-700">{tender.status}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mb-2">{tender.title}</h3>
                      <div className="text-xs text-slate-600 space-y-1 mb-4">
                        <div><span className="text-slate-400">Authority:</span> {tender.organization}</div>
                        <div><span className="text-slate-400">Budget:</span> <strong className="text-slate-800">{tender.estimatedValue}</strong></div>
                        <div><span className="text-slate-400">Closing:</span> {tender.closingDate}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      {alreadySubmitted ? (
                        <div className="w-full py-2 px-3 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Bid Submitted</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTenderToApply(tender);
                            setActiveTab('apply');
                          }}
                          className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>Apply for Tender</span>
                        </button>
                      )}
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
                  <strong className="font-bold">Bid Successfully Submitted!</strong>
                  <p>Your documents have been routed to the GeM AI Compliance Evaluation queue.</p>
                </div>
              </div>
            )}

            {/* Document Upload Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Upload Required Bid Documents</h3>
              <p className="text-xs text-slate-500 mb-4">
                Please attach technical specifications, CA turnover balance sheets, and Make-in-India declarations.
              </p>

              {/* Document List */}
              <div className="space-y-2 mb-4">
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>{doc}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">Ready for OCR Scan</span>
                  </div>
                ))}
              </div>

              {/* Add Custom Document Form */}
              <form onSubmit={handleAddDocument} className="flex gap-2">
                <input
                  type="text"
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  placeholder="e.g. OEM_Authorization_MAF.pdf"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </form>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Signing Authority: <strong className="text-slate-800">{selectedCompany.name}</strong>
              </span>
              <button
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Final Bid</span>
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
                  <p className="mb-2">No active bids submitted by this dummy company yet.</p>
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
                    return (
                      <div key={sub.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-mono text-emerald-700 font-semibold">{sub.tenderId}</div>
                          <div className="text-sm font-bold text-slate-900">{tender?.title || 'Tender'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Submitted: {sub.submittedAt}</div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-[11px] text-slate-400">AI Evaluation</div>
                            <span className="font-bold text-xs font-mono text-slate-800">
                              {sub.complianceScore ? `${sub.complianceScore}% Score` : 'Analyzing'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
