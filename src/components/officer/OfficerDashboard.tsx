import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  Bot, 
  FileSearch, 
  Network, 
  Sparkles,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Check,
  Cpu,
  Layers,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { 
    tenders, 
    selectedTenderId, 
    setSelectedTenderId, 
    submissions, 
    companies,
    navigateTo,
    runVerificationForSubmission
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tenders' | 'bidders' | 'ai-verification' | 'comparison'>('tenders');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('sub-101');
  const [isVerifying, setIsVerifying] = useState(false);

  const currentTender = tenders.find(t => t.id === selectedTenderId) || tenders[0];
  const tenderSubmissions = submissions.filter(s => s.tenderId === currentTender.id);

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId) || tenderSubmissions[0];
  const selectedSubCompany = companies.find(c => c.id === selectedSubmission?.companyId);

  const handleStartAIVerification = (subId: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      runVerificationForSubmission(subId);
      setIsVerifying(false);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header / Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <button 
                onClick={() => navigateTo('role-selection')}
                className="hover:text-slate-900 inline-flex items-center gap-1 font-medium text-slate-600"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Role Selection</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-blue-700 font-semibold">Procurement Officer Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Procurement Officer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Automated GeM Bid Verification, OCR Extraction & Multi-Entity Compliance Engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-100/70 text-blue-800 border border-blue-200">
              Evaluation Officer: GeM-OFFICER-789
            </span>
          </div>
        </div>

        {/* Modular Navigation Tabs (Aligned with future pipeline extensions) */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('tenders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tenders'
                ? 'border-blue-700 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Select Tender</span>
          </button>

          <button
            onClick={() => setActiveTab('bidders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'bidders'
                ? 'border-blue-700 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>View Applied Bidders</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
              {tenderSubmissions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ai-verification')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ai-verification'
                ? 'border-blue-700 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Verification Pipeline</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1 rounded">
              OCR &bull; API &bull; LLM
            </span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-blue-700 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Bidder Comparison &amp; Cross-Intelligence</span>
          </button>
        </div>

        {/* TAB 1: SELECT TENDER & OVERVIEW */}
        {activeTab === 'tenders' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 mb-3">Available Tenders Under Officer Jurisdiction</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tenders.map((tender) => {
                  const isSelected = tender.id === selectedTenderId;
                  return (
                    <div
                      key={tender.id}
                      onClick={() => setSelectedTenderId(tender.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/40 shadow-xs' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-mono font-medium text-slate-700">{tender.tenderNumber}</span>
                        <span className="font-semibold text-emerald-700">{tender.status}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">
                        {tender.title}
                      </h3>
                      <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div><span className="text-slate-400">Org:</span> {tender.organization}</div>
                        <div><span className="text-slate-400">Est. Value:</span> <strong className="text-slate-800 tabular-nums">{tender.estimatedValue}</strong></div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                        <span className="text-slate-500 font-medium">Bidders: {tender.appliedBiddersCount}</span>
                        <span className={`font-semibold text-xs ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                          {isSelected ? 'Selected Active' : 'Select Tender'} &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Tender Requirements Spec */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                    {currentTender.tenderNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{currentTender.title}</h3>
                  <p className="text-xs text-slate-500">{currentTender.organization} · {currentTender.ministry}</p>
                </div>
                <button
                  onClick={() => setActiveTab('bidders')}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>View Applied Bidders</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Mandatory Compliance Evaluation Criteria
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentTender.requirements.map(req => (
                  <div key={req.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{req.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{req.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VIEW APPLIED BIDDERS */}
        {activeTab === 'bidders' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Bidders Participating in {currentTender.tenderNumber}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Total {tenderSubmissions.length} vendor bids submitted from registered dummy enterprises
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('ai-verification')}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Bot className="w-4 h-4" />
                  <span>Launch Automated AI Verification</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Bidder Company</th>
                      <th className="py-3 px-4">GSTIN &amp; PAN</th>
                      <th className="py-3 px-4">Uploaded Documents</th>
                      <th className="py-3 px-4">Submission Time</th>
                      <th className="py-3 px-4">Verification Stage</th>
                      <th className="py-3 px-4">Compliance</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenderSubmissions.map(sub => {
                      const comp = companies.find(c => c.id === sub.companyId);
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{comp?.name || 'Dummy Company'}</div>
                            <div className="text-[11px] font-normal text-slate-500">{comp?.city} · {comp?.sector}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                            <div>{comp?.gstin}</div>
                            <div className="text-slate-400">{comp?.pan}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{sub.documents.length} Files</span>
                            <div className="text-[10px] text-slate-500">MII, CA Turnover, OEM MAF</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] tabular-nums">
                            {sub.submittedAt}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                              {sub.aiVerificationStage || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {sub.complianceScore ? (
                              <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded ${
                                sub.complianceScore >= 90 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : sub.complianceScore >= 70 
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {sub.complianceScore}% Score
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">Pending AI</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedSubmissionId(sub.id);
                                setActiveTab('ai-verification');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-xs transition-colors"
                            >
                              Inspect AI Pipeline &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI VERIFICATION PIPELINE */}
        {activeTab === 'ai-verification' && (
          <div className="space-y-6">
            {/* Pipeline Stage Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Automated Verification Pipeline for: {selectedSubCompany?.name || 'Selected Bidder'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tender: {currentTender.tenderNumber} · {currentTender.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartAIVerification(selectedSubmission.id)}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{isVerifying ? 'Running AI Engine...' : 'Run Full AI Verification'}</span>
                  </button>
                </div>
              </div>

              {/* Visual Pipeline Stages */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                {[
                  { stage: '1. OCR Scan', desc: 'Text & Table Extraction', status: 'Passed', icon: FileSearch },
                  { stage: '2. Govt API', desc: 'MCA / GSTIN / Udyam Check', status: 'Verified', icon: ShieldCheck },
                  { stage: '3. Embeddings', desc: 'Tender Spec Semantic Match', status: 'Aligned', icon: Layers },
                  { stage: '4. LLM Analysis', desc: 'Clause Compliance Reasoning', status: 'Completed', icon: Sparkles },
                  { stage: '5. Compliance Score', desc: 'Cross-Bidder Deduplication', status: `${selectedSubmission.complianceScore || 94}% Score`, icon: Cpu },
                ].map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <Icon className="w-4 h-4 text-blue-700" />
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          {step.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 pt-1">{step.stage}</div>
                      <div className="text-[11px] text-slate-500 leading-tight">{step.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deep-dive Document OCR & Government Verification details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: OCR & Extracted Bidder Documents */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Document OCR &amp; Verification Status</span>
                  <span className="text-xs font-normal text-slate-500">{selectedSubmission.documents.length} Documents</span>
                </h4>
                <div className="space-y-2">
                  {selectedSubmission.documents.map((doc, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs bg-slate-50/60">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-500">{doc.type} · {doc.fileSize}</div>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 text-[11px] flex items-center gap-1 shrink-0 ml-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>OCR Verified</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Real-time Government API Registry Check */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Government Registry Checks (API Integration Mock)
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">GSTIN Active Status</div>
                      <div className="text-slate-500 text-[11px]">GSTN API: GSTR-3B filings active without tax default</div>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">Active &amp; Clear</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">MCA-21 Company Master Data</div>
                      <div className="text-slate-500 text-[11px]">CIN Verified with Ministry of Corporate Affairs database</div>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">Matched</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">MSME Udyam Registry</div>
                      <div className="text-slate-500 text-[11px]">Micro &amp; Small Enterprise qualification for EMD exemption</div>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">Eligible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BIDDER COMPARISON & CROSS-BIDDER INTELLIGENCE */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Comparative Bid Compliance Matrix &amp; Cross-Bidder Intelligence
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detecting document similarity, shared signatory patterns, and compliance rankings across all participating dummy bidders.
                  </p>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3 px-4">Rank &amp; Bidder</th>
                      <th className="py-3 px-4">Compliance Score</th>
                      <th className="py-3 px-4">MII Local Content</th>
                      <th className="py-3 px-4">CA Turnover Req</th>
                      <th className="py-3 px-4">Cross-Bidder Overlap</th>
                      <th className="py-3 px-4">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenderSubmissions
                      .sort((a, b) => (b.complianceScore || 0) - (a.complianceScore || 0))
                      .map((sub, idx) => {
                        const comp = companies.find(c => c.id === sub.companyId);
                        const isTop = idx === 0;
                        return (
                          <tr key={sub.id} className={isTop ? 'bg-emerald-50/30' : ''}>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400">#{idx + 1}</span>
                                <span>{comp?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold font-mono text-slate-800 text-xs">
                              {sub.complianceScore}%
                            </td>
                            <td className="py-3 px-4 text-emerald-700 font-semibold">
                              &gt; 58% (Compliant)
                            </td>
                            <td className="py-3 px-4 text-emerald-700 font-semibold">
                              Verified (₹18.4 Cr)
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className="text-[11px] text-slate-500">0% Collusion Flag</span>
                            </td>
                            <td className="py-3 px-4">
                              {sub.complianceScore && sub.complianceScore >= 85 ? (
                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                                  Technically Qualified
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                                  Clarification Required
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
