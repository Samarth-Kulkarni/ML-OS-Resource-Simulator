"""
First-Come, First-Served (FCFS) CPU Scheduler.
"""

from typing import Optional
from simulator.core.process import Process
from simulator.cpu.base import BaseScheduler


class FCFSScheduler(BaseScheduler):
    """
    First-Come First-Served (FCFS) Scheduler.
    
    Dispatches processes strictly in order of their arrival into the ready queue.
    Serves as the simplest baseline to showcase the convoy effect.
    """
    def __init__(self):
        super().__init__(name="First-Come First-Served (FCFS)")

    def select_next_process(self) -> Optional[Process]:
        """Pop the oldest arrived process from the ready queue."""
        if not self.ready_queue:
            return None
        # Ready queue is maintained in arrival order
        return self.ready_queue.pop(0)
