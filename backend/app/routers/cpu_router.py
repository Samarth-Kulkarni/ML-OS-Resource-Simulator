from fastapi import APIRouter, HTTPException
from typing import List
from app.models.process import (
    CPUScheduleRequest, CPUScheduleResponse, Process,
    CPUComparisonResponse, MLValidationMetrics
)
from app.algorithms.cpu_scheduling import run_cpu_scheduling, compare_cpu_algorithms, get_ml_validation_metrics
from app.utils.ml_recommender import predict_best_algorithm

router = APIRouter(prefix="/api/cpu", tags=["CPU Scheduling"])

@router.post("/simulate", response_model=CPUScheduleResponse)
def simulate_cpu(req: CPUScheduleRequest):
    try:
        return run_cpu_scheduling(
            algorithm=req.algorithm,
            processes=req.processes,
            time_quantum=req.time_quantum or 2,
            error_threshold=req.error_threshold or 5.0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/compare", response_model=CPUComparisonResponse)
def compare_cpu(req: CPUScheduleRequest):
    try:
        return compare_cpu_algorithms(
            processes=req.processes,
            time_quantum=req.time_quantum or 2,
            error_threshold=req.error_threshold or 5.0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/ml-metrics", response_model=MLValidationMetrics)
def fetch_ml_metrics():
    try:
        return get_ml_validation_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend")
def recommend_algorithm(processes: List[Process]):
    try:
        recommended_algo, reason = predict_best_algorithm(processes)
        return {
            "recommended_algorithm": recommended_algo,
            "reasoning": reason
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))