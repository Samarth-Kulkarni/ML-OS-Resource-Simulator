"""
Shortest Job First (SJF) CPU Scheduler.
"""

from typing import Optional, Callable
from simulator.core.process import Process
from simulator.cpu.base import BaseScheduler


class SJFScheduler(BaseScheduler):
    """
    Shortest Job First (SJF) Scheduler (Non-preemptive).
    
    Selects the process with the smallest execution burst from the ready queue.
    Ties broken deterministically by earlier arrival time, then smaller PID.
    
    Supports an extensible `sort_key_fn` hook so that later ML-Predicted-SJF
    can sort by `features.estimated_burst` instead of actual burst without
    rewriting the core scheduling dispatch loop.
    """
    def __init__(
        self,
        name: str = "Shortest Job First (SJF - Oracle)",
        sort_key_fn: Optional[Callable[[Process], float]] = None
    ):
        super().__init__(name=name)
        # Default sort key is the ground truth burst time (oracle baseline)
        self.sort_key_fn = sort_key_fn or (lambda p: p.burst_time)

    def select_next_process(self) -> Optional[Process]:
        """Select and pop the shortest job available in the ready queue."""
        if not self.ready_queue:
            return None
        
        # Find index of process with minimum burst metric
        best_idx = 0
        best_key = (self.sort_key_fn(self.ready_queue[0]), self.ready_queue[0].arrival_time, self.ready_queue[0].pid)

        for i in range(1, len(self.ready_queue)):
            p = self.ready_queue[i]
            candidate_key = (self.sort_key_fn(p), p.arrival_time, p.pid)
            if candidate_key < best_key:
                best_key = candidate_key
                best_idx = i

        return self.ready_queue.pop(best_idx)
