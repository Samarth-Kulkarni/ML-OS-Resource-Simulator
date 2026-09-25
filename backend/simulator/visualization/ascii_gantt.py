"""
ASCII Gantt chart and comparative performance table visualizer.
Pure Python standard library implementation without external dependencies.
"""

from typing import List
from simulator.cpu.base import SimulationMetrics, TimelineEvent


def render_ascii_gantt(metrics: SimulationMetrics, width_scale: int = 2) -> str:
    """
    Render a horizontal ASCII Gantt chart showing execution blocks and timestamps.
    """
    lines = []
    lines.append(f"\n--- Gantt Chart: {metrics.scheduler_name} ---")

    # Build the block bar
    # e.g.: |  P1  |  P4  |  P3  |  P2  |  P6  |  P5  |
    top_bar = ""
    time_bar = ""
    
    last_end = 0
    time_marks = ["0"]

    for event in metrics.timeline:
        duration = event.duration
        label = f"P{event.pid}" if not event.is_idle else "IDLE"
        block_width = max(len(label) + 2, duration * width_scale)

        # Center label in block
        inner = label.center(block_width)
        top_bar += f"|{inner}"
        
        # Track timestamp position
        end_str = str(event.end_time)
        space_len = (block_width + 1) - len(end_str)
        if space_len < 1:
            space_len = 1
        time_bar += " " * space_len + end_str

    top_bar += "|"
    
    # Boundary line
    border = "+" + "-" * (len(top_bar) - 2) + "+"
    
    lines.append(border)
    lines.append(top_bar)
    lines.append(border)
    lines.append(f"0{time_bar}")
    return "\n".join(lines)


def render_process_table(metrics: SimulationMetrics) -> str:
    """Render per-process timing and metrics table."""
    lines = []
    lines.append(f"\n[ Detailed Process Metrics: {metrics.scheduler_name} ]")
    header = f"{'PID':<6}{'Arrival':<10}{'Burst':<8}{'Start':<8}{'Finish':<9}{'Turnaround':<13}{'Waiting':<10}{'Response':<10}"
    lines.append("-" * len(header))
    lines.append(header)
    lines.append("-" * len(header))

    for p in metrics.processes:
        row = (
            f"{p.pid:<6}"
            f"{p.arrival_time:<10}"
            f"{p.burst_time:<8}"
            f"{p.start_time if p.start_time is not None else '-':<8}"
            f"{p.completion_time if p.completion_time is not None else '-':<9}"
            f"{p.turnaround_time if p.turnaround_time is not None else '-':<13}"
            f"{p.waiting_time if p.waiting_time is not None else '-':<10}"
            f"{p.response_time if p.response_time is not None else '-':<10}"
        )
        lines.append(row)
    lines.append("-" * len(header))
    return "\n".join(lines)


def render_comparison_summary(all_metrics: List[SimulationMetrics]) -> str:
    """Render side-by-side comparative summary between baseline schedulers."""
    lines = []
    lines.append("\n" + "=" * 78)
    lines.append("  BENCHMARK SUMMARY & COMPARATIVE EVALUATION".center(78))
    lines.append("=" * 78)

    names = [m.scheduler_name.split()[0] for m in all_metrics]
    header = f"{'Metric':<32}" + "".join(f"{name:>20}" for name in names)
    if len(all_metrics) >= 2:
        header += f"{'Improvement (SJF vs FCFS)':>26}"
    lines.append(header)
    lines.append("-" * len(header))

    def fmt_row(label: str, values: List[float], unit: str = "", is_lower_better: bool = True) -> str:
        row = f"{label:<32}"
        for v in values:
            row += f"{v:>18.2f} {unit:<1}"
        if len(values) >= 2:
            base, opt = values[0], values[1]
            if base != 0:
                pct = ((base - opt) / base * 100.0) if is_lower_better else ((opt - base) / base * 100.0)
                diff_str = f"{pct:+.1f}% ({'gain' if pct > 0 else 'loss'})"
            else:
                diff_str = "N/A"
            row += f"{diff_str:>24}"
        return row

    lines.append(fmt_row("Average Waiting Time", [m.avg_waiting_time for m in all_metrics], unit="t", is_lower_better=True))
    lines.append(fmt_row("Average Turnaround Time", [m.avg_turnaround_time for m in all_metrics], unit="t", is_lower_better=True))
    lines.append(fmt_row("Average Response Time", [m.avg_response_time for m in all_metrics], unit="t", is_lower_better=True))
    lines.append(fmt_row("Total Makespan", [float(m.makespan) for m in all_metrics], unit="t", is_lower_better=True))
    lines.append(fmt_row("CPU Utilization", [m.cpu_utilization_pct for m in all_metrics], unit="%", is_lower_better=False))
    lines.append(fmt_row("Throughput", [m.throughput for m in all_metrics], unit="/t", is_lower_better=False))

    lines.append("-" * len(header))
    return "\n".join(lines)


def print_comparison_report(all_metrics: List[SimulationMetrics]) -> None:
    """Print complete benchmark report with Gantt charts, tables, and comparisons."""
    for m in all_metrics:
        print(render_ascii_gantt(m))
        print(render_process_table(m))
    print(render_comparison_summary(all_metrics))
