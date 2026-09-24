import React, { useState } from 'react';
import { Company } from '../types';
import { X, Sparkles, Building2, Check, AlertCircle } from 'lucide-react';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (companyData: Omit<Company, 'id'>, enterImmediately: boolean) => void;
  creationError?: string;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  creationError,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [udyamNumber, setUdyamNumber] = useState('');
  const [cin, setCin] = useState('');
  const [sector, setSector] = useState('IT & Software Systems');
  const [city, setCity] = useState('New Delhi');
  const [enterDirectly, setEnterDirectly] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAutoFill = () => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const prefixes = ['Quantum', 'Apex', 'Zenith', 'Bharat', 'Matrix', 'Garuda'];
    const chosenPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const compName = `${chosenPrefix} Infotech Solutions Pvt Ltd`;
    
    setName(compName);
    setEmail(`procurement@${chosenPrefix.toLowerCase()}info.in`);
    setContactNumber(`+91 98${Math.floor(Math.random() * 89999999 + 10000000)}`);
    setGstin(`27AAB${chosenPrefix.slice(0, 2).toUpperCase()}${randomNum}K1Z5`);
    setPan(`AAB${chosenPrefix.slice(0, 2).toUpperCase()}${randomNum}K`);
    setUdyamNumber(`UDYAM-MH-02-00${randomNum}9`);
    setCin(`U72200MH2021PTC${randomNum}44`);
    setSector('Cloud & Cyber Defense Solutions');
    setCity('Pune');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a Company Name');
      return;
    }

    onCreate({
      name: name.trim(),
      email: email.trim() || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
      contactNumber: contactNumber.trim() || '+91 98100 12345',
      gstin: gstin.trim().toUpperCase() || '07AABCT9988K1Z2',
      pan: pan.trim().toUpperCase() || 'AABCT9988K',
      udyamNumber: udyamNumber.trim().toUpperCase() || 'UDYAM-DL-01-0099887',
      cin: cin.trim().toUpperCase() || 'U72200DL2022PTC398124',
      sector: sector || 'Enterprise IT Solutions',
      city: city || 'New Delhi',
      color: '#0284c7'
    }, enterDirectly);

    // Reset
    setName('');
    setEmail('');
    setContactNumber('');
    setGstin('');
    setPan('');
    setUdyamNumber('');
    setCin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Register Dummy Company</h3>
              <p className="text-xs text-slate-500">Prototype Vendor Entity Registration for GeM Evaluation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Quick Auto-fill button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="text-xs text-amber-900 font-medium">
              Want sample data quickly for the demo?
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Fill Dummy Data</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {creationError && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{creationError}</span>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Tech Solutions Pvt Ltd"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bids@company.in"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 98110 23412"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="07AAACA1234F1Z5"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="AAACA1234F"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Udyam Number
              </label>
              <input
                type="text"
                value={udyamNumber}
                onChange={(e) => setUdyamNumber(e.target.value.toUpperCase())}
                placeholder="UDYAM-DL-01-0023451"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CIN (Corporate Identity No.)
              </label>
              <input
                type="text"
                value={cin}
                onChange={(e) => setCin(e.target.value.toUpperCase())}
                placeholder="U72200DL2015PTC281920"
                className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. IT Infrastructure"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action selection */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={enterDirectly}
                onChange={(e) => setEnterDirectly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Directly enter this company's Bidder Dashboard upon creation</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Create Company</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
