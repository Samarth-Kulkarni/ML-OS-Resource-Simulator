from typing import List, Dict, Optional
from app.models.process import Process, ProcessResult
from app.models.multicore import (
    MultiCoreScheduleRequest, MultiCoreScheduleResponse,
    CoreGanttBlock, CoreTelemetry
)

def run_multicore_scheduling(req: MultiCoreScheduleRequest) -> MultiCoreScheduleResponse:
    procs = [p.model_copy(deep=True) for p in req.processes]
    core_count = max(1, min(8, req.core_count))
    alg = req.algorithm.upper()
    time_quantum = req.time_quantum or 2

    # Calculate 1-core baseline makespan (sum of bursts, ignoring idle gaps if all arrive at 0)
    single_core_makespan = 0
    t_curr = 0
    for p in sorted(procs, key=lambda x: x.arrival_time):
        if t_curr < p.arrival_time:
            t_curr = p.arrival_time
        t_curr += p.burst_time
    single_core_makespan = t_curr

    if alg == "PARTITIONED":
        return _simulate_partitioned(procs, core_count, single_core_makespan)
    elif alg == "GLOBAL_RR":
        return _simulate_global_rr(procs, core_count, time_quantum, single_core_makespan)
    else:  # WORK_STEALING (Default)
        return _simulate_work_stealing(procs, core_count, single_core_makespan)


def _simulate_work_stealing(
    processes: List[Process], 
    core_count: int, 
    single_core_makespan: int
) -> MultiCoreScheduleResponse:
    # State per core
    core_gantts: Dict[int, List[CoreGanttBlock]] = {c: [] for c in range(core_count)}
    core_local_queues: Dict[int, List[dict]] = {c: [] for c in range(core_count)}
    core_busy_until: Dict[int, int] = {c: 0 for c in range(core_count)}
    core_active_proc: Dict[int, Optional[dict]] = {c: None for c in range(core_count)}
    core_exec_ticks: Dict[int, int] = {c: 0 for c in range(core_count)}

    process_results: Dict[str, dict] = {
        p.pid: {
            "arrival": p.arrival_time,
            "burst": p.burst_time,
            "priority": p.priority or 0,
            "first_start": None,
            "completion": 0,
            "remaining": p.burst_time
        }
        for p in processes
    }

    stealing_events = 0
    unarrived = sorted(processes, key=lambda x: x.arrival_time)
    current_time = 0
    completed_count = 0
    total_procs = len(processes)

    while completed_count < total_procs:
        # 1. Dispatch newly arrived processes to the least loaded core queue
        while unarrived and unarrived[0].arrival_time <= current_time:
            p = unarrived.pop(0)
            # Find core with lowest queued backlog
            best_core = min(
                range(core_count),
                key=lambda c: sum(item["remaining"] for item in core_local_queues[c]) + (
                    core_active_proc[c]["remaining"] if core_active_proc[c] else 0
                )
            )
            core_local_queues[best_core].append({
                "pid": p.pid,
                "remaining": p.burst_time,
                "is_stolen": False
            })

        # 2. Check each core: if free, pick job or initiate work stealing
        for c in range(core_count):
            if core_active_proc[c] is None:
                if core_local_queues[c]:
                    # Pick next local process (SJF within local queue)
                    core_local_queues[c].sort(key=lambda x: x["remaining"])
                    chosen = core_local_queues[c].pop(0)
                    core_active_proc[c] = chosen
                else:
                    # Core queue is empty -> attempt work stealing from busiest core
                    busiest_core = max(
                        range(core_count),
                        key=lambda oc: len(core_local_queues[oc])
                    )
                    if len(core_local_queues[busiest_core]) > 0:
                        # Steal the largest job to amortize migration overhead
                        core_local_queues[busiest_core].sort(key=lambda x: x["remaining"])
                        stolen = core_local_queues[busiest_core].pop(-1)
                        stolen["is_stolen"] = True
                        core_active_proc[c] = stolen
                        stealing_events += 1

        # 3. Step forward 1 clock tick for all active cores
        any_active = any(core_active_proc[c] is not None for c in range(core_count))
        if not any_active:
            # All cores idle, advance to next process arrival
            if unarrived:
                current_time = unarrived[0].arrival_time
                continue
            else:
                break

        # Execute 1 tick
        for c in range(core_count):
            act = core_active_proc[c]
            if act is not None:
                pid = act["pid"]
                if process_results[pid]["first_start"] is None:
                    process_results[pid]["first_start"] = current_time

                core_exec_ticks[c] += 1
                act["remaining"] -= 1

                # Update or append Gantt block
                gantt = core_gantts[c]
                if gantt and gantt[-1].pid == pid and gantt[-1].end_time == current_time:
                    gantt[-1].end_time = current_time + 1
                else:
                    gantt.append(CoreGanttBlock(
                        core_id=c,
                        pid=pid,
                        start_time=current_time,
                        end_time=current_time + 1,
                        is_stolen=act.get("is_stolen", False)
                    ))

                if act["remaining"] == 0:
                    process_results[pid]["completion"] = current_time + 1
                    completed_count += 1
                    core_active_proc[c] = None

        current_time += 1

    makespan = current_time
    return _compile_multicore_response(
        core_count=core_count,
        algorithm="WORK_STEALING",
        makespan=makespan,
        single_core_makespan=single_core_makespan,
        core_gantts=core_gantts,
        core_exec_ticks=core_exec_ticks,
        process_results=process_results,
        stealing_events=stealing_events
    )


def _simulate_partitioned(
    processes: List[Process], 
    core_count: int, 
    single_core_makespan: int
) -> MultiCoreScheduleResponse:
    """Static core affinity partition: P_i assigned strictly to core (i % core_count). No stealing."""
    core_gantts: Dict[int, List[CoreGanttBlock]] = {c: [] for c in range(core_count)}
    core_exec_ticks: Dict[int, int] = {c: 0 for c in range(core_count)}
    core_time: Dict[int, int] = {c: 0 for c in range(core_count)}

    process_results: Dict[str, dict] = {}
    sorted_procs = sorted(processes, key=lambda x: (x.arrival_time, x.pid))

    for idx, p in enumerate(sorted_procs):
        c = idx % core_count
        start = max(core_time[c], p.arrival_time)
        end = start + p.burst_time

        core_gantts[c].append(CoreGanttBlock(
            core_id=c,
            pid=p.pid,
            start_time=start,
            end_time=end,
            is_stolen=False
        ))
        core_exec_ticks[c] += p.burst_time
        core_time[c] = end

        process_results[p.pid] = {
            "arrival": p.arrival_time,
            "burst": p.burst_time,
            "priority": p.priority or 0,
            "first_start": start,
            "completion": end
        }

    makespan = max(core_time.values()) if core_time else 0
    return _compile_multicore_response(
        core_count=core_count,
        algorithm="PARTITIONED",
        makespan=makespan,
        single_core_makespan=single_core_makespan,
        core_gantts=core_gantts,
        core_exec_ticks=core_exec_ticks,
        process_results=process_results,
        stealing_events=0
    )


def _simulate_global_rr(
    processes: List[Process], 
    core_count: int, 
    time_quantum: int, 
    single_core_makespan: int
) -> MultiCoreScheduleResponse:
    """
    Global Round-Robin: Single shared queue.
    Any available core dequeues a process for at most time_quantum ticks.
    Enforces SMP mutual exclusion: a single process CANNOT execute on more than
    one core at the same physical point in time. Preempted tasks re-enter the
    queue only after their time slice expires.
    """
    core_gantts: Dict[int, List[CoreGanttBlock]] = {c: [] for c in range(core_count)}
    core_exec_ticks: Dict[int, int] = {c: 0 for c in range(core_count)}
    core_active: Dict[int, Optional[dict]] = {c: None for c in range(core_count)}

    unarrived = sorted(processes, key=lambda x: (x.arrival_time, x.pid))
    ready_queue: List[dict] = []
    process_results: Dict[str, dict] = {
        p.pid: {
            "arrival": p.arrival_time,
            "burst": p.burst_time,
            "priority": p.priority or 0,
            "first_start": None,
            "completion": 0,
            "remaining": p.burst_time
        }
        for p in processes
    }

    current_time = 0
    completed_count = 0
    total_procs = len(processes)

    while completed_count < total_procs:
        # 1. Enqueue newly arrived processes into the shared global queue
        while unarrived and unarrived[0].arrival_time <= current_time:
            p = unarrived.pop(0)
            ready_queue.append({"pid": p.pid, "remaining": p.burst_time})

        # 2. Assign free cores from the shared ready queue
        for c in range(core_count):
            if core_active[c] is None and ready_queue:
                job = ready_queue.pop(0)
                pid = job["pid"]
                if process_results[pid]["first_start"] is None:
                    process_results[pid]["first_start"] = current_time
                q_len = min(time_quantum, job["remaining"])
                core_active[c] = {
                    "pid": pid,
                    "remaining": job["remaining"],
                    "quantum_left": q_len,
                    "slice_start": current_time
                }

        # 3. Advance to next event if all cores are idle
        any_active = any(core_active[c] is not None for c in range(core_count))
        if not any_active:
            if unarrived:
                current_time = unarrived[0].arrival_time
                continue
            else:
                break

        # 4. Execute 1 clock tick across all active cores
        preempted_jobs = []
        for c in range(core_count):
            act = core_active[c]
            if act is not None:
                pid = act["pid"]
                core_exec_ticks[c] += 1
                act["remaining"] -= 1
                act["quantum_left"] -= 1

                if act["remaining"] == 0:
                    # Completed execution
                    core_gantts[c].append(CoreGanttBlock(
                        core_id=c,
                        pid=pid,
                        start_time=act["slice_start"],
                        end_time=current_time + 1,
                        is_stolen=False
                    ))
                    process_results[pid]["completion"] = current_time + 1
                    completed_count += 1
                    core_active[c] = None
                elif act["quantum_left"] == 0:
                    # Time quantum expired - preempt and return to queue at current_time + 1
                    core_gantts[c].append(CoreGanttBlock(
                        core_id=c,
                        pid=pid,
                        start_time=act["slice_start"],
                        end_time=current_time + 1,
                        is_stolen=False
                    ))
                    preempted_jobs.append({"pid": pid, "remaining": act["remaining"]})
                    core_active[c] = None

        current_time += 1
        # Re-insert preempted processes to the tail of the global ready queue
        ready_queue.extend(preempted_jobs)

    makespan = current_time
    return _compile_multicore_response(
        core_count=core_count,
        algorithm="GLOBAL_RR",
        makespan=makespan,
        single_core_makespan=single_core_makespan,
        core_gantts=core_gantts,
        core_exec_ticks=core_exec_ticks,
        process_results=process_results,
        stealing_events=0
    )


def _compile_multicore_response(
    core_count: int,
    algorithm: str,
    makespan: int,
    single_core_makespan: int,
    core_gantts: Dict[int, List[CoreGanttBlock]],
    core_exec_ticks: Dict[int, int],
    process_results: Dict[str, dict],
    stealing_events: int
) -> MultiCoreScheduleResponse:
    # 1. Telemetry per core
    telemetry: List[CoreTelemetry] = []
    for c in range(core_count):
        exec_t = core_exec_ticks.get(c, 0)
        idle_t = max(0, makespan - exec_t)
        util = round((exec_t / makespan * 100), 1) if makespan > 0 else 0.0
        serviced = len(set(b.pid for b in core_gantts.get(c, [])))
        telemetry.append(CoreTelemetry(
            core_id=c,
            total_execution_ticks=exec_t,
            idle_ticks=idle_t,
            utilization_pct=util,
            processes_serviced=serviced
        ))

    # 2. Process results (TAT, WT, RT)
    p_results: List[ProcessResult] = []
    tot_wt, tot_tat = 0, 0
    for pid, data in process_results.items():
        arr = data["arrival"]
        burst = data["burst"]
        comp = data["completion"]
        tat = comp - arr
        wt = tat - burst
        rt = (data["first_start"] or arr) - arr

        tot_wt += wt
        tot_tat += tat
        p_results.append(ProcessResult(
            pid=pid,
            arrival_time=arr,
            burst_time=burst,
            priority=data.get("priority", 0),
            completion_time=comp,
            turnaround_time=tat,
            waiting_time=wt,
            response_time=rt
        ))

    avg_wt = round(tot_wt / len(p_results), 2) if p_results else 0.0
    avg_tat = round(tot_tat / len(p_results), 2) if p_results else 0.0

    # 3. Speedup & Parallel Efficiency
    speedup = round(single_core_makespan / max(1, makespan), 2)
    efficiency = round((speedup / core_count) * 100, 1)

    min_util = min(t.utilization_pct for t in telemetry) if telemetry else 0.0
    max_util = max(t.utilization_pct for t in telemetry) if telemetry else 100.0
    load_balance = round(min_util / max(1.0, max_util), 2)

    flat_gantt = []
    for c in sorted(core_gantts.keys()):
        flat_gantt.extend(core_gantts[c])

    formatted_core_gantts = {f"core_{c}": core_gantts[c] for c in core_gantts}

    verdict = (
        f"{core_count}-Core SMP {algorithm} completed workload in {makespan} ticks vs {single_core_makespan} ticks on 1 core "
        f"({speedup}x Speedup, {efficiency}% Parallel Efficiency, Load Balance Factor: {load_balance}). "
        f"{stealing_events} dynamic work-stealing job migrations occurred to prevent CPU core stalling."
    )

    return MultiCoreScheduleResponse(
        core_count=core_count,
        algorithm=algorithm,
        makespan=makespan,
        core_gantts=formatted_core_gantts,
        flat_gantt=flat_gantt,
        process_results=p_results,
        core_telemetry=telemetry,
        average_waiting_time=avg_wt,
        average_turnaround_time=avg_tat,
        single_core_makespan=single_core_makespan,
        speedup=speedup,
        parallel_efficiency_pct=efficiency,
        work_stealing_events=stealing_events,
        load_balance_factor=load_balance,
        verdict=verdict
    )
