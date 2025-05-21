from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from ultralytics import YOLO
import shutil
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import io
import base64


app = FastAPI(title="Coffee Bean Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
MODEL_DIR = Path("models")
DATASET_DIR = Path("datasets")
UPLOAD_DIR = Path("uploads")

# Model paths
GREEN_BEAN_MODEL_DIR = MODEL_DIR / "coffee-bean-defect"
ROASTED_COFFEE_MODEL_DIR = MODEL_DIR / "roasted-coffee-analysis2"

# Dataset paths
GREEN_BEAN_DATASET_DIR = DATASET_DIR / "coffee-bean-defect"
ROASTED_COFFEE_DATASET_DIR = DATASET_DIR / "roasted-coffee"

# Create directories
for dir_path in [MODEL_DIR, DATASET_DIR, UPLOAD_DIR, 
                GREEN_BEAN_MODEL_DIR, ROASTED_COFFEE_MODEL_DIR,
                GREEN_BEAN_DATASET_DIR, ROASTED_COFFEE_DATASET_DIR]:
    dir_path.mkdir(exist_ok=True)

class TrainingConfig(BaseModel):
    model_type: str  # "green-bean" or "roasted-coffee"
    epochs: int = 50
    batch_size: int = 16
    img_size: int = 640
    learning_rate: float = 0.001

class PredictionResult(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]


# Define roast colors
ROAST_COLORS = {
    "light": (0, 255, 255),    # Yellow
    "medium": (0, 165, 255),   # Orange
    "dark": (42, 42, 165)      # Brown (BGR)
}

@app.post("/train")
async def train_model(config: TrainingConfig):
    try:
        if config.model_type == "green-bean":
            dataset_path = GREEN_BEAN_DATASET_DIR / "data.yaml"
            model_name = "coffee-bean-defect"
        elif config.model_type == "roasted-coffee":
            dataset_path = ROASTED_COFFEE_DATASET_DIR / "data.yaml"
            model_name = "roasted-coffee-analysis"
        else:
            raise HTTPException(status_code=400, detail="Invalid model type")

        # Check if dataset exists
        if not dataset_path.exists():
            raise HTTPException(status_code=400, detail=f"Dataset not found for {config.model_type}. Please upload the dataset first.")

        # Initialize YOLO model
        model = YOLO("yolov8n.pt")  # Using YOLOv8 nano as base model

        # Train the model
        results = model.train(
            data=str(dataset_path),
            epochs=config.epochs,
            batch=config.batch_size,
            imgsz=config.img_size,
            lr0=config.learning_rate,
            project=str(MODEL_DIR),
            name=model_name
        )

        return {"message": f"Training completed successfully for {config.model_type}", "results": results.results_dict}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...), dataset_type: str = Form(...)):
    try:
        if dataset_type == "green-bean":
            target_dir = GREEN_BEAN_DATASET_DIR
        elif dataset_type == "roasted-coffee":
            target_dir = ROASTED_COFFEE_DATASET_DIR
        else:
            raise HTTPException(status_code=400, detail="Invalid dataset type")

        # Save the uploaded zip file
        zip_path = target_dir / file.filename
        with zip_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract the dataset
        shutil.unpack_archive(str(zip_path), str(target_dir))
        
        # Remove the zip file
        zip_path.unlink()

        return {"message": f"Dataset uploaded and extracted successfully to {dataset_type} directory"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-green-beans")
async def analyze_green_beans(file: UploadFile = File(...)):
    try:
        # Load the green bean model
        model_path = GREEN_BEAN_MODEL_DIR / "weights" / "best.pt"
        if not model_path.exists():
            raise HTTPException(status_code=400, detail="Green bean model not found. Please train the model first.")

        model = YOLO(str(model_path))

        # Define class names (match your data.yaml)
        class_names = ['black', 'broken', 'foreign', 'fraghusk', 'green', 'husk', 'immature', 'infested', 'sour']

        # Process the image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Run inference
        results = model(img)
        result = results[0]
        boxes = result.boxes
        
        total_beans = len(boxes)
        # defective_beans = total_beans  # All detections are defects
        # quality_score = 100 if total_beans == 0 else 0  # No detections = good quality
        good_beans = sum(1 for box in boxes if class_names[int(box.cls[0])] == 'good')
        defective_beans = total_beans - good_beans
        quality_score = (good_beans / total_beans) * 100 if total_beans > 0 else 0

        # Prepare detection results
        detections = []
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = class_names[class_id] if class_id < len(class_names) else "Unknown"

            detections.append({
                "bbox": [x1, y1, x2, y2],
                "confidence": confidence,
                "class": class_name
            })
        
        return {
            "quality_score": quality_score,
            "total_beans": total_beans,
            "defective_beans": defective_beans,
            "detections": detections
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error processing image: {str(e)}"}
        )

@app.post("/analyze-roasted-coffee")
async def analyze_roasted_coffee(file: UploadFile = File(...)):
    try:
        # Load the roasted coffee model
        model_path = ROASTED_COFFEE_MODEL_DIR / "weights" / "best.pt"
        if not model_path.exists():
            raise HTTPException(status_code=400, detail="Roasted coffee model not found. Please train the model first.")

        model = YOLO(str(model_path))

        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Run inference
        results = model(img)
        result = results[0]
        boxes = result.boxes
        
        detections = []
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = result.names[class_id].lower()  # e.g., "medium"

            # Compute center of bean
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            radius = max((x2 - x1) // 2, 5)

            # Get color
            color = ROAST_COLORS.get(class_name, (255, 255, 255))  # White fallback

            # Draw circle and label
            cv2.circle(img, (cx, cy), radius, color, 2)
            cv2.putText(img, class_name.capitalize(), (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            detections.append({
                "bbox": [x1, y1, x2, y2],
                "confidence": confidence,
                "class": class_name
            })

        # Encode image back to base64
        _, buffer = cv2.imencode('.jpg', img)
        encoded_image = base64.b64encode(buffer).decode('utf-8')

        return {
            "roastAnalysis": {
                "summary": "Roast level detections with visual overlay.",
                "detectedBeans": len(detections)
            },
            "detections": detections,
            "annotatedImage": f"data:image/jpeg;base64,{encoded_image}"
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error processing image: {str(e)}"}
        )
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 