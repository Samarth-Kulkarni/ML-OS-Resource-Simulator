"""
Unit Tests for Rotational Disk Head Scheduling Algorithms.
Validates FCFS, SSTF, SCAN, and C-SCAN seek kinematics against textbook hand-computed examples.
"""

from app.models.disk import DiskScheduleRequest
from app.algorithms.disk_scheduling import run_disk_scheduling, compare_disk_algorithms

# Standard Silberschatz textbook disk benchmark
TEXTBOOK_HEAD = 53
TEXTBOOK_REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67]
DISK_SIZE = 200

def test_disk_fcfs_seek_distance():
    """
    FCFS serves tracks in chronological arrival order:
    53 -> 98 -> 183 -> 37 -> 122 -> 14 -> 124 -> 65 -> 67
    Total seek distance = 45+85+146+85+108+110+59+2 = 640 tracks.
    """
    req = DiskScheduleRequest(
        head=TEXTBOOK_HEAD,
        requests=TEXTBOOK_REQUESTS,
        algorithm="FCFS",
        disk_size=DISK_SIZE,
        direction="right"
    )
    res = run_disk_scheduling(req)
    assert res.sequence == [53, 98, 183, 37, 122, 14, 124, 65, 67]
    assert res.total_seek_time == 640
    assert len(res.movements) == 8


def test_disk_sstf_seek_distance():
    """
    SSTF greedily visits the closest track to current head:
    53 -> 65 -> 67 -> 37 -> 14 -> 98 -> 122 -> 124 -> 183
    Total seek distance = 12+2+30+23+84+24+2+59 = 236 tracks.
    """
    req = DiskScheduleRequest(
        head=TEXTBOOK_HEAD,
        requests=TEXTBOOK_REQUESTS,
        algorithm="SSTF",
        disk_size=DISK_SIZE,
        direction="right"
    )
    res = run_disk_scheduling(req)
    assert res.sequence == [53, 65, 67, 37, 14, 98, 122, 124, 183]
    assert res.total_seek_time == 236


def test_disk_scan_seek_distance():
    """
    SCAN sweeps right towards cylinder 199, then reverses left to cylinder 14:
    Total seek distance = (199 - 53) + (199 - 14) = 146 + 185 = 331 tracks.
    """
    req = DiskScheduleRequest(
        head=TEXTBOOK_HEAD,
        requests=TEXTBOOK_REQUESTS,
        algorithm="SCAN",
        disk_size=DISK_SIZE,
        direction="right"
    )
    res = run_disk_scheduling(req)
    assert res.total_seek_time == 331
    assert res.sequence[0] == 53
    assert 199 in res.sequence


def test_disk_cscan_seek_distance():
    """
    C-SCAN sweeps right to 199, returns circular to 0, then services remaining:
    Total seek distance = (199 - 53) + (199 - 0) + (37 - 0) = 146 + 199 + 37 = 382 tracks.
    """
    req = DiskScheduleRequest(
        head=TEXTBOOK_HEAD,
        requests=TEXTBOOK_REQUESTS,
        algorithm="C-SCAN",
        disk_size=DISK_SIZE,
        direction="right"
    )
    res = run_disk_scheduling(req)
    assert res.total_seek_time == 382
    assert 0 in res.sequence
    assert 199 in res.sequence


def test_disk_compare_all_algorithms():
    """
    Verifies comparative benchmarking across all 6 policies on textbook workload,
    including LOOK and SATF with physical spindle rotational kinematics.
    """
    req = DiskScheduleRequest(
        head=TEXTBOOK_HEAD,
        requests=TEXTBOOK_REQUESTS,
        algorithm="COMPARE",
        disk_size=DISK_SIZE,
        direction="right"
    )
    res = compare_disk_algorithms(req)
    assert res.best_algorithm == "SSTF"
    assert res.min_seek == 236
    assert res.max_seek == 640
    assert len(res.results) == 6
    
    sstf_item = next(r for r in res.results if r.algorithm == "SSTF")
    assert sstf_item.improvement_vs_fcfs_pct == 63.1

    satf_item = next(r for r in res.results if r.algorithm == "SATF")
    assert satf_item.total_access_time_ms > 0
    assert satf_item.access_time_improvement_vs_fcfs_pct > 0.0
    assert res.best_access_time_algorithm == "SATF"


def test_satf_and_look_individual_runs():
    req_satf = DiskScheduleRequest(
        head=TEXTBOOK_HEAD,
        requests=TEXTBOOK_REQUESTS,
        algorithm="SATF",
        disk_size=DISK_SIZE
    )
    res_satf = run_disk_scheduling(req_satf)
    assert len(res_satf.sequence) == len(TEXTBOOK_REQUESTS) + 1
    assert res_satf.estimated_rotational_delay_ms > 0
    assert res_satf.total_access_time_ms > 0

    req_look = DiskScheduleRequest(
        head=TEXTBOOK_HEAD,
        requests=TEXTBOOK_REQUESTS,
        algorithm="LOOK",
        disk_size=DISK_SIZE,
        direction="right"
    )
    res_look = run_disk_scheduling(req_look)
    assert len(res_look.sequence) == len(TEXTBOOK_REQUESTS) + 1
    # LOOK doesn't touch track 0 or 199 unless requested
    assert 0 not in res_look.sequence
    assert 199 not in res_look.sequence

