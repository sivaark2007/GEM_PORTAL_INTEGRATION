import React from 'react';
import { Eye, FileText, ShieldCheck } from 'lucide-react';
import type { Tender } from '../../types';
import { TenderStatusBadge } from './TenderStatusBadge';

const REQUIREMENT_CATEGORY_COLORS: Record<string, string> = {
  financial: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  technical: 'bg-blue-50 text-blue-700 border-blue-200',
  compliance: 'bg-amber-50 text-amber-700 border-amber-200',
  statutory: 'bg-purple-50 text-purple-700 border-purple-200',
};

export interface TenderDetailSummaryProps {
  tender: Tender;
  onViewGemDocument?: () => void;
}

export const TenderDetailSummary: React.FC<TenderDetailSummaryProps> = ({ tender, onViewGemDocument }) => (
  <div className="space-y-4">
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" style={{ borderLeft: '4px solid #2563eb' }}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {tender.tenderNumber}
            </span>
            <TenderStatusBadge status={tender.status} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">{tender.title}</h3>
          <p className="text-xs text-slate-500">
            {tender.ministry} · {tender.organization}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
            <span>
              <strong>Items:</strong> {tender.items || tender.title}
            </span>
            <span>
              <strong>Qty:</strong> {tender.quantity ?? '—'}
            </span>
            <span>
              <strong>Value:</strong> {tender.estimatedValue}
            </span>
            <span>
              <strong>Category:</strong> {tender.category}
            </span>
            <span>
              <strong>Start:</strong> {tender.startDate || '—'}
            </span>
            <span>
              <strong>End:</strong> {tender.endDate || tender.closingDate}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tender Document</p>
          {tender.gemBiddingDocument ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{tender.gemBiddingDocument.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tender.gemBiddingDocument.fileSize}</p>
              {tender.gemBiddingDocument.fileContentUrl && onViewGemDocument && (
                <button
                  type="button"
                  onClick={onViewGemDocument}
                  className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                >
                  <Eye className="w-3 h-3" />
                  Preview Tender Document
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400">No GeM bidding document attached yet.</p>
          )}
        </div>
      </div>
    </div>

    {tender.requirements.length > 0 && (
      <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tender Requirements</h2>
            <p className="text-xs text-slate-500">Same compliance requirements published by the procurement officer.</p>
          </div>
        </div>
        <ul className="divide-y divide-slate-100">
          {tender.requirements.map(req => (
            <li key={req.id} className="px-5 py-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-slate-900">{req.title}</span>
                <span
                  className={`px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${REQUIREMENT_CATEGORY_COLORS[req.category] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  {req.category}
                </span>
                {req.mandatory && (
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    Mandatory
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">{req.description}</p>
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
);
