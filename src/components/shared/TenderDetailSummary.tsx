import React from 'react';
import { Eye, FileText, ShieldCheck, Sparkles, CheckCircle2, ListChecks, AlertCircle, Cpu } from 'lucide-react';
import type { Tender, TenderSummaryInfo } from '../../types';
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

export const TenderDetailSummary: React.FC<TenderDetailSummaryProps> = ({ tender, onViewGemDocument }) => {
  const summaryInfo: TenderSummaryInfo | undefined =
    tender.tenderSummaryInfo ||
    tender.gemBiddingDocument?.tenderSummaryInfo ||
    tender.gemBiddingDocument?.parsedData?.tenderSummaryInfo;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
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
                  <span className="font-medium truncate max-w-[170px]">{tender.gemBiddingDocument.name}</span>
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

      {/* AI Tender Intelligence: Specific Conditions & Needed Documents */}
      {summaryInfo && (
        <section className="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white border border-indigo-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  AI Tender Intelligence Summary
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-normal">
                    Auto-analyzed from GeM Bidding Document
                  </span>
                </h3>
              </div>
            </div>
            {summaryInfo.emd_amount && (
              <span className="text-xs bg-amber-400/20 border border-amber-300/40 text-amber-100 px-2.5 py-0.5 rounded-md font-semibold">
                EMD: {summaryInfo.emd_amount}
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {summaryInfo.scope_of_work && (
              <div className="bg-white/80 border border-indigo-100 rounded-lg p-3 text-xs text-slate-700 leading-relaxed shadow-2xs">
                <span className="font-bold text-indigo-900 block mb-0.5">Procurement Scope:</span>
                {summaryInfo.scope_of_work}
              </div>
            )}

            {/* Extracted Technical Specifications Table */}
            {summaryInfo.technical_specifications && summaryInfo.technical_specifications.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    Required Technical Specifications ({summaryInfo.technical_specifications.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Extracted from GeM Tender Specifications</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Parameter / Item</th>
                        <th className="py-2 px-3">Required Specification from Tender</th>
                        <th className="py-2 px-3">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {summaryInfo.technical_specifications.map((spec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-800">{spec.parameter}</td>
                          <td className="py-2 px-3 font-bold text-blue-900 font-mono">{spec.required_value}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              {spec.category || 'Technical'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Specific Conditions */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Specific Eligibility Conditions ({summaryInfo.conditions?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-400">Must be satisfied by Bidder</span>
                </div>
                <ul className="space-y-2.5 divide-y divide-slate-100">
                  {summaryInfo.conditions?.map((c, i) => (
                    <li key={i} className="pt-2.5 first:pt-0 text-xs">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-800">{c.title}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${REQUIREMENT_CATEGORY_COLORS[c.category] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {c.category}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{c.description}</p>
                    </li>
                  ))}
                  {(!summaryInfo.conditions || summaryInfo.conditions.length === 0) && (
                    <li className="text-xs text-slate-400 italic py-2">No specific condition thresholds listed.</li>
                  )}
                </ul>
              </div>

              {/* Needed Documents Checklist */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-emerald-600" />
                    Needed Documents for Bidders ({summaryInfo.needed_documents?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-400">Mandatory Submission Checklist</span>
                </div>
                <ul className="space-y-2.5 divide-y divide-slate-100">
                  {summaryInfo.needed_documents?.map((d, i) => (
                    <li key={i} className="pt-2.5 first:pt-0 text-xs">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {d.document_name}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                            d.mandatory
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {d.mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug pl-5">{d.purpose}</p>
                    </li>
                  ))}
                  {(!summaryInfo.needed_documents || summaryInfo.needed_documents.length === 0) && (
                    <li className="text-xs text-slate-400 italic py-2">Standard statutory tender documents required.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Published Tender Requirements List */}
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
};
