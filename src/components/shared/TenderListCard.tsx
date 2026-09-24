import React from 'react';
import { ChevronRight, ExternalLink, Eye, FileText } from 'lucide-react';
import type { Tender } from '../../types';
import { TenderStatusBadge } from './TenderStatusBadge';

const displayItems = (tender: Tender) => {
  const text = tender.items || tender.title;
  return text.length > 55 ? `${text.slice(0, 55)}...` : text;
};

export interface TenderListCardProps {
  tender: Tender;
  mode: 'officer' | 'bidder';
  appliedCount?: number;
  alreadySubmitted?: boolean;
  onOfficerSelect?: () => void;
  onBidderApply?: () => void;
  gemDocActions?: React.ReactNode;
  onViewGemDocument?: () => void;
}

export const TenderListCard: React.FC<TenderListCardProps> = ({
  tender,
  mode,
  appliedCount = 0,
  alreadySubmitted = false,
  onOfficerSelect,
  onBidderApply,
  gemDocActions,
  onViewGemDocument,
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-xs hover:shadow-md transition-all ${mode === 'officer' ? 'cursor-pointer group' : ''}`}
      style={{ borderTop: '3px solid #f59e0b' }}
      onClick={mode === 'officer' ? onOfficerSelect : undefined}
    >
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">BID NO:</span>{' '}
            {mode === 'officer' ? (
              <button
                type="button"
                className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  onOfficerSelect?.();
                }}
              >
                {tender.tenderNumber}
              </button>
            ) : (
              <span className="text-sm font-bold text-sky-700">{tender.tenderNumber}</span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <TenderStatusBadge status={tender.status} />
            {mode === 'officer' && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline whitespace-nowrap"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                View Corrigendum/Representation
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-[13px]">
          <div className="sm:col-span-1">
            <div>
              <span className="font-semibold text-slate-800">Items:</span>{' '}
              <span className={mode === 'officer' ? 'text-blue-600 hover:underline cursor-pointer' : 'text-slate-700'}>
                {displayItems(tender)}
              </span>
            </div>
            <div className="mt-1">
              <span className="font-semibold text-slate-800">Quantity:</span>{' '}
              <span className="text-slate-700">{tender.quantity ?? '—'}</span>
            </div>
            <div className="mt-1">
              <span className="font-semibold text-slate-800">Title:</span>{' '}
              <span className="text-slate-700 leading-snug">{tender.title}</span>
            </div>
            {mode === 'officer' ? (
              <div className="mt-1 flex items-center gap-1">
                <span className="font-semibold text-slate-800">Bidders Applied:</span>{' '}
                <span className="font-bold text-blue-700">{appliedCount}</span>
              </div>
            ) : null}
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
              {gemDocActions}
              {mode === 'bidder' && tender.gemBiddingDocument && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate font-medium">{tender.gemBiddingDocument.name}</span>
                    <span className="text-slate-400 font-mono text-[10px] shrink-0">
                      ({tender.gemBiddingDocument.fileSize})
                    </span>
                  </div>
                  {tender.gemBiddingDocument.fileContentUrl && onViewGemDocument && (
                    <button
                      type="button"
                      onClick={onViewGemDocument}
                      className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium w-fit"
                    >
                      <Eye className="w-3 h-3" />
                      Preview GeM Bidding Document
                    </button>
                  )}
                </div>
              )}
              {!gemDocActions && mode === 'bidder' && !tender.gemBiddingDocument && (
                <span className="text-[11px] text-slate-400">GeM bidding document not uploaded yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-lg">
        <span className="text-[11px] text-slate-500">
          Est. Value: <strong className="text-slate-800 font-mono">{tender.estimatedValue}</strong>
          {' · '}
          {tender.category}
        </span>
        {mode === 'officer' ? (
          <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            View Applied Bidders <ChevronRight className="w-3.5 h-3.5" />
          </span>
        ) : alreadySubmitted ? (
          <span className="text-xs text-emerald-700 font-semibold">Bid Submitted</span>
        ) : (
          <button
            type="button"
            onClick={onBidderApply}
            className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline underline-offset-2"
          >
            View / Apply
          </button>
        )}
      </div>
    </div>
  );
};
