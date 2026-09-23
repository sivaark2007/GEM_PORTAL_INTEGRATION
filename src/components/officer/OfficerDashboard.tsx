import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CreateTenderModal } from './CreateTenderModal';
import type { UploadedDoc } from './CreateTenderModal';
import { DocumentViewerModal, DocumentInfo } from '../DocumentViewerModal';
import {
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Bot,
  FileSearch,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  Search,
  Plus,
  FilePlus2,
  Calendar,
  Clock,
  Package,
  Upload,
  X,
  Eye,
  RefreshCw,
  BadgeCheck,
  XCircle,
  AlertCircle,
  Hash,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Briefcase,
  ChevronLeft,
} from 'lucide-react';
import type { GemBiddingDocument } from '../../types';

// ─── Gem Requirement cross-check (mocked from GeM-Bidding-9318928.pdf) ─────
const GEM_BIDDING_REQUIREMENTS = [
  {
    id: 'gbr-1',
    title: 'Valid GSTIN Registration',
    description: 'Active GSTIN with no tax default for past 12 months',
    matchKeywords: ['gstin', 'gst', 'gstr', 'tax'],
  },
  {
    id: 'gbr-2',
    title: 'Make in India (MII) Local Content ≥ 50%',
    description: 'Class-I or Class-II local supplier declaration signed by auditor',
    matchKeywords: ['india', 'mii', 'make', 'local'],
  },
  {
    id: 'gbr-3',
    title: 'Annual Turnover Certificate (CA Certified)',
    description: 'Audited CA balance sheets for FY 2023-2026 with UDIN',
    matchKeywords: ['turnover', 'balance', 'ca_', 'financial', 'audited'],
  },
  {
    id: 'gbr-4',
    title: 'OEM/Manufacturer Authorization Form',
    description: 'Direct OEM authorization letter for this tender valid until 2027',
    matchKeywords: ['oem', 'maf', 'authorization', 'manufacturer', 'tier'],
  },
  {
    id: 'gbr-5',
    title: 'Technical Compliance Specification Sheet',
    description: 'Item-wise compliance matrix matching tender technical schedule',
    matchKeywords: ['technical', 'spec', 'compliance', 'proposal'],
  },
  {
    id: 'gbr-6',
    title: 'MSME / Udyam Registration (if applicable)',
    description: 'Valid Udyam certificate for EMD exemption benefit',
    matchKeywords: ['udyam', 'msme', 'micro', 'small'],
  },
];

function checkRequirementMatch(reqKeywords: string[], docs: { name: string; verified: boolean }[]) {
  const matched = docs.filter(d =>
    reqKeywords.some(kw => d.name.toLowerCase().includes(kw))
  );
  if (matched.length === 0) return { status: 'missing' as const, doc: null };
  if (matched.some(d => d.verified)) return { status: 'satisfied' as const, doc: matched.find(d => d.verified) || matched[0] };
  return { status: 'partial' as const, doc: matched[0] };
}

// ─── Sub-component: Gem Bidding Doc Upload Button ────────────────────────────
interface GemDocUploadProps {
  tenderId: string;
  existing?: GemBiddingDocument;
}
const GemDocUpload: React.FC<GemDocUploadProps> = ({ tenderId, existing }) => {
  const { uploadGemBiddingDocument } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;
    uploadGemBiddingDocument(tenderId, {
      name: file.name,
      fileSize: sizeStr,
      fileContentUrl: url,
      uploadedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
      {existing ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-emerald-800 truncate max-w-[140px]">{existing.name}</span>
          <span className="text-emerald-600">{existing.fileSize}</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="ml-auto text-emerald-700 hover:text-emerald-900 font-semibold underline whitespace-nowrap"
            title="Replace document"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold text-amber-800 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload GeM Bidding Document
        </button>
      )}
    </div>
  );
};

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
    Disqualified: 'bg-red-50 text-red-700 border-red-200',
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Evaluation: 'bg-amber-50 text-amber-700 border-amber-200',
    Closed: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Level = 'bid-list' | 'bidders' | 'bidder-detail';

export const OfficerDashboard: React.FC = () => {
  const {
    tenders,
    selectedTenderId,
    setSelectedTenderId,
    submissions,
    companies,
    navigateTo,
    runVerificationForSubmission,
    addTender,
    uploadGemBiddingDocument,
  } = useApp();

  // Navigation state
  const [level, setLevel] = useState<Level>('bid-list');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // UI state
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCreateTender, setShowCreateTender] = useState(false);
  const [selectedDocToView, setSelectedDocToView] = useState<DocumentInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Derived data
  const currentTender = tenders.find(t => t.id === selectedTenderId) || tenders[0];
  const tenderSubmissions = submissions.filter(s => s.tenderId === currentTender?.id);
  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId) || null;
  const selectedCompany = companies.find(c => c.id === selectedSubmission?.companyId) || null;

  // Filtered & paginated tenders
  const filteredTenders = tenders.filter(t =>
    !searchQuery ||
    t.tenderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.items || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredTenders.length / PAGE_SIZE));
  const pagedTenders = filteredTenders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSelectBid = (tenderId: string) => {
    setSelectedTenderId(tenderId);
    setLevel('bidders');
  };

  const handleSelectBidder = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setLevel('bidder-detail');
  };

  const handleRunAI = () => {
    if (!selectedSubmissionId) return;
    setIsVerifying(true);
    setTimeout(() => {
      runVerificationForSubmission(selectedSubmissionId);
      setIsVerifying(false);
    }, 1400);
  };

  const handleViewDoc = (doc: { name: string; type: string; fileSize: string; verified: boolean; fileContentUrl?: string }) => {
    setSelectedDocToView({
      name: doc.name,
      fileSize: doc.fileSize,
      type: doc.type,
      companyName: selectedCompany?.name || 'Bidder Enterprise',
      verified: doc.verified,
      uploadedAt: selectedSubmission?.submittedAt,
      fileContentUrl: doc.fileContentUrl,
    });
  };

  // ── Render: Level 1 — Bid List ────────────────────────────────────────────
  const renderBidList = () => (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by BID NO, item, department..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowCreateTender(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow-md whitespace-nowrap"
        >
          <FilePlus2 className="w-4 h-4" />
          Create New Tender
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-500">
        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredTenders.length)} of{' '}
        <span className="font-semibold text-slate-700">{filteredTenders.length}</span> records
      </p>

      {/* Bid Cards */}
      <div className="space-y-3">
        {pagedTenders.map(tender => {
          const subCount = submissions.filter(s => s.tenderId === tender.id).length;
          return (
            <div
              key={tender.id}
              className="bg-white border border-slate-200 rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer group"
              style={{ borderTop: '3px solid #f59e0b' }}
              onClick={() => handleSelectBid(tender.id)}
            >
              <div className="px-5 pt-4 pb-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">BID NO:</span>{' '}
                    <button
                      className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                      onClick={e => { e.stopPropagation(); handleSelectBid(tender.id); }}
                    >
                      {tender.tenderNumber}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={tender.status} />
                    <button
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline whitespace-nowrap"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Corrigendum/Representation
                    </button>
                  </div>
                </div>

                {/* Main info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-[13px]">
                  <div className="sm:col-span-1">
                    <div>
                      <span className="font-semibold text-slate-800">Items:</span>{' '}
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {tender.items
                          ? tender.items.length > 55
                            ? tender.items.slice(0, 55) + '...'
                            : tender.items
                          : tender.title.length > 55
                          ? tender.title.slice(0, 55) + '...'
                          : tender.title}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="font-semibold text-slate-800">Quantity:</span>{' '}
                      <span className="text-slate-700">{tender.quantity ?? '—'}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="font-semibold text-slate-800">Bidders Applied:</span>{' '}
                      <span className="font-bold text-blue-700">{subCount}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-1">
                    <div className="font-semibold text-slate-800 mb-0.5">Department Name And Address:</div>
                    <div className="text-slate-600">{tender.ministry}</div>
                    <div className="text-slate-600">{tender.organization}</div>
                  </div>

                  <div className="sm:col-span-1 space-y-1">
                    <div>
                      <span className="font-semibold text-slate-800">Start Date:</span>{' '}
                      <span className="text-emerald-600 font-medium">{tender.startDate || '—'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">End Date:</span>{' '}
                      <span className="text-amber-600 font-medium">{tender.endDate || tender.closingDate}</span>
                    </div>
                    <div className="pt-1">
                      <GemDocUpload
                        tenderId={tender.id}
                        existing={tender.gemBiddingDocument}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-lg">
                <span className="text-[11px] text-slate-500">
                  Est. Value: <strong className="text-slate-800 font-mono">{tender.estimatedValue}</strong>
                  {' · '}{tender.category}
                </span>
                <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Applied Bidders <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-1 pt-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded bg-slate-700 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors"
        >
          Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 rounded text-xs font-bold transition-colors ${page === p ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400'}`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && (
          <>
            <span className="text-slate-400 text-xs px-1">...</span>
            <button
              onClick={() => setPage(totalPages)}
              className={`w-8 h-8 rounded text-xs font-bold transition-colors ${page === totalPages ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400'}`}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded bg-slate-700 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

  // ── Render: Level 2 — Applied Bidders ────────────────────────────────────
  const renderBidders = () => (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLevel('bid-list')}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bid List
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-bold text-blue-700">{currentTender.tenderNumber}</span>
      </div>

      {/* Bid summary card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" style={{ borderLeft: '4px solid #2563eb' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {currentTender.tenderNumber}
              </span>
              <StatusBadge status={currentTender.status} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{currentTender.title}</h3>
            <p className="text-xs text-slate-500">{currentTender.ministry} · {currentTender.organization}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
              <span><strong>Items:</strong> {currentTender.items || currentTender.title.slice(0, 40)}</span>
              <span><strong>Qty:</strong> {currentTender.quantity ?? '—'}</span>
              <span><strong>Value:</strong> {currentTender.estimatedValue}</span>
            </div>
          </div>

          {/* GeM Bidding Document */}
          <div className="shrink-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tender Document</p>
            <GemDocUpload tenderId={currentTender.id} existing={currentTender.gemBiddingDocument} />
            {currentTender.gemBiddingDocument?.fileContentUrl && (
              <button
                onClick={() => setSelectedDocToView({
                  name: currentTender.gemBiddingDocument!.name,
                  fileSize: currentTender.gemBiddingDocument!.fileSize,
                  type: 'PDF',
                  companyName: 'GeM Portal',
                  verified: true,
                  uploadedAt: currentTender.gemBiddingDocument!.uploadedAt,
                  fileContentUrl: currentTender.gemBiddingDocument!.fileContentUrl,
                })}
                className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
              >
                <Eye className="w-3 h-3" />
                Preview Tender Document
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bidder cards */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Companies Applied for {currentTender.tenderNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tenderSubmissions.length} vendor bid{tenderSubmissions.length !== 1 ? 's' : ''} submitted
            </p>
          </div>
        </div>

        {tenderSubmissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No bidders have applied yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tenderSubmissions.map(sub => {
              const comp = companies.find(c => c.id === sub.companyId);
              const scoreColor =
                (sub.complianceScore || 0) >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : (sub.complianceScore || 0) >= 70 ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-red-700 bg-red-50 border-red-200';

              return (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleSelectBidder(sub.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: comp?.color || '#94a3b8' }}
                    >
                      {comp?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{comp?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {comp?.city} · {comp?.sector}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {comp?.gstin} | {comp?.pan}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap ml-13 sm:ml-0">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Docs</div>
                      <div className="text-sm font-bold text-slate-800">{sub.documents.length}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Stage</div>
                      <div className="text-xs font-mono font-bold text-blue-700">{sub.aiVerificationStage || 'Pending'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score</div>
                      {sub.complianceScore ? (
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${scoreColor}`}>
                          {sub.complianceScore}%
                        </span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </div>
                    <StatusBadge status={sub.status} />
                    <button
                      onClick={e => { e.stopPropagation(); handleSelectBidder(sub.id); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Level 3 — Bidder Detail ──────────────────────────────────────
  const renderBidderDetail = () => {
    if (!selectedSubmission || !selectedCompany) return null;

    const pipelineStages = [
      { stage: '1. OCR Scan', desc: 'Text & Data Extraction', icon: FileSearch, done: true },
      { stage: '2. Govt API', desc: 'GSTIN / MCA / Udyam', icon: ShieldCheck, done: true },
      { stage: '3. Embeddings', desc: 'Tender Spec Alignment', icon: Layers, done: ['Embeddings', 'LLM_Analysis', 'Completed'].includes(selectedSubmission.aiVerificationStage || '') },
      { stage: '4. LLM Analysis', desc: 'Clause Reasoning', icon: Sparkles, done: ['LLM_Analysis', 'Completed'].includes(selectedSubmission.aiVerificationStage || '') },
      { stage: '5. Score', desc: 'Cross-Bidder Dedup', icon: Cpu, done: selectedSubmission.aiVerificationStage === 'Completed' },
    ];

    const gemReqChecks = GEM_BIDDING_REQUIREMENTS.map(req => ({
      ...req,
      result: checkRequirementMatch(req.matchKeywords, selectedSubmission.documents),
    }));

    const satisfiedCount = gemReqChecks.filter(r => r.result.status === 'satisfied').length;
    const missingCount = gemReqChecks.filter(r => r.result.status === 'missing').length;

    return (
      <div className="space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button onClick={() => setLevel('bid-list')} className="hover:text-slate-900 font-medium">Bid List</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => setLevel('bidders')} className="hover:text-slate-900 font-medium">{currentTender.tenderNumber}</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-blue-700 font-bold">{selectedCompany.name}</span>
        </div>

        {/* Company Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0"
              style={{ backgroundColor: selectedCompany.color || '#0284c7' }}
            >
              {selectedCompany.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">{selectedCompany.name}</h2>
                <StatusBadge status={selectedSubmission.status} />
                {selectedSubmission.complianceScore && (
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                    selectedSubmission.complianceScore >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedSubmission.complianceScore >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    Compliance: {selectedSubmission.complianceScore}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Applied for: <span className="font-semibold text-blue-700">{currentTender.tenderNumber}</span>
                {' · '}Submitted: <span className="font-semibold text-slate-700">{selectedSubmission.submittedAt}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { icon: CreditCard, label: 'GSTIN', value: selectedCompany.gstin },
                  { icon: Hash, label: 'PAN', value: selectedCompany.pan },
                  { icon: Briefcase, label: 'CIN', value: selectedCompany.cin },
                  { icon: BadgeCheck, label: 'Udyam', value: selectedCompany.udyamNumber },
                  { icon: MapPin, label: 'City', value: selectedCompany.city || '—' },
                  { icon: Package, label: 'Sector', value: selectedCompany.sector || '—' },
                  { icon: Mail, label: 'Email', value: selectedCompany.email },
                  { icon: Phone, label: 'Phone', value: selectedCompany.contactNumber },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Icon className="w-3 h-3" />
                      <span className="font-semibold uppercase tracking-wider text-[10px]">{label}</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-800 text-[11px] break-all">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Pipeline Stages */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">AI Verification Pipeline</h3>
            <button
              onClick={handleRunAI}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              {isVerifying ? 'Running…' : 'Run Full AI Verification'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {pipelineStages.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`p-3 rounded-lg border ${s.done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={`w-4 h-4 ${s.done ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-bold px-1.5 rounded ${s.done ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-200'}`}>
                      {s.done ? 'Done' : 'Pending'}
                    </span>
                  </div>
                  <div className={`text-[11px] font-bold ${s.done ? 'text-emerald-800' : 'text-slate-600'}`}>{s.stage}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column: Bidder Docs + Govt API */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bidder Documents */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Submitted Documents</h3>
              <span className="text-xs text-slate-500">{selectedSubmission.documents.length} files</span>
            </div>
            <div className="space-y-2">
              {selectedSubmission.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">{doc.type} · {doc.fileSize}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {doc.verified ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <button
                      onClick={() => handleViewDoc(doc)}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Flags */}
            {(selectedSubmission.flags?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1">
                {selectedSubmission.flags!.map((flag, i) => (
                  <div key={i} className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Govt API Checks */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Government Registry Checks</h3>
            <div className="space-y-2 text-xs">
              {[
                { title: 'GSTIN Active Status', desc: 'GSTN API: GSTR-3B filings active — no tax default', status: 'Active & Clear', ok: true },
                { title: 'MCA-21 Company Master Data', desc: 'CIN verified with Ministry of Corporate Affairs', status: 'Matched', ok: true },
                { title: 'MSME Udyam Registry', desc: 'Udyam qualification for EMD exemption', status: 'Eligible', ok: true },
                { title: 'GeM Seller Account', desc: 'Seller registration active on GeM portal', status: 'Registered', ok: true },
              ].map((check, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-900">{check.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{check.desc}</div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ml-2 ${check.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GeM Bidding Document Cross-Verification */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                GeM Bidding Document Requirements Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTender.gemBiddingDocument
                  ? <>Requirements extracted from <strong>{currentTender.gemBiddingDocument.name}</strong> cross-checked against bidder's submitted documents</>
                  : 'Upload the GeM Bidding document for this tender to enable requirement cross-verification'
                }
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0 ml-4">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />{satisfiedCount} Satisfied
              </span>
              <span className="flex items-center gap-1 text-red-600 font-bold">
                <XCircle className="w-3.5 h-3.5" />{missingCount} Missing
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {gemReqChecks.map(req => {
              const { status, doc } = req.result;
              const statusConfig = {
                satisfied: { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50/50', iconCls: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Satisfied' },
                partial: { icon: AlertCircle, cls: 'border-amber-200 bg-amber-50/50', iconCls: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Partial' },
                missing: { icon: XCircle, cls: 'border-red-200 bg-red-50/30', iconCls: 'text-red-500', badge: 'bg-red-100 text-red-700 border-red-200', label: 'Missing' },
              }[status];
              const Icon = statusConfig.icon;

              return (
                <div key={req.id} className={`flex items-start gap-3 p-3 rounded-lg border ${statusConfig.cls}`}>
                  <Icon className={`w-4 h-4 ${statusConfig.iconCls} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{req.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                      {doc && (
                        <span className="text-[10px] text-slate-500 truncate">→ {doc.name}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{req.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <button
                onClick={() => navigateTo('role-selection')}
                className="hover:text-slate-900 inline-flex items-center gap-1 font-medium text-slate-600"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Role Selection
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-blue-700 font-semibold">Procurement Officer Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Procurement Officer Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              GeM Bid Management · Bidder Verification · AI Compliance Engine
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-100/70 text-blue-800 border border-blue-200">
            Officer: GeM-OFFICER-789
          </span>
        </div>

        {/* Level content */}
        {level === 'bid-list' && renderBidList()}
        {level === 'bidders' && renderBidders()}
        {level === 'bidder-detail' && renderBidderDetail()}
      </div>

      {/* Modals */}
      <CreateTenderModal
        isOpen={showCreateTender}
        onClose={() => setShowCreateTender(false)}
        onSubmit={(tenderData, _docs, gemDoc) => {
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
            + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          const created = addTender({
            ...tenderData,
            startDate: dateStr,
            endDate: tenderData.closingDate,
          });
          if (gemDoc) {
            uploadGemBiddingDocument(created.id, {
              name: gemDoc.name,
              fileSize: gemDoc.size,
              fileContentUrl: gemDoc.fileContentUrl,
              uploadedAt: dateStr,
            });
          }
          setShowCreateTender(false);
          setLevel('bid-list');
        }}
      />

      <DocumentViewerModal
        isOpen={Boolean(selectedDocToView)}
        document={selectedDocToView}
        onClose={() => setSelectedDocToView(null)}
      />
    </div>
  );
};
