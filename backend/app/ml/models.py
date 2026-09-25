"""
Machine Learning Training & Inference Module.
Implements small, 100% offline regression models for CPU burst prediction.
"""

import os
import time
import math
import joblib
import pandas as pd
from typing import Dict, Any, Optional

from sklearn.tree import DecisionTreeRegressor, export_text
from sklearn.neighbors import KNeighborsRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.models.process import Process

# The exact features available at pre-submit time
NUMERIC_FEATURES = [
    "requested_memory_mb", "static_priority", "historical_burst_avg",
    "past_burst_1", "past_burst_2", "past_burst_3"
]
CATEGORICAL_FEATURES = ["process_type"]


class BurstPredictor:
    """
    Offline Burst Predictor wrapping a Scikit-Learn Pipeline.
    Supports Decision Tree (Primary) and KNN (Comparison).
    """

    def __init__(self, model_type: str = "decision_tree"):
        self.model_type = model_type
        self.pipeline: Optional[Pipeline] = None
        self.is_trained = False

        if model_type == "decision_tree":
            self.regressor = DecisionTreeRegressor(max_depth=5, min_samples_leaf=10, random_state=42)
        elif model_type == "knn":
            self.regressor = KNeighborsRegressor(n_neighbors=5)
        else:
            raise ValueError(f"Unsupported model_type: {model_type}")

    def _build_pipeline(self) -> Pipeline:
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), NUMERIC_FEATURES),
                ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES)
            ]
        )
        return Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", self.regressor)
        ])

    def train(self, df_train: pd.DataFrame) -> None:
        """Trains the ML pipeline on the provided training dataframe."""
        X_train = df_train[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
        y_train = df_train["actual_burst_time"]

        self.pipeline = self._build_pipeline()
        self.pipeline.fit(X_train, y_train)
        self.is_trained = True

    def evaluate(self, df_test: pd.DataFrame) -> Dict[str, float]:
        """Evaluates the model on test data and returns metrics."""
        if not self.is_trained or self.pipeline is None:
            raise RuntimeError("Model must be trained before evaluation.")

        X_test = df_test[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
        y_test = df_test["actual_burst_time"]

        start_time = time.perf_counter()
        y_pred = self.pipeline.predict(X_test)
        inference_time_us = ((time.perf_counter() - start_time) / len(y_test)) * 1_000_000

        mae = mean_absolute_error(y_test, y_pred)
        rmse = math.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        return {
            "model_type": self.model_type,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4),
            "inference_latency_us": round(inference_time_us, 2)
        }

    def predict(self, process: Process) -> float:
        """
        Infers the next burst time for a single process in < 50 us.
        Falls back to exponential smoothing heuristic if model isn't trained.
        """
        if not self.is_trained or self.pipeline is None:
            # Zero-Dependency Fallback Heuristic
            return max(1.0, process.historical_burst_avg * 0.7 + process.past_burst_1 * 0.3)

        # Create a single-row DataFrame (required by ColumnTransformer)
        df_single = pd.DataFrame([{
            "requested_memory_mb": process.requested_memory_mb,
            "static_priority": process.static_priority,
            "historical_burst_avg": process.historical_burst_avg,
            "past_burst_1": process.past_burst_1,
            "past_burst_2": process.past_burst_2,
            "past_burst_3": process.past_burst_3,
            "process_type": process.process_type
        }])
        
        pred = self.pipeline.predict(df_single)[0]
        return max(1.0, pred)

    def save(self, filepath: str) -> None:
        """Serializes the pipeline to disk (< 50KB for Decision Tree)."""
        if not self.is_trained:
            raise RuntimeError("Cannot save an untrained model.")
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.pipeline, filepath)

    def load(self, filepath: str) -> None:
        """Loads a pre-trained pipeline from disk."""
        self.pipeline = joblib.load(filepath)
        self.is_trained = True

    def export_tree_rules(self) -> str:
        """Returns human-readable text rules if the model is a Decision Tree."""
        if self.model_type != "decision_tree" or not self.is_trained:
            return "Rules only available for trained Decision Tree models."
        
        # We need the transformed feature names
        try:
            # scikit-learn 1.0+ way to get feature names
            cat_encoder = self.pipeline.named_steps["preprocessor"].named_transformers_["cat"]
            cat_features = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES)
            all_features = NUMERIC_FEATURES + list(cat_features)
            
            tree_model = self.pipeline.named_steps["regressor"]
            return export_text(tree_model, feature_names=all_features)
        except Exception as e:
            return f"Could not export rules: {str(e)}"

if __name__ == "__main__":
    print("Loading generated datasets...")
    df_train = pd.read_csv("data/train_workload.csv")
    df_test = pd.read_csv("data/test_workload.csv")

    for m_type in ["decision_tree", "knn"]:
        print(f"\nTraining {m_type}...")
        predictor = BurstPredictor(model_type=m_type)
        predictor.train(df_train)
        
        metrics = predictor.evaluate(df_test)
        print(f"Metrics: {metrics}")
        
        save_path = f"simulator/ml/saved_models/{m_type}.pkl"
        predictor.save(save_path)
        print(f"Saved to {save_path} (Size: {os.path.getsize(save_path) / 1024:.1f} KB)")
        
        if m_type == "decision_tree":
            print("\nDecision Tree Rules (Top Level):")
            rules = predictor.export_tree_rules()
            # print only first 15 lines of rules for brevity
            print("\n".join(rules.split("\n")[:15]))
