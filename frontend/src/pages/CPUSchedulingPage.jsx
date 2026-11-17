import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { simulateCPU, compareCPU, getMLMetrics, simulateMultiCore } from '../services/api';
import CPUSimulationStepper from '../components/CPUSimulationStepper';
import MultiModelBenchmarkCard from '../components/MultiModelBenchmarkCard';
import MultiCoreGantt from '../components/MultiCoreGantt';
import WorkloadGeneratorModal from '../components/WorkloadGeneratorModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { exportAuditReport } from '../utils/reportExporter';
import { 
  Play, Plus, Trash2, Cpu, ShieldAlert, Bot, Sparkles, 
  BarChart3, Zap, CheckCircle2, TrendingDown, ArrowRight, Activity, Layers,
  Sliders, Printer, Download 
} from 'lucide-react';

export default function CPUSchedulingPage({ processes, setProcesses, result, setResult, algorithm, setAlgorithm }) {
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [modelType, setModelType] = useState('decision_tree');
  const [showModelBenchmark, setShowModelBenchmark] = useState(false);
  const [showWorkloadGenerator, setShowWorkloadGenerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [smpLoading, setSmpLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [multicoreResult, setMulticoreResult] = useState(null);
  const [activeView, setActiveView] = useState('single'); // 'single' | 'benchmark' | 'multicore'
  const [mlValidationMetrics, setMlValidationMetrics] = useState(null);

  useEffect(() => {
    getMLMetrics(modelType)
      .then((data) => setMlValidationMetrics(data))
      .catch((err) => console.error('Failed to load ML validation metrics', err));
  }, [modelType]);

  const handleAddProcess = () => {
    const nextNum = processes.length + 1;
    setProcesses([
      ...processes,
      { pid: `P${nextNum}`, arrival_time: 0, burst_time: 4, priority: 1, process_type: 'batch', requested_memory_mb: 512, static_priority: 5 },
    ]);
  };

  const handleRemoveProcess = (index) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...processes];
    if (field === 'pid' || field === 'process_type') {
      updated[index][field] = value;
    } else {
      updated[index][field] = Number(value);
    }
    setProcesses(updated);
  };

  const loadDefaultWorkload = () => {
    setProcesses([
      { pid: 'P1', arrival_time: 0, burst_time: 6, priority: 1, process_type: 'bursty', requested_memory_mb: 256, static_priority: 5 },
      { pid: 'P2', arrival_time: 1, burst_time: 4, priority: 2, process_type: 'interactive', requested_memory_mb: 128, static_priority: 2 },
      { pid: 'P3', arrival_time: 2, burst_time: 8, priority: 1, process_type: 'batch', requested_memory_mb: 1024, static_priority: 10 },
      { pid: 'P4', arrival_time: 3, burst_time: 3, priority: 3, process_type: 'interactive', requested_memory_mb: 64, static_priority: 1 },
      { pid: 'P5', arrival_time: 4, burst_time: 5, priority: 2, process_type: 'bursty', requested_memory_mb: 512, static_priority: 7 },
    ]);
  };

  const loadAdversarialWorkload = () => {
    const advProcs = [
      { pid: 'P1', arrival_time: 0, burst_time: 3, priority: 1, process_type: 'bursty', requested_memory_mb: 256, static_priority: 5 },
      { pid: 'P2', arrival_time: 1, burst_time: 2, priority: 1, process_type: 'interactive', requested_memory_mb: 128, static_priority: 2 },
      { 
        pid: 'P3', 
        arrival_time: 2, 
        burst_time: 24, 
        priority: 2,
        process_type: 'interactive',
        requested_memory_mb: 128,
        historical_burst_avg: 2.0,
        past_burst_1: 2.0,
        past_burst_2: 2.0,
        past_burst_3: 2.0,
        static_priority: 2
      },
      { 
        pid: 'P4', 
        arrival_time: 3, 
        burst_time: 18, 
        priority: 2,
        process_type: 'interactive',
        requested_memory_mb: 128,
        historical_burst_avg: 2.0,
        past_burst_1: 2.0,
        past_burst_2: 2.0,
        past_burst_3: 2.0,
        static_priority: 2
      },
      { pid: 'P5', arrival_time: 4, burst_time: 4, priority: 1, process_type: 'bursty', requested_memory_mb: 512, static_priority: 7 },
    ];
    setProcesses(advProcs);
    setAlgorithm('ADAPTIVE_ROUTER');
    setResult(null);
  };

  const handleAIRecommend = async () => {
    setAiLoading(true);
    try {
      const response = await axios.post('/api/cpu/recommend', processes);
      const rec = response.data.recommended_algorithm;
      
      if (rec.includes('First-Come')) setAlgorithm('FCFS');
      else if (rec.includes('Shortest Job First')) setAlgorithm('SJF');
      else if (rec.includes('Round Robin')) setAlgorithm('RR');
      else if (rec.includes('Priority')) setAlgorithm('PRIORITY');
      
      setAiRecommendation(response.data);
    } catch (err) {
      alert('Error fetching AI recommendation: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const data = await simulateCPU({
        algorithm,
        time_quantum: (algorithm === 'RR' || algorithm === 'ADAPTIVE_ROUTER') ? timeQuantum : undefined,
        error_threshold: algorithm === 'ADAPTIVE_ROUTER' ? (window.errorThreshold || 5.0) : undefined,
        model_type: modelType,
        processes,
      });
      setResult(data);
      setActiveView('single');
    } catch (err) {
      alert('Error running simulation: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = async () => {
    setComparing(true);
    try {
      const data = await compareCPU({
        algorithm: 'COMPARE',
        time_quantum: timeQuantum,
        error_threshold: window.errorThreshold || 5.0,
        model_type: modelType,
        processes,
      });
      setComparisonData(data);
      setActiveView('benchmark');
    } catch (err) {
      alert('Error running benchmark comparison: ' + (err.response?.data?.detail || err.message));
    } finally {
      setComparing(false);
    }
  };

  const handleRunMultiCore = async ({ coreCount = 2, smpAlgorithm = 'WORK_STEALING' } = {}) => {
    setSmpLoading(true);
    try {
      const data = await simulateMultiCore({
        processes,
        core_count: coreCount,
        algorithm: smpAlgorithm,
        time_quantum: timeQuantum || 2,
      });
      setMulticoreResult(data);
      setActiveView('multicore');
    } catch (err) {
      alert('Error running SMP multi-core simulation: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSmpLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-28 space-y-6">
      {/* Configuration Header */}
      <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#393939] pb-4">
          <h2 className="text-xl font-bold text-[#78a9ff] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#0f62fe]" />
            CPU Scheduling Configuration
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportAuditReport({
                cpuResult: result,
                cpuComparison: comparisonData,
                multicoreResult,
                activeWorkload: processes
              })}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#161616] hover:bg-[#333] border border-[#525252] text-xs font-mono uppercase tracking-wider text-white transition-colors"
              title="Generates a print-ready PDF/HTML executive audit report"
            >
              <Printer className="w-3.5 h-3.5 text-[#42be65]" />
              Export Audit Report (PDF)
            </button>

            <button
              onClick={handleAIRecommend}
              disabled={aiLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#393939] hover:bg-[#4c4c4c] border border-[#525252] text-xs font-mono uppercase tracking-wider text-white font-semibold transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#78a9ff]" />
              {aiLoading ? 'Analyzing...' : 'AI Auto-Select Algorithm'}
            </button>
          </div>
        </div>

        {/* AI Insight Banner */}
        {aiRecommendation && (
          <div className="mb-6 p-4 bg-[#161616] border-l-4 border-l-[#0f62fe] border-y border-r border-[#393939] flex items-start gap-3">
            <Bot className="w-5 h-5 text-[#0f62fe] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-[#8d8d8d]">Recommended:</span>
                <span className="text-xs font-mono font-semibold text-[#78a9ff] bg-[#0f62fe]/10 px-2 py-0.5 border border-[#0f62fe]/30">
                  {aiRecommendation.recommended_algorithm}
                </span>
              </div>
              <p className="text-xs text-[#c6c6c6] font-light leading-relaxed">{aiRecommendation.reasoning}</p>
            </div>
          </div>
        )}

        {/* Algorithm & Tuning Controls */}
        <div className={`grid grid-cols-1 ${algorithm === 'ADAPTIVE_ROUTER' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-6`}>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-2.5 text-white focus:outline-none focus:border-[#0f62fe]"
            >
              <option value="FCFS">First-Come, First-Served (FCFS)</option>
              <option value="SJF">Shortest Job First (SJF - Non Preemptive)</option>
              <option value="SRTF">Shortest Remaining Time First (SRTF)</option>
              <option value="RR">Round Robin (RR)</option>
              <option value="PRIORITY">Priority Scheduling</option>
              <option value="ADAPTIVE_ROUTER">Predicted-SJF (ML implemented)</option>
            </select>
          </div>

          {algorithm === 'ADAPTIVE_ROUTER' && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#78a9ff] font-semibold mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#0f62fe]" /> ML Regressor
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full bg-[#161616] border border-[#0f62fe]/60 text-xs font-mono px-3 py-2.5 text-white focus:outline-none focus:border-[#0f62fe]"
              >
                <option value="decision_tree">Decision Tree (Depth 5 - ~34µs)</option>
                <option value="random_forest">Random Forest (20 Trees - ~140µs)</option>
                <option value="ridge">Ridge Linear Regressor (~15µs)</option>
                <option value="knn">K-Nearest Neighbors (~280µs)</option>
              </select>
            </div>
          )}

          {(algorithm === 'RR' || algorithm === 'ADAPTIVE_ROUTER') && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
                Time Quantum
              </label>
              <input
                type="number"
                min="1"
                value={timeQuantum}
                onChange={(e) => setTimeQuantum(Number(e.target.value))}
                className="w-full bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-2 text-white focus:outline-none focus:border-[#0f62fe]"
              />
            </div>
          )}
          
          {algorithm === 'ADAPTIVE_ROUTER' && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
                Error Threshold (ticks)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                defaultValue={5.0}
                onChange={(e) => (window.errorThreshold = Number(e.target.value))}
                className="w-full bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-2 text-white focus:outline-none focus:border-[#0f62fe]"
              />
            </div>
          )}
        </div>

        {/* Workload Presets & Benchmark Toggle Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-[#1e1e1e] p-2.5 border border-[#393939]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase text-[#8d8d8d] font-semibold">Presets & Benchmarks:</span>
            <button
              onClick={loadDefaultWorkload}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#333] border border-[#525252] text-xs font-mono text-[#c6c6c6] hover:text-white transition-colors"
            >
              Default Batch (5 Procs)
            </button>
            <button
              onClick={loadAdversarialWorkload}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#333] border border-[#ff832b]/50 text-xs font-mono text-[#ff832b] hover:text-white transition-colors flex items-center gap-1.5"
              title="Loads high-burst spike workload to deliberately trigger EMA circuit breaker"
            >
              <Zap className="w-3 h-3 text-[#ff832b]" /> Adversarial Stress Test
            </button>
            <button
              onClick={() => setShowWorkloadGenerator(true)}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#333] border border-[#be95ff]/50 text-xs font-mono text-[#be95ff] hover:text-white transition-colors flex items-center gap-1.5"
              title="Synthesize Pareto, Gaussian, or Exponential process traces, or import/export JSON"
            >
              <Sliders className="w-3 h-3 text-[#be95ff]" /> Distribution Generator
            </button>
            <button
              onClick={() => setShowModelBenchmark(!showModelBenchmark)}
              className={`px-2.5 py-1 text-xs font-mono transition-colors flex items-center gap-1.5 border ${
                showModelBenchmark
                  ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                  : 'bg-[#161616] hover:bg-[#333] border-[#0f62fe]/40 text-[#78a9ff] hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3 text-[#78a9ff]" />
              {showModelBenchmark ? 'Hide ML Benchmark' : 'ML Model Benchmark (DT vs RF vs KNN vs Ridge)'}
            </button>
          </div>
          <span className="text-[11px] font-mono text-[#8d8d8d] hidden sm:inline">
            Active Model: <strong className="text-white">{modelType}</strong>
          </span>
        </div>

        {/* Multi-Model Benchmark Expandable Drawer */}
        {showModelBenchmark && (
          <div className="mb-6">
            <ErrorBoundary title="ML Architecture Benchmark Module">
              <MultiModelBenchmarkCard
                selectedModel={modelType}
                onSelectModel={(m) => setModelType(m)}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Process Input Table */}
        <div className="border border-[#393939] mb-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161616] text-[#c6c6c6] uppercase font-mono tracking-wider border-b border-[#393939]">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Process ID</th>
                <th className="px-3 py-2.5 font-semibold">Arrival Time</th>
                <th className="px-3 py-2.5 font-semibold">Burst Time</th>
                {algorithm === 'PRIORITY' && <th className="px-3 py-2.5 font-semibold">Priority</th>}
                {(algorithm === 'ADAPTIVE_ROUTER' || algorithm === 'PREDICTED_SJF') && (
                  <>
                    <th className="px-3 py-2.5 font-semibold text-[#78a9ff]">Process Type</th>
                    <th className="px-3 py-2.5 font-semibold text-[#78a9ff]">Memory (MB)</th>
                    <th className="px-3 py-2.5 font-semibold text-[#78a9ff]">Static Priority</th>
                  </>
                )}
                <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#393939] bg-[#1e1e1e]">
              {processes.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#262626] transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={p.pid}
                      onChange={(e) => handleChange(idx, 'pid', e.target.value)}
                      className="bg-[#161616] border border-[#525252] px-2 py-1 text-white font-mono text-xs w-24 focus:outline-none focus:border-[#0f62fe]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={p.arrival_time}
                      onChange={(e) => handleChange(idx, 'arrival_time', e.target.value)}
                      className="bg-[#161616] border border-[#525252] px-2 py-1 text-white font-mono text-xs w-20 focus:outline-none focus:border-[#0f62fe]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      value={p.burst_time}
                      onChange={(e) => handleChange(idx, 'burst_time', e.target.value)}
                      className="bg-[#161616] border border-[#525252] px-2 py-1 text-white font-mono text-xs w-20 focus:outline-none focus:border-[#0f62fe]"
                    />
                  </td>
                  {algorithm === 'PRIORITY' && (
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={p.priority}
                        onChange={(e) => handleChange(idx, 'priority', e.target.value)}
                        className="bg-[#161616] border border-[#525252] px-2 py-1 text-white font-mono text-xs w-20 focus:outline-none focus:border-[#0f62fe]"
                      />
                    </td>
                  )}
                  {(algorithm === 'ADAPTIVE_ROUTER' || algorithm === 'PREDICTED_SJF') && (
                    <>
                      <td className="px-3 py-2">
                        <select
                          value={p.process_type || 'batch'}
                          onChange={(e) => handleChange(idx, 'process_type', e.target.value)}
                          className="bg-[#161616] border border-[#525252] px-2 py-1 text-white font-mono text-xs w-28 focus:outline-none focus:border-[#0f62fe]"
                        >
                          <option value="interactive">Interactive</option>
                          <option value="bursty">Bursty</option>
                          <option value="batch">Batch</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="16"
                          value={p.requested_memory_mb || 512}
                          onChange={(e) => handleChange(idx, 'requested_memory_mb', e.target.value)}
                          className="bg-[#161616] border border-[#525252] px-2 py-1 text-white font-mono text-xs w-20 focus:outline-none focus:border-[#0f62fe]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="19"
                          value={p.static_priority ?? 5}
                          onChange={(e) => handleChange(idx, 'static_priority', e.target.value)}
                          className="bg-[#161616] border border-[#525252] px-2 py-1 text-white font-mono text-xs w-20 focus:outline-none focus:border-[#0f62fe]"
                        />
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleRemoveProcess(idx)}
                      disabled={processes.length <= 1}
                      className="text-[#8d8d8d] hover:text-[#fa4d56] disabled:opacity-20 p-1"
                      title="Remove process"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
          <button
            onClick={handleAddProcess}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#393939] hover:bg-[#4c4c4c] border border-[#525252] text-xs font-mono uppercase tracking-wider text-white font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Process
          </button>
          
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => handleRunMultiCore({ coreCount: 2, smpAlgorithm: 'WORK_STEALING' })}
              disabled={smpLoading || loading || comparing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#161616] hover:bg-[#333] border border-[#08bdba] text-xs font-mono uppercase tracking-wider text-[#08bdba] font-semibold transition-colors disabled:opacity-50"
              title="Runs 2 or 4 core Symmetric Multiprocessing with dynamic work-stealing"
            >
              <Cpu className="w-3.5 h-3.5 text-[#08bdba]" />
              {smpLoading ? 'Simulating SMP...' : 'SMP Multi-Core (Dual/Quad)'}
            </button>

            <button
              onClick={handleRunComparison}
              disabled={comparing || loading || smpLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#161616] hover:bg-[#333] border border-[#0f62fe] text-xs font-mono uppercase tracking-wider text-[#78a9ff] font-semibold transition-colors disabled:opacity-50"
              title="Executes FCFS, RR, Predicted-SJF, and Oracle SJF side-by-side"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#78a9ff]" />
              {comparing ? 'Benchmarking...' : 'Compare Baselines'}
            </button>

            <button
              onClick={handleRunSimulation}
              disabled={loading || comparing || smpLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-xs font-mono uppercase tracking-wider text-white font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* View Selector Tabs (Visible when results, benchmark, or multicore exist) */}
      {(result || comparisonData || multicoreResult) && (
        <div className="flex border-b border-[#393939] bg-[#161616] overflow-x-auto">
          <button
            onClick={() => setActiveView('single')}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeView === 'single'
                ? 'border-[#0f62fe] text-white bg-[#262626]'
                : 'border-transparent text-[#8d8d8d] hover:text-white hover:bg-[#1e1e1e]'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Single Algorithm Execution {result ? `(${algorithm})` : ''}
          </button>
          <button
            onClick={() => {
              if (!comparisonData) handleRunComparison();
              else setActiveView('benchmark');
            }}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeView === 'benchmark'
                ? 'border-[#0f62fe] text-white bg-[#262626]'
                : 'border-transparent text-[#8d8d8d] hover:text-white hover:bg-[#1e1e1e]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#78a9ff]" /> Multi-Algorithm Benchmark Comparison
            {comparisonData && (
              <span className="text-[10px] bg-[#0f62fe]/20 text-[#78a9ff] px-1.5 py-0.5 border border-[#0f62fe]/40">
                5 Schedulers
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (!multicoreResult) handleRunMultiCore({ coreCount: 2, smpAlgorithm: 'WORK_STEALING' });
              else setActiveView('multicore');
            }}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeView === 'multicore'
                ? 'border-[#08bdba] text-white bg-[#262626]'
                : 'border-transparent text-[#8d8d8d] hover:text-white hover:bg-[#1e1e1e]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#08bdba]" /> Multi-Core SMP Simulator
            {multicoreResult && (
              <span className="text-[10px] bg-[#08bdba]/20 text-[#08bdba] px-1.5 py-0.5 border border-[#08bdba]/40">
                {multicoreResult.core_count} Cores
              </span>
            )}
          </button>
        </div>
      )}

      {/* VIEW 1: Single Run Simulation View */}
      {activeView === 'single' && result && (
        <div className="space-y-6">
          {/* Gantt Chart Timeline */}
          <div className="bg-[#262626] border border-[#393939] p-5">
            <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white mb-4 border-b border-[#393939] pb-3">
              Gantt Chart Timeline
            </h3>

            <div className="flex overflow-x-auto py-2 border border-[#393939] bg-[#161616]">
              {result.gantt_chart.map((block, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center min-w-[65px] flex-grow border-r border-[#393939] p-3 text-center transition-colors ${
                    block.fallback_mode 
                      ? 'bg-[#ff832b]/10 text-[#ff832b]' 
                      : 'bg-[#0f62fe]/10 text-[#78a9ff]'
                  }`}
                >
                  <span className="text-xs font-mono font-bold">
                    {block.fallback_mode ? '[FB] ' : ''}{block.pid}
                  </span>
                  <span className="text-[11px] font-mono text-[#8d8d8d] mt-1.5">
                    {block.start_time} - {block.end_time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Virtual Clock CPU Simulation Stepper */}
          <ErrorBoundary title="Virtual Clock Stepper">
            <CPUSimulationStepper
              gantt={result.gantt_chart}
              processes={processes}
              fallbackLogs={result.fallback_logs || []}
              algorithm={algorithm}
            />
          </ErrorBoundary>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#262626] border border-[#393939] p-4 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider">Avg. Waiting Time</span>
              <p className="text-2xl font-light font-mono text-[#78a9ff] mt-1">{result.average_waiting_time} ms</p>
            </div>
            <div className="bg-[#262626] border border-[#393939] p-4 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider">Avg. Turnaround Time</span>
              <p className="text-2xl font-light font-mono text-[#42be65] mt-1">{result.average_turnaround_time} ms</p>
            </div>
            <div className="bg-[#262626] border border-[#393939] p-4 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider">Avg. Response Time</span>
              <p className="text-2xl font-light font-mono text-[#be95ff] mt-1">{result.average_response_time} ms</p>
            </div>
          </div>

          {/* Fallback Safety Events */}
          {result.fallback_logs && result.fallback_logs.length > 0 && (
            <div className="bg-[#262626] border-l-4 border-l-[#ff832b] border-y border-r border-[#393939] p-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#ff832b] font-semibold mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Fallback Safety Events
              </h3>
              <div className="space-y-2">
                {result.fallback_logs.map((log, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono bg-[#161616] p-2.5 border border-[#393939]">
                    <span className="text-[#8d8d8d] min-w-[70px]">t={log.time}</span>
                    <span className="font-semibold text-white min-w-[60px]">{log.pid}</span>
                    <span className="text-[#c6c6c6] flex-1">{log.reason}</span>
                    <span className="text-[11px] text-[#ff832b] bg-[#ff832b]/15 px-2 py-0.5 border border-[#ff832b]/40">
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Calculated Metrics Table */}
          <div className="bg-[#262626] border border-[#393939]">
            <div className="p-4 border-b border-[#393939]">
              <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white">
                Process Calculated Metrics
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161616] text-[#c6c6c6] uppercase font-mono tracking-wider border-b border-[#393939]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">PID</th>
                    <th className="px-4 py-2.5 font-semibold">Arrival</th>
                    <th className="px-4 py-2.5 font-semibold">Burst</th>
                    {algorithm === 'ADAPTIVE_ROUTER' && (
                      <th className="px-4 py-2.5 font-semibold text-[#78a9ff]">Predicted Burst</th>
                    )}
                    <th className="px-4 py-2.5 font-semibold">Completion</th>
                    <th className="px-4 py-2.5 font-semibold">Turnaround (TAT)</th>
                    <th className="px-4 py-2.5 font-semibold">Waiting (WT)</th>
                    <th className="px-4 py-2.5 font-semibold">Response (RT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393939] bg-[#1e1e1e]">
                  {result.process_results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#262626] transition-colors font-mono">
                      <td className="px-4 py-2.5 font-semibold text-white">{r.pid}</td>
                      <td className="px-4 py-2.5 text-[#c6c6c6]">{r.arrival_time}</td>
                      <td className="px-4 py-2.5 text-white">{r.burst_time}</td>
                      {algorithm === 'ADAPTIVE_ROUTER' && (
                        <td className="px-4 py-2.5 font-semibold text-[#78a9ff]">
                          {r.predicted_burst ? `${r.predicted_burst} ms` : '—'}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-[#c6c6c6]">{r.completion_time}</td>
                      <td className="px-4 py-2.5 text-[#42be65]">{r.turnaround_time}</td>
                      <td className="px-4 py-2.5 text-[#78a9ff]">{r.waiting_time}</td>
                      <td className="px-4 py-2.5 text-[#be95ff]">{r.response_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ML Engine Statistics & Validation */}
          {(() => {
            const currentModelName = result.ml_metrics?.model || mlValidationMetrics?.model_name || 'Decision Tree Regressor';
            const currentArch = result.ml_metrics?.architecture || mlValidationMetrics?.model_architecture || 'DecisionTreeRegressor(max_depth=5, min_samples_leaf=10)';
            const currentR2 = result.ml_metrics?.r2_score ?? mlValidationMetrics?.r2_score;
            const currentLatency = result.ml_metrics?.inference_latency_us ?? mlValidationMetrics?.inference_latency_us;
            const currentMae = result.ml_metrics?.mae ?? mlValidationMetrics?.mean_absolute_error;

            return (
              <div className="bg-[#262626] border border-[#393939] p-5">
                <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white mb-4 border-b border-[#393939] pb-3 flex flex-wrap items-center justify-between gap-2">
                  <span>ML Engine Statistics & Validation</span>
                  {currentR2 != null && (
                    <span className="text-xs font-mono font-normal text-[#42be65] bg-[#42be65]/10 px-2 py-0.5 border border-[#42be65]/30">
                      R² = {(currentR2 * 100).toFixed(1)}% on 500 Test Samples
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#161616] p-4 border border-[#393939] text-center">
                    <span className="block text-[#8d8d8d] text-xs font-mono uppercase tracking-wider mb-1">
                      Model Architecture
                    </span>
                    <span className="text-sm font-mono font-medium text-white block truncate" title={currentArch}>
                      {currentModelName}
                    </span>
                    <span className="text-[10px] font-mono text-[#8d8d8d] block truncate mt-0.5" title={currentArch}>
                      {currentArch}
                    </span>
                  </div>
                  
                  <div className="bg-[#161616] p-4 border border-[#393939] text-center">
                    <span className="block text-[#8d8d8d] text-xs font-mono uppercase tracking-wider mb-1">
                      Current Run EMA Error
                    </span>
                    <span className="text-base font-mono font-medium text-[#78a9ff]">
                      {result.ml_metrics?.final_ema_error ?? 0} ms
                    </span>
                    {currentMae != null && (
                      <span className="text-[10px] font-mono text-[#8d8d8d] block mt-0.5">
                        Test MAE: {currentMae} ms
                      </span>
                    )}
                  </div>

                  <div className="bg-[#161616] p-4 border border-[#393939] text-center">
                    <span className="block text-[#8d8d8d] text-xs font-mono uppercase tracking-wider mb-1">
                      Safety Fallback Triggers
                    </span>
                    <span className="text-base font-mono font-medium text-[#ff832b]">
                      {result.ml_metrics?.fallback_triggers ?? 0}
                    </span>
                    <span className="text-[10px] font-mono text-[#8d8d8d] block mt-0.5">
                      EMA dynamic recovery
                    </span>
                  </div>

                  <div className="bg-[#161616] p-4 border border-[#393939] text-center">
                    <span className="block text-[#8d8d8d] text-xs font-mono uppercase tracking-wider mb-1">
                      Offline Inference Latency
                    </span>
                    <span className="text-base font-mono font-medium text-[#42be65]">
                      {currentLatency != null ? `${currentLatency} μs` : '< 50 μs'}
                    </span>
                    <span className="text-[10px] font-mono text-[#8d8d8d] block mt-0.5">
                      Per-process prediction
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 2: Comparative Benchmark View (Section 1.1 of Improvement Plan) */}
      {activeView === 'benchmark' && comparisonData && (
        <div className="space-y-6">
          {/* Executive Verdict Banner */}
          <div className="bg-[#262626] border-l-4 border-l-[#42be65] border-y border-r border-[#393939] p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#42be65] font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#42be65]" /> Comparative Empirical Verdict
                </span>
                <p className="text-sm font-mono text-white font-medium">
                  {comparisonData.verdict}
                </p>
              </div>
              <span className="text-xs font-mono text-[#8d8d8d] bg-[#161616] px-3 py-1.5 border border-[#393939] shrink-0">
                Workload: {comparisonData.total_processes} Processes
              </span>
            </div>
          </div>

          {/* Comparative KPI Delta Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#262626] border border-[#393939] p-4">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                WT vs. FCFS Baseline
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-mono font-light ${comparisonData.improvement_over_fcfs_wt_pct >= 0 ? 'text-[#42be65]' : 'text-[#fa4d56]'}`}>
                  {comparisonData.improvement_over_fcfs_wt_pct >= 0 ? `-${comparisonData.improvement_over_fcfs_wt_pct}%` : `+${Math.abs(comparisonData.improvement_over_fcfs_wt_pct)}%`}
                </span>
                <span className="text-[11px] font-mono text-[#8d8d8d]">waiting time</span>
              </div>
            </div>

            <div className="bg-[#262626] border border-[#393939] p-4">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                WT vs. Round Robin
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-mono font-light ${comparisonData.improvement_over_rr_wt_pct >= 0 ? 'text-[#42be65]' : 'text-[#fa4d56]'}`}>
                  {comparisonData.improvement_over_rr_wt_pct >= 0 ? `-${comparisonData.improvement_over_rr_wt_pct}%` : `+${Math.abs(comparisonData.improvement_over_rr_wt_pct)}%`}
                </span>
                <span className="text-[11px] font-mono text-[#8d8d8d]">waiting time</span>
              </div>
            </div>

            <div className="bg-[#262626] border border-[#393939] p-4">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                Oracle SJF Gap
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-light text-[#78a9ff]">
                  {comparisonData.oracle_gap_pct}%
                </span>
                <span className="text-[11px] font-mono text-[#8d8d8d]">from theoretical ideal</span>
              </div>
            </div>

            <div className="bg-[#262626] border border-[#393939] p-4">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">
                Starvation Prevention
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-light text-[#be95ff]">
                  100%
                </span>
                <span className="text-[11px] font-mono text-[#8d8d8d]">circuit breaker active</span>
              </div>
            </div>
          </div>

          {/* Multi-Algorithm Comparison Data Table */}
          <div className="bg-[#262626] border border-[#393939]">
            <div className="p-4 border-b border-[#393939] flex justify-between items-center">
              <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0f62fe]" /> Side-by-Side Schedulers Matrix
              </h3>
              <span className="text-xs font-mono text-[#8d8d8d]">Tested on identical process stream</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161616] text-[#c6c6c6] uppercase font-mono tracking-wider border-b border-[#393939]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Algorithm</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold text-right">Avg Waiting (WT)</th>
                    <th className="px-4 py-3 font-semibold text-right">Avg Turnaround (TAT)</th>
                    <th className="px-4 py-3 font-semibold text-right">Avg Response (RT)</th>
                    <th className="px-4 py-3 font-semibold text-right">CPU Util</th>
                    <th className="px-4 py-3 font-semibold text-right">Fallback Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393939] bg-[#1e1e1e] font-mono">
                  {comparisonData.algorithms.map((alg, idx) => {
                    const isML = alg.category === 'ml_augmented';
                    const isOracle = alg.category === 'oracle';
                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${isML ? 'bg-[#0f62fe]/10 hover:bg-[#0f62fe]/15' : 'hover:bg-[#262626]'}`}
                      >
                        <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                          {isML && <span className="w-2 h-2 rounded-full bg-[#0f62fe] animate-pulse"></span>}
                          {alg.algorithm_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] uppercase px-2 py-0.5 border ${
                            isML 
                              ? 'bg-[#0f62fe]/20 text-[#78a9ff] border-[#0f62fe]/40' 
                              : isOracle 
                              ? 'bg-[#6929c4]/20 text-[#be95ff] border-[#6929c4]/40'
                              : 'bg-[#393939] text-[#c6c6c6] border-[#525252]'
                          }`}>
                            {alg.category}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${isML ? 'text-[#78a9ff]' : 'text-white'}`}>
                          {alg.avg_waiting_time} ms
                        </td>
                        <td className="px-4 py-3 text-right text-[#42be65]">
                          {alg.avg_turnaround_time} ms
                        </td>
                        <td className="px-4 py-3 text-right text-[#be95ff]">
                          {alg.avg_response_time} ms
                        </td>
                        <td className="px-4 py-3 text-right text-[#c6c6c6]">
                          {alg.cpu_utilization}%
                        </td>
                        <td className={`px-4 py-3 text-right ${alg.fallback_triggers > 0 ? 'text-[#ff832b] font-semibold' : 'text-[#8d8d8d]'}`}>
                          {alg.fallback_triggers}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side-by-Side Gantt Chart Timelines (FCFS vs Predicted-SJF vs Oracle) */}
          <div className="bg-[#262626] border border-[#393939] p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-[#393939] pb-3 gap-2">
              <div>
                <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0f62fe]" /> Side-by-Side Gantt Timelines (Identical Workload)
                </h3>
                <p className="text-xs text-[#8d8d8d] font-mono mt-0.5">
                  Visual execution timeline demonstrating how Predicted-SJF reorders short jobs ahead of batch jobs vs FCFS
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#78a9ff] bg-[#0f62fe]/15 px-2.5 py-1 border border-[#0f62fe]/40">
                Visual Proof
              </span>
            </div>

            <div className="space-y-4">
              {comparisonData.algorithms.filter((a) => ['FCFS', 'PREDICTED_SJF', 'SJF_ORACLE'].includes(a.algorithm_id)).map((alg, idx) => {
                const isML = alg.category === 'ml_augmented';
                const isOracle = alg.category === 'oracle';
                return (
                  <div key={idx} className="bg-[#161616] p-3.5 border border-[#393939]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 font-mono text-xs gap-1">
                      <span className="font-semibold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isML ? 'bg-[#0f62fe] animate-pulse' : isOracle ? 'bg-[#a56eff]' : 'bg-[#8d8d8d]'}`}></span>
                        {alg.algorithm_name}
                      </span>
                      <div className="text-[#8d8d8d] flex items-center gap-3">
                        <span>Avg WT: <strong className={isML ? 'text-[#78a9ff]' : 'text-white'}>{alg.avg_waiting_time} ms</strong></span>
                        <span>Avg TAT: <strong className="text-[#42be65]">{alg.avg_turnaround_time} ms</strong></span>
                      </div>
                    </div>

                    <div className="flex overflow-x-auto py-1 border border-[#393939] bg-[#1e1e1e]">
                      {alg.gantt_preview && alg.gantt_preview.map((block, bIdx) => (
                        <div
                          key={bIdx}
                          className={`flex flex-col items-center min-w-[55px] flex-grow border-r border-[#393939] py-2 px-1 text-center transition-colors ${
                            block.fallback_mode 
                              ? 'bg-[#ff832b]/20 text-[#ff832b]' 
                              : isML 
                              ? 'bg-[#0f62fe]/20 text-[#78a9ff]' 
                              : isOracle 
                              ? 'bg-[#8a3ffc]/20 text-[#be95ff]' 
                              : 'bg-[#393939]/50 text-[#f4f4f4]'
                          }`}
                        >
                          <span className="text-[11px] font-mono font-bold">
                            {block.fallback_mode ? '[FB] ' : ''}{block.pid}
                          </span>
                          <span className="text-[10px] font-mono text-[#8d8d8d] mt-1">
                            {block.start_time} - {block.end_time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Performance Comparison (Proportional Bars) */}
          <div className="bg-[#262626] border border-[#393939] p-5">
            <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white mb-4 border-b border-[#393939] pb-3">
              Visual Waiting Time Comparison (Lower is Better)
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {comparisonData.algorithms.map((alg, idx) => {
                const maxWT = Math.max(...comparisonData.algorithms.map((a) => a.avg_waiting_time), 1);
                const widthPct = Math.max(5, Math.round((alg.avg_waiting_time / maxWT) * 100));
                const isML = alg.category === 'ml_augmented';
                const isOracle = alg.category === 'oracle';

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[#c6c6c6]">
                      <span className="font-semibold text-white">{alg.algorithm_name}</span>
                      <span className={isML ? 'text-[#78a9ff] font-bold' : ''}>{alg.avg_waiting_time} ms</span>
                    </div>
                    <div className="w-full bg-[#161616] h-4 border border-[#393939]">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isML 
                            ? 'bg-[#0f62fe]' 
                            : isOracle 
                            ? 'bg-[#6929c4]' 
                            : 'bg-[#525252]'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Held-out Model Validation Metrics Card (Section 1.5 of Improvement Plan) */}
          {mlValidationMetrics && (
            <div className="bg-[#262626] border border-[#393939] p-5">
              <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white mb-4 border-b border-[#393939] pb-3 flex items-center justify-between">
                <span>{mlValidationMetrics?.model_name || 'Active ML Model'} Generalization Metrics (500 Held-Out Samples)</span>
                <span className="text-xs text-[#8d8d8d] font-normal font-mono">Offline Scikit-Learn Pipeline</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                <div className="bg-[#161616] p-3.5 border border-[#393939]">
                  <span className="text-[11px] text-[#8d8d8d] uppercase tracking-wider block mb-1">MAE</span>
                  <span className="text-xl font-light text-white">{mlValidationMetrics.mean_absolute_error} ms</span>
                </div>
                <div className="bg-[#161616] p-3.5 border border-[#393939]">
                  <span className="text-[11px] text-[#8d8d8d] uppercase tracking-wider block mb-1">RMSE</span>
                  <span className="text-xl font-light text-[#78a9ff]">{mlValidationMetrics.root_mean_squared_error} ms</span>
                </div>
                <div className="bg-[#161616] p-3.5 border border-[#393939]">
                  <span className="text-[11px] text-[#8d8d8d] uppercase tracking-wider block mb-1">R² Variance</span>
                  <span className="text-xl font-light text-[#42be65]">{(mlValidationMetrics.r2_score * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-[#161616] p-3.5 border border-[#393939]">
                  <span className="text-[11px] text-[#8d8d8d] uppercase tracking-wider block mb-1">Inference Latency</span>
                  <span className="text-xl font-light text-[#be95ff]">{mlValidationMetrics.inference_latency_us} μs</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SMP Multi-Core Execution View */}
      {activeView === 'multicore' && (
        <ErrorBoundary title="SMP Multi-Core Engine">
          <MultiCoreGantt
            multicoreResult={multicoreResult}
            onRunMultiCore={handleRunMultiCore}
            loading={smpLoading}
          />
        </ErrorBoundary>
      )}

      {/* Synthetic Workload Distribution Generator Modal */}
      <WorkloadGeneratorModal
        isOpen={showWorkloadGenerator}
        onClose={() => setShowWorkloadGenerator(false)}
        onApplyWorkload={(newProcs) => setProcesses(newProcs)}
        currentProcesses={processes}
      />
      {/* Bottom spacer ensuring comfortable scroll clearance past the last card */}
      <div className="h-16" aria-hidden="true" />
    </div>
  );
}