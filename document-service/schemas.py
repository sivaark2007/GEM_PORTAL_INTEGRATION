"""
Pydantic schemas for data validation in GeM Portal API.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


# ---------------- Bidder / Company Schemas ----------------
class CompanyBase(BaseModel):
    name: str
    email: Optional[str] = ""
    contactNumber: Optional[str] = ""
    gstin: Optional[str] = ""
    pan: Optional[str] = ""
    udyamNumber: Optional[str] = ""
    cin: Optional[str] = ""
    city: Optional[str] = ""
    sector: Optional[str] = ""
    color: Optional[str] = "#0284c7"
    registeredDate: Optional[str] = "Today"
    isCustom: Optional[bool] = False


class CompanyCreate(CompanyBase):
    id: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: str

    class Config:
        from_attributes = True


# ---------------- Tender Schemas ----------------
class TenderRequirement(BaseModel):
    id: str
    title: str
    category: str  # financial | technical | compliance | statutory
    description: str
    mandatory: bool = True


class GemBiddingDocument(BaseModel):
    name: str
    fileSize: str
    fileContentUrl: Optional[str] = None
    uploadedAt: str
    parsedData: Optional[Dict[str, Any]] = None
    parsingStatus: Optional[str] = "complete"
    parseError: Optional[str] = None


class TenderDocumentPayload(BaseModel):
    tenderId: str
    document: GemBiddingDocument


class TenderCreate(BaseModel):
    id: Optional[str] = None
    tenderNumber: str
    title: str
    organization: Optional[str] = "Government Organization"
    ministry: Optional[str] = "Central Ministry"
    estimatedValue: Optional[str] = "₹ 1,00,00,000"
    category: Optional[str] = "General"
    closingDate: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    items: Optional[str] = None
    quantity: Optional[int] = 1
    status: Optional[str] = "Active"
    requirements: Optional[List[TenderRequirement]] = []
    gemBiddingDocument: Optional[GemBiddingDocument] = None


class TenderResponse(BaseModel):
    id: str
    tenderNumber: str
    title: str
    organization: Optional[str] = ""
    ministry: Optional[str] = ""
    estimatedValue: Optional[str] = ""
    category: Optional[str] = ""
    closingDate: Optional[str] = ""
    startDate: Optional[str] = ""
    endDate: Optional[str] = ""
    items: Optional[str] = ""
    quantity: Optional[int] = 1
    status: Optional[str] = "Active"
    appliedBiddersCount: Optional[int] = 0
    requirements: Optional[List[TenderRequirement]] = []
    gemBiddingDocument: Optional[Dict[str, Any]] = None
    anomalyScore: Optional[int] = 0
    predictedAnomaly: Optional[bool] = False
    riskTier: Optional[str] = "LOW_RISK"
    anomalyFlags: Optional[List[Any]] = []
    anomalyStatus: Optional[str] = "CLEARED"
    adminOverrideNotes: Optional[str] = None
    adminOverrideBy: Optional[str] = None
    adminOverrideAt: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------- Bid Submission & Certificate Schemas ----------------
class BidDocumentCreate(BaseModel):
    id: Optional[str] = None
    name: str
    type: Optional[str] = "PDF"
    fileSize: Optional[str] = "1.0 MB"
    verified: Optional[bool] = False
    fileContentUrl: Optional[str] = None
    parsedData: Optional[Dict[str, Any]] = None


class BidSubmissionCreate(BaseModel):
    id: Optional[str] = None
    tenderId: str
    companyId: str
    submittedAt: Optional[str] = None
    commercialQuote: Optional[str] = None
    status: Optional[str] = "Under Review"
    complianceScore: Optional[int] = 85
    aiVerificationStage: Optional[str] = "Pending"
    documents: Optional[List[BidDocumentCreate]] = []
    flags: Optional[List[str]] = []


class BidSubmissionResponse(BaseModel):
    id: str
    tenderId: str
    companyId: str
    submittedAt: Optional[str] = ""
    commercialQuote: Optional[str] = None
    status: Optional[str] = "Under Review"
    complianceScore: Optional[int] = 85
    aiVerificationStage: Optional[str] = "Pending"
    documents: Optional[List[Dict[str, Any]]] = []
    flags: Optional[List[str]] = []

    class Config:
        from_attributes = True


class VerificationUpdate(BaseModel):
    status: Optional[str] = "Verified"
    complianceScore: Optional[int] = 92
    aiVerificationStage: Optional[str] = "Completed"
    flags: Optional[List[str]] = []


# ---------------- Anomaly & Admin Governance Schemas ----------------
class AnomalyOverrideRequest(BaseModel):
    tenderId: str
    officerEmployeeId: str
    justificationNotes: str
    action: Optional[str] = "OVERRIDE_ALLOW"  # 'OVERRIDE_ALLOW' | 'DISQUALIFY_CARTEL' | 'SHOW_CAUSE'


class AnomalyAssessmentResponse(BaseModel):
    tenderId: str
    tenderTitle: Optional[str] = None
    estimatedValue: Optional[Any] = None
    bidCount: int = 0
    anomalyScore: float = 0.0
    mlRawScore: float = 0.0
    predictedAnomaly: bool = False
    riskTier: str = "LOW_RISK"
    recommendation: str = ""
    ruleFlags: List[Dict[str, Any]] = []
    linkedBidderPairs: List[Dict[str, Any]] = []
    features: Dict[str, Any] = {}
    evaluatedAt: str = ""

