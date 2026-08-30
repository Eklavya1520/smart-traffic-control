"""
config.py
---------
Configuration parameters for the computer vision and signal optimization engine.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")

# Model configuration
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8s.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))
IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", "0.50"))

# Target vehicle class IDs in COCO dataset:
# 2: car, 3: motorcycle, 5: bus, 7: truck
TARGET_CLASSES = [2, 3, 5, 7]
CLASS_WEIGHTS = {
    2: 1.0,   # Car: 1.0 Passenger Car Unit (PCU)
    3: 0.5,   # Motorcycle: 0.5 PCU
    5: 2.5,   # Bus: 2.5 PCU
    7: 2.0    # Truck: 2.0 PCU
}

# API Ingestion
API_URL = os.getenv("API_URL", "http://localhost:4000/api/traffic/reading")
INTERSECTION_ID = os.getenv("INTERSECTION_ID", "INT_001")
REPORT_INTERVAL_SECONDS = int(os.getenv("REPORT_INTERVAL_SECONDS", "5"))

# Signal constraints (Webster bounds)
MIN_GREEN_TIME = 15  # seconds
MAX_GREEN_TIME = 60  # seconds
YELLOW_TIME = 4      # seconds
ALL_RED_TIME = 2     # seconds
SATURATION_FLOW_RATE = 1800  # vehicles per hour of green per lane
