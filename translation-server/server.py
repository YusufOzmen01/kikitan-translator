from dotenv import load_dotenv
from fastapi import FastAPI
from azure import Azure

import os

load_dotenv()

app = FastAPI()
azure = Azure(os.getenv("REGION"), os.getenv("API_KEY"))

@app.get("/translate/{engine}")
def read_root(engine: str, text: str, src: str, target: str):
    match engine:
        case "azure":
            return {
                "text": azure.translate(text, src, target)
            }