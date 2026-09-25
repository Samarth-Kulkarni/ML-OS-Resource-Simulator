"""
Adaptive Policy Router (Fallback Safety Net).
Directly implements dual-expert routing based on 'Aegis' and 'Mixture-of-Schedulers'.
"""

from typing import List, Optional, Tuple
from dataclasses import replace
import copy

from simulator.core.process import Process, ProcessState
from simulator.cpu.base import BaseScheduler, TimelineEvent, SimulationMetrics
from simulator.ml.models import BurstPredictor

class AdaptivePolicyRouterScheduler(BaseScheduler):
    """
    Dual-Expert Scheduler with Online Error Tracking.
    
    Expert 1: Predicted-SJF (High throughput, non-preemptive up to prediction limit)
    Expert 2: Round Robin (Guaranteed fairness, time-sliced)
    
    Safety Mechanism:
    If a process exceeds its predicted burst, it is preempted and routed to the RR queue.
    If the global Exponential Moving Average (EMA) of prediction error exceeds `error_threshold`,
    all processes are routed to RR until the error stabilizes.
    """
    
    def __init__(self, predictor: BurstPredictor, name: str = "Adaptive Policy Router", error_threshold: float = 5.0):
        super().__init__(name=name)
        self.predictor = predictor
        self.error_threshold = error_threshold
        
        # Internal dual queues
        self.ml_ready_queue: List[Process] = []
        self.rr_fallback_queue: List[Process] = []
        
        # Online Error Tracking (Exponential Moving Average)
        self.ema_error: float = 0.0
        self.alpha: float = 0.3 # Weight of the most recent error
        
        self.rr_quantum = 2
        
        # Telemetry
        self.fallback_trigger_log = []

    def load_workload(self, processes: List[Process]) -> None:
        super().load_workload(processes)
        self.ml_ready_queue.clear()
        self.rr_fallback_queue.clear()
        self.ema_error = 0.0
        self.fallback_trigger_log.clear()

    def _admit_arriving_processes(self) -> None:
        """Admit processes and route them based on current EMA error."""
        while self.unloaded_processes and self.unloaded_processes[0].arrival_time <= self.current_time:
            p = self.unloaded_processes.pop(0)
            p.state = ProcessState.READY
            
            # Predict burst
            pred = self.predictor.predict(p)
            p.features = replace(p.features, estimated_burst=pred)
            
            # Route based on global error state
            if self.ema_error > self.error_threshold:
                self.rr_fallback_queue.append(p)
                self.fallback_trigger_log.append({
                    "time": self.current_time,
                    "pid": p.pid,
                    "reason": f"Global EMA Error ({self.ema_error:.1f}) > Threshold ({self.error_threshold})",
                    "action": "Routed to RR"
                })
            else:
                self.ml_ready_queue.append(p)
                
        # Sort ML queue by estimated burst (SJF logic)
        self.ml_ready_queue.sort(key=lambda x: (x.features.estimated_burst, x.arrival_time, x.pid))

    def select_next_process(self) -> Optional[Process]:
        # This isn't used directly since we override run(), but kept for BaseScheduler signature
        pass

    def run(self) -> SimulationMetrics:
        total_target = len(self.unloaded_processes)

        while len(self.completed_processes) < total_target:
            self._admit_arriving_processes()

            if not self.ml_ready_queue and not self.rr_fallback_queue:
                next_arrival = self.unloaded_processes[0].arrival_time
                self.timeline.append(TimelineEvent(
                    start_time=self.current_time, end_time=next_arrival, pid=None, is_idle=True
                ))
                self.current_time = next_arrival
                self._admit_arriving_processes()
                continue

            # Policy Router: Prioritize RR fallback to clear degraded jobs, else ML SJF
            is_fallback = False
            if self.rr_fallback_queue:
                process = self.rr_fallback_queue.pop(0)
                slice_time = min(process.remaining_time, self.rr_quantum)
                is_fallback = True
            else:
                process = self.ml_ready_queue.pop(0)
                # ML process runs for AT MOST its predicted burst (or remaining time if it's less)
                # We give a 20% margin of error before aggressively preempting
                margin_limit = int(process.features.estimated_burst * 1.2) + 1
                slice_time = min(process.remaining_time, margin_limit)

            start = self.current_time
            if process.start_time is None:
                process.mark_started(start)
                
            end = start + slice_time
            self.current_time = end
            process.remaining_time -= slice_time
            
            self.timeline.append(TimelineEvent(
                start_time=start, end_time=end, pid=process.pid, is_idle=False, fallback_mode=is_fallback
            ))
            
            self._admit_arriving_processes()
            
            if process.remaining_time <= 0:
                process.mark_completed(end)
                self.completed_processes.append(process)
                
                # Update EMA error ONLY when a process successfully finishes its total execution
                # to measure how far off the initial prediction was
                actual_error = abs(process.burst_time - process.features.estimated_burst)
                self.ema_error = (self.alpha * actual_error) + ((1 - self.alpha) * self.ema_error)
            else:
                # Preempted!
                if not is_fallback:
                    # ML process exceeded its prediction limit! 
                    # This is a starvation risk. Demote to RR Fallback queue.
                    self.rr_fallback_queue.append(process)
                    self.fallback_trigger_log.append({
                        "time": self.current_time,
                        "pid": process.pid,
                        "reason": f"Prediction overrun. Pred={process.features.estimated_burst:.1f}, but didn't finish.",
                        "action": "Demoted to RR"
                    })
                    
                    # Instantly penalize EMA error since we know the prediction was very wrong
                    overrun_error = process.burst_time - process.features.estimated_burst
                    self.ema_error = (self.alpha * overrun_error) + ((1 - self.alpha) * self.ema_error)
                else:
                    # Was already in RR, just round-robin it
                    self.rr_fallback_queue.append(process)

        return self.compute_metrics()
