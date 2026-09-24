from fastapi import FastAPI
import json
from pathlib import Path


app = FastAPI(
    title="Mock Government Verification API",
    description="Prototype mock services for GeM bid compliance verification",
    version="1.0.0"
)


DATA_DIR = Path(__file__).resolve().parent / "data"


def load_data(filename):
    """
    Load JSON data from the data folder.
    """
    path = DATA_DIR / filename

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def find_record(filename, field, value):
    """
    Search a JSON file for a record matching the given field and value.
    """
    data = load_data(filename)

    for record in data:
        if record.get(field) == value:
            return record

    return None




@app.get("/")
def home():
    return {
        "message": "GeM Statutory Verification API is running",
        "status": "OK",
        "version": "1.0.0",
        "documentation": "/docs",
        "note": "Prototype uses synthetic/mock data."
    }





@app.get("/gst/{gstin}")
def verify_gst(gstin: str):
    record = find_record("gst.json", "gstin", gstin)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "GST registration not found"
    }



@app.get("/udyam/{udyam_number}")
def verify_udyam(udyam_number: str):
    record = find_record("udyam.json", "udyam_number", udyam_number)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "Udyam registration not found"
    }



@app.get("/pan/{pan}")
def verify_pan(pan: str):
    record = find_record("pan.json", "pan", pan)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "PAN record not found"
    }



@app.get("/mca/{cin}")
def verify_mca(cin: str):
    record = find_record("mca.json", "cin", cin)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "Company record not found"
    }


@app.get("/debarment/{pan}")
def check_debarment(pan: str):
    record = find_record("debarment.json", "pan", pan)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "Debarment record not found"
    }





@app.get("/gst-returns/{gstin}")
def verify_gst_returns(gstin: str):
    record = find_record("gst_returns.json", "gstin", gstin)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "GST return filing record not found"
    }



@app.get("/income-tax/{pan}")
def verify_income_tax(pan: str):
    record = find_record("income_tax.json", "pan", pan)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "Income Tax compliance record not found"
    }



@app.get("/epfo/{establishment_id}")
def verify_epfo(establishment_id: str):
    record = find_record("epfo.json", "establishment_id", establishment_id)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "EPFO compliance record not found"
    }



@app.get("/esic/{esic_number}")
def verify_esic(esic_number: str):
    record = find_record("esic.json", "esic_number", esic_number)

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "ESIC compliance record not found"
    }



@app.get("/startup-india/{recognition_number}")
def verify_startup_india(recognition_number: str):
    record = find_record(
        "startup_india.json",
        "recognition_number",
        recognition_number
    )

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "Startup India recognition record not found"
    }



@app.get("/nsic/{certificate_number}")
def verify_nsic(certificate_number: str):
    record = find_record(
        "nsic.json",
        "certificate_number",
        certificate_number
    )

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "NSIC certificate record not found"
    }



@app.get("/oem/{authorization_number}")
def verify_oem(authorization_number: str):
    record = find_record(
        "oem.json",
        "authorization_number",
        authorization_number
    )

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "OEM authorization record not found"
    }



@app.get("/make-in-india/{enterprise_name}")
def verify_make_in_india(enterprise_name: str):
    data = load_data("make_in_india.json")

    for record in data:
        if record.get("enterprise_name", "").lower() == enterprise_name.lower():
            return record

    return {
        "status": "NOT_FOUND",
        "message": "Make in India record not found"
    }



@app.get("/digilocker/{document_id}")
def verify_digilocker(document_id: str):
    record = find_record(
        "digilocker.json",
        "document_id",
        document_id
    )

    if record:
        return record

    return {
        "status": "NOT_FOUND",
        "message": "DigiLocker document not found"
    }




@app.get("/companies")
def list_companies():
    data = load_data("udyam.json")

    companies = []

    for record in data:
        name = record.get("enterprise_name") or record.get("company_name")

        if name:
            companies.append(name)

    return {
        "count": len(companies),
        "companies": companies
    }