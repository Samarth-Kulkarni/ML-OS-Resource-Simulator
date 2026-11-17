import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, SkipBack, SkipForward, FastForward, 
  Layers, HardDrive, CheckCircle2, Award, TrendingDown, Eye
} from 'lucide-react';

export default function DiskKinematicsVisualizer({ 
  sequence = [], 
  totalSeek = 0, 
  algorithm = 'SSTF', 
  diskSize = 200, 
  comparisonData = null, 
  activeView = 'single' // 'single' | 'compare'
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 2x, 4x
  const [visibleAlgos, setVisibleAlgos] = useState({
    FCFS: true,
    SSTF: true,
    SCAN: true,
    'C-SCAN': true,
    LOOK: true,
    SATF: true
  });
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const maxSteps = sequence && sequence.length > 0 ? sequence.length - 1 : 0;

  // Reset animation when sequence changes
  useEffect(() => {
    setCurrentStep(sequence.length > 0 ? sequence.length - 1 : 0);
    setIsPlaying(false);
  }, [sequence, algorithm]);

  // Animation Loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const interval = Math.max(200, 1000 / playbackSpeed);
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, maxSteps, playbackSpeed]);

  if (!sequence || sequence.length === 0) {
    return null;
  }

  // Current head position
  const currentHeadTrack = sequence[Math.min(currentStep, maxSteps)] || sequence[0];
  
  // Calculate cumulative seek up to currentStep
  let cumulativeSeek = 0;
  for (let i = 0; i < currentStep && i < sequence.length - 1; i++) {
    cumulativeSeek += Math.abs(sequence[i + 1] - sequence[i]);
  }

  // SVG Dimension Constants
  const svgWidth = 860;
  const svgHeight = 380;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 40;
  const padBottom = 50;

  const graphWidth = svgWidth - padLeft - padRight;
  const graphHeight = svgHeight - padTop - padBottom;

  // Coordinate mappers
  const getX = (track) => {
    const clamped = Math.max(0, Math.min(diskSize - 1, track));
    return padLeft + (clamped / (diskSize - 1)) * graphWidth;
  };

  const getY = (stepIndex, totalSteps) => {
    if (totalSteps <= 0) return padTop + graphHeight / 2;
    return padTop + (stepIndex / totalSteps) * graphHeight;
  };

  // Algorithm color map
  const algoColors = {
    FCFS: '#ff832b',    // Orange
    SSTF: '#42be65',    // Carbon Green
    SCAN: '#0f62fe',    // Carbon Blue
    'C-SCAN': '#be95ff', // Purple
    LOOK: '#08bdba',    // Teal
    SATF: '#4589ff'     // Bright Cobalt Blue
  };

  // Grid lines
  const trackTicks = [0, Math.round(diskSize * 0.25), Math.round(diskSize * 0.5), Math.round(diskSize * 0.75), diskSize - 1];

  return (
    <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6 space-y-6">
      {/* Header and Telemetry */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#393939] pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
            <HardDrive className="w-5 h-5 text-[#0f62fe]" />
            2D Kinematic Head Movement Visualizer
          </h3>
          <p className="text-xs text-[#c6c6c6] font-light mt-0.5">
            Real-time mechanical disk platter traversal graph and physical arm movement tracker
          </p>
        </div>

        {/* Live Head Telemetry Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-[#161616] border border-[#393939] px-3.5 py-1.5 font-mono text-xs flex items-center gap-3">
            <div>
              <span className="text-[#8d8d8d] text-[10px] uppercase block">Current Head</span>
              <span className="text-white font-bold text-sm">Track {currentHeadTrack}</span>
            </div>
            <div className="h-6 w-px bg-[#393939]"></div>
            <div>
              <span className="text-[#8d8d8d] text-[10px] uppercase block">Step</span>
              <span className="text-[#78a9ff] font-bold text-sm">{currentStep} / {maxSteps}</span>
            </div>
            <div className="h-6 w-px bg-[#393939]"></div>
            <div>
              <span className="text-[#8d8d8d] text-[10px] uppercase block">Seek Traveled</span>
              <span className="text-[#42be65] font-bold text-sm">{cumulativeSeek} tracks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Cylinder Track Slider Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono text-[#8d8d8d]">
          <span className="uppercase tracking-wider font-semibold">Physical Disk Cylinder Position (0 – {diskSize - 1})</span>
          <span>Arm Resting at Track {currentHeadTrack}</span>
        </div>

        <div className="relative h-12 bg-[#161616] border border-[#393939] overflow-hidden flex items-center px-4">
          {/* Cylinder Tick Marks */}
          <div className="absolute inset-x-4 h-full flex justify-between items-center pointer-events-none opacity-30">
            {Array.from({ length: 21 }).map((_, idx) => (
              <div key={idx} className="h-3 w-px bg-[#8d8d8d]"></div>
            ))}
          </div>

          {/* Requested Tracks Pins */}
          {sequence.map((track, idx) => {
            const leftPct = (track / (diskSize - 1)) * 100;
            const isServed = idx <= currentStep;
            return (
              <div 
                key={idx}
                style={{ left: `${leftPct}%` }}
                className={`absolute w-1.5 h-6 -translate-x-1/2 transition-colors ${
                  isServed ? 'bg-[#42be65]/70' : 'bg-[#525252]'
                }`}
                title={`Request #${idx}: Track ${track}`}
              />
            );
          })}

          {/* Physical Sliding Read/Write Head */}
          <div 
            style={{ 
              left: `${(currentHeadTrack / (diskSize - 1)) * 100}%`,
              transition: isPlaying ? `left ${Math.max(150, 800 / playbackSpeed)}ms ease-out` : 'none'
            }}
            className="absolute -translate-x-1/2 flex flex-col items-center z-10"
          >
            <div className="w-4 h-7 bg-[#0f62fe] border-2 border-white shadow-[0_0_12px_rgba(15,98,254,0.8)] flex items-center justify-center">
              <div className="w-1 h-3 bg-white animate-pulse"></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-white bg-[#0f62fe] px-1 py-0.2 mt-0.5 whitespace-nowrap shadow">
              T{currentHeadTrack}
            </span>
          </div>
        </div>
      </div>

      {/* 2D Kinematic Traversal Graph (SVG) */}
      <div className="relative bg-[#161616] border border-[#393939] overflow-x-auto no-scrollbar">
        {/* Graph Legend / Controls */}
        <div className="p-3 border-b border-[#393939] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-[#8d8d8d] uppercase font-semibold">Trajectories:</span>
            {activeView === 'single' ? (
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-3 h-3 inline-block" 
                  style={{ backgroundColor: algoColors[algorithm] || '#0f62fe' }}
                />
                <span className="text-white font-semibold">{algorithm} Path</span>
              </div>
            ) : (
              comparisonData?.results?.map((item) => (
                <label key={item.algorithm} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleAlgos[item.algorithm] ?? true}
                    onChange={(e) => setVisibleAlgos({ ...visibleAlgos, [item.algorithm]: e.target.checked })}
                    className="accent-[#0f62fe]"
                  />
                  <span 
                    className="w-2.5 h-2.5 inline-block" 
                    style={{ backgroundColor: algoColors[item.algorithm] }}
                  />
                  <span className="text-[#c6c6c6]">{item.algorithm} ({item.total_seek_time} tracks)</span>
                </label>
              ))
            )}
          </div>

          <span className="text-[#8d8d8d] text-[11px]">
            X: Cylinder (0–{diskSize - 1}) &bull; Y: Chronological Step (0–{maxSteps})
          </span>
        </div>

        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-auto min-w-[700px] select-none"
        >
          {/* Background Grid & Ticks */}
          {trackTicks.map((track) => {
            const x = getX(track);
            return (
              <g key={track}>
                <line 
                  x1={x} 
                  y1={padTop} 
                  x2={x} 
                  y2={svgHeight - padBottom} 
                  stroke="#262626" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={x} 
                  y={svgHeight - padBottom + 18} 
                  fill="#8d8d8d" 
                  fontSize="11" 
                  fontFamily="IBM Plex Mono, monospace" 
                  textAnchor="middle"
                >
                  {track}
                </text>
              </g>
            );
          })}

          {/* Y Axis Grid Lines */}
          {Array.from({ length: maxSteps + 1 }).map((_, stepIdx) => {
            const y = getY(stepIdx, maxSteps);
            return (
              <g key={stepIdx}>
                <line 
                  x1={padLeft} 
                  y1={y} 
                  x2={svgWidth - padRight} 
                  y2={y} 
                  stroke="#222222" 
                />
                <text 
                  x={padLeft - 10} 
                  y={y + 4} 
                  fill="#8d8d8d" 
                  fontSize="10" 
                  fontFamily="IBM Plex Mono, monospace" 
                  textAnchor="end"
                >
                  S{stepIdx}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text 
            x={svgWidth / 2} 
            y={svgHeight - 10} 
            fill="#a8a8a8" 
            fontSize="11" 
            fontFamily="IBM Plex Mono, monospace" 
            textAnchor="middle"
            fontWeight="bold"
          >
            DISK CYLINDER / TRACK POSITION →
          </text>
          
          <text 
            x={16} 
            y={svgHeight / 2} 
            fill="#a8a8a8" 
            fontSize="11" 
            fontFamily="IBM Plex Mono, monospace" 
            textAnchor="middle" 
            transform={`rotate(-90 16 ${svgHeight / 2})`}
            fontWeight="bold"
          >
            STEP →
          </text>

          {/* Multi-Algorithm Trajectories in Compare Mode */}
          {activeView === 'compare' && comparisonData?.results && (
            comparisonData.results.map((comp) => {
              if (!visibleAlgos[comp.algorithm]) return null;
              const color = algoColors[comp.algorithm] || '#8d8d8d';
              const points = comp.sequence.map((trk, sIdx) => `${getX(trk)},${getY(sIdx, comp.sequence.length - 1)}`).join(' ');

              return (
                <g key={comp.algorithm} opacity="0.85">
                  <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeDasharray={comp.algorithm === 'FCFS' ? '6 4' : 'none'}
                    points={points}
                  />
                  {comp.sequence.map((trk, sIdx) => (
                    <circle
                      key={sIdx}
                      cx={getX(trk)}
                      cy={getY(sIdx, comp.sequence.length - 1)}
                      r="3.5"
                      fill={color}
                    />
                  ))}
                </g>
              );
            })
          )}

          {/* Active / Single Mode Trajectory Line */}
          {activeView === 'single' && (
            <>
              {/* Completed / Active Path */}
              {sequence.slice(0, currentStep + 1).map((track, idx) => {
                if (idx === 0) return null;
                const prevTrack = sequence[idx - 1];
                const x1 = getX(prevTrack);
                const y1 = getY(idx - 1, maxSteps);
                const x2 = getX(track);
                const y2 = getY(idx, maxSteps);

                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={algoColors[algorithm] || '#0f62fe'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Remaining Future Path (Ghost Line) */}
              {sequence.map((track, idx) => {
                if (idx < currentStep) return null;
                const prevTrack = sequence[idx - 1];
                if (prevTrack === undefined) return null;
                const x1 = getX(prevTrack);
                const y1 = getY(idx - 1, maxSteps);
                const x2 = getX(track);
                const y2 = getY(idx, maxSteps);

                return (
                  <line
                    key={`future-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#393939"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Data Point Nodes */}
              {sequence.map((track, idx) => {
                const cx = getX(track);
                const cy = getY(idx, maxSteps);
                const isPastOrCurrent = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <g 
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint({ idx, track, prev: sequence[idx - 1] })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setCurrentStep(idx)}
                  >
                    {isCurrent && (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r="10" 
                        fill="#0f62fe" 
                        opacity="0.3" 
                        className="animate-ping" 
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isCurrent ? "6.5" : "4.5"}
                      fill={isCurrent ? "#0f62fe" : isPastOrCurrent ? algoColors[algorithm] || '#0f62fe' : '#393939'}
                      stroke={isCurrent ? "#ffffff" : "#161616"}
                      strokeWidth="2"
                    />
                    <text
                      x={cx + (track > diskSize / 2 ? -10 : 10)}
                      y={cy + 4}
                      fill={isPastOrCurrent ? "#ffffff" : "#666666"}
                      fontSize="10"
                      fontFamily="IBM Plex Mono, monospace"
                      textAnchor={track > diskSize / 2 ? "end" : "start"}
                      fontWeight={isCurrent ? "bold" : "normal"}
                    >
                      {idx === 0 ? `Head (${track})` : `T${track}`}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Interactive Hover Tooltip inside SVG */}
          {hoveredPoint && (
            <g transform={`translate(${getX(hoveredPoint.track)}, ${getY(hoveredPoint.idx, maxSteps) - 15})`}>
              <rect
                x="-60"
                y="-30"
                width="120"
                height="26"
                fill="#262626"
                stroke="#0f62fe"
                strokeWidth="1"
                rx="2"
              />
              <text
                x="0"
                y="-13"
                fill="#ffffff"
                fontSize="10"
                fontFamily="IBM Plex Mono, monospace"
                textAnchor="middle"
              >
                Step {hoveredPoint.idx}: Track {hoveredPoint.track}
                {hoveredPoint.prev !== undefined && ` (Δ ${Math.abs(hoveredPoint.track - hoveredPoint.prev)})`}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Animation Playback & Step Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1e1e1e] border border-[#393939] p-3">
        {/* Step Scrubber Slider */}
        <div className="w-full sm:w-1/2 flex items-center gap-3">
          <span className="text-xs font-mono text-[#8d8d8d] uppercase shrink-0">Step:</span>
          <input
            type="range"
            min="0"
            max={maxSteps}
            value={currentStep}
            onChange={(e) => setCurrentStep(Number(e.target.value))}
            className="w-full accent-[#0f62fe] bg-[#161616] h-1.5 cursor-pointer"
          />
          <span className="text-xs font-mono text-white shrink-0 font-bold w-12 text-right">
            {currentStep}/{maxSteps}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStep(0)}
            className="p-2 bg-[#262626] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white transition-colors"
            title="Reset to Initial Head"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="p-2 bg-[#262626] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white transition-colors disabled:opacity-40"
            title="Step Backward"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (currentStep >= maxSteps) setCurrentStep(0);
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
                <span>{currentStep >= maxSteps ? 'Replay' : 'Play Kinematics'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setCurrentStep((prev) => Math.min(maxSteps, prev + 1))}
            disabled={currentStep === maxSteps}
            className="p-2 bg-[#262626] hover:bg-[#333] border border-[#393939] text-[#c6c6c6] hover:text-white transition-colors disabled:opacity-40"
            title="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 border-l border-[#393939] pl-2 ml-1">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold border ${
                  playbackSpeed === spd
                    ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                    : 'bg-[#161616] text-[#8d8d8d] border-[#393939] hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
