"""
Process modeling for the OS Resource Management Simulator.

Includes strict separation of pre-submit metadata (for leakage-safe ML inference)
from execution-time kernel runtime state.
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, Dict, Any


class ProcessState(Enum):
    """Lifecycle states of an operating system process."""
    NEW = auto()
    READY = auto()
    RUNNING = auto()
    WAITING = auto()
    TERMINATED = auto()


@dataclass(frozen=True)
class PreSubmitFeatures:
    """
    Leakage-Safe Feature Container.
    
    Attributes strictly available at or prior to scheduling decision time.
    Guarantees that downstream machine learning predictors cannot consume
    future execution telemetry (following arXiv 2025 guidelines).
    """
    process_type: str = "batch"             # e.g., 'batch', 'interactive', 'io_bound'
    user_id: int = 1000                     # Security/UID group
    requested_memory_mb: int = 256          # Declared memory allocation
    static_priority: int = 0                # Base nice level / static priority
    historical_burst_avg: float = 0.0       # Exponential/historical mean of ancestor bursts
    past_burst_1: int = 0                   # Burst length in the previous run (t-1)
    past_burst_2: int = 0                   # Burst length 2 runs ago (t-2)
    past_burst_3: int = 0                   # Burst length 3 runs ago (t-3)
    estimated_burst: float = 0.0            # User-supplied hint or ML model inference


@dataclass
class Process:
    """
    Operating System Process Control Block (PCB) representation.
    """
    pid: int
    arrival_time: int
    burst_time: int                         # Ground truth execution length (hidden from ML predictor)
    priority: int = 0                       # Dynamic or dispatch priority
    features: PreSubmitFeatures = field(default_factory=PreSubmitFeatures)
    
    # Dynamic runtime tracking
    remaining_time: int = 0
    state: ProcessState = ProcessState.NEW
    
    # Timing and evaluation metrics
    start_time: Optional[int] = None        # Timestamp of first CPU dispatch
    completion_time: Optional[int] = None   # Timestamp of termination
    turnaround_time: Optional[int] = None   # completion_time - arrival_time
    waiting_time: Optional[int] = None      # turnaround_time - burst_time
    response_time: Optional[int] = None     # start_time - arrival_time
    
    def __post_init__(self):
        if self.remaining_time == 0:
            self.remaining_time = self.burst_time

    def mark_started(self, current_time: int) -> None:
        """Record the initial dispatch timestamp."""
        if self.start_time is None:
            self.start_time = current_time
            self.response_time = current_time - self.arrival_time
        self.state = ProcessState.RUNNING

    def mark_completed(self, current_time: int) -> None:
        """Finalize process metrics upon completion."""
        self.completion_time = current_time
        self.state = ProcessState.TERMINATED
        self.remaining_time = 0
        self.turnaround_time = self.completion_time - self.arrival_time
        self.waiting_time = self.turnaround_time - self.burst_time

    def clone(self) -> "Process":
        """Produce a pristine, unexecuted copy for comparative benchmarks."""
        return Process(
            pid=self.pid,
            arrival_time=self.arrival_time,
            burst_time=self.burst_time,
            priority=self.priority,
            features=self.features,
            remaining_time=self.burst_time,
            state=ProcessState.NEW
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serialize process metrics for reporting."""
        return {
            "pid": self.pid,
            "arrival_time": self.arrival_time,
            "burst_time": self.burst_time,
            "priority": self.priority,
            "start_time": self.start_time,
            "completion_time": self.completion_time,
            "turnaround_time": self.turnaround_time,
            "waiting_time": self.waiting_time,
            "response_time": self.response_time,
            "process_type": self.features.process_type,
            "requested_memory_mb": self.features.requested_memory_mb
        }
