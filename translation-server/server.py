from dotenv import load_dotenv
from fastapi import FastAPI, Response
from azure import Azure
from chatgpt import ChatGPT

import os

load_dotenv()

app = FastAPI()
azure = Azure(os.getenv("AZURE_REGION"), os.getenv("AZURE_API_KEY"))
chatgpt = ChatGPT(os.getenv("OPENAI_API_KEY"))

@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@app.get("/translate/{engine}")
def read_root(engine: str, text: str, src: str, target: str, response: Response):
    match engine:
        case "azure":
            res = azure.translate(text, src, target)
            if res == None:
                Response.status_code = 500
                
                return "Failed to translate."
            
            return {
                "text": res
            }
        case "chatgpt":
            try:
                return chatgpt.translate(text, src, target)["content"]
            except Exception as e:
                print(e)
                Response.status_code = 500
                
                return "Failed to translate."