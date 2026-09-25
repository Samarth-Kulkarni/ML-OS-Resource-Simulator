"""
Unit Tests for Rotational Disk Head Scheduling Algorithms.
Validates FCFS, SSTF, SCAN, and C-SCAN seek kinematics against textbook hand-computed examples.
"""

from app.models.disk import DiskScheduleRequest
from app.algorithms.disk_scheduling import run_disk_scheduling

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
