import { Company, Tender, BidSubmission } from '../types';
import { MOCK_COMPANY_RECORDS } from './mockRegistry';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'ABC Technologies Pvt Ltd',
    email: 'contact@abctechnologies.in',
    contactNumber: '+91 98110 23412',
    gstin: MOCK_COMPANY_RECORDS[0].gstin || '',
    pan: MOCK_COMPANY_RECORDS[0].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[0].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[0].cin || '',
    city: 'Chennai',
    sector: 'IT Infrastructure & Hardware',
    color: '#0284c7',
    registeredDate: '10 Apr 2022'
  },
  {
    id: 'comp-2',
    name: 'XYZ Solutions Private Limited',
    email: 'tenders@xyzsolutions.co.in',
    contactNumber: '+91 98221 44512',
    gstin: MOCK_COMPANY_RECORDS[1].gstin || '',
    pan: MOCK_COMPANY_RECORDS[1].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[1].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[1].cin || '',
    city: 'Chennai',
    sector: 'Enterprise Software & Cloud',
    color: '#0d9488',
    registeredDate: '15 Aug 2021'
  },
  {
    id: 'comp-3',
    name: 'PQR Electronics Private Limited',
    email: 'info@pqrelectronics.in',
    contactNumber: '+91 98450 67123',
    gstin: MOCK_COMPANY_RECORDS[2].gstin || '',
    pan: MOCK_COMPANY_RECORDS[2].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[2].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[2].cin || '',
    city: 'Chennai',
    sector: 'Defense & Electronic Systems',
    color: '#4f46e5',
    registeredDate: '20 Jan 2023'
  },
  {
    id: 'comp-4',
    name: 'LMN Industrial Solutions Pvt Ltd',
    email: 'procurement@lmnindustries.in',
    contactNumber: '+91 98712 33490',
    gstin: MOCK_COMPANY_RECORDS[3].gstin || '',
    pan: MOCK_COMPANY_RECORDS[3].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[3].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[3].cin || '',
    city: 'Bengaluru',
    sector: 'AI & Industrial Automation',
    color: '#7c3aed',
    registeredDate: '18 Jun 2020'
  },
  {
    id: 'comp-5',
    name: 'RST Technologies Limited',
    email: 'sales@rsttechnologies.net',
    contactNumber: '+91 94120 78234',
    gstin: MOCK_COMPANY_RECORDS[4].gstin || '',
    pan: MOCK_COMPANY_RECORDS[4].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[4].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[4].cin || '',
    city: 'Mumbai',
    sector: 'Commercial Computing Equipment',
    color: '#2563eb',
    registeredDate: '25 Nov 2019'
  },
  {
    id: 'comp-6',
    name: 'WXYZ Computer Systems Pvt Ltd',
    email: 'bids@wxyzcomputers.in',
    contactNumber: '+91 98301 99231',
    gstin: MOCK_COMPANY_RECORDS[5].gstin || '',
    pan: MOCK_COMPANY_RECORDS[5].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[5].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[5].cin || '',
    city: 'Kochi',
    sector: 'Network Architecture & Telecom',
    color: '#d97706',
    registeredDate: '12 Feb 2024'
  },
  {
    id: 'comp-7',
    name: 'MNO Office Equipment Pvt Ltd',
    email: 'compliance@mnooffice.org',
    contactNumber: '+91 99002 11456',
    gstin: MOCK_COMPANY_RECORDS[6].gstin || '',
    pan: MOCK_COMPANY_RECORDS[6].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[6].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[6].cin || '',
    city: 'Chennai',
    sector: 'Cybersecurity & Data Center Solutions',
    color: '#059669',
    registeredDate: '05 Sep 2022'
  },
  {
    id: 'comp-8',
    name: 'QRS Digital Systems Pvt Ltd',
    email: 'govbids@qrsdigital.in',
    contactNumber: '+91 97188 55670',
    gstin: MOCK_COMPANY_RECORDS[7].gstin || '',
    pan: MOCK_COMPANY_RECORDS[7].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[7].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[7].cin || '',
    city: 'Kolkata',
    sector: 'Smart City & IoT Deployment',
    color: '#e11d48',
    registeredDate: '17 May 2023'
  },
  {
    id: 'comp-9',
    name: 'ABC Industrial Automation Pvt Ltd',
    email: 'tenderdesk@abcautomation.com',
    contactNumber: '+91 96190 44521',
    gstin: MOCK_COMPANY_RECORDS[8].gstin || '',
    pan: MOCK_COMPANY_RECORDS[8].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[8].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[8].cin || '',
    city: 'Hyderabad',
    sector: 'Cloud Hosting & System Integration',
    color: '#9333ea',
    registeredDate: '22 Mar 2021'
  },
  {
    id: 'comp-10',
    name: 'FGH Infrastructure Solutions Pvt Ltd',
    email: 'director@fghinfra.in',
    contactNumber: '+91 98260 88219',
    gstin: MOCK_COMPANY_RECORDS[9].gstin || '',
    pan: MOCK_COMPANY_RECORDS[9].pan || '',
    udyamNumber: MOCK_COMPANY_RECORDS[9].udyamNumber || '',
    cin: MOCK_COMPANY_RECORDS[9].cin || '',
    city: 'Ahmedabad',
    sector: 'AI Video Analytics & Automation',
    color: '#0284c7',
    registeredDate: '14 Dec 2018'
  }
];

export const INITIAL_TENDERS: Tender[] = [
  {
    id: 'GEM/2026/B/894102',
    tenderNumber: 'GEM/2026/B/894102',
    title: 'Procurement of Enterprise Cloud Computing Servers & High-Performance Storage',
    items: 'Enterprise Cloud Computing Servers & High-Performance Storage Arrays',
    quantity: 45,
    organization: 'National Informatics Centre (NIC)',
    ministry: 'Ministry of Electronics & Information Technology',
    estimatedValue: '₹ 8,45,00,000',
    category: 'Hardware & IT Infrastructure',
    startDate: '28-08-2026 2:11 PM',
    endDate: '24-09-2026 9:00 AM',
    closingDate: '2026-09-24',
    status: 'Evaluation',
    appliedBiddersCount: 6,
    selectionMethod: 'L1',
    emdRequiredAmount: '₹ 16,90,000',
    technicalFilters: {
      minTurnoverCr: 15,
      minExperienceYears: 3,
      minPerformanceQuantityPercent: 50,
      requireOEMAuth: true,
    },
    requirements: [
      { id: 'req-1', title: 'Make in India Class-I/II Certification', category: 'compliance', description: 'Minimum 50% local content requirement verified by statutory auditor', mandatory: true },
      { id: 'req-2', title: 'Average Annual Turnover > ₹15 Crores (FY 23-26)', category: 'financial', description: 'Audited CA balance sheets for last 3 financial years with UDIN', mandatory: true },
      { id: 'req-3', title: 'OEM Authorization Form (MAF)', category: 'technical', description: 'Direct manufacturer authorization for tender warranty and SLA support', mandatory: true },
      { id: 'req-4', title: 'Valid GSTIN & Tax Clearance Certificate', category: 'statutory', description: 'GSTR-3B filings up to latest quarter without defaults', mandatory: true }
    ],
    gemBiddingDocument: {
      name: 'GeM-Bidding-9318928.pdf',
      fileSize: '118.6 KB',
      uploadedAt: '28-08-2026 10:00 AM'
    }
  },
  {
    id: 'GEM/2026/B/895311',
    tenderNumber: 'GEM/2026/B/895311',
    title: 'Deployment of AI-Powered Edge CCTV Surveillance & Analytics for Railway Stations',
    items: 'AI-Powered Edge CCTV Cameras & Video Analytics Software',
    quantity: 320,
    organization: 'Northern Railway Zone',
    ministry: 'Ministry of Railways',
    estimatedValue: '₹ 14,20,00,000',
    category: 'Electronic Systems & AI',
    startDate: '31-08-2026 3:45 PM',
    endDate: '24-09-2026 9:00 AM',
    closingDate: '2026-09-24',
    status: 'Active',
    appliedBiddersCount: 4,
    selectionMethod: 'RA',
    emdRequiredAmount: '₹ 28,40,000',
    technicalFilters: {
      minTurnoverCr: 25,
      minExperienceYears: 4,
      minPerformanceQuantityPercent: 40,
      requireOEMAuth: false,
    },
    requirements: [
      { id: 'req-10', title: 'ISO 27001 Information Security Certification', category: 'compliance', description: 'Valid ISO certification for enterprise surveillance software stack', mandatory: true },
      { id: 'req-11', title: 'Past Experience in Government Video Surveillance', category: 'technical', description: 'Completion certificates of at least 2 similar scale deployments', mandatory: true },
      { id: 'req-12', title: 'MSME / Udyam Registration Exemption', category: 'statutory', description: 'Valid Udyam certificate for EMD exemption benefit', mandatory: false }
    ]
  },
  {
    id: 'GEM/2026/B/897740',
    tenderNumber: 'GEM/2026/B/897740',
    title: 'Annual Maintenance & Modernization of Data Center Network Switches and Firewalls',
    items: 'Network Switches, Firewalls & Maintenance Services',
    quantity: 18,
    organization: 'Department of Telecommunications',
    ministry: 'Ministry of Communications',
    estimatedValue: '₹ 3,90,00,000',
    category: 'Networking & Maintenance',
    startDate: '27-08-2026 11:34 AM',
    endDate: '24-09-2026 9:00 AM',
    closingDate: '2026-09-24',
    status: 'Active',
    appliedBiddersCount: 3,
    selectionMethod: 'QCBS',
    emdRequiredAmount: '₹ 7,80,000',
    technicalFilters: {
      minTurnoverCr: 8,
      minExperienceYears: 3,
      minPerformanceQuantityPercent: 30,
      requireOEMAuth: true,
    },
    requirements: [
      { id: 'req-20', title: 'Cisco / Juniper Certified Gold Partner Status', category: 'technical', description: 'OEM tier partnership valid for India territory', mandatory: true },
      { id: 'req-21', title: '24x7 SLA On-site Engineer Commitment', category: 'compliance', description: 'Notarized affidavit agreeing to standard GeM SLA penalties', mandatory: true }
    ]
  }
];

export const INITIAL_SUBMISSIONS: BidSubmission[] = [
  {
    id: 'sub-101',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-1',
    submittedAt: '2026-09-18 14:32 IST',
    status: 'Verified',
    complianceScore: 94,
    commercialQuote: 79500000,
    formattedCommercialQuote: '₹ 7.95 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'Technical_Specification_Compliance_Sheet.pdf', type: 'PDF', fileSize: '2.4 MB', verified: true },
      { name: 'Make_In_India_Declaration_Auditor.pdf', type: 'PDF', fileSize: '1.1 MB', verified: true },
      { name: 'CA_Audited_Turnover_FY23_26.pdf', type: 'PDF', fileSize: '3.8 MB', verified: true },
      { name: 'GSTIN_Registration_and_GSTR3B.pdf', type: 'PDF', fileSize: '890 KB', verified: true }
    ],
    flags: [],
    gemFrameworkEvaluation: {
      stage1Baseline: {
        gemProfileVerified: true,
        panStatus: { verified: true, panNumber: 'ABCDE1234F', message: 'PAN verified active in Income Tax / NSDL registry.' },
        gstinStatus: { verified: true, gstinNumber: '33ABCDE1234F1Z5', message: 'GSTIN active with regular GSTR-3B filings.' },
        bankPfmsStatus: { linked: true, message: 'Bank Account & PFMS integration authenticated via valid PAN/GST credentials.' },
        debarmentCheck: { cleared: true, status: 'NOT_DEBARRED', message: 'Clean track record — No debarment or blacklisting records found across GeM/Central/State registries.' },
        gfr144xiCompliance: { compliant: true, declarationSubmitted: true, message: 'Mandatory GFR Rule 144(xi) Land Border Declaration verified.' },
        emdCompliance: { status: 'EXEMPTED', requiredAmount: '₹ 16,90,000', submitted: true, exempted: true, exemptionReason: 'MSE', message: 'Statutory EMD exemption granted under Public Procurement Policy for MSEs Order, 2012 (Micro Enterprise).' },
        overallBaselinePassed: true
      },
      stage2Technical: {
        turnoverFilter: { requiredCr: 15, bidderTurnoverCr: 24.5, caCertified: true, meetsCriteria: true, mseStartupExempted: true, status: 'EXEMPTED', message: 'Exempted from minimum turnover criteria under GeM GTC / GFR statutory exemption for MSEs & Startups (CA balance sheet also verified ₹24.5 Cr).' },
        experienceFilter: { requiredYears: 3, bidderYears: 5, meetsCriteria: true, mseStartupExempted: true, status: 'EXEMPTED', message: 'Exempted from past experience criteria under GeM GTC / GFR statutory exemption for MSEs & Startups.' },
        performanceFilter: { requiredPercentage: 50, bidderPercentage: 65, meetsCriteria: true, status: 'QUALIFIED', message: 'Supplied ≥50% tender quantity in prior government IT infrastructure contracts.' },
        oemAuthFilter: { required: true, mafSubmitted: true, verified: true, status: 'QUALIFIED', message: 'Valid tender-specific OEM Manufacturer Authorization Form (MAF) authenticated.' },
        overallTechnicalPassed: true
      },
      stage3Preferences: {
        mseExemption: { eligible: true, udyamVerified: true, enterpriseCategory: 'Micro', turnoverExemptionApplied: true, expExemptionApplied: true, message: 'Verified Micro Enterprise (UDYAM-TN-00-1234567): Exempted from turnover & experience filters, eligible for 25% procurement preference.' },
        startupExemption: { eligible: true, dpiitVerified: true, applied: true, message: 'DPIIT-recognized Startup: statutory exemptions applied.' },
        makeInIndia: { supplierClass: 'Class-I Local', localContentPercentage: 65, preferenceEligible: true, message: 'Class-I Local Supplier (65% Local Content). Primary purchase preference applicable.' },
        msePriceMatching: { eligibleForL1Plus15: true, priceQuote: 79500000, l1PriceQuote: 79000000, within15PercentWindow: true, allocationEligiblePercent: 25, message: 'Quoted price (₹7.95 Cr) is within L1 + 15% price band of L1 (₹7.90 Cr). Eligible for L1 price matching and 25% order allocation.' }
      },
      stage4Selection: {
        selectionMethod: 'L1',
        commercialQuote: 79500000,
        formattedQuote: '₹ 7.95 Cr',
        rank: 2,
        isL1: false,
        qcbsScore: { technicalMarks: 94, financialMarks: 99, combinedScore: 95 },
        tieBreakerStatus: { isTied: false, method: 'Algorithmic Random Run', verdict: 'Distinct commercial quote established.' },
        selectionVerdict: 'Technically Qualified Seller. Eligible for MSE Price Matching (within L1 + 15%).'
      },
      finalVerdict: 'Technically Qualified & Eligible',
      oneLineExecutiveSummary: 'QUALIFIED: Baseline Passed (EMD Exempt MSE Micro), Technical Cleared [MSE Exemptions Applied], Class-I MII (65%), Quote ₹7.95 Cr (within L1+15%).'
    }
  },
  {
    id: 'sub-102',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-2',
    submittedAt: '2026-09-19 11:15 IST',
    status: 'Disqualified',
    complianceScore: 28,
    commercialQuote: 78000000,
    formattedCommercialQuote: '₹ 7.80 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'Technical_Proposal_v2.pdf', type: 'PDF', fileSize: '4.1 MB', verified: true },
      { name: 'MII_Affidavit.pdf', type: 'PDF', fileSize: '980 KB', verified: true },
      { name: 'Financial_Turnover_Certificate.pdf', type: 'PDF', fileSize: '2.1 MB', verified: false }
    ],
    flags: ['Bidder is DEBARRED by Mock Procurement Authority (Period: 2026-01-15 to 2028-01-14). Statutory ineligibility under GeM Integrity & Debarment Rules.'],
    gemFrameworkEvaluation: {
      stage1Baseline: {
        gemProfileVerified: true,
        panStatus: { verified: true, panNumber: 'XYZAB5678G', message: 'PAN active in Income Tax registry.' },
        gstinStatus: { verified: true, gstinNumber: '33XYZAB5678G1Z2', message: 'GSTIN active.' },
        bankPfmsStatus: { linked: true, message: 'Bank Account & PFMS integration linked.' },
        debarmentCheck: { cleared: false, status: 'DEBARRED', authority: 'Mock Procurement Authority', message: 'Bidder is DEBARRED by Mock Procurement Authority (Period: 2026-01-15 to 2028-01-14). Statutory ineligibility under GeM Integrity & Debarment Rules.' },
        gfr144xiCompliance: { compliant: true, declarationSubmitted: true, message: 'GFR Rule 144(xi) declaration submitted.' },
        emdCompliance: { status: 'EXEMPTED', requiredAmount: '₹ 16,90,000', submitted: true, exempted: true, exemptionReason: 'MSE', message: 'MSE exemption claimed.' },
        overallBaselinePassed: false
      },
      stage2Technical: {
        turnoverFilter: { requiredCr: 15, bidderTurnoverCr: 12.0, caCertified: false, meetsCriteria: false, mseStartupExempted: true, status: 'EXEMPTED', message: 'Turnover criteria exempted under MSE rules.' },
        experienceFilter: { requiredYears: 3, bidderYears: 4, meetsCriteria: true, mseStartupExempted: true, status: 'EXEMPTED', message: 'Experience criteria exempted under MSE rules.' },
        performanceFilter: { requiredPercentage: 50, bidderPercentage: 50, meetsCriteria: true, status: 'QUALIFIED', message: 'Past performance documented.' },
        oemAuthFilter: { required: true, mafSubmitted: true, verified: true, status: 'QUALIFIED', message: 'OEM Authorization present.' },
        overallTechnicalPassed: true
      },
      stage3Preferences: {
        mseExemption: { eligible: true, udyamVerified: true, enterpriseCategory: 'Small', turnoverExemptionApplied: true, expExemptionApplied: true, message: 'Small Enterprise, but debarred from public procurement.' },
        startupExemption: { eligible: true, dpiitVerified: true, applied: true, message: 'DPIIT Recognized.' },
        makeInIndia: { supplierClass: 'Class-I Local', localContentPercentage: 55, preferenceEligible: false, message: 'Class-I Local Supplier (55% Local Content), but seller is debarred.' },
        msePriceMatching: { eligibleForL1Plus15: false, priceQuote: 78000000, within15PercentWindow: false, allocationEligiblePercent: 0, message: 'Debarred bidder is ineligible for purchase preference or price matching.' }
      },
      stage4Selection: {
        selectionMethod: 'L1',
        commercialQuote: 78000000,
        formattedQuote: '₹ 7.80 Cr',
        rank: 99,
        isL1: false,
        selectionVerdict: 'DISQUALIFIED: Debarred seller is excluded from commercial ranking and contract award.'
      },
      finalVerdict: 'Debarred from Public Procurement',
      oneLineExecutiveSummary: 'DISQUALIFIED: Debarred by Mock Procurement Authority until 2028-01-14 under GeM Integrity & Debarment Rule.'
    }
  },
  {
    id: 'sub-103',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-3',
    submittedAt: '2026-09-19 16:40 IST',
    status: 'Verified',
    complianceScore: 91,
    commercialQuote: 81000000,
    formattedCommercialQuote: '₹ 8.10 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'PQR_Hardware_Spec_Sheet.pdf', type: 'PDF', fileSize: '3.2 MB', verified: true },
      { name: 'OEM_MAF_Authorization.pdf', type: 'PDF', fileSize: '1.4 MB', verified: true },
      { name: 'Audited_Balance_Sheets.pdf', type: 'PDF', fileSize: '4.5 MB', verified: true }
    ],
    flags: [],
    gemFrameworkEvaluation: {
      stage1Baseline: {
        gemProfileVerified: true,
        panStatus: { verified: true, panNumber: 'PQRCD9012H', message: 'PAN verified active in Income Tax registry.' },
        gstinStatus: { verified: true, gstinNumber: '33PQRCD9012H1Z8', message: 'GSTIN active with regular filings.' },
        bankPfmsStatus: { linked: true, message: 'Bank Account & PFMS integration authenticated.' },
        debarmentCheck: { cleared: true, status: 'NOT_DEBARRED', message: 'No debarment records found.' },
        gfr144xiCompliance: { compliant: true, declarationSubmitted: true, message: 'GFR Rule 144(xi) Land Border Declaration verified.' },
        emdCompliance: { status: 'COMPLIANT', requiredAmount: '₹ 16,90,000', submitted: true, exempted: false, exemptionReason: 'NONE', message: 'EMD Bank Guarantee submitted and authenticated (Medium Enterprise - not MSE exempt).' },
        overallBaselinePassed: true
      },
      stage2Technical: {
        turnoverFilter: { requiredCr: 15, bidderTurnoverCr: 32.0, caCertified: true, meetsCriteria: true, mseStartupExempted: false, status: 'QUALIFIED', message: 'Turnover ₹32.0 Cr meets criteria (Medium Enterprise - standard rules apply).' },
        experienceFilter: { requiredYears: 3, bidderYears: 6, meetsCriteria: true, mseStartupExempted: false, status: 'QUALIFIED', message: 'Past experience 6 years exceeds 3 years threshold.' },
        performanceFilter: { requiredPercentage: 50, bidderPercentage: 70, meetsCriteria: true, status: 'QUALIFIED', message: 'Performance criteria satisfied.' },
        oemAuthFilter: { required: true, mafSubmitted: true, verified: true, status: 'QUALIFIED', message: 'Direct OEM Authorization verified.' },
        overallTechnicalPassed: true
      },
      stage3Preferences: {
        mseExemption: { eligible: false, udyamVerified: true, enterpriseCategory: 'Medium', turnoverExemptionApplied: false, expExemptionApplied: false, message: 'Medium Enterprise: standard technical turnover & experience criteria apply.' },
        startupExemption: { eligible: false, dpiitVerified: false, applied: false, message: 'Not registered as Startup.' },
        makeInIndia: { supplierClass: 'Class-I Local', localContentPercentage: 70, preferenceEligible: true, message: 'Class-I Local Supplier (70% Local Content).' },
        msePriceMatching: { eligibleForL1Plus15: false, priceQuote: 81000000, within15PercentWindow: false, allocationEligiblePercent: 0, message: 'Medium enterprise not eligible for MSE price preference.' }
      },
      stage4Selection: {
        selectionMethod: 'L1',
        commercialQuote: 81000000,
        formattedQuote: '₹ 8.10 Cr',
        rank: 3,
        isL1: false,
        qcbsScore: { technicalMarks: 91, financialMarks: 97, combinedScore: 93 },
        selectionVerdict: 'Technically Qualified Seller. Commercial Rank: 3.'
      },
      finalVerdict: 'Technically Qualified & Eligible',
      oneLineExecutiveSummary: 'QUALIFIED: Baseline Passed, Technical Qualified (Turnover ₹32 Cr), Class-I MII (70%), Quote ₹8.10 Cr.'
    }
  },
  {
    id: 'sub-104',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-4',
    submittedAt: '2026-09-20 09:12 IST',
    status: 'Under Review',
    complianceScore: 82,
    commercialQuote: 82000000,
    formattedCommercialQuote: '₹ 8.20 Cr',
    aiVerificationStage: 'Embeddings',
    documents: [
      { name: 'LMN_Industrial_Spec.pdf', type: 'PDF', fileSize: '2.9 MB', verified: true },
      { name: 'Tax_Clearance_2026.pdf', type: 'PDF', fileSize: '1.2 MB', verified: true }
    ],
    flags: ['Local content declaration calculation format discrepancy'],
    gemFrameworkEvaluation: {
      stage1Baseline: {
        gemProfileVerified: true,
        panStatus: { verified: true, panNumber: 'LMNOP3456J', message: 'PAN verified active.' },
        gstinStatus: { verified: true, gstinNumber: '29LMNOP3456J1Z4', message: 'GSTIN active.' },
        bankPfmsStatus: { linked: true, message: 'Bank / PFMS linked.' },
        debarmentCheck: { cleared: true, status: 'NOT_DEBARRED', message: 'No debarment records found.' },
        gfr144xiCompliance: { compliant: true, declarationSubmitted: true, message: 'GFR Rule 144(xi) declaration verified.' },
        emdCompliance: { status: 'EXEMPTED', requiredAmount: '₹ 16,90,00,00', submitted: true, exempted: true, exemptionReason: 'MSE', message: 'Statutory EMD exemption granted (Small Enterprise).' },
        overallBaselinePassed: true
      },
      stage2Technical: {
        turnoverFilter: { requiredCr: 15, bidderTurnoverCr: 18.0, caCertified: true, meetsCriteria: true, mseStartupExempted: true, status: 'EXEMPTED', message: 'Turnover criteria exempted under MSE policy.' },
        experienceFilter: { requiredYears: 3, bidderYears: 4, meetsCriteria: true, mseStartupExempted: true, status: 'EXEMPTED', message: 'Experience criteria exempted under MSE policy.' },
        performanceFilter: { requiredPercentage: 50, bidderPercentage: 55, meetsCriteria: true, status: 'QUALIFIED', message: 'Past performance documented.' },
        oemAuthFilter: { required: true, mafSubmitted: true, verified: true, status: 'QUALIFIED', message: 'OEM Authorization present.' },
        overallTechnicalPassed: true
      },
      stage3Preferences: {
        mseExemption: { eligible: true, udyamVerified: true, enterpriseCategory: 'Small', turnoverExemptionApplied: true, expExemptionApplied: true, message: 'Verified Small Enterprise: turnover/experience waivers applied.' },
        startupExemption: { eligible: true, dpiitVerified: true, applied: true, message: 'DPIIT recognized.' },
        makeInIndia: { supplierClass: 'Class-II Local', localContentPercentage: 45, preferenceEligible: false, message: 'Class-II Local Supplier (45% Local Content). Eligible to bid, secondary preference.' },
        msePriceMatching: { eligibleForL1Plus15: true, priceQuote: 82000000, l1PriceQuote: 79000000, within15PercentWindow: true, allocationEligiblePercent: 25, message: 'Within L1 + 15% window. Eligible for MSE price matching opportunity.' }
      },
      stage4Selection: {
        selectionMethod: 'L1',
        commercialQuote: 82000000,
        formattedQuote: '₹ 8.20 Cr',
        rank: 4,
        isL1: false,
        selectionVerdict: 'Technically Qualified Seller. Commercial Rank: 4.'
      },
      finalVerdict: 'Technically Qualified & Eligible',
      oneLineExecutiveSummary: 'QUALIFIED: Baseline Passed (EMD Exempt Small MSE), Class-II MII (45%), Quote ₹8.20 Cr.'
    }
  },
  {
    id: 'sub-105',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-7',
    submittedAt: '2026-09-20 18:22 IST',
    status: 'Verified',
    complianceScore: 96,
    commercialQuote: 79000000,
    formattedCommercialQuote: '₹ 7.90 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'MNO_Enterprise_Solution_Proposal.pdf', type: 'PDF', fileSize: '5.1 MB', verified: true },
      { name: 'OEM_Tier1_Certificate.pdf', type: 'PDF', fileSize: '1.8 MB', verified: true },
      { name: 'CA_Certified_Turnover_Signed.pdf', type: 'PDF', fileSize: '2.7 MB', verified: true }
    ],
    flags: [],
    gemFrameworkEvaluation: {
      stage1Baseline: {
        gemProfileVerified: true,
        panStatus: { verified: true, panNumber: 'MNOPQ5678M', message: 'PAN verified active in Income Tax registry.' },
        gstinStatus: { verified: true, gstinNumber: '33MNOPQ5678M1Z0', message: 'GSTIN active with regular filings.' },
        bankPfmsStatus: { linked: true, message: 'Bank Account & PFMS integration authenticated.' },
        debarmentCheck: { cleared: true, status: 'NOT_DEBARRED', message: 'No debarment records found.' },
        gfr144xiCompliance: { compliant: true, declarationSubmitted: true, message: 'GFR Rule 144(xi) Land Border Declaration verified.' },
        emdCompliance: { status: 'EXEMPTED', requiredAmount: '₹ 16,90,000', submitted: true, exempted: true, exemptionReason: 'MSE', message: 'Statutory EMD exemption granted under Public Procurement Policy for MSEs Order, 2012 (Small Enterprise).' },
        overallBaselinePassed: true
      },
      stage2Technical: {
        turnoverFilter: { requiredCr: 15, bidderTurnoverCr: 21.5, caCertified: true, meetsCriteria: true, mseStartupExempted: true, status: 'EXEMPTED', message: 'Turnover criteria exempted under MSE policy (CA audited ₹21.5 Cr).' },
        experienceFilter: { requiredYears: 3, bidderYears: 7, meetsCriteria: true, mseStartupExempted: true, status: 'EXEMPTED', message: 'Experience criteria exempted under MSE policy (7 years documented).' },
        performanceFilter: { requiredPercentage: 50, bidderPercentage: 75, meetsCriteria: true, status: 'QUALIFIED', message: 'Past performance verified.' },
        oemAuthFilter: { required: true, mafSubmitted: true, verified: true, status: 'QUALIFIED', message: 'OEM Tier 1 Certificate authenticated.' },
        overallTechnicalPassed: true
      },
      stage3Preferences: {
        mseExemption: { eligible: true, udyamVerified: true, enterpriseCategory: 'Small', turnoverExemptionApplied: true, expExemptionApplied: true, message: 'Verified Small Enterprise: turnover/experience waivers applied.' },
        startupExemption: { eligible: true, dpiitVerified: true, applied: true, message: 'DPIIT recognized.' },
        makeInIndia: { supplierClass: 'Class-II Local', localContentPercentage: 40, preferenceEligible: false, message: 'Class-II Local Supplier (40% Local Content).' },
        msePriceMatching: { eligibleForL1Plus15: true, priceQuote: 79000000, l1PriceQuote: 79000000, within15PercentWindow: true, allocationEligiblePercent: 100, message: 'Bidder is L1 (Lowest Commercial Quote). Eligible for 100% contract award.' }
      },
      stage4Selection: {
        selectionMethod: 'L1',
        commercialQuote: 79000000,
        formattedQuote: '₹ 7.90 Cr',
        rank: 1,
        isL1: true,
        qcbsScore: { technicalMarks: 96, financialMarks: 100, combinedScore: 97 },
        selectionVerdict: 'L1 Bidder: Lowest commercial quote among technically qualified sellers. Recommended for contract award.'
      },
      finalVerdict: 'Technically Qualified & Eligible',
      oneLineExecutiveSummary: 'L1 WINNER: Baseline Passed, Technical Qualified [MSE Exemption Applied], Quote ₹7.90 Cr (Lowest Commercial Offer).'
    }
  },
  {
    id: 'sub-106',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-8',
    submittedAt: '2026-09-21 10:05 IST',
    status: 'Disqualified',
    complianceScore: 42,
    commercialQuote: 84000000,
    formattedCommercialQuote: '₹ 8.40 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'QRS_Digital_Proposal.pdf', type: 'PDF', fileSize: '1.9 MB', verified: true },
      { name: 'Expired_Tax_Clearance.pdf', type: 'PDF', fileSize: '750 KB', verified: false }
    ],
    flags: ['Mandatory MII certificate missing', 'GST return filing delayed beyond allowable cure window'],
    gemFrameworkEvaluation: {
      stage1Baseline: {
        gemProfileVerified: false,
        panStatus: { verified: true, panNumber: 'QRSTU9012N', message: 'PAN active.' },
        gstinStatus: { verified: false, gstinNumber: '19QRSTU9012N1Z6', message: 'GSTIN default: tax filings overdue beyond allowable cure window.' },
        bankPfmsStatus: { linked: false, message: 'Bank / PFMS linking pending tax compliance clearance.' },
        debarmentCheck: { cleared: true, status: 'NOT_DEBARRED', message: 'No debarment records found.' },
        gfr144xiCompliance: { compliant: false, declarationSubmitted: false, message: 'GFR 144(xi) declaration missing.' },
        emdCompliance: { status: 'NON_COMPLIANT', requiredAmount: '₹ 16,90,000', submitted: false, exempted: false, exemptionReason: 'NONE', message: 'EMD not submitted and Udyam certification invalid.' },
        overallBaselinePassed: false
      },
      stage2Technical: {
        turnoverFilter: { requiredCr: 15, bidderTurnoverCr: 8.5, caCertified: false, meetsCriteria: false, mseStartupExempted: false, status: 'DISQUALIFIED', message: 'Turnover below threshold and tax clearance unverified.' },
        experienceFilter: { requiredYears: 3, bidderYears: 2, meetsCriteria: false, mseStartupExempted: false, status: 'DISQUALIFIED', message: 'Insufficient past experience.' },
        performanceFilter: { requiredPercentage: 50, bidderPercentage: 20, meetsCriteria: false, status: 'DISQUALIFIED', message: 'Past performance criteria not met.' },
        oemAuthFilter: { required: true, mafSubmitted: false, verified: false, status: 'DISQUALIFIED', message: 'OEM Authorization Form missing.' },
        overallTechnicalPassed: false
      },
      stage3Preferences: {
        mseExemption: { eligible: false, udyamVerified: false, enterpriseCategory: 'None', turnoverExemptionApplied: false, expExemptionApplied: false, message: 'Ineligible for MSE preferences.' },
        startupExemption: { eligible: false, dpiitVerified: false, applied: false, message: 'Not registered as Startup.' },
        makeInIndia: { supplierClass: 'Non-Local', localContentPercentage: 0, preferenceEligible: false, message: 'Mandatory Make in India certificate missing.' },
        msePriceMatching: { eligibleForL1Plus15: false, priceQuote: 84000000, within15PercentWindow: false, allocationEligiblePercent: 0, message: 'Ineligible.' }
      },
      stage4Selection: {
        selectionMethod: 'L1',
        commercialQuote: 84000000,
        formattedQuote: '₹ 8.40 Cr',
        rank: 99,
        isL1: false,
        selectionVerdict: 'DISQUALIFIED: Baseline and technical criteria not satisfied.'
      },
      finalVerdict: 'Disqualified - Baseline Failure',
      oneLineExecutiveSummary: 'DISQUALIFIED: Failed Baseline Requirements (GSTIN default, GFR 144(xi) missing, EMD not paid).'
    }
  },
  {
    id: 'sub-201',
    tenderId: 'GEM/2026/B/895311',
    companyId: 'comp-4',
    submittedAt: '2026-09-14 10:00 IST',
    status: 'Verified',
    complianceScore: 89,
    commercialQuote: 138000000,
    formattedCommercialQuote: '₹ 13.80 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'ISO_27001_Certificate.pdf', type: 'PDF', fileSize: '1.5 MB', verified: true },
      { name: 'Past_Deployment_Certificates.pdf', type: 'PDF', fileSize: '3.2 MB', verified: true },
      { name: 'Udyam_Registration.pdf', type: 'PDF', fileSize: '420 KB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-202',
    tenderId: 'GEM/2026/B/895311',
    companyId: 'comp-9',
    submittedAt: '2026-09-15 14:30 IST',
    status: 'Under Review',
    complianceScore: 71,
    commercialQuote: 141000000,
    formattedCommercialQuote: '₹ 14.10 Cr',
    aiVerificationStage: 'LLM_Analysis',
    documents: [
      { name: 'CCTV_Technical_Proposal.pdf', type: 'PDF', fileSize: '2.8 MB', verified: true },
      { name: 'Experience_Certificate_Railways.pdf', type: 'PDF', fileSize: '1.9 MB', verified: false }
    ],
    flags: ['Experience certificate needs notarization']
  },
  {
    id: 'sub-203',
    tenderId: 'GEM/2026/B/895311',
    companyId: 'comp-10',
    submittedAt: '2026-09-16 09:45 IST',
    status: 'Disqualified',
    complianceScore: 35,
    commercialQuote: 139000000,
    formattedCommercialQuote: '₹ 13.90 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'FGH_AI_Analytics_Spec.pdf', type: 'PDF', fileSize: '4.1 MB', verified: true },
      { name: 'ISO_Certification_2024.pdf', type: 'PDF', fileSize: '1.1 MB', verified: true },
      { name: 'Govt_Completion_Certificates.pdf', type: 'PDF', fileSize: '2.5 MB', verified: true }
    ],
    flags: ['Bidder is DEBARRED by Mock Procurement Authority (Period: 2026-03-10 to 2029-03-09). Statutory ineligibility under GeM Integrity & Debarment Rules.']
  },
  {
    id: 'sub-204',
    tenderId: 'GEM/2026/B/895311',
    companyId: 'comp-3',
    submittedAt: '2026-09-17 16:00 IST',
    status: 'Under Review',
    complianceScore: 76,
    commercialQuote: 139500000,
    formattedCommercialQuote: '₹ 13.95 Cr',
    aiVerificationStage: 'Embeddings',
    documents: [
      { name: 'PQR_CCTV_Bid_Proposal.pdf', type: 'PDF', fileSize: '3.5 MB', verified: true },
      { name: 'Udyam_Certificate.pdf', type: 'PDF', fileSize: '380 KB', verified: true }
    ],
    flags: ['ISO 27001 certificate expiry date needs verification']
  },
  {
    id: 'sub-301',
    tenderId: 'GEM/2026/B/897740',
    companyId: 'comp-6',
    submittedAt: '2026-09-10 11:00 IST',
    status: 'Verified',
    complianceScore: 92,
    commercialQuote: 36500000,
    formattedCommercialQuote: '₹ 3.65 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'Cisco_Gold_Partner_Certificate.pdf', type: 'PDF', fileSize: '1.3 MB', verified: true },
      { name: 'SLA_Commitment_Affidavit.pdf', type: 'PDF', fileSize: '890 KB', verified: true },
      { name: 'Technical_Maintenance_Plan.pdf', type: 'PDF', fileSize: '2.2 MB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-302',
    tenderId: 'GEM/2026/B/897740',
    companyId: 'comp-7',
    submittedAt: '2026-09-11 15:20 IST',
    status: 'Under Review',
    complianceScore: 74,
    commercialQuote: 37500000,
    formattedCommercialQuote: '₹ 3.75 Cr',
    aiVerificationStage: 'Govt_API',
    documents: [
      { name: 'Juniper_Partner_Certificate.pdf', type: 'PDF', fileSize: '1.1 MB', verified: true },
      { name: 'Network_Maintenance_Proposal.pdf', type: 'PDF', fileSize: '3.1 MB', verified: false }
    ],
    flags: ['Juniper partner tier needs verification with OEM portal']
  },
  {
    id: 'sub-303',
    tenderId: 'GEM/2026/B/897740',
    companyId: 'comp-5',
    submittedAt: '2026-09-12 10:30 IST',
    status: 'Disqualified',
    complianceScore: 32,
    commercialQuote: 38500000,
    formattedCommercialQuote: '₹ 3.85 Cr',
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'RST_Networking_Proposal.pdf', type: 'PDF', fileSize: '1.7 MB', verified: false }
    ],
    flags: ['Bidder is DEBARRED by Mock Procurement Authority (Period: 2025-06-01 to 2027-05-31). Statutory ineligibility under GeM Integrity & Debarment Rules.']
  }
];
