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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        
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

        {/* Document Preview */}
        <div className="flex-1 min-h-0 overflow-hidden bg-slate-100">
          <div className="h-full w-full bg-white">
            {document.fileContentUrl ? (
              <iframe
                src={`${document.fileContentUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title={`Preview of ${document.name}`}
                className="block w-full h-full border-0 bg-slate-100"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Document preview is unavailable for this file.
              </div>
            )}

          </div>
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
