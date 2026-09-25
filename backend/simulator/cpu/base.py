"""
Base scheduler abstraction and simulation execution engine.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict, Any

from simulator.core.process import Process, ProcessState


@dataclass
class TimelineEvent:
    """A continuous execution slice on the CPU core."""
    start_time: int
    end_time: int
    pid: Optional[int]                      # None if CPU was idle
    is_idle: bool = False
    fallback_mode: bool = False             # True if executed under safety fallback policy

    @property
    def duration(self) -> int:
        return self.end_time - self.start_time


@dataclass
class SimulationMetrics:
    """Aggregated simulation performance statistics."""
    scheduler_name: str
    total_processes: int
    makespan: int                           # Total elapsed simulation time
    idle_time: int
    busy_time: int
    cpu_utilization_pct: float
    throughput: float                       # completed processes per unit time
    avg_waiting_time: float
    avg_turnaround_time: float
    avg_response_time: float
    processes: List[Process]
    timeline: List[TimelineEvent]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scheduler_name": self.scheduler_name,
            "total_processes": self.total_processes,
            "makespan": self.makespan,
            "idle_time": self.idle_time,
            "busy_time": self.busy_time,
            "cpu_utilization_pct": round(self.cpu_utilization_pct, 2),
            "throughput": round(self.throughput, 4),
            "avg_waiting_time": round(self.avg_waiting_time, 2),
            "avg_turnaround_time": round(self.avg_turnaround_time, 2),
            "avg_response_time": round(self.avg_response_time, 2),
        }


class BaseScheduler(ABC):
    """
    Abstract Base Scheduler providing discrete-event simulation infrastructure.
    """
    def __init__(self, name: str):
        self.name = name
        self.current_time: int = 0
        self.ready_queue: List[Process] = []
        self.unloaded_processes: List[Process] = []
        self.completed_processes: List[Process] = []
        self.timeline: List[TimelineEvent] = []
        self.running_process: Optional[Process] = None

    def load_workload(self, processes: List[Process]) -> None:
        """Load processes sorted by arrival time into the simulator."""
        self.unloaded_processes = sorted(processes, key=lambda p: (p.arrival_time, p.pid))
        self.current_time = 0
        self.ready_queue.clear()
        self.completed_processes.clear()
        self.timeline.clear()
        self.running_process = None

    def _admit_arriving_processes(self) -> None:
        """Move newly arrived processes from unloaded queue into ready queue."""
        while self.unloaded_processes and self.unloaded_processes[0].arrival_time <= self.current_time:
            p = self.unloaded_processes.pop(0)
            p.state = ProcessState.READY
            self.ready_queue.append(p)

    @abstractmethod
    def select_next_process(self) -> Optional[Process]:
        """
        Policy decision hook: select and remove the next process to run from ready_queue.
        Must be implemented by concrete scheduler subclasses (FCFS, SJF, etc.).
        """
        pass

    def run(self) -> SimulationMetrics:
        """
        Execute discrete-event simulation until all processes complete.
        Supports both non-preemptive execution and preemptive time slices (quantum).
        """
        total_target = len(self.unloaded_processes)
        
        # Check if the scheduler defines a quantum (e.g., Round Robin)
        quantum = getattr(self, "quantum", None)

        while len(self.completed_processes) < total_target:
            self._admit_arriving_processes()

            if not self.ready_queue:
                # CPU is idle: advance clock to next arrival
                next_arrival = self.unloaded_processes[0].arrival_time
                self.timeline.append(
                    TimelineEvent(
                        start_time=self.current_time,
                        end_time=next_arrival,
                        pid=None,
                        is_idle=True
                    )
                )
                self.current_time = next_arrival
                self._admit_arriving_processes()

            # Dispatch next process
            process = self.select_next_process()
            if process is None:
                continue

            # Determine execution slice
            slice_time = min(process.remaining_time, quantum) if quantum else process.remaining_time
            
            start = self.current_time
            if process.start_time is None:
                process.mark_started(start)
            
            end = start + slice_time
            self.current_time = end
            process.remaining_time -= slice_time
            
            # Record execution slice
            self.timeline.append(
                TimelineEvent(
                    start_time=start,
                    end_time=end,
                    pid=process.pid,
                    is_idle=False,
                    fallback_mode=getattr(self, "is_fallback_active", False)
                )
            )
            
            # Process completion or preemption
            self._admit_arriving_processes()  # Admit arrivals that happened during this slice BEFORE requeuing
            
            if process.remaining_time <= 0:
                process.mark_completed(end)
                self.completed_processes.append(process)
            else:
                # Preempted: return to ready queue
                # Policy specific: RR puts it at the back. Base RR will handle it.
                self.ready_queue.append(process)

        return self.compute_metrics()

    def compute_metrics(self) -> SimulationMetrics:
        """Calculate standardized scheduling performance indicators."""
        n = len(self.completed_processes)
        if n == 0:
            raise ValueError("Cannot compute metrics with 0 completed processes.")

        total_waiting = sum(p.waiting_time for p in self.completed_processes)
        total_turnaround = sum(p.turnaround_time for p in self.completed_processes)
        total_response = sum(p.response_time for p in self.completed_processes)
        
        makespan = self.current_time
        busy_time = sum(e.duration for e in self.timeline if not e.is_idle)
        idle_time = sum(e.duration for e in self.timeline if e.is_idle)
        utilization = (busy_time / makespan * 100.0) if makespan > 0 else 0.0
        throughput = (n / makespan) if makespan > 0 else 0.0

        return SimulationMetrics(
            scheduler_name=self.name,
            total_processes=n,
            makespan=makespan,
            idle_time=idle_time,
            busy_time=busy_time,
            cpu_utilization_pct=utilization,
            throughput=throughput,
            avg_waiting_time=total_waiting / n,
            avg_turnaround_time=total_turnaround / n,
            avg_response_time=total_response / n,
            processes=sorted(self.completed_processes, key=lambda p: p.pid),
            timeline=self.timeline
        )
