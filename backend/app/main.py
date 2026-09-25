from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cpu_router, deadlock_router, disk_router

app = FastAPI(
    title="OS Resource Management Simulator API",
    description="Backend execution engine for CPU, Deadlock, and Disk scheduling algorithms",
    version="1.0.0"
)

# Enable CORS for local React development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(cpu_router.router)
app.include_router(deadlock_router.router)
app.include_router(disk_router.router)

@app.get("/")
def root():
    return {"message": "OS Resource Simulator API is running"}

@app.get("/api/health")
def health():
    return {"status": "online"}

@app.get("/api/ml/metrics")
def ml_metrics_alias():
    from app.algorithms.cpu_scheduling import get_ml_validation_metrics
    return get_ml_validation_metrics()