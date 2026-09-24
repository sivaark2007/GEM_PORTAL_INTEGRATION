import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  IndianRupee,
  Building2,
  Calendar,
  Tag,
  ShieldCheck,
  File,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ParsedDocumentResult, Tender, TenderRequirement } from '../../types';
import { parseDocumentWithService } from '../../services/documentParser';

interface CreateTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tender: Omit<Tender, 'id' | 'appliedBiddersCount'>, documentFiles: UploadedDoc[], gemDoc?: TenderDocumentUpload) => void;
}

export interface UploadedDoc {
  name: string;
  size: string;
  type: string;
}

export interface TenderDocumentUpload extends UploadedDoc {
  fileContentUrl?: string;
  parsedData?: ParsedDocumentResult;
  parsingStatus?: 'processing' | 'complete' | 'failed';
  parseError?: string;
}

type Step = 1 | 2 | 3;

const CATEGORIES = [
  'Hardware & IT Infrastructure',
  'Electronic Systems & AI',
  'Networking & Maintenance',
  'Software & Cloud Services',
  'Defence & Security Equipment',
  'Office Supplies & Furniture',
  'Medical Equipment & Supplies',
  'Civil Works & Construction',
  'Transport & Vehicles',
  'Other',
];

const REQUIREMENT_CATEGORIES: TenderRequirement['category'][] = [
  'financial',
  'technical',
  'compliance',
  'statutory',
];

const CATEGORY_COLORS: Record<string, string> = {
  financial: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  technical: 'bg-blue-50 text-blue-700 border-blue-200',
  compliance: 'bg-amber-50 text-amber-700 border-amber-200',
  statutory: 'bg-purple-50 text-purple-700 border-purple-200',
};

const emptyRequirement = (): Omit<TenderRequirement, 'id'> => ({
  title: '',
  category: 'compliance',
  description: '',
  mandatory: true,
});

export const CreateTenderModal: React.FC<CreateTenderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState<Step>(1);

  // Step 1: Tender Details
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [ministry, setMinistry] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [closingDate, setClosingDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'Evaluation' | 'Closed'>('Active');

  // Step 2: Requirements
  const [requirements, setRequirements] = useState<Omit<TenderRequirement, 'id'>[]>([emptyRequirement()]);

  // Step 3: Documents
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [gemBiddingDoc, setGemBiddingDoc] = useState<TenderDocumentUpload | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gemFileInputRef = useRef<HTMLInputElement>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Tender title is required';
    if (!organization.trim()) newErrors.organization = 'Organization is required';
    if (!ministry.trim()) newErrors.ministry = 'Ministry is required';
    if (!estimatedValue.trim()) newErrors.estimatedValue = 'Estimated value is required';
    if (!closingDate) newErrors.closingDate = 'Closing date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const validReqs = requirements.filter(r => r.title.trim());
    if (validReqs.length === 0) newErrors.requirements = 'At least one requirement is needed';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const addRequirement = () => {
    setRequirements(prev => [...prev, emptyRequirement()]);
  };

  const removeRequirement = (idx: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRequirement = (idx: number, field: string, value: string | boolean) => {
    setRequirements(prev =>
      prev.map((req, i) => (i === idx ? { ...req, [field]: value } : req))
    );
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (files: File[]) => {
    const newDocs: UploadedDoc[] = files.map(f => ({
      name: f.name,
      size: f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(f.size / 1024).toFixed(0)} KB`,
      type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
    }));
    setUploadedDocs(prev => [...prev, ...newDocs]);
  };

  const handleGemFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;
    const document: TenderDocumentUpload = {
      name: file.name,
      size: sizeStr,
      type: 'PDF',
      fileContentUrl: url,
      parsingStatus: 'processing',
    };
    setGemBiddingDoc(document);
    if (gemFileInputRef.current) gemFileInputRef.current.value = '';

    try {
      const parsed = await parseDocumentWithService(file, file.name);
      setGemBiddingDoc(current => current?.fileContentUrl === url
        ? (parsed.success
          ? { ...document, parsedData: parsed, parsingStatus: 'complete' }
          : { ...document, parsingStatus: 'failed', parseError: parsed.error || 'Tender document parsing failed.' })
        : current
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tender document parsing failed.';
      setGemBiddingDoc(current => current?.fileContentUrl === url
        ? { ...document, parsingStatus: 'failed', parseError: message }
        : current
      );
    }
  };

  const removeDoc = (idx: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (gemBiddingDoc?.parsingStatus === 'processing') {
      setErrors(prev => ({ ...prev, gemDoc: 'Wait for tender document text extraction to finish.' }));
      return;
    }
    const yearSuffix = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const tenderNumber = `GEM/${yearSuffix}/B/${randomNum}`;

    const validReqs: TenderRequirement[] = requirements
      .filter(r => r.title.trim())
      .map((r, i) => ({
        ...r,
        id: `req-new-${Date.now()}-${i}`,
      }));

    const tenderData: Omit<Tender, 'id' | 'appliedBiddersCount'> = {
      tenderNumber,
      title: title.trim(),
      organization: organization.trim(),
      ministry: ministry.trim(),
      estimatedValue: estimatedValue.trim().startsWith('₹') ? estimatedValue.trim() : `₹ ${estimatedValue.trim()}`,
      category,
      closingDate,
      status,
      requirements: validReqs,
    };

    onSubmit(tenderData, uploadedDocs, gemBiddingDoc || undefined);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setOrganization('');
    setMinistry('');
    setEstimatedValue('');
    setCategory(CATEGORIES[0]);
    setClosingDate('');
    setStatus('Active');
    setRequirements([emptyRequirement()]);
    setUploadedDocs([]);
    setGemBiddingDoc(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const stepLabels = ['Tender Details', 'Compliance Requirements', 'Upload Documents'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Create New GeM Tender
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of 3 — {stepLabels[step - 1]}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-100 bg-white shrink-0">
          {stepLabels.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-blue-700 text-white shadow-md shadow-blue-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      isActive ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 rounded-full transition-colors ${
                      step > stepNum ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* STEP 1: Tender Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <FileText className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                  Tender Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Procurement of Enterprise Cloud Computing Servers"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all ${
                    errors.title ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                    Organization *
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                    placeholder="e.g. National Informatics Centre (NIC)"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all ${
                      errors.organization ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                    }`}
                  />
                  {errors.organization && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.organization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                    Ministry *
                  </label>
                  <input
                    type="text"
                    value={ministry}
                    onChange={e => setMinistry(e.target.value)}
                    placeholder="e.g. Ministry of Electronics & IT"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all ${
                      errors.ministry ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                    }`}
                  />
                  {errors.ministry && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.ministry}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <IndianRupee className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                    Estimated Value (₹) *
                  </label>
                  <input
                    type="text"
                    value={estimatedValue}
                    onChange={e => setEstimatedValue(e.target.value)}
                    placeholder="e.g. 8,45,00,000"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono ${
                      errors.estimatedValue ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                    }`}
                  />
                  {errors.estimatedValue && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.estimatedValue}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <Tag className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                    Closing Date *
                  </label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={e => setClosingDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all ${
                      errors.closingDate ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-white'
                    }`}
                  />
                  {errors.closingDate && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.closingDate}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Status
                </label>
                <div className="flex items-center gap-3">
                  {(['Active', 'Evaluation'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        status === s
                          ? s === 'Active'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Compliance Requirements */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mandatory Compliance Criteria</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define evaluation requirements for bidder submissions
                  </p>
                </div>
                <button
                  onClick={addRequirement}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Requirement
                </button>
              </div>

              {errors.requirements && (
                <p className="text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.requirements}
                </p>
              )}

              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={req.title}
                            onChange={e => updateRequirement(idx, 'title', e.target.value)}
                            placeholder="Requirement title (e.g. Make in India Certification)"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
                          />
                        </div>

                        <input
                          type="text"
                          value={req.description}
                          onChange={e => updateRequirement(idx, 'description', e.target.value)}
                          placeholder="Description (e.g. Minimum 50% local content verified by auditor)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white text-slate-600"
                        />

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">Category:</span>
                            {REQUIREMENT_CATEGORIES.map(cat => (
                              <button
                                key={cat}
                                onClick={() => updateRequirement(idx, 'category', cat)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                  req.category === cat
                                    ? CATEGORY_COLORS[cat]
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>

                          <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                            <input
                              type="checkbox"
                              checked={req.mandatory}
                              onChange={e => updateRequirement(idx, 'mandatory', e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                            />
                            <span className="text-[11px] font-semibold text-slate-600">Mandatory</span>
                          </label>
                        </div>
                      </div>

                      {requirements.length > 1 && (
                        <button
                          onClick={() => removeRequirement(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove requirement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Upload Documents */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Tender Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach the GeM Bidding document (mandatory — one per tender) and any supporting files
                </p>
              </div>

              {/* GeM Bidding Document — one per tender */}
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-5 bg-blue-50/40">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      GeM Bidding Document
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">One Per Tender</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      e.g. GeM-Bidding-9318928.pdf — used for AI requirement cross-verification
                    </p>
                  </div>
                </div>
                <input
                  ref={gemFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleGemFileSelect}
                />
                {gemBiddingDoc ? (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
                    <File className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="flex-1 truncate">
                    <div className="text-xs font-semibold text-slate-900 truncate">{gemBiddingDoc.name}</div>
                    <div className="text-[10px] text-slate-400">{gemBiddingDoc.size}</div>
                    {gemBiddingDoc.parsingStatus === 'processing' && <div className="text-[10px] text-blue-700 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Extracting text…</div>}
                    {gemBiddingDoc.parsingStatus === 'complete' && <div className="text-[10px] text-emerald-700">Text extracted</div>}
                    {gemBiddingDoc.parsingStatus === 'failed' && <div className="text-[10px] text-red-700" title={gemBiddingDoc.parseError}>Parsing failed</div>}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <button
                      onClick={() => gemFileInputRef.current?.click()}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Replace
                    </button>
                    <button onClick={() => setGemBiddingDoc(null)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => gemFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Click to upload GeM Bidding Document
                  </button>
                )}
              </div>

              {errors.gemDoc && <p className="text-xs text-red-600">{errors.gemDoc}</p>}

              {/* Additional Supporting Documents Drop Zone */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Additional Supporting Documents (optional)</h4>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip"
                />
                <Upload
                  className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                    isDragging ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <p className="text-sm font-semibold text-slate-700">
                  {isDragging ? 'Drop files here...' : 'Drag & drop files or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, DOC, DOCX, XLS, XLSX, CSV, Images, ZIP — Max 25 MB per file
                </p>
              </div>

              {/* Uploaded File List */}
              {uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {uploadedDocs.length} Document{uploadedDocs.length > 1 ? 's' : ''} Ready
                  </h4>
                  {uploadedDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white text-xs group hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <File className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {doc.type} · {doc.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Ready
                        </span>
                        <button
                          onClick={() => removeDoc(idx)}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-100 p-4 space-y-2">
                <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Tender Summary
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-slate-500">Title:</div>
                  <div className="font-semibold text-slate-800 truncate">{title || '—'}</div>
                  <div className="text-slate-500">Organization:</div>
                  <div className="font-semibold text-slate-800 truncate">{organization || '—'}</div>
                  <div className="text-slate-500">Estimated Value:</div>
                  <div className="font-mono font-semibold text-slate-800">
                    {estimatedValue ? (estimatedValue.startsWith('₹') ? estimatedValue : `₹ ${estimatedValue}`) : '—'}
                  </div>
                  <div className="text-slate-500">Requirements:</div>
                  <div className="font-semibold text-slate-800">
                    {requirements.filter(r => r.title.trim()).length} defined
                  </div>
                  <div className="text-slate-500">GeM Doc:</div>
                  <div className="font-semibold text-slate-800">{gemBiddingDoc ? gemBiddingDoc.name : '— Not uploaded'}</div>
                  <div className="text-slate-500">Documents:</div>
                  <div className="font-semibold text-slate-800">{uploadedDocs.length} uploaded</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <button
            onClick={step === 1 ? handleClose : handleBack}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            {step === 1 ? (
              <>Cancel</>
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </>
            )}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={gemBiddingDoc?.parsingStatus === 'processing'}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Publish Tender
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
