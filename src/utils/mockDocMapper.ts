/**
 * Utility for mapping document filenames and contents to GeM bidder requirement slots.
 * Supports numbered mock filenames (from cloud_tender_docs) and arbitrary user filenames.
 */

export interface DocumentSlotMapping {
  slotName: string;
  groupTitle: string;
  category: string;
  docIndex?: number;
  isStage4Dossier?: boolean;
}

export const ALL_REQUIREMENT_SLOTS: DocumentSlotMapping[] = [
  // Group 1: Identity & Tax
  { slotName: 'Aadhaar Card / UIDAI Identity Proof', groupTitle: '1. Identity & Tax', category: 'AADHAAR', docIndex: 1 },
  { slotName: 'PAN Card / PAN Details', groupTitle: '1. Identity & Tax', category: 'PAN', docIndex: 2 },
  { slotName: 'GST Registration Certificate / GSTIN', groupTitle: '1. Identity & Tax', category: 'GST', docIndex: 3 },
  { slotName: 'Income Tax Return (ITR)', groupTitle: '1. Identity & Tax', category: 'INCOME_TAX', docIndex: 4 },

  // Group 2: Business Registration
  { slotName: 'Udyam Registration Certificate', groupTitle: '2. Business Registration', category: 'UDYAM', docIndex: 5 },
  { slotName: 'MCA Company/LLP Registration Details', groupTitle: '2. Business Registration', category: 'MCA', docIndex: 6 },
  { slotName: 'Startup India / DPIIT Recognition Certificate', groupTitle: '2. Business Registration', category: 'STARTUP', docIndex: 7 },
  { slotName: 'NSIC Registration Certificate', groupTitle: '2. Business Registration', category: 'NSIC', docIndex: 8 },

  // Group 3: Statutory Compliance
  { slotName: 'EPFO Registration Details', groupTitle: '3. Statutory Compliance', category: 'EPFO', docIndex: 9 },
  { slotName: 'ESIC Registration Details', groupTitle: '3. Statutory Compliance', category: 'ESIC', docIndex: 10 },
  { slotName: 'GST Compliance / Return Details', groupTitle: '3. Statutory Compliance', category: 'GST_RETURNS', docIndex: 11 },
  { slotName: 'Income Tax Compliance Details', groupTitle: '3. Statutory Compliance', category: 'INCOME_TAX', docIndex: 12 },

  // Group 4: Product / Procurement Compliance
  { slotName: 'BIS Certificate / Licence', groupTitle: '4. Product / Procurement Compliance', category: 'BIS', docIndex: 13 },
  { slotName: 'Make in India / Local Content Declaration', groupTitle: '4. Product / Procurement Compliance', category: 'MII', docIndex: 14 },
  { slotName: 'OEM Authorization Certificate', groupTitle: '4. Product / Procurement Compliance', category: 'OEM', docIndex: 15 },

  // Group 5: Digital Document Verification
  { slotName: 'DigiLocker-issued Documents', groupTitle: '5. Digital Document Verification', category: 'DIGILOCKER', docIndex: 16 },

  // Group 6: GeM 4-Stage Statutory Documents (GTC & GFR)
  { slotName: 'GFR Rule 144(xi) Land Border Declaration', groupTitle: '6. GeM 4-Stage Statutory Documents (GTC & GFR)', category: 'GFR_144XI', docIndex: 17 },
  { slotName: 'Earnest Money Deposit (EMD) / Bid Security Declaration', groupTitle: '6. GeM 4-Stage Statutory Documents (GTC & GFR)', category: 'FEE_EMD', docIndex: 18 },
  { slotName: 'CA Audited Balance Sheets & Annual Turnover (3 FYs)', groupTitle: '6. GeM 4-Stage Statutory Documents (GTC & GFR)', category: 'FINANCIAL', docIndex: 19 },
  { slotName: 'Past Experience & Performance Supply Proof', groupTitle: '6. GeM 4-Stage Statutory Documents (GTC & GFR)', category: 'EXPERIENCE', docIndex: 20 },
  { slotName: 'Non-Debarment & Non-Blacklisting Affidavit', groupTitle: '6. GeM 4-Stage Statutory Documents (GTC & GFR)', category: 'DEBARMENT_AFFIDAVIT', docIndex: 21 },

  // Special 4-Stage Dossier
  { slotName: 'GeM Standardized 4-Stage Evaluation', groupTitle: 'GeM 4-Stage Evaluation Framework', category: 'GEM_4STAGE_EVAL', docIndex: 22, isStage4Dossier: true }
];

/**
 * Maps any file name (including numbering e.g. 01_Aadhaar_Card.pdf, or raw file name) to the exact requirement slot
 */
export function mapFilenameToRequirementSlot(filename: string): { slotName: string; confidence: 'exact' | 'high' | 'medium' | 'fallback' } {
  const clean = filename.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // 1. Direct number prefix checks from cloud_tender_docs (01_ to 22_)
  if (/^0?1_aadhaar/i.test(clean) || /^0?1_aadhar/i.test(clean)) return { slotName: 'Aadhaar Card / UIDAI Identity Proof', confidence: 'exact' };
  if (/^0?2_pan/i.test(clean)) return { slotName: 'PAN Card / PAN Details', confidence: 'exact' };
  if (/^0?3_gst_reg/i.test(clean) || /^0?3_gst/i.test(clean)) return { slotName: 'GST Registration Certificate / GSTIN', confidence: 'exact' };
  if (/^0?4_income_tax/i.test(clean) || /^0?4_itr/i.test(clean)) return { slotName: 'Income Tax Return (ITR)', confidence: 'exact' };
  if (/^0?5_udyam/i.test(clean)) return { slotName: 'Udyam Registration Certificate', confidence: 'exact' };
  if (/^0?6_mca/i.test(clean) || /^0?6_company/i.test(clean)) return { slotName: 'MCA Company/LLP Registration Details', confidence: 'exact' };
  if (/^0?7_startup/i.test(clean) || /^0?7_dpiit/i.test(clean)) return { slotName: 'Startup India / DPIIT Recognition Certificate', confidence: 'exact' };
  if (/^0?8_nsic/i.test(clean)) return { slotName: 'NSIC Registration Certificate', confidence: 'exact' };
  if (/^0?9_epfo/i.test(clean)) return { slotName: 'EPFO Registration Details', confidence: 'exact' };
  if (/^10_esic/i.test(clean)) return { slotName: 'ESIC Registration Details', confidence: 'exact' };
  if (/^11_gst_comp/i.test(clean) || /^11_gst_return/i.test(clean)) return { slotName: 'GST Compliance / Return Details', confidence: 'exact' };
  if (/^12_income_tax/i.test(clean) || /^12_tax_comp/i.test(clean)) return { slotName: 'Income Tax Compliance Details', confidence: 'exact' };
  if (/^13_bis/i.test(clean)) return { slotName: 'BIS Certificate / Licence', confidence: 'exact' };
  if (/^14_make_in_india/i.test(clean) || /^14_mii/i.test(clean)) return { slotName: 'Make in India / Local Content Declaration', confidence: 'exact' };
  if (/^15_oem/i.test(clean)) return { slotName: 'OEM Authorization Certificate', confidence: 'exact' };
  if (/^16_digilocker/i.test(clean)) return { slotName: 'DigiLocker-issued Documents', confidence: 'exact' };
  if (/^17_gfr/i.test(clean) || /^17_land/i.test(clean)) return { slotName: 'GFR Rule 144(xi) Land Border Declaration', confidence: 'exact' };
  if (/^18_emd/i.test(clean) || /^18_bid_sec/i.test(clean)) return { slotName: 'Earnest Money Deposit (EMD) / Bid Security Declaration', confidence: 'exact' };
  if (/^19_ca_audit/i.test(clean) || /^19_turnover/i.test(clean) || /^19_ca/i.test(clean)) return { slotName: 'CA Audited Balance Sheets & Annual Turnover (3 FYs)', confidence: 'exact' };
  if (/^20_past_exp/i.test(clean) || /^20_performance/i.test(clean) || /^20_exp/i.test(clean)) return { slotName: 'Past Experience & Performance Supply Proof', confidence: 'exact' };
  if (/^21_non_deb/i.test(clean) || /^21_debarment/i.test(clean) || /^21_affidavit/i.test(clean)) return { slotName: 'Non-Debarment & Non-Blacklisting Affidavit', confidence: 'exact' };
  if (/^22_gem_4stage/i.test(clean) || /^22_4stage/i.test(clean) || /^22_compliance_dossier/i.test(clean)) return { slotName: 'GeM Standardized 4-Stage Evaluation', confidence: 'exact' };

  // 2. High confidence semantic keywords
  if (clean.includes('4stage') || clean.includes('4_stage') || clean.includes('dossier') || clean.includes('evaluation_document')) {
    return { slotName: 'GeM Standardized 4-Stage Evaluation', confidence: 'high' };
  }
  if (clean.includes('aadhaar') || clean.includes('aadhar') || clean.includes('uidai') || clean.includes('eaadhaar')) {
    return { slotName: 'Aadhaar Card / UIDAI Identity Proof', confidence: 'high' };
  }
  if (clean.includes('pan_card') || clean.includes('pancard') || clean.includes('permanent_account') || (clean.includes('pan') && !clean.includes('company'))) {
    return { slotName: 'PAN Card / PAN Details', confidence: 'high' };
  }
  if (clean.includes('gst_return') || clean.includes('gstr') || clean.includes('gst_compliance')) {
    return { slotName: 'GST Compliance / Return Details', confidence: 'high' };
  }
  if (clean.includes('gst_reg') || clean.includes('gstin') || clean.includes('form_gst') || clean.includes('gst_certificate')) {
    return { slotName: 'GST Registration Certificate / GSTIN', confidence: 'high' };
  }
  if (clean.includes('tax_compliance') || clean.includes('tax_clearance') || clean.includes('income_tax_compliance')) {
    return { slotName: 'Income Tax Compliance Details', confidence: 'high' };
  }
  if (clean.includes('itr') || clean.includes('income_tax_return') || clean.includes('itr_v')) {
    return { slotName: 'Income Tax Return (ITR)', confidence: 'high' };
  }
  if (clean.includes('udyam') || clean.includes('uam') || clean.includes('msme_reg')) {
    return { slotName: 'Udyam Registration Certificate', confidence: 'high' };
  }
  if (clean.includes('mca') || clean.includes('incorporation') || clean.includes('cin') || clean.includes('roc') || clean.includes('company_reg')) {
    return { slotName: 'MCA Company/LLP Registration Details', confidence: 'high' };
  }
  if (clean.includes('startup') || clean.includes('dpiit') || clean.includes('dipp')) {
    return { slotName: 'Startup India / DPIIT Recognition Certificate', confidence: 'high' };
  }
  if (clean.includes('nsic')) {
    return { slotName: 'NSIC Registration Certificate', confidence: 'high' };
  }
  if (clean.includes('epfo') || clean.includes('provident_fund') || clean.includes('pf_return')) {
    return { slotName: 'EPFO Registration Details', confidence: 'high' };
  }
  if (clean.includes('esic') || clean.includes('esi_return')) {
    return { slotName: 'ESIC Registration Details', confidence: 'high' };
  }
  if (clean.includes('bis') || clean.includes('isi_mark') || clean.includes('bureau_indian_standards')) {
    return { slotName: 'BIS Certificate / Licence', confidence: 'high' };
  }
  if (clean.includes('make_in_india') || clean.includes('local_content') || clean.includes('mii')) {
    return { slotName: 'Make in India / Local Content Declaration', confidence: 'high' };
  }
  if (clean.includes('oem') || clean.includes('maf') || clean.includes('manufacturer_auth')) {
    return { slotName: 'OEM Authorization Certificate', confidence: 'high' };
  }
  if (clean.includes('digilocker') || clean.includes('dgl')) {
    return { slotName: 'DigiLocker-issued Documents', confidence: 'high' };
  }
  if (clean.includes('144xi') || clean.includes('144_xi') || clean.includes('land_border') || clean.includes('border_sharing')) {
    return { slotName: 'GFR Rule 144(xi) Land Border Declaration', confidence: 'high' };
  }
  if (clean.includes('emd') || clean.includes('bid_security') || clean.includes('earnest_money') || clean.includes('bsd')) {
    return { slotName: 'Earnest Money Deposit (EMD) / Bid Security Declaration', confidence: 'high' };
  }
  if (clean.includes('turnover') || clean.includes('ca_audited') || clean.includes('balance_sheet') || clean.includes('3fy')) {
    return { slotName: 'CA Audited Balance Sheets & Annual Turnover (3 FYs)', confidence: 'high' };
  }
  if (clean.includes('past_exp') || clean.includes('experience') || clean.includes('supply_proof') || clean.includes('performance_proof')) {
    return { slotName: 'Past Experience & Performance Supply Proof', confidence: 'high' };
  }
  if (clean.includes('debarment') || clean.includes('blacklisting') || clean.includes('non_debarment') || clean.includes('affidavit')) {
    return { slotName: 'Non-Debarment & Non-Blacklisting Affidavit', confidence: 'high' };
  }

  // 3. Fallback to filename
  return { slotName: filename, confidence: 'fallback' };
}

/**
 * Matches folder name in cloud_tender_docs (e.g. "01_ABC_Technologies_Pvt_Ltd") to registered company name
 */
export function normalizeCompanyFolderName(folderName: string): string {
  // Remove numeric prefix like "01_", "02_"
  let name = folderName.replace(/^\d+[\s_-]*/, '');
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');
  return name.trim();
}
