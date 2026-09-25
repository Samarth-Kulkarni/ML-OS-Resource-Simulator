"""
Workload generation and standard benchmark suites.
"""

from typing import List
from simulator.core.process import Process, PreSubmitFeatures


def get_standard_benchmark_workload() -> List[Process]:
    """
    Standard heterogeneous benchmark workload designed to demonstrate
    the classical convoy effect under FCFS and the optimization of SJF.
    
    Workload profile:
    - P1 arrives at 0 with long burst (convoy driver in FCFS)
    - P2, P3 arrive shortly after with short bursts
    - P4 arrives with medium burst
    - P5 arrives later with short burst
    """
    return [
        Process(
            pid=1,
            arrival_time=0,
            burst_time=8,
            priority=2,
            features=PreSubmitFeatures(
                process_type="batch",
                user_id=1001,
                requested_memory_mb=512,
                static_priority=2,
                historical_burst_avg=7.8,
                estimated_burst=8.0
            )
        ),
        Process(
            pid=2,
            arrival_time=1,
            burst_time=4,
            priority=1,
            features=PreSubmitFeatures(
                process_type="interactive",
                user_id=1002,
                requested_memory_mb=128,
                static_priority=1,
                historical_burst_avg=3.9,
                estimated_burst=4.0
            )
        ),
        Process(
            pid=3,
            arrival_time=2,
            burst_time=2,
            priority=1,
            features=PreSubmitFeatures(
                process_type="interactive",
                user_id=1003,
                requested_memory_mb=64,
                static_priority=1,
                historical_burst_avg=2.1,
                estimated_burst=2.0
            )
        ),
        Process(
            pid=4,
            arrival_time=3,
            burst_time=1,
            priority=3,
            features=PreSubmitFeatures(
                process_type="system",
                user_id=1000,
                requested_memory_mb=32,
                static_priority=3,
                historical_burst_avg=1.0,
                estimated_burst=1.0
            )
        ),
        Process(
            pid=5,
            arrival_time=4,
            burst_time=6,
            priority=2,
            features=PreSubmitFeatures(
                process_type="batch",
                user_id=1004,
                requested_memory_mb=256,
                static_priority=2,
                historical_burst_avg=6.2,
                estimated_burst=6.0
            )
        ),
        Process(
            pid=6,
            arrival_time=6,
            burst_time=3,
            priority=1,
            features=PreSubmitFeatures(
                process_type="interactive",
                user_id=1005,
                requested_memory_mb=128,
                static_priority=1,
                historical_burst_avg=3.2,
                estimated_burst=3.0
            )
        )
    ]


def clone_workload(workload: List[Process]) -> List[Process]:
    """Return pristine clones of all processes in the workload."""
    return [p.clone() for p in workload]
