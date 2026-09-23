import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Bot, 
  FileSearch, 
  Network, 
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';

export const RoleSelectionPage: React.FC = () => {
  const { selectRole } = useApp();

  return (
    <div className="relative min-h-[calc(100vh-4.25rem)] flex flex-col justify-between overflow-hidden">
      {/* Background architectural grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 w-full flex-1 flex flex-col justify-center">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          {/* Government e-Marketplace pill kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>National Public Procurement Portal Prototype</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-700">SIH 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            GeM AI Bid Compliance Platform
          </h1>
          
          <p className="mt-3 text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto">
            AI-Powered Integrated Bid Compliance Verification
          </p>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Automating multi-parameter tender evaluation, OCR document extraction, 
            statutory registry checks, and cross-bidder compliance intelligence.
          </p>
        </div>

        {/* Center: Two Large Clickable Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto w-full">
          
          {/* CARD 1: PROCUREMENT OFFICER */}
          <div 
            onClick={() => selectRole('officer')}
            className="group relative bg-white rounded-2xl border-2 border-slate-200/90 hover:border-blue-600 shadow-sm hover:shadow-xl transition-all duration-200 p-6 sm:p-8 flex flex-col justify-between cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRole('officer'); } }}
          >
            {/* Top corner tag */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                Evaluation Authority
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                Instant Access <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-blue-600/10 border border-blue-200 text-blue-700 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                <ShieldCheck className="w-8 h-8" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                PROCUREMENT OFFICER
              </h2>

              {/* Description (Exact as requested) */}
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-normal">
                Manage tenders, view participating bidders and start automated AI verification.
              </p>

              {/* Feature capabilities list for SIH showcase */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Included Officer Capabilities:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Tender Management</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>OCR Document Scan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>MCA / GSTIN API</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>LLM Compliance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Button (Exact as requested) */}
            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectRole('officer');
                }}
                className="w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm group-hover:shadow transition-all"
              >
                <span>Enter as Procurement Officer</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* CARD 2: BIDDER */}
          <div 
            onClick={() => selectRole('bidder')}
            className="group relative bg-white rounded-2xl border-2 border-slate-200/90 hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-200 p-6 sm:p-8 flex flex-col justify-between cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRole('bidder'); } }}
          >
            {/* Top corner tag */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                Vendor & Contractor
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                10 Dummy Companies <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-emerald-600/10 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-700 group-hover:text-white transition-all duration-200">
                <Building2 className="w-8 h-8" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                BIDDER
              </h2>

              {/* Description (Exact as requested) */}
              <p className="mt-3 text-sm text-slate-600 leading-relaxed font-normal">
                Apply for tenders and upload bid documents for verification.
              </p>

              {/* Feature capabilities list for SIH showcase */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Included Bidder Capabilities:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Live GeM Tenders</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Document Upload</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Bidder Registry</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Submission Status</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Button (Exact as requested) */}
            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectRole('bidder');
                }}
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm group-hover:shadow transition-all"
              >
                <span>Enter as Bidder</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Prototype & Hackathon Notice banner at bottom */}
        <div className="mt-10 max-w-3xl mx-auto w-full bg-slate-100/80 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-800">Demonstration Mode:</span>
            <span>No passwords, JWT, or real credentials needed. Click any role to instantly evaluate.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-slate-500">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Smart India Hackathon</span>
          </div>
        </div>

      </div>

      {/* Footer minimal info */}
      <footer className="border-t border-slate-200/80 bg-white py-3 text-center text-xs text-slate-500">
        GeM AI Bid Compliance Platform · Ministry of Commerce & Industry · Government of India
      </footer>
    </div>
  );
};
