import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, SkipBack, SkipForward, Clock, 
  Cpu, ShieldAlert, CheckCircle2, AlertTriangle, Layers, ArrowRight 
} from 'lucide-react';

export default function CPUSimulationStepper({
  gantt = [],
  processes = [],
  fallbackLogs = [],
  algorithm = 'ADAPTIVE_ROUTER'
}) {
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x, 10x

  const totalTime = gantt && gantt.length > 0 ? gantt[gantt.length - 1].end_time : 0;

  // Reset stepper on new simulation
  useEffect(() => {
    setCurrentTick(0);
    setIsPlaying(false);
  }, [gantt, algorithm]);

  // Animation Timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const interval = Math.max(100, 800 / speed);
      timer = setInterval(() => {
        setCurrentTick((prev) => {
          if (prev >= totalTime) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalTime, speed]);

  if (!gantt || gantt.length === 0 || totalTime === 0) {
    return null;
  }

  // Determine active Gantt block at currentTick
  const activeBlock = gantt.find(b => currentTick >= b.start_time && currentTick < b.end_time);
  const runningPid = activeBlock ? activeBlock.pid : (currentTick === totalTime ? 'IDLE (Done)' : 'IDLE');
  const isFallbackMode = activeBlock ? activeBlock.fallback_mode : false;

  // Calculate executed ticks per process up to currentTick
  const executedTicks = {};
  processes.forEach(p => { executedTicks[p.pid] = 0; });

  gantt.forEach(b => {
    if (currentTick > b.start_time) {
      const exec = Math.min(b.end_time, currentTick) - b.start_time;
      executedTicks[b.pid] = (executedTicks[b.pid] || 0) + exec;
    }
  });

  // Categorize processes into OS states at currentTick
  const newQueue = [];
  const readyQueue = [];
  const terminatedQueue = [];
  const demotedQueue = [];

  processes.forEach(p => {
    const executed = executedTicks[p.pid] || 0;
    const remaining = p.burst_time - executed;

    if (p.arrival_time > currentTick) {
      newQueue.push(p);
    } else if (remaining <= 0) {
      terminatedQueue.push(p);
    } else if (p.pid === runningPid) {
      // Currently running
    } else {
      // Check if demoted via fallback
      const hasBeenDemoted = fallbackLogs.some(
        log => log.pid === p.pid && log.time <= currentTick && log.action.includes('demot')
      );
      if (hasBeenDemoted) {
        demotedQueue.push({ ...p, remaining });
      } else {
        readyQueue.push({ ...p, remaining });
      }
    }
  });

  // Active Fallback Log at this tick
  const activeLogsAtTick = fallbackLogs.filter(l => l.time === currentTick);

  return (
    <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6 space-y-6">
      {/* Header & Virtual Clock Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#393939] pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
            <Clock className="w-5 h-5 text-[#0f62fe]" />
            Live CPU Clock Simulation Stepper
          </h3>
          <p className="text-xs text-[#c6c6c6] font-light mt-0.5">
            Step-by-step kernel clock execution showing real-time queue migration and circuit breaker demotions
          </p>
        </div>

        {/* Live Clock Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-[#161616] border border-[#393939] px-4 py-2 font-mono text-xs flex items-center gap-4">
            <div>
              <span className="text-[#8d8d8d] text-[10px] uppercase block">Virtual Clock</span>
              <span className="text-[#78a9ff] font-bold text-base">t = {currentTick} ms</span>
            </div>
            <div className="h-6 w-px bg-[#393939]"></div>
            <div>
              <span className="text-[#8d8d8d] text-[10px] uppercase block">CPU State</span>
              <span className={`font-bold text-sm ${runningPid.startsWith('P') ? 'text-[#42be65]' : 'text-[#8d8d8d]'}`}>
                {runningPid} {isFallbackMode ? '(RR Fallback)' : ''}
              </span>
            </div>
            <div className="h-6 w-px bg-[#393939]"></div>
            <div>
              <span className="text-[#8d8d8d] text-[10px] uppercase block">Progress</span>
              <span className="text-white font-bold text-sm">
                {Math.round((currentTick / totalTime) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Circuit Breaker Notification Callout (if active) */}
      {activeLogsAtTick.length > 0 && (
        <div className="bg-[#da1e28]/10 border-l-4 border-l-[#da1e28] border-y border-r border-[#da1e28]/30 p-3 flex items-start gap-3 animate-in fade-in duration-200">
          <ShieldAlert className="w-5 h-5 text-[#fa4d56] shrink-0 mt-0.5" />
          <div className="font-mono text-xs space-y-1">
            <span className="text-[#fa4d56] font-bold uppercase tracking-wider block">
              Safety Circuit Breaker Fired at t={currentTick} ms
            </span>
            {activeLogsAtTick.map((log, idx) => (
              <p key={idx} className="text-[#f4f4f4]">
                <strong className="text-white">[{log.pid}]</strong>: {log.reason} &bull; Action:{' '}
                <span className="text-[#fa4d56] underline font-semibold">{log.action}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Visual OS State Queues Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. New / Not Arrived */}
        <div className="bg-[#161616] border border-[#393939] p-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-2 text-xs font-mono">
            <span className="text-[#8d8d8d] uppercase font-semibold">1. Unarrived</span>
            <span className="text-[#c6c6c6] bg-[#262626] px-1.5 py-0.5">{newQueue.length}</span>
          </div>
          <div className="flex-1 space-y-1.5 min-h-[90px]">
            {newQueue.map(p => (
              <div key={p.pid} className="p-1.5 bg-[#262626] border border-[#393939] font-mono text-[11px] text-[#8d8d8d]">
                <div className="flex justify-between font-bold text-white">
                  <span>{p.pid}</span>
                  <span>arr: {p.arrival_time}ms</span>
                </div>
                <div>burst: {p.burst_time}ms</div>
              </div>
            ))}
            {newQueue.length === 0 && (
              <span className="text-[#525252] text-[11px] font-mono italic block pt-6 text-center">Empty</span>
            )}
          </div>
        </div>

        {/* 2. Ready Queue */}
        <div className="bg-[#161616] border border-[#393939] p-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-2 text-xs font-mono">
            <span className="text-[#78a9ff] uppercase font-semibold">2. Ready Queue</span>
            <span className="text-[#78a9ff] bg-[#0f62fe]/10 border border-[#0f62fe]/30 px-1.5 py-0.5">{readyQueue.length}</span>
          </div>
          <div className="flex-1 space-y-1.5 min-h-[90px]">
            {readyQueue.map(p => (
              <div key={p.pid} className="p-1.5 bg-[#262626] border border-[#0f62fe]/40 font-mono text-[11px] text-[#c6c6c6]">
                <div className="flex justify-between font-bold text-white">
                  <span>{p.pid}</span>
                  <span className="text-[#78a9ff]">rem: {p.remaining}ms</span>
                </div>
                <div className="text-[10px] text-[#8d8d8d]">waited: {currentTick - p.arrival_time - (executedTicks[p.pid] || 0)}ms</div>
              </div>
            ))}
            {readyQueue.length === 0 && (
              <span className="text-[#525252] text-[11px] font-mono italic block pt-6 text-center">Empty</span>
            )}
          </div>
        </div>

        {/* 3. Running (CPU Core) */}
        <div className="bg-[#161616] border-2 border-[#0f62fe] p-3 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#393939] pb-2 mb-2 text-xs font-mono">
            <span className="text-white uppercase font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#0f62fe]" /> 3. Running
            </span>
            <span className="w-2 h-2 rounded-full bg-[#42be65] animate-ping"></span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[90px]">
            {activeBlock ? (
              <div className="text-center font-mono space-y-1">
                <span className="text-2xl font-bold text-white block">{activeBlock.pid}</span>
                <span className={`text-[10px] px-2 py-0.5 border inline-block ${
                  isFallbackMode 
                    ? 'bg-[#da1e28]/20 text-[#fa4d56] border-[#da1e28]/40' 
                    : 'bg-[#0f62fe]/20 text-[#78a9ff] border-[#0f62fe]/40'
                }`}>
                  {isFallbackMode ? 'Fallback Slice' : 'ML Slice'}
                </span>
                <div className="text-[11px] text-[#c6c6c6] pt-1">
                  tick {currentTick - activeBlock.start_time + 1} of {activeBlock.end_time - activeBlock.start_time}
                </div>
              </div>
            ) : (
              <span className="text-[#8d8d8d] text-xs font-mono italic">CPU Idle</span>
            )}
          </div>
        </div>

        {/* 4. Demoted Fallback Queue (RR) */}
        <div className="bg-[#161616] border border-[#393939] p-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-2 text-xs font-mono">
            <span className="text-[#fa4d56] uppercase font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-[#fa4d56]" /> 4. Demoted (RR)
            </span>
            <span className="text-[#fa4d56] bg-[#da1e28]/10 border border-[#da1e28]/30 px-1.5 py-0.5">{demotedQueue.length}</span>
          </div>
          <div className="flex-1 space-y-1.5 min-h-[90px]">
            {demotedQueue.map(p => (
              <div key={p.pid} className="p-1.5 bg-[#262626] border border-[#da1e28]/40 font-mono text-[11px] text-[#fa4d56]">
                <div className="flex justify-between font-bold text-white">
                  <span>{p.pid}</span>
                  <span className="text-[#fa4d56]">rem: {p.remaining}ms</span>
                </div>
                <div className="text-[10px] text-[#8d8d8d]">overrun demoted</div>
              </div>
            ))}
            {demotedQueue.length === 0 && (
              <span className="text-[#525252] text-[11px] font-mono italic block pt-6 text-center">No overruns</span>
            )}
          </div>
        </div>

        {/* 5. Terminated */}
        <div className="bg-[#161616] border border-[#393939] p-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-2 text-xs font-mono">
            <span className="text-[#42be65] uppercase font-semibold">5. Completed</span>
            <span className="text-[#42be65] bg-[#24a148]/10 border border-[#24a148]/30 px-1.5 py-0.5">{terminatedQueue.length}</span>
          </div>
          <div className="flex-1 space-y-1.5 min-h-[90px]">
            {terminatedQueue.map(p => (
              <div key={p.pid} className="p-1.5 bg-[#262626] border border-[#24a148]/40 font-mono text-[11px] text-[#c6c6c6]">
                <div className="flex justify-between font-bold text-white">
                  <span>{p.pid}</span>
                  <span className="text-[#42be65]">Done</span>
                </div>
                <div className="text-[10px] text-[#8d8d8d]">total: {p.burst_time}ms</div>
              </div>
            ))}
            {terminatedQueue.length === 0 && (
              <span className="text-[#525252] text-[11px] font-mono italic block pt-6 text-center">None yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Synchronized Gantt Fill Timeline */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-mono text-[#8d8d8d]">
          <span className="uppercase font-semibold">Synchronized Execution Progress Timeline</span>
          <span>{currentTick} ms / {totalTime} ms</span>
        </div>

        <div className="h-10 bg-[#161616] border border-[#393939] relative flex overflow-hidden">
          {gantt.map((block, idx) => {
            const blockWidthPct = ((block.end_time - block.start_time) / totalTime) * 100;
            const isFinished = currentTick >= block.end_time;
            const isCurrentlyExecuting = currentTick >= block.start_time && currentTick < block.end_time;
            
            // Calculate proportional fill of active block
            let fillPct = 0;
            if (isFinished) fillPct = 100;
            else if (isCurrentlyExecuting) {
              fillPct = ((currentTick - block.start_time) / (block.end_time - block.start_time)) * 100;
            }

            return (
              <div
                key={idx}
                style={{ width: `${blockWidthPct}%` }}
                className="h-full relative border-r border-[#393939] flex items-center justify-center font-mono text-xs select-none"
              >
                {/* Background Unfilled Color */}
                <div className="absolute inset-0 bg-[#262626] opacity-30"></div>

                {/* Animated Fill Bar */}
                <div
                  style={{ width: `${fillPct}%` }}
                  className={`absolute inset-y-0 left-0 transition-all duration-100 ${
                    block.fallback_mode ? 'bg-[#da1e28]/70' : 'bg-[#0f62fe]/70'
                  }`}
                ></div>

                {/* Block Label */}
                <span className="relative z-10 font-bold text-white text-[11px] flex items-center gap-0.5">
                  {block.pid}
                  {block.fallback_mode && <span className="text-[9px] text-[#ff8389] font-bold">[FB]</span>}
                </span>
              </div>
            );
          })}

          {/* Time Marker Pin */}
          <div
            style={{ left: `${(currentTick / totalTime) * 100}%` }}
            className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_#ffffff] pointer-events-none z-20"
          ></div>
        </div>
      </div>

      {/* Playback Controls & Scrubber Slider */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1e1e1e] border border-[#393939] p-3">
        {/* Clock Scrubber */}
        <div className="w-full sm:w-1/2 flex items-center gap-3">
          <span className="text-xs font-mono text-[#8d8d8d] uppercase shrink-0">Tick:</span>
          <input
            type="range"
            min="0"
            max={totalTime}
            value={currentTick}
            onChange={(e) => setCurrentTick(Number(e.target.value))}
            className="w-full accent-[#0f62fe] bg-[#161616] h-1.5 cursor-pointer"
          />
          <span className="text-xs font-mono text-white shrink-0 font-bold w-16 text-right">
            {currentTick} / {totalTime}ms
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTick(0)}
            className="p-2 bg-[#262626] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white transition-colors"
            title="Reset Clock to t=0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCurrentTick(prev => Math.max(0, prev - 1))}
            disabled={currentTick === 0}
            className="p-2 bg-[#262626] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white transition-colors disabled:opacity-40"
            title="Step -1 Tick"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (currentTick >= totalTime) setCurrentTick(0);
              setIsPlaying(!isPlaying);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0f62fe] hover:bg-[#0353e9] text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{currentTick >= totalTime ? 'Replay' : 'Run Clock'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setCurrentTick(prev => Math.min(totalTime, prev + 1))}
            disabled={currentTick === totalTime}
            className="p-2 bg-[#262626] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white transition-colors disabled:opacity-40"
            title="Step +1 Tick"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 border-l border-[#393939] pl-2 ml-1">
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold border ${
                  speed === s
                    ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                    : 'bg-[#161616] text-[#8d8d8d] border-[#393939] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
