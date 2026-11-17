from fastapi import APIRouter, HTTPException
from typing import List
from app.models.process import (
    CPUScheduleRequest, CPUScheduleResponse, Process,
    CPUComparisonResponse, MLValidationMetrics, MultiModelBenchmarkResponse
)
from app.models.multicore import (
    MultiCoreScheduleRequest, MultiCoreScheduleResponse
)
from app.algorithms.cpu_scheduling import run_cpu_scheduling, compare_cpu_algorithms, get_ml_validation_metrics
from app.algorithms.multicore_scheduling import run_multicore_scheduling
from app.ml.models import get_multi_model_benchmark
from app.utils.ml_recommender import predict_best_algorithm

router = APIRouter(prefix="/api/cpu", tags=["CPU Scheduling"])

@router.post("/multicore/simulate", response_model=MultiCoreScheduleResponse)
def simulate_multicore(req: MultiCoreScheduleRequest):
    try:
        return run_multicore_scheduling(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate", response_model=CPUScheduleResponse)
def simulate_cpu(req: CPUScheduleRequest):
    try:
        return run_cpu_scheduling(
            algorithm=req.algorithm,
            processes=req.processes,
            time_quantum=req.time_quantum or 2,
            error_threshold=req.error_threshold or 5.0,
            model_type=req.model_type or "decision_tree"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/compare", response_model=CPUComparisonResponse)
def compare_cpu(req: CPUScheduleRequest):
    try:
        return compare_cpu_algorithms(
            processes=req.processes,
            time_quantum=req.time_quantum or 2,
            error_threshold=req.error_threshold or 5.0,
            model_type=req.model_type or "decision_tree"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/ml-metrics", response_model=MLValidationMetrics)
def fetch_ml_metrics(model_type: str = "decision_tree"):
    try:
        return get_ml_validation_metrics(model_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models-benchmark", response_model=MultiModelBenchmarkResponse)
def fetch_multi_model_benchmark():
    try:
        return get_multi_model_benchmark()
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