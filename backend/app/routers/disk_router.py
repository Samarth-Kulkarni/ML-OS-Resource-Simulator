from fastapi import APIRouter, HTTPException
from app.models.disk import DiskScheduleRequest, DiskScheduleResponse, DiskComparisonResponse
from app.algorithms.disk_scheduling import run_disk_scheduling, compare_disk_algorithms

router = APIRouter(prefix="/api/disk", tags=["Disk Scheduling"])

@router.post("/simulate", response_model=DiskScheduleResponse)
def simulate_disk(req: DiskScheduleRequest):
    try:
        return run_disk_scheduling(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/compare", response_model=DiskComparisonResponse)
def compare_disk(req: DiskScheduleRequest):
    try:
        return compare_disk_algorithms(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))