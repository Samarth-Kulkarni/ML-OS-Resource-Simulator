from pydantic import BaseModel, Field
from typing import List, Optional

class DiskScheduleRequest(BaseModel):
    algorithm: str = Field(..., description="FCFS, SSTF, SCAN, C-SCAN")
    requests: List[int] = Field(..., description="List of requested disk tracks (e.g., [98, 183, 37, 122])")
    head: int = Field(..., ge=0, description="Initial disk head track position")
    disk_size: Optional[int] = Field(default=200, gt=0, description="Total number of tracks on the disk (default 0-199)")
    direction: Optional[str] = Field(default="right", description="'left' (towards 0) or 'right' (towards max track) for SCAN/C-SCAN")

class HeadMovement(BaseModel):
    from_track: int
    to_track: int
    distance: int

class DiskScheduleResponse(BaseModel):
    sequence: List[int] = Field(..., description="Order of tracks serviced starting from initial head")
    total_seek_time: int = Field(..., description="Total track distance traveled by head")
    movements: List[HeadMovement] = Field(..., description="Detailed step-by-step head movements")

class DiskAlgorithmComparisonItem(BaseModel):
    algorithm: str = Field(..., description="Algorithm name (FCFS, SSTF, SCAN, C-SCAN)")
    sequence: List[int] = Field(..., description="Servicing sequence")
    total_seek_time: int = Field(..., description="Total seek distance in cylinders")
    movements: List[HeadMovement] = Field(..., description="Step movements")
    improvement_vs_fcfs_pct: float = Field(..., description="Percentage seek distance reduction relative to FCFS")

class DiskComparisonResponse(BaseModel):
    results: List[DiskAlgorithmComparisonItem] = Field(..., description="Metrics for all 4 disk schedulers")
    best_algorithm: str = Field(..., description="Algorithm with the lowest total seek distance")
    max_seek: int
    min_seek: int