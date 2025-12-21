from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import json
import os
# Add parent dir to path to import local modules
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from route_optimizer import get_optimized_routes
from data_generator import generate_data

app = FastAPI(title="Project Antigravity API")

# CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizeRequest(BaseModel):
    date: str
    truck_count: int

# Define Base Dir (Root of project)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "current_bin_status.json")

@app.get("/")
def read_root():
    return {"status": "System Online", "project": "Antigravity"}

import advanced_ai

@app.get("/bins")
def get_bins():
    """Returns current status of all bins with AI Predictions"""
    if not os.path.exists(DATA_FILE):
        print("Generating data...")
        generate_data(days=1) 
        
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            
        # Enrich data with AI Predictions
        for b in data:
            # Predict Logic
            prob, time_crit = advanced_ai.predict_overflow_risk(b)
            p_score = advanced_ai.calculate_priority_score(b)
            
            b['overflow_prob'] = prob
            b['time_to_critical'] = time_crit
            b['priority_score'] = round(p_score, 1)
            
        return data
    else:
        return {"error": "Data generation failed"}

@app.post("/optimize")
def optimize_routes(req: OptimizeRequest):
    """Calculates optimal routes"""
    # 1. Get Data
    if not os.path.exists(DATA_FILE):
        generate_data()
        
    with open(DATA_FILE, "r") as f:
        data = json.load(f)
        
    # 2. Run Optimization
    # Depot: UniMall (31.255717, 75.705534)
    routes = get_optimized_routes(data, n_trucks=req.truck_count)
    
    return {
        "date": req.date,
        "truck_count": req.truck_count,
        "routes": routes
    }
