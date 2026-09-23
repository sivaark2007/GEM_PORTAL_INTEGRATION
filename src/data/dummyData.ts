import { Company, Tender, BidSubmission } from '../types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'ABC Technologies Pvt Ltd',
    email: 'contact@abctechnologies.in',
    contactNumber: '+91 98110 23412',
    gstin: '07AAACA1234F1Z5',
    pan: 'AAACA1234F',
    udyamNumber: 'UDYAM-DL-01-0023451',
    cin: 'U72200DL2015PTC281920',
    city: 'New Delhi',
    sector: 'IT Infrastructure & Hardware',
    color: '#0284c7',
    registeredDate: '12 Jan 2018'
  },
  {
    id: 'comp-2',
    name: 'XYZ Solutions Pvt Ltd',
    email: 'tenders@xyzsolutions.co.in',
    contactNumber: '+91 98221 44512',
    gstin: '27AABCX5432E1Z8',
    pan: 'AABCX5432E',
    udyamNumber: 'UDYAM-MH-03-0098412',
    cin: 'U72900MH2016PTC294112',
    city: 'Mumbai',
    sector: 'Enterprise Software & Cloud',
    color: '#0d9488',
    registeredDate: '04 Mar 2019'
  },
  {
    id: 'comp-3',
    name: 'Nova Systems India',
    email: 'info@novasystems.in',
    contactNumber: '+91 98450 67123',
    gstin: '29AABCN8891D1Z2',
    pan: 'AABCN8891D',
    udyamNumber: 'UDYAM-KR-03-0044521',
    cin: 'U30007KA2017PTC099182',
    city: 'Bengaluru',
    sector: 'Defense & Electronic Systems',
    color: '#4f46e5',
    registeredDate: '19 Aug 2017'
  },
  {
    id: 'comp-4',
    name: 'TechVision India',
    email: 'procurement@techvision.in',
    contactNumber: '+91 98712 33490',
    gstin: '06AAACT9901B1Z4',
    pan: 'AAACT9901B',
    udyamNumber: 'UDYAM-HR-05-0019284',
    cin: 'U74999HR2018PTC078129',
    city: 'Gurugram',
    sector: 'AI & Automated Surveillance',
    color: '#7c3aed',
    registeredDate: '23 Nov 2018'
  },
  {
    id: 'comp-5',
    name: 'Alpha Computers',
    email: 'sales@alphacomputers.net',
    contactNumber: '+91 94120 78234',
    gstin: '09AAACA9012J1Z3',
    pan: 'AAACA9012J',
    udyamNumber: 'UDYAM-UP-12-0055190',
    cin: 'U31900UP2014PTC065421',
    city: 'Noida',
    sector: 'Commercial Computing Equipment',
    color: '#2563eb',
    registeredDate: '15 Feb 2016'
  },
  {
    id: 'comp-6',
    name: 'NextGen Systems',
    email: 'bids@nextgensystems.in',
    contactNumber: '+91 98301 99231',
    gstin: '19AABCN4412L1Z9',
    pan: 'AABCN4412L',
    udyamNumber: 'UDYAM-WB-10-0038192',
    cin: 'U72200WB2019PTC221901',
    city: 'Kolkata',
    sector: 'Network Architecture & Telecom',
    color: '#d97706',
    registeredDate: '10 May 2020'
  },
  {
    id: 'comp-7',
    name: 'Vertex Technologies',
    email: 'compliance@vertextech.org',
    contactNumber: '+91 99002 11456',
    gstin: '33AABCV7721K1Z1',
    pan: 'AABCV7721K',
    udyamNumber: 'UDYAM-TN-02-0081294',
    cin: 'U72300TN2015PTC098231',
    city: 'Chennai',
    sector: 'Cybersecurity & Data Center Solutions',
    color: '#059669',
    registeredDate: '08 Oct 2017'
  },
  {
    id: 'comp-8',
    name: 'Prime Digital Solutions',
    email: 'govbids@primedigital.in',
    contactNumber: '+91 97188 55670',
    gstin: '24AABCP6631H1Z7',
    pan: 'AABCP6631H',
    udyamNumber: 'UDYAM-GJ-01-0062819',
    cin: 'U72200GJ2016PTC089114',
    city: 'Ahmedabad',
    sector: 'Smart City & IoT Deployment',
    color: '#e11d48',
    registeredDate: '27 Jun 2019'
  },
  {
    id: 'comp-9',
    name: 'Orbit Infotech',
    email: 'tenderdesk@orbitinfotech.com',
    contactNumber: '+91 96190 44521',
    gstin: '36AABCO3321M1Z6',
    pan: 'AABCO3321M',
    udyamNumber: 'UDYAM-TS-09-0029184',
    cin: 'U72400TG2018PTC121890',
    city: 'Hyderabad',
    sector: 'Cloud Hosting & System Integration',
    color: '#9333ea',
    registeredDate: '14 Sep 2020'
  },
  {
    id: 'comp-10',
    name: 'BlueSky Technologies',
    email: 'director@blueskytech.in',
    contactNumber: '+91 98260 88219',
    gstin: '23AABCB1190N1Z5',
    pan: 'AABCB1190N',
    udyamNumber: 'UDYAM-MP-20-0044129',
    cin: 'U72900MP2021PTC051289',
    city: 'Bhopal',
    sector: 'AI Video Analytics & Automation',
    color: '#0284c7',
    registeredDate: '29 Jan 2021'
  }
];

export const INITIAL_TENDERS: Tender[] = [
  {
    id: 'GEM/2026/B/894102',
    tenderNumber: 'GEM/2026/B/894102',
    title: 'Procurement of Enterprise Cloud Computing Servers & High-Performance Storage',
    organization: 'National Informatics Centre (NIC)',
    ministry: 'Ministry of Electronics & Information Technology',
    estimatedValue: '₹ 8,45,00,000',
    category: 'Hardware & IT Infrastructure',
    closingDate: '2026-10-15',
    status: 'Evaluation',
    appliedBiddersCount: 6,
    requirements: [
      { id: 'req-1', title: 'Make in India Class-I/II Certification', category: 'compliance', description: 'Minimum 50% local content requirement verified by statutory auditor', mandatory: true },
      { id: 'req-2', title: 'Average Annual Turnover > ₹15 Crores (FY 23-26)', category: 'financial', description: 'Audited CA balance sheets for last 3 financial years with UDIN', mandatory: true },
      { id: 'req-3', title: 'OEM Authorization Form (MAF)', category: 'technical', description: 'Direct manufacturer authorization for tender warranty and SLA support', mandatory: true },
      { id: 'req-4', title: 'Valid GSTIN & Tax Clearance Certificate', category: 'statutory', description: 'GSTR-3B filings up to latest quarter without defaults', mandatory: true }
    ]
  },
  {
    id: 'GEM/2026/B/895311',
    tenderNumber: 'GEM/2026/B/895311',
    title: 'Deployment of AI-Powered Edge CCTV Surveillance & Analytics for Railway Stations',
    organization: 'Northern Railway Zone',
    ministry: 'Ministry of Railways',
    estimatedValue: '₹ 14,20,00,000',
    category: 'Electronic Systems & AI',
    closingDate: '2026-10-28',
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
    organization: 'Department of Telecommunications',
    ministry: 'Ministry of Communications',
    estimatedValue: '₹ 3,90,00,000',
    category: 'Networking & Maintenance',
    closingDate: '2026-11-05',
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
    companyId: 'comp-1', // ABC Technologies
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
    companyId: 'comp-2', // XYZ Solutions
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
    companyId: 'comp-3', // Nova Systems India
    submittedAt: '2026-09-19 16:40 IST',
    status: 'Verified',
    complianceScore: 91,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'Nova_Hardware_Spec_Sheet.pdf', type: 'PDF', fileSize: '3.2 MB', verified: true },
      { name: 'OEM_MAF_Authorization.pdf', type: 'PDF', fileSize: '1.4 MB', verified: true },
      { name: 'Audited_Balance_Sheets.pdf', type: 'PDF', fileSize: '4.5 MB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-104',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-4', // TechVision India
    submittedAt: '2026-09-20 09:12 IST',
    status: 'Under Review',
    complianceScore: 82,
    aiVerificationStage: 'Embeddings',
    documents: [
      { name: 'AI_Surveillance_Spec.pdf', type: 'PDF', fileSize: '2.9 MB', verified: true },
      { name: 'Tax_Clearance_2026.pdf', type: 'PDF', fileSize: '1.2 MB', verified: true }
    ],
    flags: ['Local content declaration calculation format discrepancy']
  },
  {
    id: 'sub-105',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-7', // Vertex Technologies
    submittedAt: '2026-09-20 18:22 IST',
    status: 'Verified',
    complianceScore: 96,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'Vertex_Enterprise_Solution_Proposal.pdf', type: 'PDF', fileSize: '5.1 MB', verified: true },
      { name: 'OEM_Tier1_Certificate.pdf', type: 'PDF', fileSize: '1.8 MB', verified: true },
      { name: 'CA_Certified_Turnover_Signed.pdf', type: 'PDF', fileSize: '2.7 MB', verified: true }
    ],
    flags: []
  },
  {
    id: 'sub-106',
    tenderId: 'GEM/2026/B/894102',
    companyId: 'comp-8', // Prime Digital Solutions
    submittedAt: '2026-09-21 10:05 IST',
    status: 'Disqualified',
    complianceScore: 42,
    aiVerificationStage: 'Completed',
    documents: [
      { name: 'PrimeDigital_Proposal.pdf', type: 'PDF', fileSize: '1.9 MB', verified: true },
      { name: 'Expired_Tax_Clearance.pdf', type: 'PDF', fileSize: '750 KB', verified: false }
    ],
    flags: ['Mandatory MII certificate missing', 'GST return filing delayed beyond allowable cure window']
  }
];
