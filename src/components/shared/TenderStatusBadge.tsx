import React from 'react';

export function TenderStatusBadge({ status }: { status: string }) {
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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
    >
      {status}
    </span>
  );
}
