from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from app.models.process import Process, ProcessResult

class CoreGanttBlock(BaseModel):
    core_id: int = Field(..., description="0-indexed CPU core identifier")
    pid: str = Field(..., description="Process Identifier (e.g., P1, IDLE)")
    start_time: int
    end_time: int
    is_stolen: Optional[bool] = Field(default=False, description="Flagged true if job was acquired via work-stealing")

class CoreTelemetry(BaseModel):
    core_id: int
    total_execution_ticks: int
    idle_ticks: int
    utilization_pct: float
    processes_serviced: int

class MultiCoreScheduleRequest(BaseModel):
    processes: List[Process]
    core_count: int = Field(default=2, ge=1, le=8, description="Number of parallel SMP CPU cores (e.g. 2, 4)")
    algorithm: str = Field(default="WORK_STEALING", description="WORK_STEALING, PARTITIONED, GLOBAL_RR")
    time_quantum: Optional[int] = Field(default=2, gt=0)

class MultiCoreScheduleResponse(BaseModel):
    core_count: int
    algorithm: str
    makespan: int = Field(..., description="Total wall-clock execution time across all cores")
    core_gantts: Dict[str, List[CoreGanttBlock]] = Field(..., description="Keyed by core_0, core_1, etc.")
    flat_gantt: List[CoreGanttBlock] = Field(..., description="Flat timeline blocks for rendering")
    process_results: List[ProcessResult]
    core_telemetry: List[CoreTelemetry]
    average_waiting_time: float
    average_turnaround_time: float
    single_core_makespan: int
    speedup: float = Field(..., description="Parallel speedup S = T_1 / T_N")
    parallel_efficiency_pct: float = Field(..., description="Efficiency E = (S / N) * 100")
    work_stealing_events: int
    load_balance_factor: float
    verdict: str
