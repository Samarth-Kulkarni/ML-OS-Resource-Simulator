"""
Synthetic Workload Generator.
Generates leakage-safe process traces for ML model training and simulator testing.
"""

import csv
import math
import random
from typing import List, Dict, Any
from pathlib import Path

from simulator.core.process import Process, PreSubmitFeatures

class WorkloadGenerator:
    """
    Generates synthetic traces of OS processes with 4 realistic workload profiles:
    - interactive: Short bursts, frequent arrivals.
    - batch: Long bursts, high memory, rare arrivals.
    - bursty: Heavy-tailed burst distribution.
    - mixed: 70% interactive, 30% batch blend.
    """
    
    def __init__(self, seed: int = 42):
        random.seed(seed)
        self.pid_counter = 1

    def _generate_interactive(self, current_time: int) -> Process:
        """Interactive (GUI/Web) process profile."""
        burst = max(1, int(random.expovariate(1.0 / 3.0)))
        return self._build_process(
            current_time=current_time,
            burst_time=burst,
            p_type="interactive",
            mem=random.choice([64, 128, 256]),
            prio=random.randint(0, 5)
        )

    def _generate_batch(self, current_time: int) -> Process:
        """Batch (Compute-bound) process profile."""
        burst = max(10, int(random.gauss(25, 5)))
        return self._build_process(
            current_time=current_time,
            burst_time=burst,
            p_type="batch",
            mem=random.choice([1024, 2048, 4096]),
            prio=random.randint(10, 19)
        )

    def _generate_bursty(self, current_time: int) -> Process:
        """Bursty (Heavy-tailed DB/Server) process profile."""
        # Pareto distribution (alpha=1.5)
        burst = max(1, int((random.paretovariate(1.5) * 5)))
        return self._build_process(
            current_time=current_time,
            burst_time=burst,
            p_type="bursty",
            mem=random.choice([256, 512, 1024]),
            prio=random.randint(5, 10)
        )

    def _build_process(self, current_time: int, burst_time: int, p_type: str, mem: int, prio: int) -> Process:
        """Constructs a Process with leakage-safe correlated historical features."""
        # Simulate realistic autoregressive past bursts
        noise = lambda x: max(1, int(random.gauss(x, x * 0.2)))
        b1 = noise(burst_time)
        b2 = noise(b1)
        b3 = noise(b2)
        
        hist_avg = round((b1 + b2 + b3) / 3.0, 1)

        features = PreSubmitFeatures(
            process_type=p_type,
            user_id=random.randint(1000, 1005),
            requested_memory_mb=mem,
            static_priority=prio,
            historical_burst_avg=hist_avg,
            past_burst_1=b1,
            past_burst_2=b2,
            past_burst_3=b3,
            estimated_burst=0.0
        )
        
        p = Process(
            pid=self.pid_counter,
            arrival_time=current_time,
            burst_time=burst_time,
            priority=prio,
            features=features
        )
        self.pid_counter += 1
        return p

    def generate(self, profile: str = "mixed", count: int = 1000) -> List[Process]:
        """Generates a list of Process objects matching the desired profile."""
        processes = []
        current_time = 0
        
        for _ in range(count):
            if profile == "interactive":
                p = self._generate_interactive(current_time)
                current_time += max(1, int(random.expovariate(1.0 / 2.0)))
            elif profile == "batch":
                p = self._generate_batch(current_time)
                current_time += max(1, int(random.uniform(5, 15)))
            elif profile == "bursty":
                p = self._generate_bursty(current_time)
                current_time += max(1, int(random.paretovariate(2.0) * 3))
            else: # mixed
                if random.random() < 0.7:
                    p = self._generate_interactive(current_time)
                    current_time += max(1, int(random.expovariate(1.0 / 2.0)))
                else:
                    p = self._generate_batch(current_time)
                    current_time += max(1, int(random.uniform(5, 15)))
            
            processes.append(p)
            
        return processes

    def save_to_csv(self, processes: List[Process], filepath: str) -> None:
        """Serializes generated workload to CSV."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, mode="w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "pid", "arrival_time", "process_type", "user_id",
                "requested_memory_mb", "static_priority", "historical_burst_avg",
                "past_burst_1", "past_burst_2", "past_burst_3", "actual_burst_time"
            ])
            for p in processes:
                writer.writerow([
                    p.pid, p.arrival_time, p.features.process_type, p.features.user_id,
                    p.features.requested_memory_mb, p.features.static_priority,
                    p.features.historical_burst_avg, p.features.past_burst_1,
                    p.features.past_burst_2, p.features.past_burst_3, p.burst_time
                ])

    def inject_anomaly(self, processes: List[Process], index: int, new_actual_burst: int) -> None:
        """Injects a sudden burst anomaly to test the Round-Robin Fallback safety net."""
        p = processes[index]
        # Mutate the true burst time, leaving the historical features unchanged (tricking the ML)
        p.burst_time = new_actual_burst
        p.remaining_time = new_actual_burst

if __name__ == "__main__":
    gen = WorkloadGenerator()
    train_data = gen.generate(profile="mixed", count=2000)
    test_data = gen.generate(profile="mixed", count=500)
    
    # Inject one massive anomaly to test the router in test set
    gen.inject_anomaly(test_data, 10, 50)
    
    gen.save_to_csv(train_data, "data/train_workload.csv")
    gen.save_to_csv(test_data, "data/test_workload.csv")
    print("Generated data/train_workload.csv (2000 samples) and data/test_workload.csv (500 samples)")
