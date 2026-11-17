import React, { useState } from 'react';
import { 
  Cpu, Zap, Gauge, Award, Layers, TrendingUp, 
  CheckCircle2, ArrowRight, Play, RefreshCw, AlertCircle 
} from 'lucide-react';

export default function MultiCoreGantt({ 
  multicoreResult = null, 
  onRunMultiCore, 
  loading = false 
}) {
  const [coreCount, setCoreCount] = useState(2);
  const [smpAlgorithm, setSmpAlgorithm] = useState('WORK_STEALING');

  const handleSimulate = () => {
    if (onRunMultiCore) {
      onRunMultiCore({ coreCount, smpAlgorithm });
    }
  };

  const makespan = multicoreResult?.makespan || 1;
  const coreTelemetry = multicoreResult?.core_telemetry || [];

  return (
    <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6 space-y-6">
      {/* Configuration Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#393939] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#0f62fe]" />
            <h3 className="text-base font-semibold text-white font-mono uppercase tracking-wider">
              Symmetric Multiprocessing (SMP) Multi-Core Scheduler
            </h3>
          </div>
          <p className="text-xs text-[#c6c6c6] font-light mt-0.5">
            Hardware multi-core parallel simulation with dynamic Cilk/Go-style work-stealing load balance
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Core Count Selector */}
          <div className="flex border border-[#525252] bg-[#161616]">
            {[2, 4].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCoreCount(c)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                  coreCount === c
                    ? 'bg-[#0f62fe] text-white'
                    : 'text-[#8d8d8d] hover:text-white'
                }`}
              >
                {c} Cores
              </button>
            ))}
          </div>

          {/* SMP Policy */}
          <select
            value={smpAlgorithm}
            onChange={(e) => setSmpAlgorithm(e.target.value)}
            className="bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-1.5 text-white focus:outline-none focus:border-[#0f62fe]"
          >
            <option value="WORK_STEALING">Dynamic Work-Stealing (SJF)</option>
            <option value="PARTITIONED">Static Core Affinity (No Stealing)</option>
            <option value="GLOBAL_RR">Global Shared Round-Robin</option>
          </select>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0f62fe] hover:bg-[#0353e9] text-xs font-mono uppercase font-semibold text-white transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Simulating...' : 'Simulate SMP'}
          </button>
        </div>
      </div>

      {multicoreResult && (
        <div className="space-y-6">
          {/* Executive SMP Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#161616] border border-[#393939] p-4 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                Parallel Speedup (S)
              </span>
              <p className="text-3xl font-light font-mono text-[#42be65]">
                {multicoreResult.speedup}x
              </p>
              <span className="text-[11px] font-mono text-[#8d8d8d]">
                vs {multicoreResult.single_core_makespan} ticks on 1 core
              </span>
            </div>

            <div className="bg-[#161616] border border-[#393939] p-4 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                Parallel Efficiency
              </span>
              <p className="text-3xl font-light font-mono text-[#78a9ff]">
                {multicoreResult.parallel_efficiency_pct}%
              </p>
              <span className="text-[11px] font-mono text-[#8d8d8d]">
                {multicoreResult.core_count}-core utilization factor
              </span>
            </div>

            <div className="bg-[#161616] border border-[#393939] p-4 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                SMP Wall-Clock Makespan
              </span>
              <p className="text-3xl font-light font-mono text-white">
                {multicoreResult.makespan} <span className="text-sm text-[#8d8d8d]">ticks</span>
              </p>
              <span className="text-[11px] font-mono text-[#42be65]">
                -{multicoreResult.single_core_makespan - multicoreResult.makespan} ticks saved
              </span>
            </div>

            <div className="bg-[#161616] border border-[#393939] p-4 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                Work-Stealing Events
              </span>
              <p className="text-3xl font-light font-mono text-[#f1c21b]">
                {multicoreResult.work_stealing_events}
              </p>
              <span className="text-[11px] font-mono text-[#8d8d8d]">
                Load Balance: {multicoreResult.load_balance_factor}
              </span>
            </div>
          </div>

          {/* Parallel Multi-Lane Gantt Chart */}
          <div className="bg-[#161616] border border-[#393939] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#393939] pb-2">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0f62fe]" /> Parallel Core Execution Timelines
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#78a9ff]">
                  <span className="w-2.5 h-2.5 bg-[#0f62fe]/40 border border-[#0f62fe] inline-block" /> Native Task
                </span>
                <span className="flex items-center gap-1 text-[#f1c21b]">
                  <span className="w-2.5 h-2.5 bg-[#f1c21b]/30 border border-[#f1c21b] inline-block" /> Work-Stolen Task
                </span>
                <span className="flex items-center gap-1 text-[#8d8d8d]">
                  <span className="w-2.5 h-2.5 bg-[#262626] border border-[#393939] inline-block" /> Core Idle
                </span>
              </div>
            </div>

            {/* Core Lanes */}
            <div className="space-y-3">
              {Object.keys(multicoreResult.core_gantts).map((coreKey, coreIndex) => {
                const blocks = multicoreResult.core_gantts[coreKey] || [];
                const tel = coreTelemetry.find(t => t.core_id === coreIndex);

                return (
                  <div key={coreKey} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Core Badge */}
                    <div className="sm:w-28 shrink-0 flex sm:flex-col justify-between sm:justify-center p-2 bg-[#262626] border border-[#393939] text-xs font-mono">
                      <span className="font-bold text-white uppercase">{coreKey.replace('_', ' ')}</span>
                      <span className="text-[11px] text-[#42be65]">{tel?.utilization_pct || 0}% util</span>
                    </div>

                    {/* Timeline Track */}
                    <div className="flex-1 flex h-11 bg-[#1e1e1e] border border-[#393939] overflow-x-auto relative">
                      {blocks.map((b, bIdx) => {
                        const dur = b.end_time - b.start_time;
                        const widthPct = (dur / makespan) * 100;

                        return (
                          <div
                            key={bIdx}
                            style={{ width: `${Math.max(4, widthPct)}%` }}
                            className={`h-full border-r border-[#393939] flex flex-col items-center justify-center text-xs font-mono relative transition-colors ${
                              b.is_stolen
                                ? 'bg-[#f1c21b]/20 text-[#f1c21b] border-y-2 border-y-[#f1c21b]'
                                : 'bg-[#0f62fe]/20 text-[#78a9ff]'
                            }`}
                            title={`Core ${coreIndex} running ${b.pid} from t=${b.start_time} to t=${b.end_time} (${b.is_stolen ? 'Work-Stolen' : 'Local Queue'})`}
                          >
                            <span className="font-bold text-[11px]">
                              {b.pid}
                            </span>
                            <span className="text-[9px] text-[#8d8d8d]">
                              {b.start_time}-{b.end_time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Axis Markers */}
            <div className="flex justify-between text-[10px] font-mono text-[#8d8d8d] pt-1 pl-32 pr-2">
              <span>t = 0</span>
              <span>t = {Math.round(makespan * 0.25)}</span>
              <span>t = {Math.round(makespan * 0.5)}</span>
              <span>t = {Math.round(makespan * 0.75)}</span>
              <span>t = {makespan} ticks</span>
            </div>
          </div>

          {/* Per-Core Telemetry Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {coreTelemetry.map((t) => (
              <div key={t.core_id} className="bg-[#1e1e1e] border border-[#393939] p-3 text-xs font-mono space-y-2">
                <div className="flex justify-between items-center text-white font-semibold">
                  <span>CORE {t.core_id}</span>
                  <span className="text-[#42be65]">{t.utilization_pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#161616] border border-[#393939]">
                  <div className="h-full bg-[#42be65]" style={{ width: `${t.utilization_pct}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-[#8d8d8d]">
                  <span>Active: {t.total_execution_ticks} ticks</span>
                  <span>Idle: {t.idle_ticks} ticks</span>
                </div>
              </div>
            ))}
          </div>

          {/* Verdict Callout */}
          <div className="p-3 bg-[#161616] border-l-4 border-l-[#0f62fe] border-y border-r border-[#393939] text-xs font-mono text-[#c6c6c6] flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-[#78a9ff] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-white block mb-0.5">SMP Speedup & Load Balance Analysis</span>
              {multicoreResult.verdict}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
