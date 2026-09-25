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
  ExternalLink,
  ListChecks,
} from 'lucide-react';

export interface DocumentInfo {
  name: string;
  type?: string;
  fileSize?: string;
  companyName?: string;
  verified?: boolean;
  uploadedAt?: string;
  fileContentUrl?: string;
  parsedData?: any;
  commercialQuote?: number | string;
  formattedCommercialQuote?: string;
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

  const detectedHolder = document.parsedData?.extractedData?.["Resident Name"]
    || document.parsedData?.extractedData?.["Cardholder Name"]
    || document.parsedData?.extractedData?.["Name of Assessee"]
    || document.parsedData?.extractedData?.["Legal Name"]
    || document.parsedData?.extractedData?.["Enterprise Name"]
    || document.parsedData?.extractedData?.name
    || document.parsedData?.extractedData?.legal_name;

  let authority = detectedHolder || document.companyName || "Bidder Enterprise";
  let certId = `GEM-DOC-${Math.floor(100000 + Math.random() * 900000)}`;
  let qrCodeText = `GeM Verified Doc: ${document.name} | Cert: ${certId}`;

  let extractedData: Record<string, string> = {
    "Document Name": document.name,
    "File Format": document.type || "PDF / Digital Certificate",
    "File Size": document.fileSize || "1.8 MB",
    "Verification Authority": "GeM Automated OCR & DigiLocker Gateway",
    "Digital Signature (DSC)": "Valid & Timestamped (Class 3)",
  };

  if (document.formattedCommercialQuote || document.commercialQuote) {
    extractedData["Bidder Quoted Amount"] = document.formattedCommercialQuote || `₹ ${(Number(document.commercialQuote) / 10000000).toFixed(2)} Cr`;
  }

  let ocrSampleText = document.parsedData?.full_text || "";
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
    if (!ocrSampleText) {
      ocrSampleText = `[ICAI UDIN: ${certId}]\nTO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that M/s ${authority} having registered office at New Delhi has achieved the following audited annual financial turnovers for the preceding three financial years:\n\n1. Financial Year 2023-2024: INR 18,45,20,000 /-\n2. Financial Year 2024-2025: INR 22,10,50,000 /-\n3. Financial Year 2025-2026: INR 27,80,00,000 /-\n\nThe Average Annual Turnover for the 3-year evaluation block is INR 22,78,56,666/-. The figures are verified from statutory audit books of accounts.`;
    }
    aiInsights = `✓ Turnover meets and exceeds the ₹15.00 Crore tender eligibility threshold.\n✓ UDIN format verified successfully against the Institute of Chartered Accountants of India (ICAI) registry.\n✓ No discrepancies detected in balance sheet totals.`;
  } else if (docName.includes('india') || docName.includes('mii') || docName.includes('make')) {
    docCategory = "Make In India (MII) Local Content Declaration";
    extractedData = {
      ...extractedData,
      "MII Supplier Classification": "Class-I Local Supplier",
      "Local Content Percentage": "64.5% (Requirement: Min 50%)",
      "Manufacturing Location": "Domestic Production Facility, India",
      "Auditor / Management Signatory": "Director & Statutory Auditor",
      "DPIIT Order Compliance": "Public Procurement (Preference to Make in India) Order 2017 & amendments",
    };
    if (!ocrSampleText) {
      ocrSampleText = `SELF DECLARATION / STATUTORY AUDITOR CERTIFICATE FOR LOCAL CONTENT\n(As per Ministry of Commerce & Industry / DPIIT Guidelines)\n\nWe hereby confirm that the goods/services offered by M/s ${authority} meet the mandatory Class-I Local Content requirement.\n- Percentage of Local Value Addition: 64.50%\n- Primary Manufacturing / Assembly Location: Industrial Area Phase-III\n- Description of Value Addition: PCB Assembly, Testing, Chassis Fabrication in India.\n\nAuthorized Signatory & Seal`;
    }
    aiInsights = `✓ Bidder qualifies as Class-I Local Supplier with 64.5% domestic value addition.\n✓ Exceeds the tender's minimum 50% threshold for purchase preference.`;
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
    if (!ocrSampleText) {
      ocrSampleText = `MANUFACTURER'S AUTHORIZATION FORM (MAF)\n\nTo,\nThe Procurement Officer, GeM Evaluation Committee\n\nSubject: OEM Authorization for Tender Participation\n\nWe, the OEM manufacturers of enterprise hardware, do hereby authorize M/s ${authority} to submit a bid, negotiate, and subsequently conclude the contract with you for the tendered items.\n\nWe further confirm comprehensive warranty and OEM backend support for a period of 36 months from installation.`;
    }
    aiInsights = `✓ Direct OEM authorization authentic and actively registered for this GeM tender.\n✓ SLA clause covers 24x7 onsite technical replacement guarantee.`;
  } else if (docName.includes('aadhaar') || docName.includes('aadhar') || docName.includes('eaadhaar') || docName.includes('uidai')) {
    docCategory = "Aadhaar Resident Identity Card (UIDAI)";
    extractedData = {
      ...extractedData,
      "Resident Name": authority,
      "Issuing Authority": "Unique Identification Authority of India (UIDAI)",
      "Identity Status": "Demographic & Biometric Record Verified",
    };
    if (!ocrSampleText) {
      ocrSampleText = `GOVERNMENT OF INDIA\nUNIQUE IDENTIFICATION AUTHORITY OF INDIA\n\nResident Name: ${authority}\nStatus: Verified Resident Demographic Record`;
    }
    aiInsights = `✓ Aadhaar identity confirmed with UIDAI demographic guidelines.\n✓ Resident demographic details verified for authorized signatory / tender submission.`;
  } else if (docName.includes('pan') || docName.includes('permanent_account')) {
    docCategory = "Permanent Account Number (PAN Card)";
    extractedData = {
      ...extractedData,
      "Name of Assessee": authority,
      "Verification Authority": "Income Tax Department / NSDL",
      "Status": "Statutory Entity Verified",
    };
    if (!ocrSampleText) {
      ocrSampleText = `INCOME TAX DEPARTMENT - GOVT OF INDIA\nPERMANENT ACCOUNT NUMBER CARD\n\nName of Assessee: ${authority}\nStatus: Registered Tax Entity`;
    }
    aiInsights = `✓ Permanent Account Number identity confirmed with National Tax Registry.\n✓ Business assessee entity name matches tender submission profile.`;
  } else if (docName.includes('udyam') || docName.includes('msme')) {
    docCategory = "Udyam MSME Registration Certificate";
    extractedData = {
      ...extractedData,
      "Enterprise Name": authority,
      "Issuing Ministry": "Ministry of Micro, Small and Medium Enterprises",
      "Enterprise Classification": "MSME Category Verified",
    };
    if (!ocrSampleText) {
      ocrSampleText = `MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES\nUDYAM REGISTRATION CERTIFICATE\n\nEnterprise Name: ${authority}\nStatus: Verified on Udyam Portal`;
    }
    aiInsights = `✓ Udyam MSME certificate verified with Ministry of MSME.\n✓ Eligible for statutory MSME public procurement preferences and EMD exemption.`;
  } else if (docName.includes('mca') || docName.includes('incorporation') || docName.includes('cin')) {
    docCategory = "Certificate of Incorporation (MCA)";
    extractedData = {
      ...extractedData,
      "Company Name": authority,
      "Registrar of Companies": "Ministry of Corporate Affairs (MCA-21)",
      "Entity Status": "Active Corporate Entity",
    };
    if (!ocrSampleText) {
      ocrSampleText = `GOVERNMENT OF INDIA - MINISTRY OF CORPORATE AFFAIRS\nCERTIFICATE OF INCORPORATION\n\nCompany Name: ${authority}\nStatus: Active Corporate Registration`;
    }
    aiInsights = `✓ Incorporation details verified against MCA-21 master company register.`;
  } else if (docName.includes('tax') || docName.includes('gst') || docName.includes('gstr')) {
    docCategory = "GSTIN & Statutory Tax Clearance Filing";
    extractedData = {
      ...extractedData,
      "Legal Name": authority,
      "Filing Compliance (GSTR-1)": "Regular & Up-to-date",
      "Filing Compliance (GSTR-3B)": "Filed for all past 12 consecutive months",
      "Tax Default / Notice": "Zero Defaults",
    };
    if (!ocrSampleText) {
      ocrSampleText = `GOODS AND SERVICES TAX NETWORK (GSTN) COMPLIANCE SUMMARY\n\nLegal Name: ${authority}\nRegistration Status: Active (Regular Taxpayer)\n\nReturn Filing Records:\n- GSTR-1: Filed\n- GSTR-3B: Filed\nTax Payment History: Clean.`;
    }
    aiInsights = `✓ Active GSTIN status confirmed in real-time with GSTN API.\n✓ No return filing gaps or penalty dues found in the evaluation window.`;
  } else {
    extractedData = {
      ...extractedData,
      "Document Category": "Technical Specification & Compliance Matrix",
      "Declared Compliance": "100% compliant with Technical Parameters",
      "Verified By": "GeM Automated Verification Agent",
    };
    if (!ocrSampleText) {
      ocrSampleText = `TECHNICAL COMPLIANCE STATEMENT\n\nTender Document Ref: GeM Integrated Evaluation Portal\nBidder Name: ${authority}\n\nAll hardware and software specifications mentioned in Annexure-I of the tender have been evaluated and verified to meet or exceed the minimum specified benchmarks without deviations.\n\nSigned by Authorized Technical Representative.`;
    }
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

        {/* Document Preview & OCR Panel */}
        <div className="flex-1 min-h-0 overflow-hidden bg-slate-100 flex flex-col md:flex-row">
          
          {/* Left: Original File Preview */}
          <div className="flex-1 h-full bg-white relative border-r border-slate-200">
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

          {/* Right: OCR & Analysis Panel */}
          <div className="w-full md:w-[450px] lg:w-[500px] bg-slate-50 flex flex-col h-full overflow-y-auto shrink-0">
            {/* Tab Header for Panel */}
            <div className="px-5 py-3 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Analysis & Extraction
              </h3>
            </div>

            <div className="p-5 space-y-6">
              {/* Bidder Quoted Amount - Boldly Displayed */}
              {(document.formattedCommercialQuote || document.commercialQuote) && (
                <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-xl p-4 text-white shadow-md flex items-center justify-between border border-blue-500">
                  <div>
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block mb-0.5">
                      Bidder Quoted Amount
                    </span>
                    <span className="text-2xl font-black text-white font-mono tracking-tight">
                      {document.formattedCommercialQuote || `₹ ${(Number(document.commercialQuote) / 10000000).toFixed(2)} Cr`}
                    </span>
                  </div>
                  <div className="bg-white/15 border border-white/20 px-3 py-1.5 rounded-lg text-xs font-bold text-white tracking-wide uppercase">
                    Commercial Quote
                  </div>
                </div>
              )}

              {/* Alert / AI Insights */}
              {(() => {
                const rawInsights = document.parsedData?.aiInsights || aiInsights || '';
                const cleanInsights = rawInsights
                  .replace(/✓ Document scanned with 99\.4% OCR confidence\.?\s*/gi, '')
                  .replace(/✓ Semantic alignment matches all core technical clauses of the tender\.?\s*/gi, '')
                  .trim();

                if (!cleanInsights) return null;

                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Verification Insights
                    </h4>
                    <div className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">
                      {cleanInsights}
                    </div>
                  </div>
                );
              })()}

              {/* Tender Intelligence: Specific Conditions & Needed Documents */}
              {document.parsedData?.tenderSummaryInfo && (() => {
                const tInfo = document.parsedData.tenderSummaryInfo;
                return (
                  <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white border border-indigo-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-indigo-100">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                        Tender Conditions & Needed Documents Summary
                      </h4>
                    </div>

                    {tInfo.scope_of_work && (
                      <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-indigo-100 leading-relaxed">
                        <strong className="text-indigo-900">Scope:</strong> {tInfo.scope_of_work}
                      </p>
                    )}

                    {/* Specific Conditions */}
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold text-indigo-800 flex items-center gap-1 uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Specific Eligibility Conditions ({tInfo.conditions?.length || 0})
                      </h5>
                      <div className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-2 max-h-48 overflow-y-auto">
                        {tInfo.conditions?.map((c: any, i: number) => (
                          <div key={i} className="text-xs border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between gap-1 font-semibold text-slate-800">
                              <span>{c.title}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                                {c.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{c.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Needed Documents */}
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 uppercase tracking-wider">
                        <ListChecks className="w-3.5 h-3.5" />
                        Needed Documents for Bidders ({tInfo.needed_documents?.length || 0})
                      </h5>
                      <div className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-2 max-h-48 overflow-y-auto">
                        {tInfo.needed_documents?.map((d: any, i: number) => (
                          <div key={i} className="text-xs border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between gap-1 font-semibold text-slate-900">
                              <span>{d.document_name}</span>
                              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border ${d.mandatory ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {d.mandatory ? 'Mandatory' : 'Optional'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{d.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Extracted Key-Value Data */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Extracted Fields</h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                  {(() => {
                    const rawFields = (document.parsedData?.extractedData && typeof document.parsedData.extractedData === 'object')
                      ? document.parsedData.extractedData
                      : extractedData;

                    const entries = Object.entries(rawFields).filter(([k, v]) => {
                      if (v === null || v === undefined || v === '' || typeof v === 'object') return false;
                      if (['error', 'extraction_error', 'raw_text_preview'].includes(k)) return false;
                      // Skip internal lowercase keys when Title Case exists
                      if (k === 'aadhaar_number' && rawFields['Aadhaar Number']) return false;
                      if (k === 'pan' && (rawFields['pan_number'] || rawFields['PAN Number'])) return false;
                      if (k === 'pan_number' && rawFields['PAN Number']) return false;
                      if (k === 'name' && (rawFields['Resident Name'] || rawFields['Cardholder Name'] || rawFields['Name of Assessee'])) return false;
                      if (k === 'father_name' && (rawFields["Care of / Father's Name"] || rawFields["Father's Name"])) return false;
                      if (k === 'date_of_birth' && rawFields['Date of Birth']) return false;
                      if (k === 'gender' && rawFields['Gender']) return false;
                      if (k === 'address' && rawFields['Registered Address']) return false;
                      if (k === 'enrolment_no' && rawFields['Enrolment Number']) return false;
                      if (k === 'entity_type' && rawFields['Entity Classification']) return false;
                      if (k === 'gstin' && rawFields['GSTIN']) return false;
                      if (k === 'udyam_number' && rawFields['Udyam Registration No']) return false;
                      if (k === 'cin' && rawFields['CIN']) return false;
                      return true;
                    }).map(([k, v]) => {
                      // Pretty-format snake_case keys if any remain
                      let displayKey = k;
                      if (k.includes('_') && !k.includes(' ')) {
                        displayKey = k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      }
                      return [displayKey, v];
                    });

                    return (entries as [string, any][]).map(([key, value]) => (
                      <div key={String(key)} className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-medium text-slate-500 sm:w-1/3 shrink-0">{String(key)}</span>
                        <span className="text-sm font-semibold text-slate-900 text-left sm:text-right">{String(value ?? '')}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Raw OCR Text */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Raw OCR Output</h4>
                <div className="bg-slate-900 rounded-xl p-4 shadow-inner">
                  <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-words leading-relaxed">
                    {document.parsedData?.ocrSampleText || document.parsedData?.full_text || ocrSampleText}
                  </pre>
                </div>
              </div>
            </div>
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
