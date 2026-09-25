"""
Trace Loader.
Reads real-world cluster traces (CSV) and maps them into the standardized simulator schema.
"""

import csv
from typing import List
from simulator.core.process import Process, PreSubmitFeatures

class TraceLoader:
    """
    Parses standard CSV trace logs into the unified Process object contract,
    allowing the simulator to run on both synthetic and empirical real-world data.
    """
    
    @staticmethod
    def load_from_csv(filepath: str) -> List[Process]:
        processes = []
        with open(filepath, mode="r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                features = PreSubmitFeatures(
                    process_type=row.get("process_type", "batch"),
                    user_id=int(row.get("user_id", 1000)),
                    requested_memory_mb=int(row.get("requested_memory_mb", 256)),
                    static_priority=int(row.get("static_priority", 0)),
                    historical_burst_avg=float(row.get("historical_burst_avg", 0.0)),
                    past_burst_1=int(row.get("past_burst_1", 0)),
                    past_burst_2=int(row.get("past_burst_2", 0)),
                    past_burst_3=int(row.get("past_burst_3", 0)),
                    estimated_burst=0.0
                )
                
                p = Process(
                    pid=int(row["pid"]),
                    arrival_time=int(row["arrival_time"]),
                    burst_time=int(row["actual_burst_time"]),
                    priority=int(row.get("static_priority", 0)),
                    features=features
                )
                processes.append(p)
                
        return processes
