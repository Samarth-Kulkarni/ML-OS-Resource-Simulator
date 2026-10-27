import React, { useState, useEffect } from 'react';
import { Cpu, ShieldAlert, HardDrive, Activity, Play, CheckCircle2, AlertCircle, WifiOff, Layers, XCircle } from 'lucide-react';
import { checkHealth } from '../services/api';

export default function DashboardPage({ 
  setActiveTab, 
  cpuProcesses, 
  cpuResult, 
  cpuAlgorithm, 
  deadlockResult,
  diskResult,
  diskHead,
  diskAlgorithm
}) {
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const isOnline = await checkHealth();
      if (isMounted) {
        setBackendOnline(isOnline);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const systemMetrics = [
    { 
      title: 'CPU Workload', 
      value: `${cpuProcesses?.length || 0} Processes`, 
      status: 'Active', 
      icon: Cpu, 
      color: 'text-[#78a9ff]',
      tagBg: 'bg-[#0f62fe]/15 border-[#0f62fe]/40 text-[#78a9ff]'
    },
    { 
      title: "Banker's Safety State", 
      value: deadlockResult 
        ? (deadlockResult.is_safe ? 'Safe Sequence' : 'Deadlock Detected') 
        : 'Unchecked', 
      status: deadlockResult 
        ? (deadlockResult.is_safe ? 'Safe / Protected' : 'CRITICAL UNSAFE') 
        : 'Pending Run', 
      icon: deadlockResult && !deadlockResult.is_safe ? XCircle : ShieldAlert, 
      color: deadlockResult 
        ? (deadlockResult.is_safe ? 'text-[#42be65]' : 'text-[#fa4d56]') 
        : 'text-[#8d8d8d]',
      tagBg: deadlockResult 
        ? (deadlockResult.is_safe ? 'bg-[#24a148]/15 border-[#24a148]/40 text-[#42be65]' : 'bg-[#da1e28]/15 border-[#da1e28]/40 text-[#fa4d56]') 
        : 'bg-[#393939] border-[#525252] text-[#8d8d8d]'
    },
    { 
      title: 'Disk Head Position', 
      value: diskResult && diskResult.sequence 
        ? `Track ${diskResult.sequence[diskResult.sequence.length - 1]}` 
        : `Track ${diskHead || 53}`, 
      status: diskResult 
        ? `${diskResult.total_seek_time} Tracks Seek (${diskAlgorithm || 'SSTF'})` 
        : `${diskAlgorithm || 'SSTF'} Idle`, 
      icon: HardDrive, 
      color: 'text-[#be95ff]',
      tagBg: diskResult 
        ? 'bg-[#8a3ffc]/15 border-[#8a3ffc]/40 text-[#be95ff]' 
        : 'bg-[#393939] border-[#525252] text-[#c6c6c6]'
    },
  ];

  const modules = [
    {
      id: 'cpu',
      title: 'CPU Scheduling',
      desc: 'Simulate FCFS, SJF, Round Robin, and Priority algorithms with Gantt timeline visualizations.',
      icon: Cpu,
      badge: 'Gantt Chart & Metrics',
      btnText: 'Launch Scheduler',
    },
    {
      id: 'deadlock',
      title: "Banker's Algorithm",
      desc: 'Analyze Allocation, Max, and Available resource matrices to detect unsafe states.',
      icon: ShieldAlert,
      badge: deadlockResult 
        ? (deadlockResult.is_safe ? 'Safe Sequence Active' : 'Deadlock State (Unsafe)') 
        : 'Deadlock Avoidance',
      btnText: 'Check Safety State',
    },
    {
      id: 'disk',
      title: 'Disk & I/O Management',
      desc: 'Visualize disk head movement across tracks using FCFS, SSTF, SCAN, and C-SCAN.',
      icon: HardDrive,
      badge: diskResult 
        ? `${diskResult.total_seek_time} Tracks Seek (${diskAlgorithm || 'SSTF'})` 
        : 'Seek Time Visualizer',
      btnText: 'Simulate Disk Head',
    },
  ];

  const processStates = cpuProcesses ? cpuProcesses.map(p => {
    let state = 'Ready';
    let time = `${p.burst_time} ms`;
    let tagStyle = 'bg-[#0f62fe]/15 text-[#78a9ff] border-[#0f62fe]/40';
    let assignedAlgo = cpuAlgorithm;

    if (cpuResult && cpuResult.process_results) {
      const pResult = cpuResult.process_results.find(res => res.pid === p.pid);
      if (pResult) {
        state = 'Completed';
        time = `${pResult.turnaround_time} ms TAT`;
        tagStyle = 'bg-[#262626] text-[#c6c6c6] border-[#525252]';
      }
    }

    return {
      pid: p.pid, 
      state, 
      algorithm: assignedAlgo, 
      time, 
      tagStyle
    };
  }) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="text-[#0f62fe] w-6 h-6" /> OS Resource Management Dashboard
          </h2>
          <p className="text-[#c6c6c6] text-xs sm:text-sm mt-1 max-w-2xl font-light">
            Real-time process lifecycle monitor, deadlock avoidance engine, and disk head simulator.
          </p>
        </div>

        {/* Live Daemon Status Tag */}
        <div>
          {backendOnline === true ? (
            <div className="flex items-center gap-2 bg-[#24a148]/15 border border-[#24a148]/40 text-[#42be65] px-3.5 py-1.5 text-xs font-mono font-semibold">
              <span className="w-2 h-2 bg-[#42be65] animate-pulse"></span>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>System Online & Ready</span>
            </div>
          ) : backendOnline === false ? (
            <div className="flex items-center gap-2 bg-[#da1e28]/15 border border-[#da1e28]/40 text-[#fa4d56] px-3.5 py-1.5 text-xs font-mono font-semibold">
              <span className="w-2 h-2 bg-[#fa4d56] animate-ping"></span>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Backend Offline (Port 8000)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#393939] text-[#c6c6c6] px-3.5 py-1.5 text-xs font-mono">
              <span className="w-2 h-2 bg-[#8d8d8d] animate-pulse"></span>
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Backend Offline Callout */}
      {backendOnline === false && (
        <div className="bg-[#262626] border-l-4 border-l-[#da1e28] border-y border-r border-[#393939] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#fa4d56] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs uppercase font-mono tracking-wider text-[#fa4d56] font-semibold">Backend Disconnected</p>
              <p className="text-sm text-[#f4f4f4] mt-0.5">
                FastAPI backend server is not responding at <code className="text-[#78a9ff] font-mono text-xs">127.0.0.1:8000</code>.
              </p>
            </div>
          </div>
          <div className="bg-[#161616] px-3 py-1.5 border border-[#393939] font-mono text-xs text-[#c6c6c6]">
            python -m uvicorn app.main:app --reload --port 8000
          </div>
        </div>
      )}

      {/* Banker's Deadlock Alert Banner */}
      {deadlockResult && !deadlockResult.is_safe && (
        <div className="bg-[#262626] border-l-4 border-l-[#da1e28] border-y border-r border-[#393939] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <XCircle className="w-5 h-5 text-[#fa4d56] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs uppercase font-mono tracking-wider text-[#fa4d56] font-semibold">Critical Deadlock State Detected</p>
              <p className="text-sm text-[#f4f4f4] mt-0.5 font-mono">
                Banker's Algorithm evaluated current allocation claims: System is in an <span className="text-[#fa4d56] font-bold">UNSAFE</span> state with 0 feasible safe sequences.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('deadlock')}
            className="px-3.5 py-1.5 bg-[#da1e28] hover:bg-[#ba1b23] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors shrink-0"
          >
            Inspect Deadlock Matrix
          </button>
        </div>
      )}

      {/* Banker's Safe State Banner */}
      {deadlockResult && deadlockResult.is_safe && (
        <div className="bg-[#262626] border-l-4 border-l-[#24a148] border-y border-r border-[#393939] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#42be65] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs uppercase font-mono tracking-wider text-[#42be65] font-semibold">Banker's Safety Invariant Verified</p>
              <p className="text-sm text-[#f4f4f4] mt-0.5 font-mono">
                System is verified <span className="text-[#42be65] font-bold">SAFE</span>. Sequence: <span className="text-[#78a9ff] font-semibold">{deadlockResult.safe_sequence.join(' → ')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('deadlock')}
            className="px-3.5 py-1.5 bg-[#161616] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors shrink-0"
          >
            View Resource Matrices
          </button>
        </div>
      )}

      {/* Disk Scheduling Simulation Banner */}
      {diskResult && diskResult.sequence && (
        <div className="bg-[#262626] border-l-4 border-l-[#8a3ffc] border-y border-r border-[#393939] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <HardDrive className="w-5 h-5 text-[#be95ff] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs uppercase font-mono tracking-wider text-[#be95ff] font-semibold">Disk Traversal Simulated ({diskAlgorithm || 'SSTF'})</p>
              <p className="text-sm text-[#f4f4f4] mt-0.5 font-mono">
                Total Seek Distance: <span className="text-[#be95ff] font-bold">{diskResult.total_seek_time} tracks</span> across {diskResult.sequence.length - 1} requests. Final Head: <span className="text-white font-semibold">Track {diskResult.sequence[diskResult.sequence.length - 1]}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('disk')}
            className="px-3.5 py-1.5 bg-[#161616] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors shrink-0"
          >
            Inspect Head Kinematics
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {systemMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-[#262626] border border-[#393939] p-4 relative hover:border-[#525252] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#8d8d8d] font-medium">{m.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${m.tagBg}`}>
                  {m.status}
                </span>
              </div>
              <div className="text-2xl font-light text-white font-mono tracking-tight">{m.value}</div>
              <div className="mt-3 pt-2.5 border-t border-[#393939] flex items-center justify-between text-xs text-[#8d8d8d]">
                <span className="font-mono text-[11px]">{m.title}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Process State Tracking Table */}
      <div className="bg-[#262626] border border-[#393939]">
        <div className="p-4 border-b border-[#393939] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm uppercase tracking-wider font-semibold text-white font-mono">
              Process State Tracking Table
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8d8d8d]">
            <span>Total: {processStates.length}</span>
            <span>|</span>
            <span className="text-[#78a9ff]">Algorithm: {cpuAlgorithm}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161616] text-[#c6c6c6] uppercase font-mono tracking-wider border-b border-[#393939]">
              <tr>
                <th className="px-4 py-3 font-semibold">Process ID</th>
                <th className="px-4 py-3 font-semibold">Current State</th>
                <th className="px-4 py-3 font-semibold">Assigned Algorithm</th>
                <th className="px-4 py-3 font-semibold text-right">Execution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#393939]">
              {processStates.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#353535]/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-white">{p.pid}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[11px] font-mono border ${p.tagStyle}`}>
                      {p.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#c6c6c6]">{p.algorithm}</td>
                  <td className="px-4 py-3 font-mono text-right text-white">{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Shortcuts */}
      <div>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-[#c6c6c6] font-mono mb-3 border-b border-[#393939] pb-2">
          Simulation Modules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.id} className="bg-[#262626] border border-[#393939] p-5 flex flex-col justify-between hover:border-[#0f62fe] transition-all group">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#161616] text-[#78a9ff] border border-[#393939]">
                      {mod.badge}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2 group-hover:text-[#78a9ff] transition-colors flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#0f62fe]" />
                    {mod.title}
                  </h4>
                  <p className="text-[#c6c6c6] text-xs leading-relaxed font-light mb-6">
                    {mod.desc}
                  </p>
                </div>
                
                <button
                  onClick={() => setActiveTab(mod.id)}
                  className="w-full flex items-center justify-center gap-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-xs uppercase tracking-wider font-semibold px-4 py-2.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{mod.btnText}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}