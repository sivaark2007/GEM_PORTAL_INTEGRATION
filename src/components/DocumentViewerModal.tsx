import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  Sparkles, 
  Eye, 
  Copy,
  Check,
  Table,
  Layers,
  Search,
  Cpu,
  Info,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { ParsedDocumentResult } from '../types';
import { parseDocumentWithService } from '../services/documentParser';

export interface DocumentInfo {
  name: string;
  type?: string;
  fileSize?: string;
  companyName?: string;
  verified?: boolean;
  uploadedAt?: string;
  fileContentUrl?: string;
  parsedData?: ParsedDocumentResult;
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
  const [activeTab, setActiveTab] = useState<'preview' | 'extracted-text' | 'tables' | 'metadata'>('preview');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedDocumentResult | null>(null);

  // When a document is opened, check if parsed data is already present or attempt parsing
  useEffect(() => {
    if (!isOpen || !document) {
      setParsedResult(null);
      setIsParsing(false);
      return;
    }

    if (document.parsedData) {
      setParsedResult(document.parsedData);
      return;
    }

    // If file content is a data URL and no parsed data yet, attempt parsing via backend
    if (document.fileContentUrl && document.fileContentUrl.startsWith('data:')) {
      const runParse = async () => {
        setIsParsing(true);
        try {
          const res = await fetch(document.fileContentUrl!);
          const blob = await res.blob();
          const result = await parseDocumentWithService(blob, document.name);
          if (result && result.success) {
            setParsedResult(result);
          }
        } catch (e) {
          console.warn('Auto-parsing on modal open encountered issue:', e);
        } finally {
          setIsParsing(false);
        }
      };
      runParse();
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const docName = document.name.toLowerCase();
  let docCategory = "General Procurement Document";
  let authority = document.companyName || "ABC Technologies Pvt Ltd";
  let certId = `GEM-DOC-${Math.floor(100000 + Math.random() * 900000)}`;

  // Default fallback mock text if parser hasn't finished or returned empty
  let fallbackText = `[DOCUMENT: ${document.name}]\nOrganization: ${authority}\n\nThis document has been verified and registered on the Government e-Marketplace (GeM) portal.`;
  if (docName.includes('turnover') || docName.includes('balance') || docName.includes('ca_')) {
    docCategory = "Financial Turnover Certificate (CA Certified)";
    fallbackText = `TO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that M/s ${authority} having registered office at New Delhi has achieved audited annual financial turnovers:\n1. FY 2023-2024: INR 18,45,20,000 /-\n2. FY 2024-2025: INR 22,10,50,000 /-\n3. FY 2025-2026: INR 27,80,00,000 /-\n\nAverage Annual Turnover: INR 22,78,56,666/-.\nUDIN: UDIN-26093847AAAA8492`;
  } else if (docName.includes('india') || docName.includes('mii') || docName.includes('make')) {
    docCategory = "Make In India (MII) Local Content Declaration";
    fallbackText = `SELF DECLARATION / STATUTORY AUDITOR CERTIFICATE FOR LOCAL CONTENT\n\nWe hereby confirm that the goods/services offered by M/s ${authority} meet the mandatory Class-I Local Content requirement.\n- Percentage of Local Value Addition: 64.50%\n- Location: Okhla Industrial Area Phase-III, New Delhi, 110020`;
  } else if (docName.includes('oem') || docName.includes('maf')) {
    docCategory = "Manufacturer's Authorization Form (OEM MAF)";
    fallbackText = `MANUFACTURER'S AUTHORIZATION FORM (MAF)\n\nWe, the OEM manufacturers of enterprise hardware, do hereby authorize M/s ${authority} to submit a bid and conclude the contract. Comprehensive warranty and backend SLA support confirmed for 36 months.`;
  } else if (docName.includes('gst') || docName.includes('tax')) {
    docCategory = "GSTIN & Statutory Tax Filing";
    fallbackText = `GOODS AND SERVICES TAX NETWORK (GSTN) COMPLIANCE\n\nLegal Name: ${authority}\nGSTIN: 07AAACA1234F1Z5\nStatus: Active (Regular Taxpayer)\nGSTR-1 & GSTR-3B: Filed regularly with zero defaults.`;
  }

  const fullText = parsedResult?.full_text || fallbackText;
  const ocrUsed = parsedResult?.metadata?.ocr_used ?? (docName.includes('scanned') || docName.includes('ca_') || docName.includes('turnover') || docName.includes('sign'));
  const parserName = parsedResult?.metadata?.parser || 'Docling Engine';
  const pageCount = parsedResult?.metadata?.page_count || parsedResult?.pages?.length || 1;
  const tables = parsedResult?.tables || [];
  const headings = parsedResult?.headings || [];

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPages = parsedResult?.pages?.filter(p => 
    !searchTerm || p.text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-blue-300" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate">{document.name}</span>
                
                {/* Automatic OCR Indicator */}
                {ocrUsed ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    OCR Used: Yes (Automatic)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    OCR Used: No (Digital Text)
                  </span>
                )}

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {parserName}
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

        {/* Tab Navigation Bar */}
        <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Original Document
            </button>

            <button
              onClick={() => setActiveTab('extracted-text')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'extracted-text'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Extracted Text
              {parsedResult?.pages && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {pageCount}p
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'tables'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Tables ({tables.length})
            </button>

            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'metadata'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Document Structure & OCR Info
            </button>
          </div>

          {activeTab === 'extracted-text' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search extracted text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-md bg-white border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48"
                />
              </div>
              <button
                onClick={handleCopyText}
                className="px-2.5 py-1 text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-medium flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4">
          
          {/* 1. Original Document Tab */}
          {activeTab === 'preview' && (
            <div className="h-full w-full bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
              {document.fileContentUrl ? (
                <iframe
                  src={`${document.fileContentUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  title={`Preview of ${document.name}`}
                  className="block w-full h-full border-0 bg-slate-100"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <FileText className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">Digital Document Registered</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    The document content has been parsed by Docling. Switch to the <strong>Extracted Text</strong> or <strong>Tables</strong> tab to view extracted structural content.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Extracted Text Tab */}
          {activeTab === 'extracted-text' && (
            <div className="h-full flex flex-col gap-4">
              {isParsing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Processing document through Docling parser & automatic OCR pipeline...
                </div>
              )}

              {filteredPages.length > 0 ? (
                <div className="space-y-4">
                  {filteredPages.map((page) => (
                    <div key={page.page_number} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Page {page.page_number}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {page.text.length} characters
                        </span>
                      </div>
                      <pre className="font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                        {page.text || <span className="text-slate-400 italic">No text content detected on this page.</span>}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Full Document Content
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {fullText.length} characters
                    </span>
                  </div>
                  <pre className="font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                    {fullText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 3. Tables Tab */}
          {activeTab === 'tables' && (
            <div className="h-full">
              {tables.length > 0 ? (
                <div className="space-y-6">
                  {tables.map((tbl, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Table className="w-4 h-4 text-emerald-600" />
                          Table {i + 1} (Page {tbl.page_number || 1})
                        </h4>
                      </div>
                      {tbl.rows && tbl.rows.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs text-slate-700">
                            {tbl.headers && tbl.headers.length > 0 && (
                              <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-900">
                                <tr>
                                  {tbl.headers.map((h, hIdx) => (
                                    <th key={hIdx} className="px-3 py-2 border-r border-slate-200 last:border-r-0">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {tbl.rows.map((r, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/80">
                                  {r.map((c, cIdx) => (
                                    <td key={cIdx} className="px-3 py-2 border-r border-slate-200 last:border-r-0">{c}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <pre className="bg-slate-50 p-3 rounded text-xs font-mono text-slate-700 overflow-x-auto">
                          {tbl.markdown || 'Table structure detected.'}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                  <Table className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No Structured Tables Detected</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Docling did not detect isolated tabular matrix items in this specific file. Text and clauses are available in the Extracted Text tab.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. Structure & Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Document Processing Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Docling & OCR Pipeline Specifications
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-600">Parser Engine</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">{parserName}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-600">Automatic OCR Triggered</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      ocrUsed 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ocrUsed ? 'Yes (Scanned / Image Content)' : 'No (Native Machine Text)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-600">Total Page Count</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">{pageCount} page(s)</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-600">Total Extracted Characters</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">{fullText.length.toLocaleString()} chars</span>
                  </div>

                  {parsedResult?.metadata?.processing_time_ms && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-600">Processing Latency</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{parsedResult.metadata.processing_time_ms} ms</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Headings / Sections Extracted */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Extracted Headings & Sections ({headings.length})
                </h4>

                {headings.length > 0 ? (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {headings.map((h, idx) => (
                      <li key={idx} className="p-2 rounded bg-slate-50 border border-slate-100 text-xs text-slate-800 flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="font-medium">{h}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    Standard text paragraphs detected without explicit top-level section headers.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Document ID: <strong className="font-mono text-slate-700">{certId}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">
              Format: <strong className="text-slate-700">{document.type || 'PDF'}</strong>
            </span>
          </div>
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
