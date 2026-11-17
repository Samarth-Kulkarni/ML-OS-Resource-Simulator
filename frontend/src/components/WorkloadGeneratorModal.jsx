import React, { useState } from 'react';
import { 
  X, Sparkles, Download, Upload, Sliders, 
  BarChart, AlertTriangle, Check, Layers, RefreshCw 
} from 'lucide-react';

export default function WorkloadGeneratorModal({
  isOpen = false,
  onClose,
  onApplyWorkload,
  currentProcesses = []
}) {
  const [distribution, setDistribution] = useState('pareto'); // 'exponential' | 'pareto' | 'gaussian' | 'uniform'
  const [processCount, setProcessCount] = useState(6);
  const [arrivalMode, setArrivalMode] = useState('staggered'); // 'simultaneous' | 'staggered'
  const [injectAnomaly, setInjectAnomaly] = useState(true);
  const [previewProcesses, setPreviewProcesses] = useState([]);

  if (!isOpen) return null;

  // Workload synthesis logic based on statistical distributions
  const generateProcesses = () => {
    const list = [];
    let currentArrival = 0;

    for (let i = 1; i <= processCount; i++) {
      let burst = 4;
      let pType = 'interactive';
      let mem = 256;
      let prio = 2;

      if (distribution === 'exponential') {
        // Expovariate: short interactive tasks
        pType = 'interactive';
        burst = Math.max(1, Math.round(-3.5 * Math.log(Math.random() || 0.001)));
        mem = [64, 128, 256][Math.floor(Math.random() * 3)];
        prio = Math.floor(Math.random() * 4) + 1;
      } else if (distribution === 'pareto') {
        // Pareto distribution: alpha = 1.5 heavy tail
        pType = 'bursty';
        const u = Math.random() || 0.001;
        burst = Math.max(1, Math.round(3.0 * Math.pow(1 - u, -1.0 / 1.5)));
        burst = Math.min(60, burst); // cap extreme tail
        mem = [256, 512, 1024][Math.floor(Math.random() * 3)];
        prio = Math.floor(Math.random() * 8) + 2;
      } else if (distribution === 'gaussian') {
        // Box-Muller Gaussian for compute batch
        pType = 'batch';
        const u1 = Math.random() || 0.001;
        const u2 = Math.random() || 0.001;
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        burst = Math.max(8, Math.round(20 + z0 * 5));
        mem = [1024, 2048, 4096][Math.floor(Math.random() * 3)];
        prio = Math.floor(Math.random() * 10) + 10;
      } else {
        // Uniform
        pType = ['interactive', 'batch', 'bursty'][Math.floor(Math.random() * 3)];
        burst = Math.floor(Math.random() * 16) + 2;
        mem = 512;
        prio = 5;
      }

      if (arrivalMode === 'staggered') {
        currentArrival += Math.floor(Math.random() * 3) + 1;
      } else {
        currentArrival = 0;
      }

      const noise = (v) => Math.max(1, Math.round(v + (Math.random() * 2 - 1)));
      const b1 = noise(burst);
      const b2 = noise(b1);
      const b3 = noise(b2);

      list.push({
        pid: `P${i}`,
        arrival_time: currentArrival,
        burst_time: burst,
        priority: prio,
        process_type: pType,
        requested_memory_mb: mem,
        static_priority: prio,
        historical_burst_avg: Number(((b1 + b2 + b3) / 3.0).toFixed(1)),
        past_burst_1: b1,
        past_burst_2: b2,
        past_burst_3: b3
      });
    }

    // Deliberate anomaly injection on one process to stress circuit breaker
    if (injectAnomaly && list.length >= 3) {
      const idx = Math.floor(list.length / 2);
      list[idx].pid = `${list[idx].pid}_Spike`;
      list[idx].burst_time = Math.max(25, list[idx].burst_time * 4);
      list[idx].historical_burst_avg = 3.0; // deceptive history
      list[idx].past_burst_1 = 3.0;
      list[idx].past_burst_2 = 2.0;
      list[idx].past_burst_3 = 3.0;
    }

    setPreviewProcesses(list);
  };

  const handleApply = () => {
    const toApply = previewProcesses.length > 0 ? previewProcesses : currentProcesses;
    if (onApplyWorkload && toApply.length > 0) {
      onApplyWorkload(toApply);
      onClose();
    }
  };

  // Export current workload to JSON
  const handleExportJSON = () => {
    const dataToExport = previewProcesses.length > 0 ? previewProcesses : currentProcesses;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `os_workload_${distribution}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import workload from JSON file
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPreviewProcesses(parsed);
          alert(`Successfully imported ${parsed.length} processes from file!`);
        } else {
          alert('Invalid JSON file format. Expected process array.');
        }
      } catch (err) {
        alert('Failed to parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#262626] border border-[#393939] max-w-2xl w-full p-6 space-y-5 animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#393939] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#0f62fe]" />
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              Synthetic Workload Distribution Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#393939] text-[#8d8d8d] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="block uppercase text-[#c6c6c6] font-semibold mb-1">
              Statistical Distribution Profile
            </label>
            <select
              value={distribution}
              onChange={(e) => setDistribution(e.target.value)}
              className="w-full bg-[#161616] border border-[#525252] px-3 py-2 text-white focus:outline-none focus:border-[#0f62fe]"
            >
              <option value="pareto">Pareto Distribution (α=1.5 Heavy-Tailed Server)</option>
              <option value="exponential">Exponential Distribution (Interactive GUI/Web)</option>
              <option value="gaussian">Gaussian Distribution (Batch Compute-Bound)</option>
              <option value="uniform">Uniform Distribution (Random Baseline)</option>
            </select>
          </div>

          <div>
            <label className="block uppercase text-[#c6c6c6] font-semibold mb-1">
              Process Count: {processCount}
            </label>
            <input
              type="range"
              min="3"
              max="20"
              value={processCount}
              onChange={(e) => setProcessCount(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          <div>
            <label className="block uppercase text-[#c6c6c6] font-semibold mb-1">
              Arrival Pattern
            </label>
            <select
              value={arrivalMode}
              onChange={(e) => setArrivalMode(e.target.value)}
              className="w-full bg-[#161616] border border-[#525252] px-3 py-2 text-white focus:outline-none focus:border-[#0f62fe]"
            >
              <option value="staggered">Staggered (Poisson arrival spacing)</option>
              <option value="simultaneous">Simultaneous (All arrive at t=0)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="anomalyToggle"
              checked={injectAnomaly}
              onChange={(e) => setInjectAnomaly(e.target.checked)}
              className="accent-[#0f62fe] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="anomalyToggle" className="cursor-pointer text-white">
              Inject Deceptive Spike Anomaly (Stress Circuit Breaker)
            </label>
          </div>
        </div>

        {/* Action Buttons to Generate or Import/Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#393939]">
          <div className="flex items-center gap-2">
            <button
              onClick={generateProcesses}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-xs font-mono uppercase font-semibold text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Synthesize Workload
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#161616] hover:bg-[#333] border border-[#525252] text-xs font-mono uppercase text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#78a9ff]" /> Export JSON
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 bg-[#161616] hover:bg-[#333] border border-[#525252] text-xs font-mono uppercase text-white transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#42be65]" /> Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

          <span className="text-[11px] font-mono text-[#8d8d8d]">
            {previewProcesses.length > 0 ? `${previewProcesses.length} generated` : 'Click Synthesize'}
          </span>
        </div>

        {/* Workload Preview Table */}
        {previewProcesses.length > 0 && (
          <div className="border border-[#393939] max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#161616] text-[#c6c6c6] uppercase tracking-wider border-b border-[#393939] sticky top-0">
                <tr>
                  <th className="px-3 py-2">PID</th>
                  <th className="px-3 py-2">Arrival</th>
                  <th className="px-3 py-2">Burst</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Hist. Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#393939] bg-[#1e1e1e]">
                {previewProcesses.map((p) => (
                  <tr key={p.pid} className="hover:bg-[#262626]">
                    <td className="px-3 py-1.5 font-bold text-white flex items-center gap-1">
                      {p.pid.includes('Spike') && <AlertTriangle className="w-3 h-3 text-[#ff832b]" />}
                      {p.pid}
                    </td>
                    <td className="px-3 py-1.5 text-[#c6c6c6]">{p.arrival_time}</td>
                    <td className="px-3 py-1.5 text-white font-semibold">{p.burst_time}</td>
                    <td className="px-3 py-1.5 text-[#78a9ff]">{p.process_type}</td>
                    <td className="px-3 py-1.5 text-[#be95ff]">{p.historical_burst_avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#393939]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#161616] hover:bg-[#333] border border-[#525252] text-xs font-mono uppercase text-[#c6c6c6] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={previewProcesses.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-[#42be65] hover:bg-[#349e53] text-xs font-mono uppercase font-bold text-black transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Load Into Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
