import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Building2, UserCog, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

export const Header: React.FC = () => {
  const { role, view, selectedCompany, navigateTo, selectRole } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top micro strip with Indian tricolor subtle accent */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600 w-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('role-selection')}
              className="flex items-center gap-3 group text-left focus:outline-none"
              title="Return to Home / Role Selection"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
                <span className="font-extrabold text-sm tracking-wider text-amber-400">GeM</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">
                    GeM AI Bid Compliance
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.2">
                    SIH 2026 Prototype
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Government e-Marketplace · Bid Evaluation Portal
                </div>
              </div>
            </button>
          </div>

          {/* Contextual navigation & Quick Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={window.history.length <= 1}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent rounded-md transition-colors"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => window.history.forward()}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Go forward"
                aria-label="Go forward"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {view !== 'role-selection' && (
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 border-r border-slate-200 pr-3">
                <span className="text-slate-400">Current Context:</span>
                {role === 'officer' && (
                  <span className="font-medium text-slate-900 flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5 text-blue-700" />
                    Procurement Officer
                  </span>
                )}
                {role === 'bidder' && selectedCompany && (
                  <span className="font-medium text-slate-900 flex items-center gap-1.5 truncate max-w-[200px]" title={selectedCompany.name}>
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    {selectedCompany.name}
                  </span>
                )}
              </div>
            )}

            {view === 'bidder-dashboard' && (
              <button
                onClick={() => navigateTo('bidder-selection')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                title="Choose another dummy company"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Switch Company</span>
              </button>
            )}

            {view !== 'role-selection' ? (
              <button
                onClick={() => navigateTo('role-selection')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch Role</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Evaluation Sandbox Mode</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
