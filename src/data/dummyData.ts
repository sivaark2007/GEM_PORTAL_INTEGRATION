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
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'Technical_Specification_Compliance_Sheet.pdf', type: 'PDF', fileSize: '2.4 MB', verified: true },
      { name: 'Make_In_India_Declaration_Auditor.pdf', type: 'PDF', fileSize: '1.1 MB', verified: true },
      { name: 'CA_Audited_Turnover_FY23_26.pdf', type: 'PDF', fileSize: '3.8 MB', verified: true },
      { name: 'GSTIN_Registration_and_GSTR3B.pdf', type: 'PDF', fileSize: '890 KB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-102',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-2',
    submittedAt: '2026-09-19 11:15 IST',
    status: 'Under Review',
    complianceScore: 78,
    aiVerificationStage: 'LLM_Analysis',
    documents: [
      { name: 'Technical_Proposal_v2.pdf', type: 'PDF', fileSize: '4.1 MB', verified: true },
      { name: 'MII_Affidavit.pdf', type: 'PDF', fileSize: '980 KB', verified: true },
      { name: 'Financial_Turnover_Certificate.pdf', type: 'PDF', fileSize: '2.1 MB', verified: false }
    ],
    flags: ['Turnover UDIN verification pending with ICAI registry']
  },
  {
    id: 'sub-103',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-3',
    submittedAt: '2026-09-19 16:40 IST',
    status: 'Verified',
    complianceScore: 91,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'PQR_Hardware_Spec_Sheet.pdf', type: 'PDF', fileSize: '3.2 MB', verified: true },
      { name: 'OEM_MAF_Authorization.pdf', type: 'PDF', fileSize: '1.4 MB', verified: true },
      { name: 'Audited_Balance_Sheets.pdf', type: 'PDF', fileSize: '4.5 MB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-104',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-4',
    submittedAt: '2026-09-20 09:12 IST',
    status: 'Under Review',
    complianceScore: 82,
    aiVerificationStage: 'Embeddings',
    documents: [
      { name: 'LMN_Industrial_Spec.pdf', type: 'PDF', fileSize: '2.9 MB', verified: true },
      { name: 'Tax_Clearance_2026.pdf', type: 'PDF', fileSize: '1.2 MB', verified: true }
    ],
    flags: ['Local content declaration calculation format discrepancy']
  },
  {
    id: 'sub-105',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-7',
    submittedAt: '2026-09-20 18:22 IST',
    status: 'Verified',
    complianceScore: 96,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'MNO_Enterprise_Solution_Proposal.pdf', type: 'PDF', fileSize: '5.1 MB', verified: true },
      { name: 'OEM_Tier1_Certificate.pdf', type: 'PDF', fileSize: '1.8 MB', verified: true },
      { name: 'CA_Certified_Turnover_Signed.pdf', type: 'PDF', fileSize: '2.7 MB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-106',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-8',
    submittedAt: '2026-09-21 10:05 IST',
    status: 'Disqualified',
    complianceScore: 42,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'QRS_Digital_Proposal.pdf', type: 'PDF', fileSize: '1.9 MB', verified: true },
      { name: 'Expired_Tax_Clearance.pdf', type: 'PDF', fileSize: '750 KB', verified: false }
    ],
    flags: ['Mandatory MII certificate missing', 'GST return filing delayed beyond allowable cure window']
  },
  {
    id: 'sub-201',
    tenderId: 'GEM/2026/B/895311',
    companyId: 'comp-4',
    submittedAt: '2026-09-14 10:00 IST',
    status: 'Verified',
    complianceScore: 89,
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
    status: 'Verified',
    complianceScore: 93,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'FGH_AI_Analytics_Spec.pdf', type: 'PDF', fileSize: '4.1 MB', verified: true },
      { name: 'ISO_Certification_2024.pdf', type: 'PDF', fileSize: '1.1 MB', verified: true },
      { name: 'Govt_Completion_Certificates.pdf', type: 'PDF', fileSize: '2.5 MB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-204',
    tenderId: 'GEM/2026/B/895311',
    companyId: 'comp-3',
    submittedAt: '2026-09-17 16:00 IST',
    status: 'Under Review',
    complianceScore: 76,
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
    complianceScore: 88,
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
    complianceScore: 38,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'RST_Networking_Proposal.pdf', type: 'PDF', fileSize: '1.7 MB', verified: false }
    ],
    flags: ['No OEM partner certification submitted', 'SLA commitment affidavit missing']
  }
];
