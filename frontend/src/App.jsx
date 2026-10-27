import React, { useState } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import CPUSchedulingPage from './pages/CPUSchedulingPage';
import DeadlockPage from './pages/DeadlockPage';
import DiskSchedulingPage from './pages/DiskSchedulingPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Lifted CPU Scheduling state
  const [cpuProcesses, setCpuProcesses] = useState([
    { pid: 'P1', arrival_time: 0, burst_time: 5, priority: 1, process_type: 'bursty', requested_memory_mb: 256, static_priority: 4 },
    { pid: 'P2', arrival_time: 1, burst_time: 3, priority: 2, process_type: 'interactive', requested_memory_mb: 128, static_priority: 2 },
    { pid: 'P3', arrival_time: 2, burst_time: 8, priority: 3, process_type: 'batch', requested_memory_mb: 1024, static_priority: 10 },
  ]);
  const [cpuResult, setCpuResult] = useState(null);
  const [cpuAlgorithm, setCpuAlgorithm] = useState('FCFS');

  // Lifted Banker's Algorithm (Deadlock) state
  const [deadlockProcesses, setDeadlockProcesses] = useState(['P0', 'P1', 'P2', 'P3', 'P4']);
  const [deadlockResources, setDeadlockResources] = useState(['A', 'B', 'C']);
  const [deadlockAvailable, setDeadlockAvailable] = useState([3, 3, 2]);
  const [deadlockMaxMatrix, setDeadlockMaxMatrix] = useState([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ]);
  const [deadlockAllocationMatrix, setDeadlockAllocationMatrix] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ]);
  const [deadlockResult, setDeadlockResult] = useState(null);

  // Lifted Disk Scheduling state
  const [diskAlgorithm, setDiskAlgorithm] = useState('SSTF');
  const [diskHead, setDiskHead] = useState(53);
  const [diskSize, setDiskSize] = useState(200);
  const [diskDirection, setDiskDirection] = useState('right');
  const [diskRequestsInput, setDiskRequestsInput] = useState('98, 183, 37, 122, 14, 124, 65, 67');
  const [diskResult, setDiskResult] = useState(null);

  return (
    <div className="min-h-screen bg-[#161616] text-[#f4f4f4] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardPage 
            setActiveTab={setActiveTab} 
            cpuProcesses={cpuProcesses} 
            cpuResult={cpuResult} 
            cpuAlgorithm={cpuAlgorithm}
            deadlockResult={deadlockResult}
            diskResult={diskResult}
            diskHead={diskHead}
            diskAlgorithm={diskAlgorithm}
          />
        )}
        {activeTab === 'cpu' && (
          <CPUSchedulingPage 
            processes={cpuProcesses} 
            setProcesses={setCpuProcesses} 
            result={cpuResult} 
            setResult={setCpuResult} 
            algorithm={cpuAlgorithm} 
            setAlgorithm={setCpuAlgorithm} 
          />
        )}
        {activeTab === 'deadlock' && (
          <DeadlockPage 
            processes={deadlockProcesses}
            setProcesses={setDeadlockProcesses}
            resources={deadlockResources}
            setResources={setDeadlockResources}
            available={deadlockAvailable}
            setAvailable={setDeadlockAvailable}
            maxMatrix={deadlockMaxMatrix}
            setMaxMatrix={setDeadlockMaxMatrix}
            allocationMatrix={deadlockAllocationMatrix}
            setAllocationMatrix={setDeadlockAllocationMatrix}
            result={deadlockResult}
            setResult={setDeadlockResult}
          />
        )}
        {activeTab === 'disk' && (
          <DiskSchedulingPage 
            algorithm={diskAlgorithm}
            setAlgorithm={setDiskAlgorithm}
            head={diskHead}
            setHead={setDiskHead}
            diskSize={diskSize}
            setDiskSize={setDiskSize}
            direction={diskDirection}
            setDirection={setDiskDirection}
            requestsInput={diskRequestsInput}
            setRequestsInput={setDiskRequestsInput}
            result={diskResult}
            setResult={setDiskResult}
          />
        )}
      </main>
    </div>
  );
}