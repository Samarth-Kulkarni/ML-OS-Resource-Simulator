import math
from typing import List, Tuple
from app.models.disk import (
    DiskScheduleRequest, DiskScheduleResponse, HeadMovement,
    DiskComparisonResponse, DiskAlgorithmComparisonItem
)

# Physical Disk Parameters (Enterprise 7200 RPM SAS/SATA HDD)
RPM = 7200
ROTATION_TIME_MS = (60.0 * 1000.0) / RPM  # ~8.333 ms per revolution

def _track_angle(track: int, disk_size: int) -> float:
    """Calculates physical sector angular position (0-360 degrees) for a cylinder."""
    return float((track * 360.0 / max(1, disk_size) * 3.7) % 360.0)

def _seek_time_ms(dist: int) -> float:
    """Physical seek time modeling acceleration, coast, and deceleration."""
    if dist == 0:
        return 0.0
    return 1.2 + 0.15 * math.sqrt(dist)

def _calculate_physical_latencies(sequence: List[int], disk_size: int) -> Tuple[float, float]:
    """
    Simulates physical disk kinematics along a track servicing sequence,
    accumulating seek latency and spindle rotational latency.
    """
    total_seek_ms = 0.0
    total_rot_ms = 0.0
    spindle_angle = 0.0

    for i in range(len(sequence) - 1):
        c_from = sequence[i]
        c_to = sequence[i + 1]
        dist = abs(c_to - c_from)

        t_seek = _seek_time_ms(dist)
        total_seek_ms += t_seek

        # Spindle rotates while head is seeking to new cylinder
        rot_during_seek = (t_seek / ROTATION_TIME_MS) * 360.0
        angle_after_seek = (spindle_angle + rot_during_seek) % 360.0

        target_angle = _track_angle(c_to, disk_size)
        delta_angle = (target_angle - angle_after_seek) % 360.0
        if delta_angle < 0:
            delta_angle += 360.0

        t_rot = (delta_angle / 360.0) * ROTATION_TIME_MS
        total_rot_ms += t_rot

        # Update spindle angle for next request
        spindle_angle = (angle_after_seek + delta_angle) % 360.0

    total_access_ms = round(total_seek_ms + total_rot_ms, 2)
    return round(total_rot_ms, 2), total_access_ms


def run_disk_scheduling(req: DiskScheduleRequest) -> DiskScheduleResponse:
    alg = req.algorithm.upper()
    disk_size = req.disk_size or 200

    if alg == "FCFS":
        seq = _fcfs_disk(req.head, req.requests)
    elif alg == "SSTF":
        seq = _sstf_disk(req.head, req.requests)
    elif alg == "SCAN":
        seq = _scan_disk(req.head, req.requests, disk_size, req.direction)
    elif alg == "C-SCAN":
        seq = _cscan_disk(req.head, req.requests, disk_size, req.direction)
    elif alg == "LOOK":
        seq = _look_disk(req.head, req.requests, req.direction)
    elif alg == "SATF":
        seq = _satf_disk(req.head, req.requests, disk_size)
    else:
        raise ValueError(f"Unsupported disk algorithm: {req.algorithm}")

    movements = []
    total_seek = 0
    for i in range(len(seq) - 1):
        dist = abs(seq[i+1] - seq[i])
        total_seek += dist
        movements.append(HeadMovement(from_track=seq[i], to_track=seq[i+1], distance=dist))

    rot_delay, total_access = _calculate_physical_latencies(seq, disk_size)

    return DiskScheduleResponse(
        sequence=seq,
        total_seek_time=total_seek,
        movements=movements,
        estimated_rotational_delay_ms=rot_delay,
        total_access_time_ms=total_access
    )


def compare_disk_algorithms(req: DiskScheduleRequest) -> DiskComparisonResponse:
    algorithms = ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "SATF"]
    run_results = {}
    disk_size = req.disk_size or 200

    for alg in algorithms:
        sub_req = DiskScheduleRequest(
            algorithm=alg,
            requests=list(req.requests),
            head=req.head,
            disk_size=disk_size,
            direction=req.direction
        )
        run_results[alg] = run_disk_scheduling(sub_req)

    fcfs_seek = run_results["FCFS"].total_seek_time
    fcfs_access = run_results["FCFS"].total_access_time_ms

    items = []
    for alg in algorithms:
        res = run_results[alg]
        seek_imp = round(((fcfs_seek - res.total_seek_time) / fcfs_seek * 100), 1) if fcfs_seek > 0 else 0.0
        acc_imp = round(((fcfs_access - res.total_access_time_ms) / fcfs_access * 100), 1) if fcfs_access > 0 else 0.0

        items.append(
            DiskAlgorithmComparisonItem(
                algorithm=alg,
                sequence=res.sequence,
                total_seek_time=res.total_seek_time,
                movements=res.movements,
                improvement_vs_fcfs_pct=seek_imp,
                estimated_rotational_delay_ms=res.estimated_rotational_delay_ms,
                total_access_time_ms=res.total_access_time_ms,
                access_time_improvement_vs_fcfs_pct=acc_imp
            )
        )

    best_seek_item = min(items, key=lambda x: x.total_seek_time)
    best_access_item = min(items, key=lambda x: x.total_access_time_ms)
    min_seek = min(x.total_seek_time for x in items)
    max_seek = max(x.total_seek_time for x in items)

    satf_item = next((x for x in items if x.algorithm == "SATF"), None)
    satf_gain = satf_item.access_time_improvement_vs_fcfs_pct if satf_item else 0.0

    verdict = (
        f"SATF (Shortest Access Time First) reduced physical disk I/O latency by {satf_gain}% vs FCFS by "
        f"co-optimizing seek distance and spindle rotational angle ({RPM} RPM kinematics). "
        f"Best cylinder seek: {best_seek_item.algorithm} ({best_seek_item.total_seek_time} tracks). "
        f"Best physical latency: {best_access_item.algorithm} ({best_access_item.total_access_time_ms} ms)."
    )

    return DiskComparisonResponse(
        results=items,
        best_algorithm=best_seek_item.algorithm,
        best_access_time_algorithm=best_access_item.algorithm,
        max_seek=max_seek,
        min_seek=min_seek,
        verdict=verdict
    )


def compare_disk_scheduling(head: int, requests: List[int], disk_size: int = 200, direction: str = "right") -> DiskComparisonResponse:
    req = DiskScheduleRequest(
        algorithm="FCFS",
        head=head,
        requests=requests,
        disk_size=disk_size,
        direction=direction
    )
    return compare_disk_algorithms(req)


def _fcfs_disk(head: int, requests: List[int]) -> List[int]:
    return [head] + requests


def _sstf_disk(head: int, requests: List[int]) -> List[int]:
    reqs = list(requests)
    curr = head
    seq = [head]

    while reqs:
        nearest = min(reqs, key=lambda x: abs(x - curr))
        seq.append(nearest)
        curr = nearest
        reqs.remove(nearest)

    return seq


def _scan_disk(head: int, requests: List[int], disk_size: int, direction: str) -> List[int]:
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    seq = [head]

    if direction.lower() == "left":
        seq.extend(reversed(left))
        if left:
            seq.append(0)
        seq.extend(right)
    else:
        seq.extend(right)
        if right:
            seq.append(disk_size - 1)
        seq.extend(reversed(left))

    return seq


def _cscan_disk(head: int, requests: List[int], disk_size: int, direction: str) -> List[int]:
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    seq = [head]

    if direction.lower() == "left":
        seq.extend(reversed(left))
        seq.append(0)
        seq.append(disk_size - 1)
        seq.extend(reversed(right))
    else:
        seq.extend(right)
        seq.append(disk_size - 1)
        seq.append(0)
        seq.extend(left)

    return seq


def _look_disk(head: int, requests: List[int], direction: str) -> List[int]:
    """LOOK scheduling services only up to the maximum/minimum requested tracks."""
    left = sorted([r for r in requests if r < head])
    right = sorted([r for r in requests if r >= head])
    seq = [head]

    if direction.lower() == "left":
        seq.extend(reversed(left))
        seq.extend(right)
    else:
        seq.extend(right)
        seq.extend(reversed(left))

    return seq


def _satf_disk(head: int, requests: List[int], disk_size: int) -> List[int]:
    """
    Shortest Access Time First (SATF):
    Greedily evaluates remaining candidate requests by composite physical access time
    T_access = T_seek(dist) + T_rotational(spindle_angle -> target_angle).
    """
    reqs = list(requests)
    curr_head = head
    spindle_angle = 0.0
    seq = [head]

    while reqs:
        best_candidate = None
        best_access_time = float("inf")
        best_next_spindle = 0.0

        for cand in reqs:
            dist = abs(cand - curr_head)
            t_seek = _seek_time_ms(dist)

            # Spindle angle when head arrives at target track
            rot_during_seek = (t_seek / ROTATION_TIME_MS) * 360.0
            angle_after_seek = (spindle_angle + rot_during_seek) % 360.0

            target_angle = _track_angle(cand, disk_size)
            delta_angle = (target_angle - angle_after_seek) % 360.0
            if delta_angle < 0:
                delta_angle += 360.0

            t_rot = (delta_angle / 360.0) * ROTATION_TIME_MS
            cand_access_time = t_seek + t_rot

            if cand_access_time < best_access_time:
                best_access_time = cand_access_time
                best_candidate = cand
                best_next_spindle = (angle_after_seek + delta_angle) % 360.0

        seq.append(best_candidate)
        curr_head = best_candidate
        spindle_angle = best_next_spindle
        reqs.remove(best_candidate)

    return seq