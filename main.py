import cv2
import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import threading
import time
import requests
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model (lightweight nano version)
model = YOLO('yolov8n.pt')

@app.get("/detect")
async def detect(url: str = Query(...), threshold: float = 0.5):
    """
    Takes a video stream URL, grabs the latest frame, 
    runs YOLOv8 detection, and returns JSON results.
    """
    # If it's an RTSP URL, we might need special handling or just trust OpenCV
    cap = cv2.VideoCapture(url)
    if not cap.isOpened():
        return {"error": "Could not open video stream"}
    
    success, frame = cap.read()
    cap.release()
    
    if not success:
        return {"error": "Could not read frame from stream"}
    
    # Run inference
    results = model(frame, conf=threshold, verbose=False)[0]
    
    detections = []
    for box in results.boxes:
        # We only care about persons (class 0 in COCO)
        if int(box.cls[0]) == 0:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            score = float(box.conf[0])
            detections.append({
                "bbox": [x1, y1, x2 - x1, y2 - y1],
                "score": score,
                "class": "person"
            })
            
    return {
        "detections": detections,
        "width": frame.shape[1],
        "height": frame.shape[0]
    }

@app.get("/mjpeg-proxy")
async def mjpeg_proxy(url: str = Query(...)):
    def generate():
        r = requests.get(url, stream=True)
        for chunk in r.iter_content(chunk_size=1024):
            yield chunk
    
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/rtsp-proxy")
async def rtsp_proxy(url: str = Query(...)):
    # Simple RTSP to MJPEG using FFmpeg subprocess
    ffmpeg_cmd = [
        'ffmpeg',
        '-rtsp_transport', 'tcp',
        '-i', url,
        '-f', 'mpjpeg',
        '-q:v', '3',
        '-'
    ]
    process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    def generate():
        try:
            while True:
                chunk = process.stdout.read(1024)
                if not chunk:
                    break
                yield chunk
        finally:
            process.terminate()

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

