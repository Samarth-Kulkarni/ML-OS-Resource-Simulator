"""
Round Robin (RR) CPU Scheduler.
"""

from typing import Optional
from simulator.core.process import Process
from simulator.cpu.base import BaseScheduler


class RoundRobinScheduler(BaseScheduler):
    """
    Round Robin (RR) Scheduler (Preemptive).
    
    Processes are executed in a FIFO manner, but each process runs for a maximum
    of `quantum` ticks. If the process does not finish within its quantum, it is
    preempted and placed at the back of the ready queue.
    """
    def __init__(
        self,
        name: str = "Round Robin (RR)",
        quantum: int = 2
    ):
        super().__init__(name=name)
        self.quantum = quantum

    def select_next_process(self) -> Optional[Process]:
        """Select and pop the front of the ready queue (FIFO)."""
        if not self.ready_queue:
            return None
        return self.ready_queue.pop(0)
