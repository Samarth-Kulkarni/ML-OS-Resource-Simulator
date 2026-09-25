"""
Matplotlib-based graphical Gantt chart exporter (optional).
"""

from typing import List, Optional
from simulator.cpu.base import SimulationMetrics


def export_gantt_plot(metrics_list: List[SimulationMetrics], output_path: str = "gantt_comparison.png") -> bool:
    """
    Generate and save a visual Gantt chart comparing schedulers side-by-side.
    Returns True if successful, False if matplotlib is not installed.
    """
    try:
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
    except ImportError:
        return False

    n_schedulers = len(metrics_list)
    fig, axes = plt.subplots(n_schedulers, 1, figsize=(12, 3 * n_schedulers), sharex=True)
    if n_schedulers == 1:
        axes = [axes]

    colors = [
        "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
        "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"
    ]

    for idx, (ax, m) in enumerate(zip(axes, metrics_list)):
        ax.set_title(f"{m.scheduler_name} (Avg Waiting Time: {m.avg_waiting_time:.2f} ticks)", fontsize=12, fontweight="bold")
        ax.set_ylabel("Execution", fontsize=10)
        ax.set_yticks([])
        ax.grid(axis="x", linestyle="--", alpha=0.5)

        for event in m.timeline:
            if event.is_idle:
                ax.broken_barh(
                    [(event.start_time, event.duration)],
                    (0.2, 0.6),
                    facecolors="#D3D3D3",
                    edgecolor="black",
                    hatch="//"
                )
                ax.text(
                    event.start_time + event.duration / 2,
                    0.5,
                    "IDLE",
                    ha="center",
                    va="center",
                    fontsize=9,
                    color="#555555"
                )
            else:
                c = colors[(event.pid - 1) % len(colors)]
                ax.broken_barh(
                    [(event.start_time, event.duration)],
                    (0.2, 0.6),
                    facecolors=c,
                    edgecolor="black"
                )
                ax.text(
                    event.start_time + event.duration / 2,
                    0.5,
                    f"P{event.pid}",
                    ha="center",
                    va="center",
                    fontsize=10,
                    fontweight="bold",
                    color="white"
                )

        ax.set_ylim(0, 1)

    axes[-1].set_xlabel("Simulation Time (ticks)", fontsize=11)
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()
    return True
