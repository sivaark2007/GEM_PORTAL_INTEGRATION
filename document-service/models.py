"""
SQLAlchemy ORM Models for GeM Portal Integration.
Defines schemas for Tenders, Bidders/Companies, Bid Submissions, and Bid Certificates/Documents.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base


class CompanyModel(Base):
    """Stores bidder / company profile information."""
    __tablename__ = "bidders"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    contact_number = Column(String(50), nullable=True)
    gstin = Column(String(50), nullable=True, index=True)
    pan = Column(String(50), nullable=True)
    udyam_number = Column(String(100), nullable=True)
    cin = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    sector = Column(String(150), nullable=True)
    color = Column(String(50), nullable=True, default="#0284c7")
    registered_date = Column(String(100), nullable=True)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    submissions = relationship("BidSubmissionModel", back_populates="company", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "contactNumber": self.contact_number,
            "gstin": self.gstin,
            "pan": self.pan,
            "udyamNumber": self.udyam_number,
            "cin": self.cin,
            "city": self.city,
            "sector": self.sector,
            "color": self.color,
            "registeredDate": self.registered_date,
            "isCustom": self.is_custom,
        }


class TenderModel(Base):
    """Stores Government Tenders published on GeM."""
    __tablename__ = "tenders"

    id = Column(String(100), primary_key=True, index=True)  # Usually matches tenderNumber
    tender_number = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    organization = Column(String(255), nullable=True)
    ministry = Column(String(255), nullable=True)
    estimated_value = Column(String(100), nullable=True)
    category = Column(String(150), nullable=True)
    closing_date = Column(String(100), nullable=True)
    start_date = Column(String(100), nullable=True)
    end_date = Column(String(100), nullable=True)
    items = Column(Text, nullable=True)
    quantity = Column(Integer, default=1)
    status = Column(String(50), default="Active")  # 'Active' | 'Evaluation' | 'Closed'
    applied_bidders_count = Column(Integer, default=0)
    requirements = Column(JSON, nullable=True, default=list)
    gem_bidding_document = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    submissions = relationship("BidSubmissionModel", back_populates="tender", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "tenderNumber": self.tender_number,
            "title": self.title,
            "organization": self.organization,
            "ministry": self.ministry,
            "estimatedValue": self.estimated_value,
            "category": self.category,
            "closingDate": self.closing_date,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "items": self.items,
            "quantity": self.quantity,
            "status": self.status,
            "appliedBiddersCount": self.applied_bidders_count,
            "requirements": self.requirements or [],
            "gemBiddingDocument": self.gem_bidding_document,
        }


class BidSubmissionModel(Base):
    """Stores Bids submitted by Bidders against Tenders, with certificates & status."""
    __tablename__ = "bid_submissions"

    id = Column(String(100), primary_key=True, index=True)
    tender_id = Column(String(100), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(100), ForeignKey("bidders.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_at = Column(String(100), nullable=True)
    status = Column(String(50), default="Under Review")  # 'Submitted' | 'Verified' | 'Under Review' | 'Disqualified'
    compliance_score = Column(Integer, default=85)
    ai_verification_stage = Column(String(50), default="Pending")  # 'Pending' | 'OCR' | 'Govt_API' | 'Embeddings' | 'LLM_Analysis' | 'Completed'
    flags = Column(JSON, nullable=True, default=list)
    documents_json = Column(JSON, nullable=True, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tender = relationship("TenderModel", back_populates="submissions")
    company = relationship("CompanyModel", back_populates="submissions")
    documents = relationship("BidDocumentModel", back_populates="submission", cascade="all, delete-orphan")

    def to_dict(self):
        # Prefer documents from normalized table if present, else documents_json
        docs = []
        if self.documents:
            docs = [d.to_dict() for d in self.documents]
        elif self.documents_json:
            docs = self.documents_json

        return {
            "id": self.id,
            "tenderId": self.tender_id,
            "companyId": self.company_id,
            "submittedAt": self.submitted_at,
            "status": self.status,
            "complianceScore": self.compliance_score,
            "aiVerificationStage": self.ai_verification_stage,
            "flags": self.flags or [],
            "documents": docs,
        }


class BidDocumentModel(Base):
    """Stores individual uploaded certificates, sheets, and documents with parsed OCR/Docling data."""
    __tablename__ = "bid_documents"

    id = Column(String(100), primary_key=True, index=True)
    submission_id = Column(String(100), ForeignKey("bid_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=True, default="PDF")
    file_size = Column(String(50), nullable=True)
    verified = Column(Boolean, default=False)
    file_content_url = Column(Text, nullable=True)
    parsed_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    submission = relationship("BidSubmissionModel", back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "fileSize": self.file_size,
            "verified": self.verified,
            "fileContentUrl": self.file_content_url,
            "parsedData": self.parsed_data,
        }
