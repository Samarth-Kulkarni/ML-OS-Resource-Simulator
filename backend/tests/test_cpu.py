"""
Unit Tests for CPU Scheduling, Multi-Algorithm Benchmarking, and Circuit Breakers.
"""

from app.models.process import Process, CPUScheduleRequest
from app.algorithms.cpu_scheduling import (
    run_cpu_scheduling, compare_cpu_algorithms, get_ml_validation_metrics
)

def test_cpu_fcfs_scheduling():
    procs = [
        Process(pid="P1", arrival_time=0, burst_time=6),
        Process(pid="P2", arrival_time=1, burst_time=4)
    ]
    res = run_cpu_scheduling("FCFS", procs)
    assert res.average_waiting_time == 2.5
    assert res.average_turnaround_time == 7.5
    assert len(res.gantt_chart) == 2


def test_cpu_multi_algorithm_comparison():
    procs = [
        Process(pid="P1", arrival_time=0, burst_time=6),
        Process(pid="P2", arrival_time=1, burst_time=4),
        Process(pid="P3", arrival_time=2, burst_time=8),
        Process(pid="P4", arrival_time=3, burst_time=3),
        Process(pid="P5", arrival_time=4, burst_time=5)
    ]
    comp = compare_cpu_algorithms(procs, time_quantum=2, error_threshold=5.0)
    assert len(comp.algorithms) == 5
    assert comp.total_processes == 5
    # Predicted-SJF must outperform or match FCFS on waiting time
    assert comp.improvement_over_fcfs_wt_pct >= 0.0
    assert "Predicted-SJF" in comp.verdict


def test_cpu_adversarial_circuit_breaker():
    """
    Tests that a process with a deceptive burst triggers overrun demotion
    and trips the global EMA safety fallback.
    """
    procs = [
        Process(pid="P1", arrival_time=0, burst_time=3),
        Process(
            pid="P_Deceptive", 
            arrival_time=1, 
            burst_time=25,
            process_type="interactive",
            requested_memory_mb=128,
            historical_burst_avg=2.0,
            past_burst_1=2.0,
            past_burst_2=2.0,
            past_burst_3=2.0
        ),
        Process(pid="P3", arrival_time=2, burst_time=4)
    ]
    res = run_cpu_scheduling("ADAPTIVE_ROUTER", procs, time_quantum=2, error_threshold=5.0)
    assert len(res.fallback_logs) > 0
    # Overrun demotion must be logged
    assert any("Exceeded predicted burst" in l.reason for l in res.fallback_logs)


def test_ml_validation_metrics_endpoint():
    metrics = get_ml_validation_metrics()
    assert metrics.dataset_samples == 500
    assert metrics.r2_score > 0.90
    assert metrics.mean_absolute_error < 2.0
    assert metrics.inference_latency_us < 50.0
