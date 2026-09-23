import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Company } from '../types';
import { CreateCompanyModal } from './CreateCompanyModal';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  FileCheck2,
  Sparkles,
  Info
} from 'lucide-react';

export const BidderSelectionPage: React.FC = () => {
  const { companies, selectCompany, createCompany, navigateTo } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.sector && c.sector.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateCompany = (companyData: Omit<Company, 'id'>, enterImmediately: boolean) => {
    const created = createCompany(companyData);
    setIsModalOpen(false);
    if (enterImmediately) {
      selectCompany(created);
    }
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb / Header */}
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
              <span className="text-slate-800 font-semibold">Bidder Entities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Select Bidder Entity
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select one of the registered vendor entities to simulate bidding, document uploads, and compliance status.
            </p>
          </div>

          {/* Action: + Create New Dummy Company */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Dummy Company</span>
            </button>
          </div>
        </div>

        {/* Prototype Guidance Strip */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Prototype Demonstration Environment:</span>
            <span className="ml-1 text-emerald-800">
              Authentication is bypassed. Click <strong>Enter Dashboard</strong> on any company card below to directly open that company&apos;s Bidder Dashboard.
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company name, GSTIN, PAN, or sector..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing <span className="font-bold text-slate-800 tabular-nums">{filteredCompanies.length}</span> of <span className="font-bold text-slate-800 tabular-nums">{companies.length}</span> companies
          </div>
        </div>

        {/* 10 Dummy Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company, index) => {
            const initials = getInitials(company.name);

            return (
              <div
                key={company.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-600/80 shadow-2xs hover:shadow-md transition-all duration-150 p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Top card bar with logo placeholder & status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Logo placeholder with distinctive color/initials */}
                      <div 
                        className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm tracking-wider text-white shadow-2xs shrink-0"
                        style={{ backgroundColor: company.color || '#0d9488' }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-emerald-800 transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {company.sector || 'IT Hardware & Solutions'} · {company.city || 'India'}
                        </p>
                      </div>
                    </div>

                    {company.isCustom && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                        Custom
                      </span>
                    )}
                  </div>

                  {/* Company Identifiers & Statutory Info */}
                  <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 space-y-1.5 text-[11px] mb-4">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">GSTIN</span>
                      <span className="font-mono font-medium text-slate-800 tabular-nums">{company.gstin}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">PAN</span>
                      <span className="font-mono font-medium text-slate-800 tabular-nums">{company.pan}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Udyam No.</span>
                      <span className="font-mono text-slate-700 truncate max-w-[170px] text-right" title={company.udyamNumber}>
                        {company.udyamNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">CIN</span>
                      <span className="font-mono text-slate-700 truncate max-w-[170px] text-right" title={company.cin}>
                        {company.cin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enter Dashboard Button */}
                <div className="pt-2">
                  <button
                    onClick={() => selectCompany(company)}
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs group-hover:bg-emerald-800 transition-colors"
                  >
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No Companies Found</h3>
            <p className="text-xs text-slate-500 mb-4">
              No registered dummy company matches &quot;{searchTerm}&quot;.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setIsModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create This Company</span>
            </button>
          </div>
        )}

      </div>

      {/* Registration Modal */}
      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCompany}
      />
    </div>
  );
};
