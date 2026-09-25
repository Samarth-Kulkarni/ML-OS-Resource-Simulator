"""
Automated Test Runner for OS Resource Simulator Test Suite.
Discovers and executes all unit tests across CPU, Deadlock, and Disk modules.
"""

import sys
import traceback
from tests import test_deadlock, test_disk, test_cpu

def run_suite():
    modules = [
        ("Deadlock Avoidance (Banker's Algorithm)", test_deadlock),
        ("Rotational Disk Scheduling", test_disk),
        ("CPU Scheduling & Multi-Algorithm Benchmark", test_cpu),
    ]

    total_passed = 0
    total_failed = 0

    print("=" * 65)
    print("Running OS Resource Management Simulator Test Suite")
    print("=" * 65)

    for mod_name, mod in modules:
        print(f"\nSubsystem: {mod_name}")
        for attr in dir(mod):
            if attr.startswith("test_"):
                test_func = getattr(mod, attr)
                if callable(test_func):
                    try:
                        test_func()
                        print(f"  [PASS] {attr}")
                        total_passed += 1
                    except Exception as e:
                        print(f"  [FAIL] {attr}")
                        traceback.print_exc()
                        total_failed += 1

    print("\n" + "=" * 65)
    print(f"Test Results: {total_passed} Passed, {total_failed} Failed")
    print("=" * 65)

    if total_failed > 0:
        sys.exit(1)
    else:
        print("ALL SUBSYSTEM UNIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_suite()
