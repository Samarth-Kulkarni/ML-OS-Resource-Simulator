import React, { useState } from 'react';
import { simulateDisk } from '../services/api';
import { Play, HardDrive, ArrowRight } from 'lucide-react';

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

  const handleRunDisk = async () => {
    const parsedRequests = requestsInput
      .split(',')
      .map((num) => Number(num.trim()))
      .filter((num) => !isNaN(num));

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
    } catch (err) {
      alert('Error running disk simulation: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Configuration Panel */}
      <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#393939] pb-4">
          <h2 className="text-xl font-bold text-[#78a9ff] flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#0f62fe]" />
            Disk Scheduling Configuration
          </h2>

          <button
            onClick={handleRunDisk}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f62fe] hover:bg-[#0353e9] text-xs font-mono uppercase tracking-wider text-white font-semibold transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Simulating...' : 'Run Disk Simulation'}
          </button>
        </div>

        {/* Workload Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 bg-[#1e1e1e] p-2.5 border border-[#393939]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-[#8d8d8d] font-semibold">Test Presets:</span>
            <button
              onClick={async () => {
                const defaultHead = 53;
                const defaultRequests = [98, 183, 37, 122, 14, 124, 65, 67];
                setHead(defaultHead);
                setRequestsInput('98, 183, 37, 122, 14, 124, 65, 67');
                setDiskSize(200);
                setDirection('right');
                setLoading(true);
                try {
                  const data = await simulateDisk({
                    algorithm: algorithm || 'SSTF',
                    head: defaultHead,
                    disk_size: 200,
                    direction: 'right',
                    requests: defaultRequests,
                  });
                  setResult(data);
                } catch (err) {
                  console.error('Error running disk preset:', err);
                } finally {
                  setLoading(false);
                }
              }}
              className="px-2.5 py-1 bg-[#161616] hover:bg-[#333] border border-[#0f62fe]/50 text-xs font-mono text-[#78a9ff] hover:text-white transition-colors"
            >
              Textbook Benchmark (Head 53, 8 Tracks)
            </button>
          </div>
          <span className="text-[11px] font-mono text-[#8d8d8d] hidden sm:inline">
            Kinematic Seek Verification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              <option value="SSTF">Shortest Seek Time First (SSTF)</option>
              <option value="SCAN">SCAN (Elevator)</option>
              <option value="C-SCAN">Circular SCAN (C-SCAN)</option>
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

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          <div className="bg-[#262626] border border-[#393939] p-5 text-center">
            <span className="text-xs font-mono text-[#8d8d8d] uppercase tracking-wider">
              Total Disk Head Seek Time
            </span>
            <p className="text-3xl font-light font-mono text-[#42be65] mt-1">
              {result.total_seek_time} <span className="text-base text-[#8d8d8d]">Tracks</span>
            </p>
          </div>

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
        </div>
      )}
    </div>
  );
}