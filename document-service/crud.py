"""
Database CRUD and Seeding Operations for GeM Portal Integration.
"""

import time
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from database import Base, get_engine
from models import CompanyModel, TenderModel, BidSubmissionModel, BidDocumentModel
from schemas import CompanyCreate, TenderCreate, BidSubmissionCreate, VerificationUpdate

logger = logging.getLogger("document-service.crud")


def init_database(db: Session):
    """Creates tables if they don't exist and seeds initial data if empty."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    # Check if companies exist, if not seed initial companies
    existing_companies_count = db.query(CompanyModel).count()
    if existing_companies_count == 0:
        logger.info("Database is empty. Seeding initial bidders, tenders, and submissions...")
        seed_initial_data(db)


def seed_initial_data(db: Session):
    """Seeds default realistic GeM dataset into the database."""
    initial_companies = [
        CompanyModel(
            id='comp-1',
            name='ABC Technologies Pvt Ltd',
            email='contact@abctechnologies.in',
            contact_number='+91 98110 23412',
            gstin='07AAACA1234F1Z5',
            pan='AAACA1234F',
            udyam_number='UDYAM-DL-01-0023451',
            cin='U72200DL2015PTC281920',
            city='New Delhi',
            sector='IT Infrastructure & Hardware',
            color='#0284c7',
            registered_date='12 Jan 2018',
            is_custom=False
        ),
        CompanyModel(
            id='comp-2',
            name='XYZ Solutions Pvt Ltd',
            email='tenders@xyzsolutions.co.in',
            contact_number='+91 98221 44512',
            gstin='27AABCX5432E1Z8',
            pan='AABCX5432E',
            udyam_number='UDYAM-MH-03-0098412',
            cin='U72900MH2016PTC294112',
            city='Mumbai',
            sector='Enterprise Software & Cloud',
            color='#0d9488',
            registered_date='04 Mar 2019',
            is_custom=False
        ),
        CompanyModel(
            id='comp-3',
            name='Nova Systems India',
            email='info@novasystems.in',
            contact_number='+91 98450 67123',
            gstin='29AABCN8891D1Z2',
            pan='AABCN8891D',
            udyam_number='UDYAM-KR-03-0044521',
            cin='U30007KA2017PTC099182',
            city='Bengaluru',
            sector='Defense & Electronic Systems',
            color='#4f46e5',
            registered_date='19 Aug 2017',
            is_custom=False
        ),
        CompanyModel(
            id='comp-4',
            name='TechVision India',
            email='procurement@techvision.in',
            contact_number='+91 98712 33490',
            gstin='06AAACT9901B1Z4',
            pan='AAACT9901B',
            udyam_number='UDYAM-HR-05-0019284',
            cin='U74999HR2018PTC078129',
            city='Gurugram',
            sector='AI & Automated Surveillance',
            color='#7c3aed',
            registered_date='23 Nov 2018',
            is_custom=False
        )
    ]
    for comp in initial_companies:
        db.add(comp)
    db.commit()

    initial_tenders = [
        TenderModel(
            id='GEM/2026/B/894102',
            tender_number='GEM/2026/B/894102',
            title='Procurement of Enterprise Cloud Computing Servers & High-Performance Storage',
            items='Enterprise Cloud Computing Servers & High-Performance Storage Arrays',
            quantity=45,
            organization='National Informatics Centre (NIC)',
            ministry='Ministry of Electronics & Information Technology',
            estimated_value='₹ 8,45,00,000',
            category='Hardware & IT Infrastructure',
            start_date='28-08-2026 2:11 PM',
            end_date='24-09-2026 9:00 AM',
            closing_date='2026-09-24',
            status='Evaluation',
            applied_bidders_count=2,
            requirements=[
                { 'id': 'req-1', 'title': 'Make in India Class-I/II Certification', 'category': 'compliance', 'description': 'Minimum 50% local content requirement verified by statutory auditor', 'mandatory': True },
                { 'id': 'req-2', 'title': 'Average Annual Turnover > ₹15 Crores (FY 23-26)', 'category': 'financial', 'description': 'Audited CA balance sheets for last 3 financial years with UDIN', 'mandatory': True },
                { 'id': 'req-3', 'title': 'OEM Authorization Form (MAF)', 'category': 'technical', 'description': 'Direct manufacturer authorization for tender warranty and SLA support', 'mandatory': True },
                { 'id': 'req-4', 'title': 'Valid GSTIN & Tax Clearance Certificate', 'category': 'statutory', 'description': 'GSTR-3B filings up to latest quarter without defaults', 'mandatory': True }
            ],
            gem_bidding_document={
                'name': 'GeM-Bidding-9318928.pdf',
                'fileSize': '118.6 KB',
                'uploadedAt': '28-08-2026 10:00 AM'
            }
        ),
        TenderModel(
            id='GEM/2026/B/895311',
            tender_number='GEM/2026/B/895311',
            title='Deployment of AI-Powered Edge CCTV Surveillance & Analytics for Railway Stations',
            items='AI-Powered Edge CCTV Cameras & Video Analytics Software',
            quantity=320,
            organization='Northern Railway Zone',
            ministry='Ministry of Railways',
            estimated_value='₹ 14,20,00,000',
            category='Electronic Systems & AI',
            start_date='31-08-2026 3:45 PM',
            end_date='24-09-2026 9:00 AM',
            closing_date='2026-09-24',
            status='Active',
            applied_bidders_count=1,
            requirements=[
                { 'id': 'req-10', 'title': 'ISO 27001 Information Security Certification', 'category': 'compliance', 'description': 'Valid ISO certification for enterprise surveillance software stack', 'mandatory': True },
                { 'id': 'req-11', 'title': 'Past Experience in Government Video Surveillance', 'category': 'technical', 'description': 'Completion certificates of at least 2 similar scale deployments', 'mandatory': True },
                { 'id': 'req-12', 'title': 'MSME / Udyam Registration Exemption', 'category': 'statutory', 'description': 'Valid Udyam certificate for EMD exemption benefit', 'mandatory': False }
            ]
        )
    ]
    for tender in initial_tenders:
        db.add(tender)
    db.commit()

    initial_submissions = [
        BidSubmissionModel(
            id='sub-101',
            tender_id='GEM/2026/B/894102',
            company_id='comp-1',
            submitted_at='2026-09-18 14:32 IST',
            status='Verified',
            compliance_score=94,
            ai_verification_stage='Completed',
            flags=[],
            documents_json=[
                { 'id': 'doc-1', 'name': 'Technical_Specification_Compliance_Sheet.pdf', 'type': 'PDF', 'fileSize': '2.4 MB', 'verified': True },
                { 'id': 'doc-2', 'name': 'Make_In_India_Declaration_Auditor.pdf', 'type': 'PDF', 'fileSize': '1.1 MB', 'verified': True },
                { 'id': 'doc-3', 'name': 'CA_Audited_Turnover_FY23_26.pdf', 'type': 'PDF', 'fileSize': '3.8 MB', 'verified': True },
                { 'id': 'doc-4', 'name': 'GSTIN_Registration_and_GSTR3B.pdf', 'type': 'PDF', 'fileSize': '890 KB', 'verified': True }
            ]
        ),
        BidSubmissionModel(
            id='sub-102',
            tender_id='GEM/2026/B/894102',
            company_id='comp-2',
            submitted_at='2026-09-19 11:15 IST',
            status='Under Review',
            compliance_score=78,
            ai_verification_stage='LLM_Analysis',
            flags=['Turnover UDIN verification pending with ICAI registry'],
            documents_json=[
                { 'id': 'doc-5', 'name': 'Technical_Proposal_v2.pdf', 'type': 'PDF', 'fileSize': '4.1 MB', 'verified': True },
                { 'id': 'doc-6', 'name': 'MII_Affidavit.pdf', 'type': 'PDF', 'fileSize': '980 KB', 'verified': True },
                { 'id': 'doc-7', 'name': 'Financial_Turnover_Certificate.pdf', 'type': 'PDF', 'fileSize': '2.1 MB', 'verified': False }
            ]
        )
    ]
    for sub in initial_submissions:
        db.add(sub)
    db.commit()
    logger.info("Database seeding completed.")


# ---------------- Bidder Operations ----------------
def get_bidders(db: Session) -> List[CompanyModel]:
    return db.query(CompanyModel).order_by(CompanyModel.created_at.desc()).all()


def get_bidder_by_id(db: Session, bidder_id: str) -> Optional[CompanyModel]:
    return db.query(CompanyModel).filter(CompanyModel.id == bidder_id).first()


def create_bidder(db: Session, bidder_in: CompanyCreate) -> CompanyModel:
    bidder_id = bidder_in.id or f"comp-{int(time.time() * 1000)}"
    new_bidder = CompanyModel(
        id=bidder_id,
        name=bidder_in.name,
        email=bidder_in.email,
        contact_number=bidder_in.contactNumber,
        gstin=bidder_in.gstin,
        pan=bidder_in.pan,
        udyam_number=bidder_in.udyamNumber,
        cin=bidder_in.cin,
        city=bidder_in.city,
        sector=bidder_in.sector,
        color=bidder_in.color or "#0284c7",
        registered_date=bidder_in.registeredDate or "Today",
        is_custom=True if bidder_in.isCustom is not None else False
    )
    db.add(new_bidder)
    db.commit()
    db.refresh(new_bidder)
    return new_bidder


# ---------------- Tender Operations ----------------
def get_tenders(db: Session) -> List[TenderModel]:
    return db.query(TenderModel).order_by(TenderModel.created_at.desc()).all()


def get_tender_by_id(db: Session, tender_id: str) -> Optional[TenderModel]:
    return db.query(TenderModel).filter(TenderModel.id == tender_id).first()


def create_tender(db: Session, tender_in: TenderCreate) -> TenderModel:
    tender_id = tender_in.id or tender_in.tenderNumber
    reqs_json = [r.dict() if hasattr(r, 'dict') else r for r in (tender_in.requirements or [])]
    gem_doc_json = tender_in.gemBiddingDocument.dict() if tender_in.gemBiddingDocument and hasattr(tender_in.gemBiddingDocument, 'dict') else tender_in.gemBiddingDocument

    new_tender = TenderModel(
        id=tender_id,
        tender_number=tender_in.tenderNumber,
        title=tender_in.title,
        organization=tender_in.organization,
        ministry=tender_in.ministry,
        estimated_value=tender_in.estimatedValue,
        category=tender_in.category,
        closing_date=tender_in.closingDate,
        start_date=tender_in.startDate,
        end_date=tender_in.endDate,
        items=tender_in.items,
        quantity=tender_in.quantity or 1,
        status=tender_in.status or "Active",
        applied_bidders_count=0,
        requirements=reqs_json,
        gem_bidding_document=gem_doc_json
    )
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)
    return new_tender


def update_tender_gem_doc(db: Session, tender_id: str, gem_doc: dict) -> Optional[TenderModel]:
    tender = get_tender_by_id(db, tender_id)
    if not tender:
        return None
    tender.gem_bidding_document = gem_doc
    db.commit()
    db.refresh(tender)
    return tender


# ---------------- Bid Submissions & Documents Operations ----------------
def get_submissions(db: Session, tender_id: Optional[str] = None, company_id: Optional[str] = None) -> List[BidSubmissionModel]:
    query = db.query(BidSubmissionModel)
    if tender_id:
        query = query.filter(BidSubmissionModel.tender_id == tender_id)
    if company_id:
        query = query.filter(BidSubmissionModel.company_id == company_id)
    return query.order_by(BidSubmissionModel.created_at.desc()).all()


def get_submission_by_id(db: Session, submission_id: str) -> Optional[BidSubmissionModel]:
    return db.query(BidSubmissionModel).filter(BidSubmissionModel.id == submission_id).first()


def create_submission(db: Session, sub_in: BidSubmissionCreate) -> BidSubmissionModel:
    sub_id = sub_in.id or f"sub-{int(time.time() * 1000)}"
    docs_json = [d.dict() if hasattr(d, 'dict') else d for d in (sub_in.documents or [])]

    # Assign IDs to documents if not provided
    for idx, d in enumerate(docs_json):
        if not d.get("id"):
            d["id"] = f"{sub_id}-doc-{idx + 1}"

    new_sub = BidSubmissionModel(
        id=sub_id,
        tender_id=sub_in.tenderId,
        company_id=sub_in.companyId,
        submitted_at=sub_in.submittedAt,
        status=sub_in.status or "Under Review",
        compliance_score=sub_in.complianceScore or 85,
        ai_verification_stage=sub_in.aiVerificationStage or "Pending",
        flags=sub_in.flags or [],
        documents_json=docs_json
    )
    db.add(new_sub)

    # Also persist into normalized bid_documents table
    for d in docs_json:
        doc_obj = BidDocumentModel(
            id=d.get("id") or f"{sub_id}-doc-{int(time.time()*1000)}",
            submission_id=sub_id,
            name=d.get("name", "Document"),
            type=d.get("type", "PDF"),
            file_size=d.get("fileSize") or d.get("size") or "1.0 MB",
            verified=d.get("verified", False),
            file_content_url=d.get("fileContentUrl"),
            parsed_data=d.get("parsedData")
        )
        db.add(doc_obj)

    # Increment applied bidders count on the tender
    tender = get_tender_by_id(db, sub_in.tenderId)
    if tender:
        tender.applied_bidders_count = (tender.applied_bidders_count or 0) + 1

    db.commit()
    db.refresh(new_sub)
    return new_sub


def update_submission_verification(db: Session, submission_id: str, ver_in: VerificationUpdate) -> Optional[BidSubmissionModel]:
    sub = get_submission_by_id(db, submission_id)
    if not sub:
        return None

    if ver_in.status:
        sub.status = ver_in.status
    if ver_in.complianceScore is not None:
        sub.compliance_score = ver_in.complianceScore
    if ver_in.aiVerificationStage:
        sub.ai_verification_stage = ver_in.aiVerificationStage
    if ver_in.flags is not None:
        sub.flags = ver_in.flags

    # Also mark all documents as verified
    if sub.documents_json:
        updated_docs = []
        for d in sub.documents_json:
            d_copy = dict(d)
            d_copy["verified"] = True
            updated_docs.append(d_copy)
        sub.documents_json = updated_docs

    for doc in sub.documents:
        doc.verified = True

    db.commit()
    db.refresh(sub)
    return sub


def update_tender_anomaly(db: Session, tender_id: str, anomaly_result: dict) -> Optional[TenderModel]:
    """Saves anomaly assessment results to the tender record."""
    tender = get_tender_by_id(db, tender_id)
    if not tender:
        return None

    score_pct = int(anomaly_result.get("anomaly_score", 0) * 100)
    tender.anomaly_score = score_pct
    tender.predicted_anomaly = anomaly_result.get("predicted_anomaly", False)
    tender.risk_tier = anomaly_result.get("risk_tier", "LOW_RISK")
    tender.anomaly_flags = anomaly_result.get("rule_flags", [])
    if tender.anomaly_status not in ["OVERRIDDEN", "REJECTED"]:
        tender.anomaly_status = "FLAGGED" if tender.predicted_anomaly else "CLEARED"

    db.commit()
    db.refresh(tender)
    return tender


def record_admin_override(
    db: Session, 
    tender_id: str, 
    officer_id: str, 
    justification_notes: str, 
    action: str = "OVERRIDE_ALLOW"
) -> Optional[TenderModel]:
    """Records formal officer administrative override memo and audit log."""
    from datetime import datetime
    tender = get_tender_by_id(db, tender_id)
    if not tender:
        return None

    tender.admin_override_notes = justification_notes
    tender.admin_override_by = officer_id
    tender.admin_override_at = datetime.utcnow()

    if action == "OVERRIDE_ALLOW":
        tender.anomaly_status = "OVERRIDDEN"
    elif action == "DISQUALIFY_CARTEL":
        tender.anomaly_status = "REJECTED"
    elif action == "SHOW_CAUSE":
        tender.anomaly_status = "FLAGGED"

    db.commit()
    db.refresh(tender)
    return tender

