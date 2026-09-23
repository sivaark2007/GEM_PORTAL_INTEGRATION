import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileSearch, 
  Sparkles, 
  Eye, 
  Building2, 
  Calendar, 
  QrCode, 
  FileCode,
  ExternalLink
} from 'lucide-react';

export interface DocumentInfo {
  name: string;
  type?: string;
  fileSize?: string;
  companyName?: string;
  verified?: boolean;
  uploadedAt?: string;
  fileContentUrl?: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  document,
  onClose
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'preview' | 'ocr' | 'ai-insights'>('preview');

  if (!isOpen || !document) return null;

  // Determine doc type and mock realistic Indian procurement document details
  const docName = document.name.toLowerCase();
  
  let docTitle = document.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
  let docCategory = "General Bid Document";
  let authority = document.companyName || "ABC Technologies Pvt Ltd";
  let certId = `GEM-DOC-${Math.floor(100000 + Math.random() * 900000)}`;
  let qrCodeText = `GeM Verified Doc: ${document.name} | Cert: ${certId}`;

  let extractedData: Record<string, string> = {
    "Document Name": document.name,
    "File Format": document.type || "PDF / Digital Certificate",
    "File Size": document.fileSize || "1.8 MB",
    "Verification Authority": "GeM Automated OCR & DigiLocker Gateway",
    "Digital Signature (DSC)": "Valid & Timestamped (Class 3)",
  };

  let ocrSampleText = "";
  let aiInsights = "";

  if (docName.includes('turnover') || docName.includes('balance') || docName.includes('ca_')) {
    docCategory = "Financial Turnover Certificate (CA Certified)";
    certId = `UDIN-26093847AAAA${Math.floor(1000 + Math.random() * 9000)}`;
    extractedData = {
      ...extractedData,
      "Statutory Auditor": "M/s R.K. Sharma & Associates, Chartered Accountants",
      "ICAI Membership No.": "094837 / FRN: 012934N",
      "UDIN Number": certId,
      "FY 2023-24 Turnover": "₹ 18,45,20,000",
      "FY 2024-25 Turnover": "₹ 22,10,50,000",
      "FY 2025-26 Turnover": "₹ 27,80,00,000",
      "3-Year Average Turnover": "₹ 22.78 Crores (Exceeds ₹15 Cr requirement)",
      "Net Worth Status": "Positive (₹ 9.40 Crores)",
    };
    ocrSampleText = `[ICAI UDIN: ${certId}]\nTO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that M/s ${authority} having registered office at New Delhi has achieved the following audited annual financial turnovers for the preceding three financial years:\n\n1. Financial Year 2023-2024: INR 18,45,20,000 /-\n2. Financial Year 2024-2025: INR 22,10,50,000 /-\n3. Financial Year 2025-2026: INR 27,80,00,000 /-\n\nThe Average Annual Turnover for the 3-year evaluation block is INR 22,78,56,666/-. The figures are verified from statutory audit books of accounts.`;
    aiInsights = `✓ Turnover meets and exceeds the ₹15.00 Crore tender eligibility threshold.\n✓ UDIN format verified successfully against the Institute of Chartered Accountants of India (ICAI) registry.\n✓ No discrepancies detected in balance sheet totals.`;
  } else if (docName.includes('india') || docName.includes('mii') || docName.includes('make')) {
    docCategory = "Make In India (MII) Local Content Declaration";
    extractedData = {
      ...extractedData,
      "MII Supplier Classification": "Class-I Local Supplier",
      "Local Content Percentage": "64.5% (Requirement: Min 50%)",
      "Manufacturing Location": "Okhla Industrial Area Phase-III, New Delhi",
      "Auditor / Management Signatory": "Director & Statutory Auditor",
      "DPIIT Order Compliance": "Public Procurement (Preference to Make in India) Order 2017 & amendments",
    };
    ocrSampleText = `SELF DECLARATION / STATUTORY AUDITOR CERTIFICATE FOR LOCAL CONTENT\n(As per Ministry of Commerce & Industry / DPIIT Guidelines)\n\nWe hereby confirm that the goods/services offered by M/s ${authority} meet the mandatory Class-I Local Content requirement.\n- Percentage of Local Value Addition: 64.50%\n- Primary Manufacturing / Assembly Location: Plot 42, Okhla Phase-III, New Delhi, 110020\n- Description of Value Addition: PCB Assembly, Firmware Flashing, Testing, Chassis Fabrication in India.\n\nAuthorized Signatory & Seal`;
    aiInsights = `✓ Bidder qualifies as Class-I Local Supplier with 64.5% domestic value addition.\n✓ Exceeds the tender's minimum 50% threshold for purchase preference.\n✓ Address correlates with company GSTIN state code (07 - Delhi).`;
  } else if (docName.includes('oem') || docName.includes('maf') || docName.includes('authorization')) {
    docCategory = "Manufacturer's Authorization Form (OEM MAF)";
    extractedData = {
      ...extractedData,
      "OEM Enterprise": "Intel & Cisco Systems Global Procurement Partner",
      "Authorized Bidder": authority,
      "Tender Scope Coverage": "Hardware Supply, Onsite 3-Year 24x7 SLA, Warranty Backing",
      "Authorization Validity": "Valid up to 31st March 2029",
      "Direct OEM SLA Backing": "Confirmed via digital cryptographic token",
    };
    ocrSampleText = `MANUFACTURER'S AUTHORIZATION FORM (MAF)\n\nTo,\nThe Procurement Officer, GeM Evaluation Committee\n\nSubject: OEM Authorization for Tender Participation\n\nWe, the OEM manufacturers of enterprise hardware, do hereby authorize M/s ${authority} to submit a bid, negotiate, and subsequently conclude the contract with you for the tendered items.\n\nWe further confirm comprehensive warranty and OEM backend support for a period of 36 months from installation.`;
    aiInsights = `✓ Direct OEM authorization authentic and actively registered for this GeM tender.\n✓ SLA clause covers 24x7 onsite technical replacement guarantee.`;
  } else if (docName.includes('tax') || docName.includes('gst') || docName.includes('gstr')) {
    docCategory = "GSTIN & Statutory Tax Clearance Filing";
    extractedData = {
      ...extractedData,
      "GSTIN": "07AAACA1234F1Z5",
      "PAN": "AAACA1234F",
      "Filing Compliance (GSTR-1)": "Regular & Up-to-date",
      "Filing Compliance (GSTR-3B)": "Filed for all past 12 consecutive months",
      "Tax Default / Notice": "Zero Defaults",
    };
    ocrSampleText = `GOODS AND SERVICES TAX NETWORK (GSTN) COMPLIANCE SUMMARY\n\nLegal Name: ${authority}\nGSTIN: 07AAACA1234F1Z5\nRegistration Status: Active (Regular Taxpayer)\n\nReturn Filing Records:\n- GSTR-1: Filed (Current Quarter)\n- GSTR-3B: Filed (Current Quarter)\nTax Payment History: Clean. No Section 73/74 demands outstanding.`;
    aiInsights = `✓ Active GSTIN status confirmed in real-time with GSTN API.\n✓ No return filing gaps or penalty dues found in the evaluation window.`;
  } else {
    extractedData = {
      ...extractedData,
      "Document Category": "Technical Specification & Compliance Matrix",
      "Declared Compliance": "100% compliant with Technical Parameters",
      "Verified By": "GeM Automated Verification Agent",
    };
    ocrSampleText = `TECHNICAL COMPLIANCE STATEMENT\n\nTender Document Ref: GeM Integrated Evaluation Portal\nBidder Name: ${authority}\n\nAll hardware and software specifications mentioned in Annexure-I of the tender have been evaluated and verified to meet or exceed the minimum specified benchmarks without deviations.\n\nSigned by Authorized Technical Representative.`;
    aiInsights = `✓ Document scanned with 99.4% OCR confidence.\n✓ Semantic alignment matches all core technical clauses of the tender.`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-300" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate">{document.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  OCR Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{docCategory} · {authority}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveViewTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeViewTab === 'preview' 
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200' 
                : 'hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Document Preview</span>
          </button>
          <button
            onClick={() => setActiveViewTab('ocr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeViewTab === 'ocr' 
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200' 
                : 'hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Extracted OCR Text</span>
          </button>
          <button
            onClick={() => setActiveViewTab('ai-insights')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeViewTab === 'ai-insights' 
                ? 'bg-white text-purple-700 shadow-xs border border-purple-200' 
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Compliance Analysis</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          
          {/* PREVIEW TAB */}
          {activeViewTab === 'preview' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto space-y-6">
              
              {/* Document Header / Emblem */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-serif font-bold text-base mb-1">
                  🏛️
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Government e-Marketplace (GeM) &bull; Bid Document Repository
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Verification Ref: {certId} | Timestamp: {document.uploadedAt || '2026-09-23 12:45 IST'}
                </p>
              </div>

              {/* Document Meta Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Document Metadata &amp; Key Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(extractedData).map(([key, val], idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{key}</span>
                      <span className="font-semibold text-slate-800 break-words">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Body Sample Preview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed">
                {ocrSampleText}
              </div>

              {/* Digital Seal / QR Block */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center p-1.5 shadow-2xs">
                    <QrCode className="w-full h-full text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      GeM Certified Cryptographic Stamp
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Hash: SHA256:7f8e...90a1 &bull; Class 3 DSC</div>
                  </div>
                </div>

                <div className="text-right text-[11px]">
                  <span className="font-bold text-slate-700">{authority}</span>
                  <div className="text-slate-400">Authorized Signatory</div>
                </div>
              </div>

            </div>
          )}

          {/* OCR TEXT TAB */}
          {activeViewTab === 'ocr' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">Raw Optical Character Recognition (OCR) Output</h4>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                  Tesseract / Vision AI Engine: 99.4% Accuracy
                </span>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                {ocrSampleText}
              </pre>
            </div>
          )}

          {/* AI INSIGHTS TAB */}
          {activeViewTab === 'ai-insights' && (
            <div className="bg-white rounded-xl border border-purple-100 p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-purple-100">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">GeM AI Clause Compliance Evaluation</h4>
                  <p className="text-xs text-slate-500">Gemini LLM semantic analysis against tender requirements</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 font-medium whitespace-pre-line space-y-2 leading-relaxed">
                {aiInsights}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Clause Match</span>
                  <div className="text-lg font-bold text-emerald-800 font-mono">100%</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Tamper Check</span>
                  <div className="text-lg font-bold text-emerald-700 font-mono">Clean</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-600">Recommendation</span>
                  <div className="text-xs font-bold text-purple-900 mt-1">Accept for Bid</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Document ID: <strong className="font-mono text-slate-700">{certId}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
