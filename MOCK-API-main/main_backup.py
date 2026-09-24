from fastapi import FastAPI
import json
import os

app = FastAPI(
    title="Mock Government Verification API",
    description="Prototype mock services for GeM bid compliance verification",
    version="1.0.0"
)


DATA_DIR = "data"


def load_data(filename):
    path = os.path.join(DATA_DIR, filename)

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


@app.get("/")
def home():
    return {
        "message": "Mock Government Verification API is running",
        "status": "OK"
    }


@app.get("/gst/{gstin}")
def verify_gst(gstin: str):

    data = load_data("gst.json")

    for record in data:
        if record["gstin"] == gstin:
            return record

    return {
        "status": "NOT_FOUND",
        "message": "GST registration not found"
    }


@app.get("/udyam/{udyam_number}")
def verify_udyam(udyam_number: str):

    data = load_data("udyam.json")

    for record in data:
        if record["udyam_number"] == udyam_number:
            return record

    return {
        "status": "NOT_FOUND",
        "message": "Udyam registration not found"
    }


@app.get("/pan/{pan}")
def verify_pan(pan: str):

    data = load_data("pan.json")

    for record in data:
        if record["pan"] == pan:
            return record

    return {
        "status": "NOT_FOUND",
        "message": "PAN record not found"
    }


@app.get("/mca/{cin}")
def verify_mca(cin: str):

    data = load_data("mca.json")

    for record in data:
        if record["cin"] == cin:
            return record

    return {
        "status": "NOT_FOUND",
        "message": "Company record not found"
    }


@app.get("/debarment/{pan}")
def check_debarment(pan: str):

    data = load_data("debarment.json")

    for record in data:
        if record["pan"] == pan:
            return record

    return {
        "status": "NOT_FOUND",
        "message": "Debarment record not found"
    }