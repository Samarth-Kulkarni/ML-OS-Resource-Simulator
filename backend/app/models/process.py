from pydantic import BaseModel, Field
from typing import List, Optional

class Process(BaseModel):
    pid: str = Field(..., description="Process Identifier (e.g., P1, P2)")
    arrival_time: int = Field(..., ge=0, description="Arrival time in the ready queue")
    burst_time: int = Field(..., gt=0, description="Total CPU execution time required")
    priority: Optional[int] = Field(default=0, ge=0, description="Process priority (Lower number = Higher priority)")
    
    # ML Features (Optional for fallback UI)
    process_type: Optional[str] = "batch"
    requested_memory_mb: Optional[int] = 1024
    static_priority: Optional[int] = 0
    historical_burst_avg: Optional[float] = 10.0
    past_burst_1: Optional[float] = 10.0
    past_burst_2: Optional[float] = 10.0
    past_burst_3: Optional[float] = 10.0

class CPUScheduleRequest(BaseModel):
    algorithm: str = Field(..., description="FCFS, SJF, SRTF, RR, PRIORITY, PREDICTED_SJF, ADAPTIVE_ROUTER")
    time_quantum: Optional[int] = Field(default=2, gt=0, description="Time quantum for Round Robin")
    error_threshold: Optional[float] = Field(default=5.0, description="Error threshold for Adaptive Router")
    processes: List[Process]

class GanttBlock(BaseModel):
    pid: str
    start_time: int
    end_time: int
    fallback_mode: Optional[bool] = False

class ProcessResult(BaseModel):
    pid: str
    arrival_time: int
    burst_time: int
    priority: int
    completion_time: int
    turnaround_time: int
    waiting_time: int
    response_time: int
    predicted_burst: Optional[float] = None

class FallbackLog(BaseModel):
    time: int
    pid: str
    reason: str
    action: str

class CPUScheduleResponse(BaseModel):
    gantt_chart: List[GanttBlock]
    process_results: List[ProcessResult]
    average_waiting_time: float
    average_turnaround_time: float
    average_response_time: float
    fallback_logs: Optional[List[FallbackLog]] = []
    ml_metrics: Optional[dict] = None

class AlgorithmMetricSummary(BaseModel):
    algorithm_id: str
    algorithm_name: str
    category: str  # "baseline", "ml_augmented", "oracle"
    avg_waiting_time: float
    avg_turnaround_time: float
    avg_response_time: float
    cpu_utilization: float
    total_execution_time: int
    fallback_triggers: int
    gantt_preview: Optional[List[GanttBlock]] = []

class CPUComparisonResponse(BaseModel):
    algorithms: List[AlgorithmMetricSummary]
    total_processes: int
    improvement_over_fcfs_wt_pct: float
    improvement_over_fcfs_tat_pct: float
    improvement_over_rr_wt_pct: float
    oracle_gap_pct: float
    best_algorithm: str
    verdict: str

class MLValidationMetrics(BaseModel):
    model_name: str
    model_architecture: str
    dataset_samples: int
    mean_absolute_error: float
    root_mean_squared_error: float
    r2_score: float
    inference_latency_us: float
    numeric_features: List[str]
    categorical_features: List[str]