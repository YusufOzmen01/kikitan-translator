from faster_whisper import WhisperModel
import psutil
from fastapi import FastAPI
from pydantic import BaseModel
import base64
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import run
import multiprocessing

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Body(BaseModel):
    data: str
    lang: str

print("Loading model...")
model = WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=psutil.cpu_count())

@app.post("/")
async def root(body: Body):
    _, base64_data = body.data.split(',')
    decoded_bytes = base64.b64decode(base64_data)
    segments, info = model.transcribe(BytesIO(decoded_bytes), language=body.lang, without_timestamps=True)
    segments = " ".join([seg.text for seg in list(segments)])
    
    return {
        "text": segments
    }

if __name__ == '__main__':
    multiprocessing.freeze_support()
    run(app, host="0.0.0.0", port=8000, reload=False, workers=1)