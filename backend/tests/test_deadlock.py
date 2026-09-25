"""
Unit Tests for Banker's Algorithm (Deadlock Avoidance & Safety Verification).
Validates algorithmic correctness against textbook test cases including deliberately unsafe states.
"""

from app.models.deadlock import DeadlockRequest
from app.algorithms.deadlock import check_bankers_safety

def test_bankers_safe_state_textbook():
    """
    Standard textbook 5-process, 3-resource safe state benchmark
    (Silberschatz, Galvin, Gagne - Operating System Concepts).
    """
    req = DeadlockRequest(
        processes=["P0", "P1", "P2", "P3", "P4"],
        resources=["A", "B", "C"],
        allocation_matrix=[
            [0, 1, 0],
            [2, 0, 0],
            [3, 0, 2],
            [2, 1, 1],
            [0, 0, 2]
        ],
        max_matrix=[
            [7, 5, 3],
            [3, 2, 2],
            [9, 0, 2],
            [2, 2, 2],
            [4, 3, 3]
        ],
        available=[3, 3, 2]
    )

    res = check_bankers_safety(req)

    # 1. State must be verified as SAFE
    assert res.is_safe is True, "Textbook benchmark state must be evaluated as safe."
    
    # 2. Must return a full safe sequence of 5 processes
    assert len(res.safe_sequence) == 5
    
    # 3. Verify correctness of Need matrix (Max - Allocation)
    expected_need = [
        [7, 4, 3],
        [1, 2, 2],
        [6, 0, 0],
        [0, 1, 1],
        [4, 3, 1]
    ]
    assert res.need_matrix == expected_need

    # 4. In this standard state, P1 must be able to execute first (Need [1,2,2] <= Work [3,3,2])
    assert res.safe_sequence[0] == "P1"
    
    # 5. All processes must be included uniquely in safe sequence
    assert set(res.safe_sequence) == {"P0", "P1", "P2", "P3", "P4"}


def test_bankers_deliberate_unsafe_deadlock():
    """
    Deliberately unsafe state where available resources are insufficient
    for any process to satisfy its maximum need.
    """
    req = DeadlockRequest(
        processes=["P0", "P1", "P2"],
        resources=["A", "B", "C"],
        allocation_matrix=[
            [2, 1, 1],
            [1, 2, 0],
            [1, 0, 2]
        ],
        max_matrix=[
            [5, 5, 5],
            [4, 4, 4],
            [3, 3, 3]
        ],
        available=[0, 0, 0]  # Zero available resources -> Deadlock
    )

    res = check_bankers_safety(req)

    # 1. State must be evaluated as UNSAFE
    assert res.is_safe is False
    
    # 2. Safe sequence must be empty
    assert res.safe_sequence == []

    # 3. Execution log must report deadlock detection
    assert any("UNSAFE" in log or "Deadlock" in log for log in res.execution_steps)


def test_bankers_single_process_boundary():
    """
    Boundary case: 1 process whose needs exactly match available capacity.
    """
    req = DeadlockRequest(
        processes=["P0"],
        resources=["A", "B"],
        allocation_matrix=[[1, 2]],
        max_matrix=[[3, 4]],
        available=[2, 2]  # Need is [2, 2] == Available [2, 2]
    )

    res = check_bankers_safety(req)
    assert res.is_safe is True
    assert res.safe_sequence == ["P0"]
