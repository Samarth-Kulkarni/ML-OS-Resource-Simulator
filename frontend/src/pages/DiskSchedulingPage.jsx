import React, { useState } from 'react';
import { simulateDisk, compareDisk } from '../services/api';
import { 
  Play, HardDrive, ArrowRight, BarChart3, Award, TrendingDown, 
  Activity, CheckCircle2, Zap, Clock, Wrench, ChevronRight 
} from 'lucide-react';
import DiskKinematicsVisualizer from '../components/DiskKinematicsVisualizer';
import ErrorBoundary from '../components/ErrorBoundary';

export default function DiskSchedulingPage({
  algorithm: propAlgorithm,
  setAlgorithm: propSetAlgorithm,
  head: propHead,
  setHead: propSetHead,
  diskSize: propDiskSize,
  setDiskSize: propSetDiskSize,
  direction: propDirection,
  setDirection: propSetDirection,
  requestsInput: propRequestsInput,
  setRequestsInput: propSetRequestsInput,
  result: propResult,
  setResult: propSetResult,
}) {
  const [localAlgorithm, setLocalAlgorithm] = useState('SSTF');
  const algorithm = propAlgorithm || localAlgorithm;
  const setAlgorithm = propSetAlgorithm || setLocalAlgorithm;

  const [localHead, setLocalHead] = useState(53);
  const head = propHead !== undefined ? propHead : localHead;
  const setHead = propSetHead || setLocalHead;

  const [localDiskSize, setLocalDiskSize] = useState(200);
  const diskSize = propDiskSize !== undefined ? propDiskSize : localDiskSize;
  const setDiskSize = propSetDiskSize || setLocalDiskSize;

  const [localDirection, setLocalDirection] = useState('right');
  const direction = propDirection || localDirection;
  const setDirection = propSetDirection || setLocalDirection;

  const [localRequestsInput, setLocalRequestsInput] = useState('98, 183, 37, 122, 14, 124, 65, 67');
  const requestsInput = propRequestsInput !== undefined ? propRequestsInput : localRequestsInput;
  const setRequestsInput = propSetRequestsInput || setLocalRequestsInput;

  const [localResult, setLocalResult] = useState(null);
  const result = propResult !== undefined ? propResult : localResult;
  const setResult = propSetResult || setLocalResult;

  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [activeView, setActiveView] = useState('single'); // 'single' | 'compare'
  const [comparisonData, setComparisonData] = useState(null);
  const [showExperimental, setShowExperimental] = useState(false);

  const parseRequests = () => {
    return requestsInput
      .split(',')
      .map((num) => Number(num.trim()))
      .filter((num) => !isNaN(num));
  };

  const handleRunDisk = async () => {
    const parsedRequests = parseRequests();
    if (parsedRequests.length === 0) {
      alert('Please enter a valid comma-separated list of numbers.');
      return;
    }

    setLoading(true);
    try {
      const data = await simulateDisk({
        algorithm,
        head,
        disk_size: diskSize,
        direction,
        requests: parsedRequests,
      });
      setResult(data);
      setActiveView('single');
    } catch (err) {
      alert('Error running disk simulation: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCompareDisk = async () => {
    const parsedRequests = parseRequests();
    if (parsedRequests.length === 0) {
      alert('Please enter a valid comma-separated list of numbers.');
      return;
    }

    setComparing(true);
    try {
      const data = await compareDisk({
        algorithm: 'COMPARE',
        head,
        disk_size: diskSize,
        direction,
        requests: parsedRequests,
      });
      setComparisonData(data);
      setActiveView('compare');
    } catch (err) {
      alert('Error comparing disk algorithms: ' + (err.response?.data?.detail || err.message));
    } finally {
      setComparing(false);
    }
  };

  if (!showExperimental) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-200">
        <div className="bg-[#262626] border border-[#393939] p-8 sm:p-12 text-center relative overflow-hidden">
          {/* Carbon top accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0f62fe]" />

          <div className="inline-flex items-center justify-center p-4 bg-[#161616] border border-[#393939] mb-5">
            <HardDrive className="w-10 h-10 text-[#78a9ff]" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 bg-[#0f62fe]/15 border border-[#0f62fe]/40 text-[#78a9ff] text-[11px] font-mono uppercase tracking-widest font-semibold">
              Future Scope
            </span>
            <span className="px-2.5 py-0.5 bg-[#f1c21b]/15 border border-[#f1c21b]/40 text-[#f1c21b] text-[11px] font-mono uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f1c21b] animate-pulse" />
              Under Development
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-sans mb-3">
            Working on it
          </h1>

          <p className="text-sm font-mono text-[#c6c6c6] max-w-xl mx-auto mb-8 leading-relaxed">
            The Disk Scheduling & I/O Kinematics module is currently under active development as part of the future research scope. 
            Physical spindle kinematics, seek deceleration modeling, and ML-Augmented Shortest Access Time First (ML-SATF) are being refined.
          </p>

          {/* Architecture Roadmap Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
            <div className="bg-[#1e1e1e] p-4 border border-[#393939]">
              <span className="text-[10px] font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">Status</span>
              <span className="text-xs font-mono font-semibold text-[#f1c21b] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#f1c21b]" />
                In Progress
              </span>
            </div>
            <div className="bg-[#1e1e1e] p-4 border border-[#393939]">
              <span className="text-[10px] font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">Scope Category</span>
              <span className="text-xs font-mono font-semibold text-[#78a9ff]">
                Future Scope
              </span>
            </div>
            <div className="bg-[#1e1e1e] p-4 border border-[#393939]">
              <span className="text-[10px] font-mono text-[#8d8d8d] uppercase tracking-wider block mb-1">Target Engine</span>
              <span className="text-xs font-mono font-semibold text-[#c6c6c6]">
                7200 RPM Kinematics
              </span>
            </div>
          </div>

          {/* Developer / Evaluation Preview Toggle */}
          <div className="pt-6 border-t border-[#393939] flex items-center justify-center">
            <button
              onClick={() => setShowExperimental(true)}
              className="text-xs font-mono text-[#8d8d8d] hover:text-[#78a9ff] transition-colors underline decoration-dotted underline-offset-4 flex items-center gap-1.5"
            >
              <span>[ Developer Preview: View Experimental Implementation ]</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Experimental Prototype Banner */}
      <div className="bg-[#161616] border border-[#393939] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#f1c21b]">
          <span className="w-2 h-2 rounded-full bg-[#f1c21b]" />
          <span className="font-semibold uppercase tracking-wider">Experimental Prototype Mode (Future Scope Preview)</span>
        </div>
        <button
          onClick={() => setShowExperimental(false)}
          className="px-3 py-1 bg-[#262626] hover:bg-[#393939] border border-[#525252] text-white transition-colors"
        >
          ← Return to Status View (Working on it)
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#393939] pb-4">
          <h2 className="text-xl font-bold text-[#78a9ff] flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#0f62fe]" />
            Disk Scheduling Configuration
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCompareDisk}
              disabled={comparing}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-[#393939] hover:bg-[#4c4c4c] border border-[#525252] text-xs font-mono uppercase tracking-wider text-white font-semibold transition-colors disabled:opacity-50"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#be95ff]" />
              {comparing ? 'Benchmarking...' : 'Compare All Disk Schedulers'}
            </button>

            <button
              onClick={handleRunDisk}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-xs font-mono uppercase tracking-wider text-white font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Workload Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 bg-[#1e1e1e] p-2.5 border border-[#393939]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-[#8d8d8d] font-semibold">Test Presets:</span>
            <button
              onClick={() => {
                const defaultHead = 53;
                const defaultRequests = [98, 183, 37, 122, 14, 124, 65, 67];
                setHead(defaultHead);
                setRequests(defaultRequests);
                setRequestsInput('98, 183, 37, 122, 14, 124, 65, 67');
                setDiskSize(200);
                setDirection('right');
                setResult(null);
              }}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#333] border border-[#0f62fe]/50 text-xs font-mono text-[#78a9ff] hover:text-white transition-colors"
            >
              Textbook Benchmark (Head 53, 8 Tracks)
            </button>
          </div>
          <span className="text-[11px] font-mono text-[#8d8d8d] hidden sm:inline">
            Kinematic Seek Verification &bull; Silberschatz Standard
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
              Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value);
                setActiveView('single');
              }}
              className="w-full bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-2.5 text-white focus:outline-none focus:border-[#0f62fe]"
            >
              <option value="FCFS">First-Come, First-Served (FCFS)</option>
              <option value="SSTF">Shortest Seek Time First (SSTF)</option>
              <option value="SCAN">SCAN (Elevator)</option>
              <option value="C-SCAN">Circular SCAN (C-SCAN)</option>
              <option value="LOOK">LOOK (Optimized Elevator)</option>
              <option value="SATF">SATF (Shortest Access Time First - Kinematics)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
              Initial Head Position
            </label>
            <input
              type="number"
              min="0"
              value={head}
              onChange={(e) => setHead(Number(e.target.value))}
              className="w-full bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-2 text-white focus:outline-none focus:border-[#0f62fe]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
              Total Tracks (Size)
            </label>
            <input
              type="number"
              min="10"
              value={diskSize}
              onChange={(e) => setDiskSize(Number(e.target.value))}
              className="w-full bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-2 text-white focus:outline-none focus:border-[#0f62fe]"
            />
          </div>

          {(algorithm === 'SCAN' || algorithm === 'C-SCAN') && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
                Initial Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-[#161616] border border-[#525252] text-xs font-mono px-3 py-2.5 text-white focus:outline-none focus:border-[#0f62fe]"
              >
                <option value="right">Right / High (towards max track)</option>
                <option value="left">Left / Low (towards track 0)</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#c6c6c6] font-semibold mb-1.5">
            Requested Tracks (Comma separated)
          </label>
          <input
            type="text"
            value={requestsInput}
            onChange={(e) => setRequestsInput(e.target.value)}
            className="w-full bg-[#161616] border border-[#525252] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#0f62fe]"
            placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
          />
        </div>
      </div>

      {/* View Switcher Tabs (If comparison data exists) */}
      {comparisonData && (
        <div className="flex border-b border-[#393939] gap-1">
          <button
            onClick={() => setActiveView('single')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors ${
              activeView === 'single'
                ? 'border-[#0f62fe] text-white bg-[#262626]'
                : 'border-transparent text-[#8d8d8d] hover:text-white'
            }`}
          >
            Single View ({algorithm})
          </button>
          <button
            onClick={() => setActiveView('compare')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-colors ${
              activeView === 'compare'
                ? 'border-[#be95ff] text-white bg-[#262626]'
                : 'border-transparent text-[#8d8d8d] hover:text-white'
            }`}
          >
            Comparative Benchmark (6 Schedulers)
          </button>
        </div>
      )}

      {/* COMPARATIVE BENCHMARK VIEW */}
      {activeView === 'compare' && comparisonData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Physics & Kinematics Verdict Banner */}
          {comparisonData.verdict && (
            <div className="bg-[#161616] border-l-4 border-l-[#0f62fe] border-y border-r border-[#393939] p-4 text-xs font-mono text-[#c6c6c6] flex items-start gap-3">
              <Zap className="w-4 h-4 text-[#78a9ff] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-white uppercase tracking-wider block mb-1">
                  Enterprise Spindle Kinematics & Physical Latency Analysis
                </span>
                {comparisonData.verdict}
              </div>
            </div>
          )}

          {/* KPI Delta Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#262626] border border-[#393939] p-5">
              <div className="flex items-center justify-between text-xs font-mono text-[#8d8d8d] uppercase mb-2">
                <span>Best Seek Policy</span>
                <Award className="w-4 h-4 text-[#42be65]" />
              </div>
              <p className="text-2xl font-bold font-mono text-[#42be65]">
                {comparisonData.best_algorithm}
              </p>
              <p className="text-xs font-mono text-[#c6c6c6] mt-1">
                Optimal seek distance: {comparisonData.min_seek} tracks
              </p>
            </div>

            <div className="bg-[#262626] border border-[#393939] p-5">
              <div className="flex items-center justify-between text-xs font-mono text-[#8d8d8d] uppercase mb-2">
                <span>Best Physical Latency</span>
                <TrendingDown className="w-4 h-4 text-[#78a9ff]" />
              </div>
              <p className="text-2xl font-bold font-mono text-[#78a9ff]">
                {comparisonData.best_access_time_algorithm || 'SATF'}
              </p>
              <p className="text-xs font-mono text-[#c6c6c6] mt-1">
                Co-optimizes seek & spindle angle
              </p>
            </div>

            <div className="bg-[#262626] border border-[#393939] p-5">
              <div className="flex items-center justify-between text-xs font-mono text-[#8d8d8d] uppercase mb-2">
                <span>Worst Case (FCFS Traversal)</span>
                <HardDrive className="w-4 h-4 text-[#ff832b]" />
              </div>
              <p className="text-2xl font-bold font-mono text-[#ff832b]">
                {comparisonData.max_seek} Tracks
              </p>
              <p className="text-xs font-mono text-[#c6c6c6] mt-1">
                Convoy-style erratic head jumps
              </p>
            </div>
          </div>

          {/* Comparative Metrics Matrix Table */}
          <div className="bg-[#262626] border border-[#393939]">
            <div className="p-4 border-b border-[#393939] flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white">
                Head-to-Head Disk Scheduling Benchmark Matrix
              </h3>
              <span className="text-xs font-mono text-[#8d8d8d]">6 Physical Schedulers &bull; 7200 RPM Spindle</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#161616] text-[#c6c6c6] uppercase tracking-wider border-b border-[#393939]">
                  <tr>
                    <th className="px-4 py-3">Algorithm</th>
                    <th className="px-4 py-3 text-right">Seek (Tracks)</th>
                    <th className="px-4 py-3 text-right">Seek Gain %</th>
                    <th className="px-4 py-3 text-right">Rotational Delay</th>
                    <th className="px-4 py-3 text-right text-[#78a9ff]">Total Physical Access</th>
                    <th className="px-4 py-3 text-right text-[#42be65]">Latency Gain %</th>
                    <th className="px-4 py-3">Servicing Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#393939]">
                  {comparisonData.results.map((item) => {
                    const isBestSeek = item.algorithm === comparisonData.best_algorithm;
                    const isBestAccess = item.algorithm === (comparisonData.best_access_time_algorithm || 'SATF');
                    return (
                      <tr key={item.algorithm} className={`hover:bg-[#333] transition-colors ${isBestAccess ? 'bg-[#0f62fe]/10' : isBestSeek ? 'bg-[#42be65]/5' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 inline-block"
                            style={{ 
                              backgroundColor: 
                                item.algorithm === 'FCFS' ? '#ff832b' :
                                item.algorithm === 'SSTF' ? '#42be65' :
                                item.algorithm === 'SCAN' ? '#0f62fe' :
                                item.algorithm === 'C-SCAN' ? '#be95ff' :
                                item.algorithm === 'LOOK' ? '#08bdba' : '#4589ff'
                            }}
                          />
                          <span>{item.algorithm}</span>
                          {isBestAccess && (
                            <span className="text-[10px] bg-[#0f62fe]/20 text-[#78a9ff] px-1.5 py-0.5 border border-[#0f62fe]/40 uppercase font-bold">
                              Fastest
                            </span>
                          )}
                          {isBestSeek && !isBestAccess && (
                            <span className="text-[10px] bg-[#42be65]/20 text-[#42be65] px-1.5 py-0.5 border border-[#42be65]/40 uppercase font-bold">
                              Min Seek
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-base font-light text-white">
                          {item.total_seek_time}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={item.improvement_vs_fcfs_pct > 0 ? 'text-[#42be65] font-bold' : 'text-[#8d8d8d]'}>
                            {item.improvement_vs_fcfs_pct > 0 ? `-${item.improvement_vs_fcfs_pct}%` : 'Baseline'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[#c6c6c6]">
                          {item.estimated_rotational_delay_ms ? `${item.estimated_rotational_delay_ms} ms` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#78a9ff]">
                          {item.total_access_time_ms ? `${item.total_access_time_ms} ms` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={(item.access_time_improvement_vs_fcfs_pct || 0) > 0 ? 'text-[#42be65] font-bold' : 'text-[#8d8d8d]'}>
                            {(item.access_time_improvement_vs_fcfs_pct || 0) > 0 ? `-${item.access_time_improvement_vs_fcfs_pct}%` : 'Baseline'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#c6c6c6] text-[11px]">
                          {item.sequence.join(' → ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2D Kinematic Visualizer in Multi-Algorithm Overlay Mode */}
          <ErrorBoundary title="Disk Kinematics Graph">
            <DiskKinematicsVisualizer
              sequence={result?.sequence || comparisonData.results[0].sequence}
              totalSeek={result?.total_seek_time || comparisonData.results[0].total_seek_time}
              algorithm={algorithm}
              diskSize={diskSize}
              comparisonData={comparisonData}
              activeView="compare"
            />
          </ErrorBoundary>
        </div>
      )}

      {/* SINGLE ALGORITHM VIEW */}
      {activeView === 'single' && result && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#262626] border border-[#393939] p-5 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider">
                Total Head Seek Traversal
              </span>
              <p className="text-3xl font-light font-mono text-[#42be65] mt-1">
                {result.total_seek_time} <span className="text-sm text-[#8d8d8d]">Cylinders</span>
              </p>
            </div>

            <div className="bg-[#262626] border border-[#393939] p-5 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider">
                Spindle Rotational Latency
              </span>
              <p className="text-3xl font-light font-mono text-[#be95ff] mt-1">
                {result.estimated_rotational_delay_ms || 0} <span className="text-sm text-[#8d8d8d]">ms</span>
              </p>
              <span className="text-[10px] font-mono text-[#8d8d8d] mt-1 block">7200 RPM spindle kinematics</span>
            </div>

            <div className="bg-[#262626] border border-[#393939] p-5 text-center">
              <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider">
                Total Physical Access Time
              </span>
              <p className="text-3xl font-light font-mono text-[#78a9ff] mt-1">
                {result.total_access_time_ms || 0} <span className="text-sm text-[#8d8d8d]">ms</span>
              </p>
              <span className="text-[10px] font-mono text-[#8d8d8d] mt-1 block">Seek + Rotational delay</span>
            </div>
          </div>

          {/* Sequence Badge Flow */}
          <div className="bg-[#262626] border border-[#393939]">
            <div className="p-4 border-b border-[#393939]">
              <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white">
                Track Service Order Sequence
              </h3>
            </div>

            <div className="p-5 flex flex-wrap items-center gap-2 font-mono text-xs bg-[#161616]">
              {result.sequence.map((track, idx) => (
                <div key={idx} className="flex items-center">
                  <span className={`px-2.5 py-1 border ${
                    idx === 0 
                      ? 'bg-[#0f62fe]/15 text-[#78a9ff] border-[#0f62fe]/40 font-semibold' 
                      : 'bg-[#262626] text-white border-[#525252]'
                  }`}>
                    {idx === 0 ? `Head (${track})` : track}
                  </span>
                  {idx < result.sequence.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#525252] mx-1.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2D Kinematic Visualizer in Single Animation Mode */}
          <ErrorBoundary title="Disk Kinematics Graph">
            <DiskKinematicsVisualizer
              sequence={result.sequence}
              totalSeek={result.total_seek_time}
              algorithm={algorithm}
              diskSize={diskSize}
              activeView="single"
            />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}