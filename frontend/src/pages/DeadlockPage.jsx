import React, { useState } from 'react';
import { checkDeadlock } from '../services/api';
import { Play, ShieldAlert, CheckCircle2, XCircle, Terminal } from 'lucide-react';

export default function DeadlockPage({
  processes: propProcesses,
  setProcesses: propSetProcesses,
  resources: propResources,
  setResources: propSetResources,
  available: propAvailable,
  setAvailable: propSetAvailable,
  maxMatrix: propMaxMatrix,
  setMaxMatrix: propSetMaxMatrix,
  allocationMatrix: propAllocationMatrix,
  setAllocationMatrix: propSetAllocationMatrix,
  result: propResult,
  setResult: propSetResult,
}) {
  const [localProcesses, setLocalProcesses] = useState(['P0', 'P1', 'P2', 'P3', 'P4']);
  const processes = propProcesses || localProcesses;
  const setProcesses = propSetProcesses || setLocalProcesses;

  const [localResources, setLocalResources] = useState(['A', 'B', 'C']);
  const resources = propResources || localResources;
  const setResources = propSetResources || setLocalResources;

  const [localAvailable, setLocalAvailable] = useState([3, 3, 2]);
  const available = propAvailable || localAvailable;
  const setAvailable = propSetAvailable || setLocalAvailable;

  const [localMaxMatrix, setLocalMaxMatrix] = useState([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ]);
  const maxMatrix = propMaxMatrix || localMaxMatrix;
  const setMaxMatrix = propSetMaxMatrix || setLocalMaxMatrix;

  const [localAllocationMatrix, setLocalAllocationMatrix] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ]);
  const allocationMatrix = propAllocationMatrix || localAllocationMatrix;
  const setAllocationMatrix = propSetAllocationMatrix || setLocalAllocationMatrix;

  const [localResult, setLocalResult] = useState(null);
  const result = propResult !== undefined ? propResult : localResult;
  const setResult = propSetResult || setLocalResult;

  const [loading, setLoading] = useState(false);

  const loadSafePreset = async () => {
    const p = ['P0', 'P1', 'P2', 'P3', 'P4'];
    const r = ['A', 'B', 'C'];
    const a = [3, 3, 2];
    const mm = [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ];
    const am = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ];
    setProcesses(p);
    setResources(r);
    setAvailable(a);
    setMaxMatrix(mm);
    setAllocationMatrix(am);
    setLoading(true);
    try {
      const data = await checkDeadlock({
        processes: p,
        resources: r,
        available: a,
        max_matrix: mm,
        allocation_matrix: am,
      });
      setResult(data);
    } catch (err) {
      console.error('Error running safe preset:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnsafePreset = async () => {
    const p = ['P0', 'P1', 'P2'];
    const r = ['A', 'B', 'C'];
    const a = [0, 0, 0];
    const mm = [
      [5, 5, 5],
      [4, 4, 4],
      [3, 3, 3],
    ];
    const am = [
      [2, 1, 1],
      [1, 2, 0],
      [1, 0, 2],
    ];
    setProcesses(p);
    setResources(r);
    setAvailable(a);
    setMaxMatrix(mm);
    setAllocationMatrix(am);
    setLoading(true);
    try {
      const data = await checkDeadlock({
        processes: p,
        resources: r,
        available: a,
        max_matrix: mm,
        allocation_matrix: am,
      });
      setResult(data);
    } catch (err) {
      console.error('Error running unsafe preset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (matrix, setMatrix, pIdx, rIdx, val) => {
    const updated = matrix.map((row) => [...row]);
    updated[pIdx][rIdx] = Math.max(0, Number(val));
    setMatrix(updated);
  };

  const handleRunBankers = async () => {
    setLoading(true);
    try {
      const data = await checkDeadlock({
        processes,
        resources,
        available,
        max_matrix: maxMatrix,
        allocation_matrix: allocationMatrix,
      });
      setResult(data);
    } catch (err) {
      alert('Error checking deadlock state: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Matrix Setup Panel */}
      <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#393939] pb-4">
          <h2 className="text-xl font-bold text-[#78a9ff] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#0f62fe]" />
            Banker's Algorithm Matrix Setup
          </h2>

          <button
            onClick={handleRunBankers}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-xs font-mono uppercase tracking-wider text-white font-semibold transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Analyzing...' : 'Check System Safety'}
          </button>
        </div>

        {/* Workload Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 bg-[#1e1e1e] p-2.5 border border-[#393939]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-[#8d8d8d] font-semibold">Test Presets:</span>
            <button
              onClick={loadSafePreset}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#333] border border-[#42be65]/50 text-xs font-mono text-[#42be65] hover:text-white transition-colors"
            >
              Safe State Benchmark (P1-P3-P4-P0-P2)
            </button>
            <button
              onClick={loadUnsafePreset}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#333] border border-[#fa4d56]/50 text-xs font-mono text-[#fa4d56] hover:text-white transition-colors"
            >
              Deliberate Deadlock / Unsafe
            </button>
          </div>
          <span className="text-[11px] font-mono text-[#8d8d8d] hidden sm:inline">
            Banker's Safety Invariant
          </span>
        </div>

        {/* Available Vector Input */}
        <div className="mb-6 bg-[#161616] p-4 border border-[#393939]">
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#c6c6c6] mb-3">
            Available Resources Vector
          </h3>
          <div className="flex flex-wrap gap-4">
            {resources.map((res, idx) => (
              <div key={res} className="flex items-center gap-2 bg-[#262626] border border-[#525252] px-3 py-1.5 font-mono text-xs">
                <span className="font-semibold text-[#78a9ff]">{res}:</span>
                <input
                  type="number"
                  min="0"
                  value={available[idx]}
                  onChange={(e) => {
                    const updated = [...available];
                    updated[idx] = Math.max(0, Number(e.target.value));
                    setAvailable(updated);
                  }}
                  className="w-14 bg-[#161616] border border-[#525252] px-2 py-0.5 text-white font-mono text-center focus:outline-none focus:border-[#0f62fe]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Matrices Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allocation Matrix */}
          <div className="bg-[#1e1e1e] border border-[#393939]">
            <div className="p-3 bg-[#161616] border-b border-[#393939]">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#c6c6c6]">
                Allocation Matrix
              </h3>
            </div>
            <div className="overflow-x-auto p-3">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#393939] text-[#8d8d8d]">
                    <th className="py-2 text-left font-semibold">Process</th>
                    {resources.map((r) => (<th key={r} className="py-2 font-semibold">{r}</th>))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393939]">
                  {processes.map((p, pIdx) => (
                    <tr key={p} className="hover:bg-[#262626]">
                      <td className="py-2 font-semibold text-left text-white">{p}</td>
                      {resources.map((_, rIdx) => (
                        <td key={rIdx} className="py-2">
                          <input
                            type="number"
                            min="0"
                            value={allocationMatrix[pIdx][rIdx]}
                            onChange={(e) => handleCellChange(allocationMatrix, setAllocationMatrix, pIdx, rIdx, e.target.value)}
                            className="w-12 bg-[#161616] border border-[#525252] px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-[#0f62fe]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Max Matrix */}
          <div className="bg-[#1e1e1e] border border-[#393939]">
            <div className="p-3 bg-[#161616] border-b border-[#393939]">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#c6c6c6]">
                Max Demand Matrix
              </h3>
            </div>
            <div className="overflow-x-auto p-3">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#393939] text-[#8d8d8d]">
                    <th className="py-2 text-left font-semibold">Process</th>
                    {resources.map((r) => (<th key={r} className="py-2 font-semibold">{r}</th>))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393939]">
                  {processes.map((p, pIdx) => (
                    <tr key={p} className="hover:bg-[#262626]">
                      <td className="py-2 font-semibold text-left text-white">{p}</td>
                      {resources.map((_, rIdx) => (
                        <td key={rIdx} className="py-2">
                          <input
                            type="number"
                            min="0"
                            value={maxMatrix[pIdx][rIdx]}
                            onChange={(e) => handleCellChange(maxMatrix, setMaxMatrix, pIdx, rIdx, e.target.value)}
                            className="w-12 bg-[#161616] border border-[#525252] px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-[#0f62fe]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Safety Status Banner */}
          <div className={`p-5 border-l-4 border-y border-r border-[#393939] bg-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            result.is_safe ? 'border-l-[#24a148]' : 'border-l-[#da1e28]'
          }`}>
            <div className="flex items-center gap-3">
              {result.is_safe ? (
                <CheckCircle2 className="w-6 h-6 text-[#42be65] flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-[#fa4d56] flex-shrink-0" />
              )}
              <div>
                <h3 className="text-base font-semibold text-white">
                  {result.is_safe ? 'System is in a SAFE State' : 'System is in an UNSAFE State (Deadlock Risk)'}
                </h3>
                {result.is_safe && (
                  <p className="text-xs font-mono text-[#c6c6c6] mt-1">
                    Safe Execution Sequence:{' '}
                    <span className="text-[#42be65] font-semibold">
                      {result.safe_sequence.join(' ➔ ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Need Matrix Calculated */}
          <div className="bg-[#262626] border border-[#393939]">
            <div className="p-4 border-b border-[#393939]">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-white">
                Calculated Need Matrix (Max - Allocation)
              </h3>
            </div>

            <div className="overflow-x-auto p-4 bg-[#1e1e1e]">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#393939] text-[#8d8d8d]">
                    <th className="py-2.5 text-left font-semibold">Process</th>
                    {resources.map((r) => (<th key={r} className="py-2.5 font-semibold">{r}</th>))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393939]">
                  {processes.map((p, pIdx) => (
                    <tr key={p} className="hover:bg-[#262626]">
                      <td className="py-2.5 text-left font-semibold text-white">{p}</td>
                      {resources.map((_, rIdx) => (
                        <td key={rIdx} className="py-2.5 font-semibold text-[#78a9ff]">
                          {result.need_matrix[pIdx][rIdx]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step Log Stream */}
          <div className="bg-[#262626] border border-[#393939]">
            <div className="p-3 bg-[#161616] border-b border-[#393939] flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-white">
                Execution Step Logs
              </h3>
              <span className="text-[11px] font-mono text-[#8d8d8d]">{result.execution_steps.length} STEPS</span>
            </div>
            
            <div className="p-4 font-mono text-xs text-[#c6c6c6] space-y-1.5 max-h-60 overflow-y-auto bg-[#161616]">
              {result.execution_steps.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 border-b border-[#262626] pb-1 font-light">
                  <span className="text-[#8d8d8d] select-none font-mono">&gt;</span>
                  <span className="text-[#f4f4f4]">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}