import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CreateTenderModal } from './CreateTenderModal';
import { DocumentViewerModal, DocumentInfo } from '../DocumentViewerModal';
import { parseDocumentWithService } from '../../services/documentParser';
import { TenderDetailSummary } from '../shared/TenderDetailSummary';
import type { ConditionCheckResult, Tender, Company, BidSubmission, TenderComplianceVerificationItem } from '../../types';
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
  BarChart2,
  Trophy,
  Play,
  ClipboardList,
  TrendingUp,
  Award,
  Loader2,
  ListChecks,
  Info,
  Scale,
  Landmark,
  Gavel,
} from 'lucide-react';
import type { GemBiddingDocument } from '../../types';
import { TenderListCard } from '../shared/TenderListCard';
import { TenderStatusBadge } from '../shared/TenderStatusBadge';

// ─── Dynamic Tender Requirements & Compliance Verification Helpers ─────────
function getTenderDynamicRequirements(tender: Tender): Array<{
  id: string;
  title: string;
  description: string;
  category: string;
  required_value?: string;
  matchKeywords: string[];
}> {
  const items: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    required_value?: string;
    matchKeywords: string[];
  }> = [];

  const summary = tender.tenderSummaryInfo ||
                  tender.gemBiddingDocument?.tenderSummaryInfo ||
                  tender.gemBiddingDocument?.parsedData?.tenderSummaryInfo;

  // 1. Technical specifications from tender tables
  if (summary?.technical_specifications && summary.technical_specifications.length > 0) {
    summary.technical_specifications.forEach((spec, idx) => {
      const words = spec.parameter.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      items.push({
        id: `spec-${idx}`,
        title: spec.parameter,
        description: `Required: ${spec.required_value}`,
        category: spec.category || 'Technical',
        required_value: spec.required_value,
        matchKeywords: [...words, spec.required_value.toLowerCase()],
      });
    });
  }

  // 2. Conditions extracted from tender
  if (summary?.conditions && summary.conditions.length > 0) {
    summary.conditions.forEach((cond, idx) => {
      const words = cond.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      items.push({
        id: `cond-${idx}`,
        title: cond.title,
        description: cond.description,
        category: cond.category || 'Eligibility',
        matchKeywords: words,
      });
    });
  }

  // 3. Needed documents checklist
  if (summary?.needed_documents && summary.needed_documents.length > 0) {
    summary.needed_documents.forEach((doc, idx) => {
      const words = doc.document_name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      items.push({
        id: `doc-${idx}`,
        title: doc.document_name,
        description: `Purpose: ${doc.purpose}`,
        category: doc.category || 'Mandatory Document',
        matchKeywords: words,
      });
    });
  }

  // 4. Any published requirements
  if (tender.requirements && tender.requirements.length > 0) {
    tender.requirements.forEach(req => {
      if (!items.some(it => it.title.toLowerCase() === req.title.toLowerCase())) {
        const words = req.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        items.push({
          id: req.id,
          title: req.title,
          description: req.description,
          category: req.category || 'General',
          matchKeywords: words,
        });
      }
    });
  }

  return items;
}

function computeDynamicComplianceItems(
  tender: Tender,
  submission: BidSubmission
): TenderComplianceVerificationItem[] {
  // If backend agent already verified this submission, return the verified results
  if (submission.complianceVerifications && submission.complianceVerifications.length > 0) {
    return submission.complianceVerifications;
  }

  const dynamicReqs = getTenderDynamicRequirements(tender);
  if (dynamicReqs.length === 0) {
    return [];
  }

  return dynamicReqs.map(req => {
    const titleLower = req.title.toLowerCase();
    const reqValLower = (req.required_value || '').toLowerCase();
    let bestDoc: any = null;
    let snippet = '';
    let status: 'Match' | 'Mismatch' | 'Missing' = 'Missing';
    let reason = '';

    for (const doc of submission.documents) {
      const docNameLower = (doc.name || '').toLowerCase();
      const docText = (doc.parsedData?.full_text || doc.parsedData?.raw_text || '').toLowerCase();

      // Check document filename match
      if (docNameLower.includes(titleLower) || (reqValLower && docNameLower.includes(reqValLower))) {
        bestDoc = doc;
        status = 'Match';
        reason = `Bidder submitted ${doc.name} satisfying requirement.`;
        snippet = `Found in ${doc.name}`;
        break;
      }

      // Check keywords in text
      const matchWord = req.matchKeywords.find(kw => kw.length > 2 && docText.includes(kw));
      if (matchWord) {
        bestDoc = doc;
        const raw = doc.parsedData?.full_text || doc.parsedData?.raw_text || '';
        const idx = docText.indexOf(matchWord);
        snippet = '…' + raw.slice(Math.max(0, idx - 40), Math.min(raw.length, idx + 100)).trim() + '…';
        if (reqValLower) {
          if (docText.includes(reqValLower)) {
            status = 'Match';
            reason = `Bidder document satisfies requirement (${req.required_value}).`;
          } else {
            status = 'Mismatch';
            reason = `Tender requires ${req.required_value}; bidder document mentions ${req.title} with differing parameter.`;
          }
        } else {
          status = 'Match';
          reason = `Evidence found in bidder document for ${req.title}.`;
        }
        break;
      }
    }

    if (status === 'Missing') {
      reason = `No evidence or supporting document found in bidder submission for "${req.title}".`;
      snippet = 'No evidence found in submitted documents';
    }

    return {
      requirement: req.required_value ? `${req.title}: ${req.required_value}` : req.title,
      evidence_found: snippet || 'No evidence found',
      status,
      reason,
      source_document: bestDoc?.name || 'N/A',
      category: req.category,
    };
  });
}

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
  const parseRequestRef = useRef(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const requestId = ++parseRequestRef.current;
    const url = URL.createObjectURL(file);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;
    const document = {
      name: file.name,
      fileSize: sizeStr,
      fileContentUrl: url,
      uploadedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };
    uploadGemBiddingDocument(tenderId, { ...document, parsingStatus: 'processing' });
    if (fileRef.current) fileRef.current.value = '';

    try {
      const parsed = await parseDocumentWithService(file, file.name);
      if (requestId !== parseRequestRef.current) return;
      uploadGemBiddingDocument(tenderId, parsed.success
        ? { ...document, parsedData: parsed, parsingStatus: 'complete', tenderSummaryInfo: parsed.tenderSummaryInfo }
        : { ...document, parsingStatus: 'failed', parseError: parsed.error || 'Tender document parsing failed.' }
      );
    } catch (error) {
      if (requestId !== parseRequestRef.current) return;
      const message = error instanceof Error ? error.message : 'Tender document parsing failed.';
      uploadGemBiddingDocument(tenderId, { ...document, parsingStatus: 'failed', parseError: message });
    }
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
      {existing ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-emerald-800 truncate max-w-[140px]">{existing.name}</span>
          <span className="text-emerald-600">{existing.fileSize}</span>
          {existing.parsingStatus === 'processing' && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
          {existing.parsingStatus === 'complete' && <span className="text-emerald-700 font-semibold">Parsed</span>}
          {existing.parsingStatus === 'failed' && <span className="text-red-700 font-semibold" title={existing.parseError}>Parse failed</span>}
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

function VerificationBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    VALID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NOT_VALID: 'bg-red-50 text-red-700 border-red-200',
    NOT_FOUND: 'bg-red-50 text-red-700 border-red-200',
    REVIEW_REQUIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const labelMap: Record<string, string> = {
    VALID: 'Valid',
    NOT_VALID: 'Not valid',
    NOT_FOUND: 'Not found',
    REVIEW_REQUIRED: 'Review',
  };
  const safeStatus = status || 'REVIEW_REQUIRED';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${map[safeStatus] || map.REVIEW_REQUIRED}`}>
      {labelMap[safeStatus] || 'Review'}
    </span>
  );
}

// ─── Sub-component: GeM GTC / GFR Standard Compliance Evaluation Section ────
interface GemFrameworkProps {
  submission: BidSubmission;
  company: Company;
  tender: Tender;
}

const GemFrameworkEvaluationSection: React.FC<GemFrameworkProps> = ({ submission, company, tender }) => {
  const evalData = submission.gemFrameworkEvaluation;
  if (!evalData) return null;

  const baseline = evalData.stage1Baseline;
  const technical = evalData.stage2Technical;
  const preferences = evalData.stage3Preferences;
  const selection = evalData.stage4Selection;

  const verdictCls =
    evalData.finalVerdict === 'Technically Qualified & Eligible'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : evalData.finalVerdict === 'Debarred from Public Procurement'
        ? 'bg-red-100 text-red-900 border-red-400 animate-pulse'
        : evalData.finalVerdict.includes('Disqualified')
          ? 'bg-red-50 text-red-800 border-red-300'
          : 'bg-amber-50 text-amber-800 border-amber-300';

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              Official GeM Statutory Framework (GTC &amp; GFR)
            </span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
              Mandatory Evaluation Rules
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            Standardized 4-Stage Seller Evaluation &amp; Award Framework
          </h3>
          <p className="text-xs text-indigo-200 mt-0.5">
            GFR Rule 144(xi) · Baseline Integrity &amp; Debarment · Technical Filters · MSE &amp; MII Preferences · Selection Method
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-center">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${verdictCls}`}>
            {!baseline.debarmentCheck.cleared ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : baseline.overallBaselinePassed && technical.overallTechnicalPassed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{evalData.finalVerdict}</span>
          </div>
        </div>
      </div>

      {/* One-Line Executive Summary */}
      <div className="px-5 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center gap-2 text-xs">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span className="font-bold text-indigo-950">Statutory Verdict:</span>
        <span className="text-indigo-900 font-medium">{evalData.oneLineExecutiveSummary}</span>
      </div>

      {/* The 4 Standard Stages Grid */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 bg-slate-50/50">

        {/* STAGE 1: Mandatory Baseline Compliance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">1</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Mandatory Baseline Compliance
              </h4>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              baseline.overallBaselinePassed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {baseline.overallBaselinePassed ? '✓ Baseline Passed' : '✗ Baseline Failed'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. GeM Profile & Registration */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  GeM Profile &amp; Valid Registration
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Verified Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                PAN: <strong className="font-mono text-slate-800">{baseline.panStatus.panNumber}</strong> · GSTIN: <strong className="font-mono text-slate-800">{baseline.gstinStatus.gstinNumber}</strong>
              </p>
              <p className="text-[10px] text-slate-500">{baseline.bankPfmsStatus.message}</p>
            </div>

            {/* 2. Integrity & Debarment Check */}
            <div className={`p-2.5 rounded-lg border space-y-1 ${
              baseline.debarmentCheck.cleared
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-red-100/70 border-red-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className={`w-3.5 h-3.5 ${baseline.debarmentCheck.cleared ? 'text-emerald-600' : 'text-red-600'}`} />
                  Integrity &amp; Debarment Registry Check
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  baseline.debarmentCheck.cleared
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-red-200 text-red-900 border-red-300 animate-pulse'
                }`}>
                  {baseline.debarmentCheck.cleared ? '✓ Not Debarred' : '🚨 DEBARRED'}
                </span>
              </div>
              <p className={`text-[11px] leading-snug ${baseline.debarmentCheck.cleared ? 'text-emerald-900' : 'text-red-900 font-semibold'}`}>
                {baseline.debarmentCheck.message}
              </p>
            </div>

            {/* 3. GFR Rule 144(xi) Land Border */}
            <div className={`p-2.5 rounded-lg border space-y-1 ${
              baseline.gfr144xiCompliance.compliant
                ? 'bg-slate-50 border-slate-100'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                  GFR Rule 144(xi) Land Border Declaration
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  baseline.gfr144xiCompliance.compliant
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {baseline.gfr144xiCompliance.compliant ? '✓ Compliant' : '✗ Missing'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{baseline.gfr144xiCompliance.message}</p>
            </div>

            {/* 4. Earnest Money Deposit (EMD) */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Earnest Money Deposit (EMD / Bid Security)
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  baseline.emdCompliance.exempted
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : baseline.emdCompliance.status === 'COMPLIANT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {baseline.emdCompliance.exempted ? 'MSE/Startup Exempt' : baseline.emdCompliance.status === 'COMPLIANT' ? 'Paid / Submitted' : 'Non-Compliant'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{baseline.emdCompliance.message}</p>
            </div>
          </div>
        </div>

        {/* STAGE 2: Standard Technical Qualification Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">2</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Technical Qualification Filters
              </h4>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              technical.overallTechnicalPassed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {technical.overallTechnicalPassed ? '✓ Technical Qualified' : '✗ Technical Failed'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Average Annual Turnover (3 FYs) */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Average Annual Turnover (Last 3 FYs)</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  technical.turnoverFilter.status === 'EXEMPTED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : technical.turnoverFilter.status === 'QUALIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {technical.turnoverFilter.status === 'EXEMPTED' ? 'Exempted (MSE/Startup)' : technical.turnoverFilter.status === 'QUALIFIED' ? '✓ Meets Criteria' : '✗ Below Threshold'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Required: <strong>₹{technical.turnoverFilter.requiredCr} Cr</strong> · Reported: <strong>₹{technical.turnoverFilter.bidderTurnoverCr} Cr</strong> (CA Certified)
              </p>
              <p className="text-[10px] text-slate-500">{technical.turnoverFilter.message}</p>
            </div>

            {/* 2. Years of Past Experience */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Years of Past Experience (Govt/PSU Supply)</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  technical.experienceFilter.status === 'EXEMPTED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : technical.experienceFilter.status === 'QUALIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {technical.experienceFilter.status === 'EXEMPTED' ? 'Exempted (MSE/Startup)' : technical.experienceFilter.status === 'QUALIFIED' ? '✓ Meets Criteria' : '✗ Insufficient'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Required: <strong>{technical.experienceFilter.requiredYears} Years</strong> · Documented: <strong>{technical.experienceFilter.bidderYears} Years</strong>
              </p>
              <p className="text-[10px] text-slate-500">{technical.experienceFilter.message}</p>
            </div>

            {/* 3. Past Performance Quantity */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Past Performance Quantity %</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                  ✓ {technical.performanceFilter.bidderPercentage}% Supplied
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{technical.performanceFilter.message}</p>
            </div>

            {/* 4. OEM Authorization Form (MAF) */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">OEM Authorization Form (MAF)</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  technical.oemAuthFilter.status === 'QUALIFIED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {technical.oemAuthFilter.status === 'QUALIFIED' ? '✓ Valid MAF' : '✗ Missing'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{technical.oemAuthFilter.message}</p>
            </div>
          </div>
        </div>

        {/* STAGE 3: Universal Exemptions & Purchase Preferences */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">3</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Universal Exemptions &amp; Purchase Preferences
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
              Central Policy Enabled
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* MSE Exemption */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">MSE &amp; DPIIT Startup Exemption</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-purple-100 text-purple-800 border-purple-200">
                  {preferences.mseExemption.enterpriseCategory} Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{preferences.mseExemption.message}</p>
            </div>

            {/* Make in India (MII) Preference */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Make in India (MII) Preference</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  preferences.makeInIndia.supplierClass === 'Class-I Local'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {preferences.makeInIndia.supplierClass} ({preferences.makeInIndia.localContentPercentage}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{preferences.makeInIndia.message}</p>
            </div>

            {/* MSE Price Matching (L1 + 15%) */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">MSE Price Matching (L1 + 15% Band)</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  preferences.msePriceMatching.within15PercentWindow
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {preferences.msePriceMatching.within15PercentWindow ? '✓ Within L1 + 15%' : 'Outside Band'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{preferences.msePriceMatching.message}</p>
            </div>
          </div>
        </div>

        {/* STAGE 4: Final Selection Methods */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">4</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Final Selection Method &amp; Commercial Evaluation
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              Method: {selection.selectionMethod}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Commercial Quote */}
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-600 uppercase tracking-wider font-bold block">Commercial Financial Bid</span>
                <span className="text-base font-bold font-mono text-blue-950">{selection.formattedQuote}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Commercial Rank</span>
                <span className="text-sm font-bold font-mono text-slate-900">Rank #{selection.rank || 1}</span>
              </div>
            </div>

            {/* Selection Mechanism Details */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-800 block">Selection Rule In Effect:</span>
              <p className="text-[11px] text-slate-600">
                {selection.selectionMethod === 'L1' && 'Lowest Price (L1): Lowest commercial quote among technically qualified sellers wins.'}
                {selection.selectionMethod === 'RA' && 'Reverse Auction (RA): Sellers enter a live online underbidding window (mandatory for bids > ₹50 Lakhs).'}
                {selection.selectionMethod === 'QCBS' && 'Quality & Cost Based Selection (QCBS): 70% Technical Merit + 30% Financial Bid Price.'}
                {selection.selectionMethod === 'Run_L1' && 'Run L1 / Algorithmic Tie-Breaker: Resolves identical price quotes.'}
              </p>
            </div>

            {/* Verdict */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-800 block">Award Recommendation:</span>
              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{selection.selectionVerdict}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Sub-component: Comparative Bidder Evaluation Matrix Modal ──────────────
interface ComparativeModalProps {
  tender: Tender;
  submissions: BidSubmission[];
  companies: Company[];
  onClose: () => void;
  onSelectBidder: (submissionId: string) => void;
}

const ComparativeEvaluationModal: React.FC<ComparativeModalProps> = ({
  tender,
  submissions,
  companies,
  onClose,
  onSelectBidder,
}) => {
  const tenderSubmissions = submissions.filter(s => s.tenderId === tender.id);

  const sorted = [...tenderSubmissions].sort((a, b) => {
    const isADebarred = a.gemFrameworkEvaluation?.stage1Baseline.debarmentCheck.status === 'DEBARRED';
    const isBDebarred = b.gemFrameworkEvaluation?.stage1Baseline.debarmentCheck.status === 'DEBARRED';
    if (isADebarred && !isBDebarred) return 1;
    if (!isADebarred && isBDebarred) return -1;
    const isADisq = a.status === 'Disqualified';
    const isBDisq = b.status === 'Disqualified';
    if (isADisq && !isBDisq) return 1;
    if (!isADisq && isBDisq) return -1;
    return (a.commercialQuote || 999999999) - (b.commercialQuote || 999999999);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Comparative GeM GTC / GFR Bidder Evaluation Matrix</h2>
                <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {tender.tenderNumber}
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Official GeM Statutory Selection Method: <strong>{tender.selectionMethod || 'L1 Lowest Price'}</strong> · {sorted.length} Bidders Evaluated
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="overflow-auto flex-1 p-6">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50">
                <th className="py-3 px-3">Rank / Status</th>
                <th className="py-3 px-3">Bidder Name</th>
                <th className="py-3 px-3">Commercial Offer</th>
                <th className="py-3 px-3">Stage 1: Baseline Compliance</th>
                <th className="py-3 px-3">Stage 2: Technical Qualification</th>
                <th className="py-3 px-3">Stage 3: Exemptions &amp; Preferences</th>
                <th className="py-3 px-3">Selection Verdict</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sorted.map((sub, idx) => {
                const comp = companies.find(c => c.id === sub.companyId);
                const evalData = sub.gemFrameworkEvaluation;
                const isDebarred = evalData?.stage1Baseline.debarmentCheck.status === 'DEBARRED';
                const isL1 = idx === 0 && !isDebarred && sub.status !== 'Disqualified';

                return (
                  <tr key={sub.id} className={`hover:bg-slate-50/80 transition-colors ${isDebarred ? 'bg-red-50/40' : ''}`}>
                    {/* Rank */}
                    <td className="py-3 px-3">
                      {isDebarred ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                          🚨 DEBARRED
                        </span>
                      ) : sub.status === 'Disqualified' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                          DISQUALIFIED
                        </span>
                      ) : isL1 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          L1 Winner
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-slate-700">
                          Rank #{idx + 1}
                        </span>
                      )}
                    </td>

                    {/* Bidder */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{comp?.name || sub.companyId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">PAN: {comp?.pan || '—'}</div>
                    </td>

                    {/* Commercial Offer */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {sub.formattedCommercialQuote || (sub.commercialQuote ? `₹ ${(sub.commercialQuote / 10000000).toFixed(2)} Cr` : '—')}
                    </td>

                    {/* Stage 1: Baseline */}
                    <td className="py-3 px-3">
                      {evalData ? (
                        <div className="space-y-0.5">
                          <div className={`font-semibold ${evalData.stage1Baseline.overallBaselinePassed ? 'text-emerald-700' : 'text-red-700'}`}>
                            {evalData.stage1Baseline.overallBaselinePassed ? '✓ Baseline Passed' : '✗ Baseline Failed'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            PAN/GST: {evalData.stage1Baseline.gemProfileVerified ? 'Active ✓' : 'Default ✗'} · GFR 144(xi): {evalData.stage1Baseline.gfr144xiCompliance.compliant ? 'Yes' : 'No'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            EMD: {evalData.stage1Baseline.emdCompliance.exempted ? 'MSE Exempt' : 'Paid'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Under Review</span>
                      )}
                    </td>

                    {/* Stage 2: Technical */}
                    <td className="py-3 px-3">
                      {evalData ? (
                        <div className="space-y-0.5">
                          <div className={`font-semibold ${evalData.stage2Technical.overallTechnicalPassed ? 'text-emerald-700' : 'text-red-700'}`}>
                            {evalData.stage2Technical.overallTechnicalPassed ? '✓ Technical Qualified' : '✗ Technical Failed'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Turnover: {evalData.stage2Technical.turnoverFilter.status === 'EXEMPTED' ? 'Exempted (MSE)' : 'Qualified'} · Exp: {evalData.stage2Technical.experienceFilter.status === 'EXEMPTED' ? 'Exempted' : 'Qualified'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Evaluating</span>
                      )}
                    </td>

                    {/* Stage 3: Preferences */}
                    <td className="py-3 px-3">
                      {evalData ? (
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            evalData.stage3Preferences.makeInIndia.supplierClass === 'Class-I Local'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {evalData.stage3Preferences.makeInIndia.supplierClass} ({evalData.stage3Preferences.makeInIndia.localContentPercentage}%)
                          </span>
                          {evalData.stage3Preferences.mseExemption.eligible && (
                            <div className="text-[10px] text-purple-700 font-semibold">
                              MSE {evalData.stage3Preferences.mseExemption.enterpriseCategory} {evalData.stage3Preferences.msePriceMatching.within15PercentWindow ? '· Within L1+15%' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Verdict */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <p className="text-[11px] text-slate-700 leading-tight">
                        {evalData?.oneLineExecutiveSummary || sub.status}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectBidder(sub.id);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Evaluated under General Terms and Conditions (GTC) and General Financial Rules (GFR).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
type Level = 'bid-list' | 'bidders' | 'bidder-detail';

interface BatchVerifyState {
  isRunning: boolean;
  currentIndex: number;
  currentStage: string;
  completedIds: string[];
  isDone: boolean;
}

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
  const [showComparativeMatrix, setShowComparativeMatrix] = useState(false);
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'Match' | 'Mismatch' | 'Missing'>('all');
  const [complianceSearch, setComplianceSearch] = useState('');

  // Batch verification state
  const [batchState, setBatchState] = useState<BatchVerifyState>({
    isRunning: false,
    currentIndex: -1,
    currentStage: '',
    completedIds: [],
    isDone: false,
  });
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const batchAbortRef = useRef(false);

  // Derived data
  const currentTender = tenders.find(t => t.id === selectedTenderId) || tenders[0];
  const tenderSubmissions = submissions.filter(s => s.tenderId === currentTender?.id);
  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId) || null;
  const selectedCompany = companies.find(c => c.id === selectedSubmission?.companyId) || null;

  // Batch verification handler
  const handleBatchVerification = useCallback(async () => {
    if (batchState.isRunning) return;
    batchAbortRef.current = false;
    const submissionIds = tenderSubmissions.map(s => s.id);
    setBatchState({ isRunning: true, currentIndex: 0, currentStage: 'Initialising...', completedIds: [], isDone: false });
    setShowSummaryReport(false);

    const stages = [
      { label: '🔍 Running OCR Scan...', ms: 600 },
      { label: '🏛️ Checking Govt APIs...', ms: 700 },
      { label: '🧠 Embedding Analysis...', ms: 500 },
      { label: '✨ LLM Clause Review...', ms: 700 },
      { label: '📊 Computing Score...', ms: 400 },
    ];

    const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < submissionIds.length; i++) {
      if (batchAbortRef.current) break;
      const subId = submissionIds[i];
      for (const stage of stages) {
        if (batchAbortRef.current) break;
        setBatchState(prev => ({ ...prev, currentIndex: i, currentStage: stage.label }));
        await delay(stage.ms);
      }
      if (!batchAbortRef.current) {
        await runVerificationForSubmission(subId);
        setBatchState(prev => ({ ...prev, completedIds: [...prev.completedIds, subId] }));
      }
    }

    if (!batchAbortRef.current) {
      setBatchState(prev => ({ ...prev, isRunning: false, isDone: true, currentIndex: -1, currentStage: '' }));
      setShowSummaryReport(true);
    }
  }, [batchState.isRunning, tenderSubmissions, runVerificationForSubmission]);

  const handleStopBatch = () => {
    batchAbortRef.current = true;
    setBatchState({ isRunning: false, currentIndex: -1, currentStage: '', completedIds: [], isDone: false });
  };

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

  const handleRunAI = async () => {
    if (!selectedSubmissionId) return;
    setIsVerifying(true);
    try {
      await runVerificationForSubmission(selectedSubmissionId);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewDoc = (doc: { name: string; type: string; fileSize: string; verified: boolean; fileContentUrl?: string; parsedData?: any }) => {
    setSelectedDocToView({
      name: doc.name,
      fileSize: doc.fileSize,
      type: doc.type,
      companyName: selectedCompany?.name || 'Bidder Enterprise',
      verified: doc.verified,
      uploadedAt: selectedSubmission?.submittedAt,
      fileContentUrl: doc.fileContentUrl,
      parsedData: doc.parsedData,
      commercialQuote: selectedSubmission?.commercialQuote,
      formattedCommercialQuote: selectedSubmission?.formattedCommercialQuote || (selectedSubmission?.commercialQuote ? `₹ ${(selectedSubmission.commercialQuote / 10000000).toFixed(2)} Cr` : undefined),
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
            <TenderListCard
              key={tender.id}
              tender={tender}
              mode="officer"
              appliedCount={subCount}
              onOfficerSelect={() => handleSelectBid(tender.id)}
              gemDocActions={
                <GemDocUpload tenderId={tender.id} existing={tender.gemBiddingDocument} />
              }
            />
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
              <TenderStatusBadge status={currentTender.status} />
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



      {/* Tender AI Intelligence Summary — officer view */}
      {(currentTender.tenderSummaryInfo || currentTender.gemBiddingDocument?.tenderSummaryInfo || currentTender.gemBiddingDocument?.parsedData?.tenderSummaryInfo) && (
        <TenderDetailSummary
          tender={currentTender}
          onViewGemDocument={
            currentTender.gemBiddingDocument?.fileContentUrl
              ? () => setSelectedDocToView({
                  name: currentTender.gemBiddingDocument!.name,
                  fileSize: currentTender.gemBiddingDocument!.fileSize,
                  type: 'PDF',
                  companyName: 'GeM Portal',
                  verified: true,
                  uploadedAt: currentTender.gemBiddingDocument!.uploadedAt,
                  fileContentUrl: currentTender.gemBiddingDocument!.fileContentUrl,
                })
              : undefined
          }
        />
      )}

      {/* Bidder cards */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Companies Applied for {currentTender.tenderNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tenderSubmissions.length} vendor bid{tenderSubmissions.length !== 1 ? 's' : ''} submitted
            </p>
          </div>
          {/* Batch verify & Evaluation controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComparativeMatrix(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow-md"
            >
              <Scale className="w-3.5 h-3.5 text-amber-300" />
              GeM Evaluation Matrix
            </button>
            {batchState.isDone && (
              <button
                onClick={() => setShowSummaryReport(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                View Summary Report
              </button>
            )}
            {batchState.isRunning ? (
              <button
                onClick={handleStopBatch}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleBatchVerification}
                disabled={tenderSubmissions.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow-md"
              >
                <Play className="w-3.5 h-3.5" />
                Start Verification
              </button>
            )}
          </div>
        </div>

        {/* Batch Progress Bar */}
        {batchState.isRunning && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-xs font-bold text-blue-800">
                  Verifying {batchState.currentIndex + 1} of {tenderSubmissions.length}: {(() => { const sub = tenderSubmissions[batchState.currentIndex]; return sub ? companies.find(c => c.id === sub.companyId)?.name : ''; })()}
                </span>
              </div>
              <span className="text-xs text-blue-600 font-mono">{batchState.currentStage}</span>
            </div>
            <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${((batchState.completedIds.length) / tenderSubmissions.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-blue-500">
              <span>{batchState.completedIds.length} completed</span>
              <span>{tenderSubmissions.length - batchState.completedIds.length} remaining</span>
            </div>
          </div>
        )}

        {tenderSubmissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No bidders have applied yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tenderSubmissions.map(sub => {
              const comp = companies.find(c => c.id === sub.companyId);

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
                    <div className="text-center sm:text-right px-2">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quoted Amount</div>
                      <div className="text-sm font-black text-blue-900 font-mono">
                        {sub.formattedCommercialQuote || (sub.commercialQuote ? `₹ ${(sub.commercialQuote / 10000000).toFixed(2)} Cr` : '—')}
                      </div>
                    </div>
                    <TenderStatusBadge status={sub.status} />
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

    const complianceItems = computeDynamicComplianceItems(currentTender, selectedSubmission);
    const registryChecks = selectedSubmission.documents.flatMap(doc =>
      (doc.verificationResult?.checks || []).map(check => ({
        ...check,
        documentName: doc.name,
      }))
    );

    const matchCount = complianceItems.filter(r => r.status === 'Match').length;
    const mismatchCount = complianceItems.filter(r => r.status === 'Mismatch').length;
    const missingCount = complianceItems.filter(r => r.status === 'Missing').length;

    const filteredComplianceItems = complianceItems.filter(item => {
      const matchesFilter = complianceFilter === 'all' || item.status === complianceFilter;
      const matchesSearch = !complianceSearch.trim() ||
        item.requirement.toLowerCase().includes(complianceSearch.toLowerCase()) ||
        item.evidence_found.toLowerCase().includes(complianceSearch.toLowerCase()) ||
        item.reason.toLowerCase().includes(complianceSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });

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
                <TenderStatusBadge status={selectedSubmission.status} />
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Quoted Amount:</span>
                  <span className="text-xs font-black text-blue-950 font-mono">
                    {selectedSubmission.formattedCommercialQuote || (selectedSubmission.commercialQuote ? `₹ ${(selectedSubmission.commercialQuote / 10000000).toFixed(2)} Cr` : '—')}
                  </span>
                </div>
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

        {/* Evaluation Summary Banner (shown after verification) */}
        {selectedSubmission.evaluationSummary && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">AI Evaluation Summary — One-Line Report</span>
              <p className="text-xs text-blue-900 leading-relaxed font-medium">{selectedSubmission.evaluationSummary}</p>
            </div>
          </div>
        )}

        {/* GeM Statutory 4-Stage GTC / GFR Evaluation Section */}
        <GemFrameworkEvaluationSection
          submission={selectedSubmission}
          company={selectedCompany}
          tender={currentTender}
        />

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
                <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs">
                  <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
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
                  {doc.verificationResult && (
                    <div className="mt-2 pl-6 flex items-start justify-between gap-2">
                      <div className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                        {doc.verificationResult.summary}
                      </div>
                      <VerificationBadge status={doc.verificationResult.finalStatus} />
                    </div>
                  )}
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
              {registryChecks.length === 0 ? (
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                  Run full AI verification to call the mock government APIs for this bidder's parsed documents.
                </div>
              ) : registryChecks.map((check, i) => (
                <div key={`${check.documentName}-${check.source}-${i}`} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">{check.source}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 break-all">
                      {check.identifier} from {check.documentName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-snug">{check.message}</div>
                  </div>
                  <VerificationBadge status={check.status} />
                </div>
              ))}
              {false && [
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

        {/* Tender Condition Compliance Panel */}
        {selectedSubmission.conditionChecks && selectedSubmission.conditionChecks.length > 0 && (() => {
          const checks = selectedSubmission.conditionChecks!;
          const compliantCount = checks.filter(c => c.status === 'COMPLIANT').length;
          const partialCount = checks.filter(c => c.status === 'PARTIAL').length;
          const failedCount = checks.filter(c => c.status === 'NON_COMPLIANT').length;

          const condStatusConfig: Record<string, { cls: string; badge: string; label: string }> = {
            COMPLIANT: { cls: 'border-emerald-200 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '✓ Compliant' },
            PARTIAL: { cls: 'border-amber-200 bg-amber-50/40', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: '⚠ Partial' },
            NON_COMPLIANT: { cls: 'border-red-200 bg-red-50/30', badge: 'bg-red-100 text-red-700 border-red-200', label: '✗ Missing' },
            NOT_VERIFIABLE: { cls: 'border-slate-200 bg-slate-50', badge: 'bg-slate-100 text-slate-600 border-slate-200', label: '? Unverifiable' },
          };

          return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-indigo-700" />
                  <div>
                    <h3 className="text-sm font-bold text-indigo-900">Tender Condition Compliance</h3>
                    <p className="text-[11px] text-indigo-600 mt-0.5">Semantic match of bidder documents against tender-specific eligibility conditions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{compliantCount} Compliant</span>
                  {partialCount > 0 && <span className="text-amber-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{partialCount} Partial</span>}
                  {failedCount > 0 && <span className="text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{failedCount} Missing</span>}
                </div>
              </div>
              <div className="p-4 space-y-2">
                {checks.map((c, i) => {
                  const cfg = condStatusConfig[c.status] || condStatusConfig.NOT_VERIFIABLE;
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${cfg.cls}`}>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-xs font-bold text-slate-800">{c.condition_title}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          c.category === 'financial' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.category === 'technical' ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : c.category === 'compliance' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>{c.category}</span>
                        {c.mandatory && (
                          <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Mandatory</span>
                        )}
                      </div>
                      {/* One-line verdict */}
                      <p className="text-[11px] text-slate-700 leading-snug font-medium">{c.verdict}</p>
                      {c.matched_in_doc && (
                        <p className="text-[10px] text-slate-400 mt-1">Matched in: {c.matched_in_doc}</p>
                      )}
                      {c.evidence_snippet && c.status === 'COMPLIANT' && (
                        <div className="mt-1.5 px-2 py-1 bg-white border border-slate-100 rounded text-[10px] text-slate-500 italic line-clamp-2">
                          {c.evidence_snippet}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Dynamic Tender Compliance Verification Agent */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Tender Compliance Verification Agent
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                      AI Verified
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentTender.gemBiddingDocument
                      ? <>Extracted dynamically from <strong>{currentTender.gemBiddingDocument.name}</strong> and cross-referenced with bidder documents</>
                      : 'Extracted dynamically from tender specifications and verified against submitted bidder documents'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Counters */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {matchCount} Match
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                {mismatchCount} Mismatch
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                {missingCount} Missing
              </span>
              <span className="text-slate-400 font-medium ml-1">
                Total: <strong>{complianceItems.length}</strong>
              </span>
            </div>
          </div>

          {/* Controls: Filter Pills & Search */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'Match', 'Mismatch', 'Missing'] as const).map(tab => {
                const count = tab === 'all' ? complianceItems.length
                  : tab === 'Match' ? matchCount
                  : tab === 'Mismatch' ? mismatchCount
                  : missingCount;
                const isActive = complianceFilter === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setComplianceFilter(tab)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      isActive
                        ? tab === 'Match'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : tab === 'Mismatch'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : tab === 'Missing'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'all' ? `All (${count})` : `${tab === 'Match' ? '✓ ' : tab === 'Mismatch' ? '⚠ ' : '✗ '}${tab} (${count})`}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={complianceSearch}
                onChange={e => setComplianceSearch(e.target.value)}
                placeholder="Search parameter or doc..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {complianceSearch && (
                <button
                  onClick={() => setComplianceSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 5-Column Compliance Table */}
          <div className="overflow-x-auto">
            {filteredComplianceItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <FileSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No compliance items match your current filter.</p>
                <p className="text-slate-400 mt-1">Try resetting the filter or search keyword.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-[24%]">1. Requirement from Tender</th>
                    <th className="py-3 px-4 w-[24%]">2. Evidence Found in Bidder Document</th>
                    <th className="py-3 px-4 w-[12%] text-center">3. Status</th>
                    <th className="py-3 px-4 w-[24%]">4. Reason for Result</th>
                    <th className="py-3 px-4 w-[16%]">5. Source Document / Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplianceItems.map((item, idx) => {
                    const statusConfig = {
                      Match: {
                        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        rowBg: 'hover:bg-emerald-50/20',
                        icon: CheckCircle2,
                        iconCls: 'text-emerald-600',
                        label: 'Match',
                      },
                      Mismatch: {
                        badge: 'bg-amber-100 text-amber-800 border-amber-300',
                        rowBg: 'bg-amber-50/25 hover:bg-amber-50/40',
                        icon: AlertCircle,
                        iconCls: 'text-amber-600',
                        label: 'Mismatch',
                      },
                      Missing: {
                        badge: 'bg-rose-100 text-rose-800 border-rose-300',
                        rowBg: 'bg-rose-50/25 hover:bg-rose-50/40',
                        icon: XCircle,
                        iconCls: 'text-rose-600',
                        label: 'Missing',
                      },
                    }[item.status];

                    const StatusIcon = statusConfig.icon;

                    // Match source document to an actual submitted doc if possible
                    const matchingDoc = selectedSubmission.documents.find(d => {
                      if (!item.source_document || item.source_document === 'Not provided') return false;
                      const docBase = item.source_document.toLowerCase().split(',')[0].trim();
                      const dName = d.name.toLowerCase();
                      return dName.includes(docBase) || docBase.includes(dName);
                    });

                    return (
                      <tr key={idx} className={`transition-colors ${statusConfig.rowBg}`}>
                        {/* 1. Requirement from Tender */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {item.requirement}
                          </div>
                          {item.category && (
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {item.category}
                            </span>
                          )}
                        </td>

                        {/* 2. Evidence Found in Bidder Document */}
                        <td className="py-3 px-4 align-top">
                          <div className={`text-[11px] leading-relaxed ${item.status === 'Missing' ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}`}>
                            {item.evidence_found || 'No evidence found in uploaded documents'}
                          </div>
                        </td>

                        {/* 3. Status */}
                        <td className="py-3 px-4 align-top text-center">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border shadow-2xs whitespace-nowrap ${statusConfig.badge}`}>
                            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* 4. Reason for Result */}
                        <td className="py-3 px-4 align-top">
                          <div className="text-[11px] text-slate-600 leading-relaxed font-normal">
                            {item.reason}
                          </div>
                        </td>

                        {/* 5. Source Document / Page */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-medium text-slate-700 break-words line-clamp-2">
                              {item.source_document || 'Not specified'}
                            </span>
                            {matchingDoc ? (
                              <button
                                onClick={() => handleViewDoc(matchingDoc)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View Doc
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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
              parsedData: gemDoc.parsedData,
              parsingStatus: gemDoc.parsingStatus,
              parseError: gemDoc.parseError,
              tenderSummaryInfo: gemDoc.tenderSummaryInfo || gemDoc.parsedData?.tenderSummaryInfo,
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

      {/* ── Summary Report Modal ─────────────────────────────────────── */}
      {showSummaryReport && (() => {
        const ranked = [...tenderSubmissions]
          .sort((a, b) => (b.complianceScore || 0) - (a.complianceScore || 0))
          .map((sub, idx) => {
            const comp = companies.find(c => c.id === sub.companyId);
            const score = sub.complianceScore || 0;
            const dynamicCompliance = computeDynamicComplianceItems(currentTender, sub);
            const satisfied = dynamicCompliance.filter(r => r.status === 'Match').length;
            const mismatch = dynamicCompliance.filter(r => r.status === 'Mismatch').length;
            const missing = dynamicCompliance.filter(r => r.status === 'Missing').length;
            const totalCount = dynamicCompliance.length;
            const recommendation =
              score >= 90 && missing === 0 && mismatch === 0 ? 'Technically Qualified'
              : score >= 75 && missing <= 1 ? 'Conditionally Qualified'
              : score >= 60 ? 'Clarification Required'
              : 'Disqualified';
            const recColor =
              recommendation === 'Technically Qualified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : recommendation === 'Conditionally Qualified' ? 'bg-blue-100 text-blue-800 border-blue-200'
              : recommendation === 'Clarification Required' ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-red-100 text-red-800 border-red-200';
            return { sub, comp, score, idx, satisfied, mismatch, missing, totalCount, recommendation, recColor, dynamicCompliance };
          });

        const qualifiedCount = ranked.filter(r => r.recommendation === 'Technically Qualified').length;
        const avgScore = Math.round(ranked.reduce((a, r) => a + r.score, 0) / ranked.length);
        const topBidder = ranked[0];

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
              onClick={() => setShowSummaryReport(false)}
            />
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart2 className="w-5 h-5 text-blue-300" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300">AI Verification Summary Report</span>
                    </div>
                    <h2 className="text-xl font-bold">Compliance Evaluation Report</h2>
                    <p className="text-sm text-blue-200 mt-0.5">
                      {currentTender.tenderNumber} · {currentTender.title.slice(0, 60)}{currentTender.title.length > 60 ? '…' : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Generated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST · Officer: GeM-OFFICER-789
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSummaryReport(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  {[
                    { label: 'Total Bidders', value: ranked.length, icon: Building2, color: 'text-blue-300' },
                    { label: 'Technically Qualified', value: qualifiedCount, icon: Trophy, color: 'text-emerald-300' },
                    { label: 'Average Score', value: `${avgScore}%`, icon: TrendingUp, color: 'text-amber-300' },
                    { label: 'Top Bidder', value: topBidder?.comp?.name?.split(' ')[0] || '—', icon: Award, color: 'text-purple-300' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</span>
                      </div>
                      <div className="text-lg font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Ranked Table */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Bidder Rankings — Compliance Matrix
                  </h3>
                  <div className="space-y-3">
                    {ranked.map(({ sub, comp, score, idx, satisfied, mismatch, missing, recommendation, recColor }) => {
                      const scoreColor =
                        score >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : score >= 75 ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-red-700 bg-red-50 border-red-200';
                      const isTop = idx === 0;

                      return (
                        <div
                          key={sub.id}
                          className={`rounded-xl border p-4 ${isTop ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'}`}
                        >
                          {/* Row header */}
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isTop ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              #{idx + 1}
                            </div>
                            {/* Avatar */}
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                              style={{ backgroundColor: comp?.color || '#94a3b8' }}
                            >
                              {comp?.name?.[0] || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-sm">{comp?.name}</span>
                                {isTop && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded">🏆 Top Bidder</span>}
                              </div>
                              <div className="text-[11px] text-slate-500">{comp?.city} · {comp?.sector}</div>
                            </div>
                            {/* Score */}
                            <span className={`font-bold font-mono text-sm px-3 py-1 rounded-lg border ${scoreColor}`}>
                              {score}%
                            </span>
                            {/* Recommendation */}
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${recColor}`}>
                              {recommendation}
                            </span>
                          </div>

                          {/* Details row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Documents</div>
                              <div className="font-bold text-slate-800">{sub.documents.length} submitted</div>
                              <div className="text-slate-500">{sub.documents.filter(d => d.verified).length} verified</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Tender Requirements</div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-700" title="Match">{satisfied} ✓</span>
                                <span className="font-bold text-amber-600" title="Mismatch">{mismatch} ⚠</span>
                                <span className="font-bold text-rose-600" title="Missing">{missing} ✗</span>
                              </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">AI Stage</div>
                              <div className="font-bold text-blue-700 font-mono">{sub.aiVerificationStage}</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Flags</div>
                              <div className={`font-bold ${(sub.flags?.length ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {(sub.flags?.length ?? 0) > 0 ? `${sub.flags!.length} flag(s)` : 'No flags ✓'}
                              </div>
                            </div>
                          </div>

                          {/* Flags */}
                          {(sub.flags?.length ?? 0) > 0 && (
                            <div className="mt-2 space-y-1">
                              {sub.flags!.map((flag, fi) => (
                                <div key={fi} className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                                  {flag}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommendation Summary */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Officer Recommendation Summary
                  </h3>
                  <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                    <p>
                      Based on AI verification of <strong>{ranked.length}</strong> bidders for tender{' '}
                      <strong>{currentTender.tenderNumber}</strong>:
                    </p>
                    <ul className="space-y-1 ml-3">
                      {ranked.map(({ comp, score, recommendation, idx }) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-slate-800">{comp?.name}</span>
                          <span className="text-slate-500">— Score: <strong>{score}%</strong></span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            recommendation === 'Technically Qualified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : recommendation === 'Conditionally Qualified' ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : recommendation === 'Clarification Required' ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                          }`}>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                    {topBidder && (
                      <p className="mt-2 pt-2 border-t border-slate-200">
                        <strong>Recommended for Award:</strong>{' '}
                        <span className="text-emerald-700 font-bold">{topBidder.comp?.name}</span>{' '}
                        with a compliance score of <strong>{topBidder.score}%</strong> and{' '}
                        {topBidder.satisfied} of {topBidder.totalCount} tender requirements matched ({topBidder.mismatch} mismatch, {topBidder.missing} missing).
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Auto-generated by GeM AI Verification Engine · {currentTender.tenderNumber}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Print Report
                  </button>
                  <button
                    onClick={() => setShowSummaryReport(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* GeM Statutory Comparative Evaluation Matrix Modal */}
      {showComparativeMatrix && (
        <ComparativeEvaluationModal
          tender={currentTender}
          submissions={submissions}
          companies={companies}
          onClose={() => setShowComparativeMatrix(false)}
          onSelectBidder={handleSelectBidder}
        />
      )}
    </div>
  );
};
