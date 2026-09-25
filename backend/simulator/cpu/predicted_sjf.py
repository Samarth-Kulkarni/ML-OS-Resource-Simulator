"""
Machine Learning Predicted SJF Scheduler.
"""

from dataclasses import replace
from typing import Optional

from simulator.core.process import Process, ProcessState
from simulator.cpu.sjf import SJFScheduler
from simulator.ml.models import BurstPredictor


class PredictedSJFScheduler(SJFScheduler):
    """
    ML-Augmented Shortest Job First Scheduler.
    
    Instead of using the oracle (ground truth) burst time, this scheduler intercepts
    arriving processes, invokes the ML model to predict their burst time using only
    leakage-safe pre-submit features, and schedules based on that prediction.
    """
    
    def __init__(self, predictor: BurstPredictor, name: str = "Predicted SJF (ML)"):
        # Sort using the estimated burst rather than true burst
        super().__init__(
            name=name,
            sort_key_fn=lambda p: p.features.estimated_burst
        )
        self.predictor = predictor
        if not self.predictor.is_trained:
            # Attempt to load a default model if not explicitly trained
            try:
                import os
                model_path = "simulator/ml/saved_models/decision_tree.pkl"
                if os.path.exists(model_path):
                    self.predictor.load(model_path)
            except Exception:
                pass # Will fallback to zero-dependency mathematical heuristic

    def _admit_arriving_processes(self) -> None:
        """
        Intercept processes just before they enter the ready queue to perform ML inference.
        """
        # Predict only for those that are about to arrive at current_time
        for p in self.unloaded_processes:
            if p.arrival_time <= self.current_time and p.state == ProcessState.NEW:
                # Features are frozen to prevent leakage, so we replace the instance cleanly
                prediction = self.predictor.predict(p)
                p.features = replace(p.features, estimated_burst=prediction)
                
        # Now let the standard admission logic move them to the ready queue
        super()._admit_arriving_processes()
