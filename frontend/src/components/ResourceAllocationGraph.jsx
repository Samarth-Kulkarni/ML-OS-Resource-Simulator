import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Layers, Eye, RefreshCw } from 'lucide-react';

export default function ResourceAllocationGraph({
  processes = [],
  resources = [],
  available = [],
  allocationMatrix = [],
  maxMatrix = [],
  needMatrix = [],
  isSafe = true,
  safeSequence = []
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'allocation' | 'request'
  const [hoveredNode, setHoveredNode] = useState(null);

  if (!processes.length || !resources.length) return null;

  // SVG Geometry
  const width = 860;
  const height = 400;
  const padX = 90;
  const padY = 60;

  // Calculate coordinates:
  // Left column: Processes (Circles)
  // Right column: Resources (Rectangles with instance dots)
  const procPositions = processes.map((p, idx) => {
    const totalP = processes.length;
    const y = padY + (idx / Math.max(1, totalP - 1)) * (height - 2 * padY);
    return { id: p, x: padX + 50, y, type: 'process' };
  });

  const resPositions = resources.map((r, idx) => {
    const totalR = resources.length;
    const y = padY + (idx / Math.max(1, totalR - 1)) * (height - 2 * padY);
    return { id: r, x: width - padX - 50, y, type: 'resource' };
  });

  // Build Edges:
  // 1. Allocation Edges: R_j -> P_i (where allocationMatrix[i][j] > 0)
  // 2. Request / Need Edges: P_i -> R_j (where needMatrix[i][j] > 0)
  const allocationEdges = [];
  const requestEdges = [];

  processes.forEach((p, pIdx) => {
    resources.forEach((r, rIdx) => {
      const alloc = allocationMatrix[pIdx]?.[rIdx] || 0;
      if (alloc > 0) {
        allocationEdges.push({
          from: r,
          to: p,
          units: alloc,
          type: 'allocation',
          source: resPositions[rIdx],
          target: procPositions[pIdx]
        });
      }

      const need = needMatrix[pIdx]?.[rIdx] ?? (maxMatrix[pIdx]?.[rIdx] - alloc);
      if (need > 0) {
        requestEdges.push({
          from: p,
          to: r,
          units: need,
          type: 'request',
          source: procPositions[pIdx],
          target: resPositions[rIdx]
        });
      }
    });
  });

  // Helper to determine if an edge should be highlighted
  const isEdgeHighlighted = (edge) => {
    if (!hoveredNode) return false;
    return edge.from === hoveredNode || edge.to === hoveredNode;
  };

  const isEdgeDimmed = (edge) => {
    if (!hoveredNode) return false;
    return edge.from !== hoveredNode && edge.to !== hoveredNode;
  };

  return (
    <div className="bg-[#262626] border border-[#393939] p-5 sm:p-6 space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#393939] pb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
            <Layers className="w-5 h-5 text-[#0f62fe]" />
            Bipartite Resource Allocation Graph (RAG)
          </h3>
          <p className="text-xs text-[#c6c6c6] font-light mt-0.5">
            Directed graph topology showing active resource claims, allocation dependencies, and circular wait cycles
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#161616] border border-[#393939] p-1 font-mono text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 font-semibold transition-colors ${
              filterMode === 'all' ? 'bg-[#0f62fe] text-white' : 'text-[#8d8d8d] hover:text-white'
            }`}
          >
            All Edges ({allocationEdges.length + requestEdges.length})
          </button>
          <button
            onClick={() => setFilterMode('allocation')}
            className={`px-3 py-1 font-semibold transition-colors ${
              filterMode === 'allocation' ? 'bg-[#24a148] text-white' : 'text-[#8d8d8d] hover:text-white'
            }`}
          >
            Allocated Only (R → P)
          </button>
          <button
            onClick={() => setFilterMode('request')}
            className={`px-3 py-1 font-semibold transition-colors ${
              filterMode === 'request' ? 'bg-[#f1c21b] text-black font-bold' : 'text-[#8d8d8d] hover:text-white'
            }`}
          >
            Needs/Requests (P → R)
          </button>
        </div>
      </div>

      {/* Graph Legend & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161616] p-3 border border-[#393939] text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#0f62fe] inline-block"></span>
            <span className="text-[#c6c6c6]">Process Node (P)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-[#393939] border border-[#78a9ff] inline-block"></span>
            <span className="text-[#c6c6c6]">Resource Node (R)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#42be65] inline-block"></span>
            <span className="text-[#42be65]">Solid Green: Holding (R → P)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-[#f1c21b] inline-block"></span>
            <span className="text-[#f1c21b]">Dashed Gold: Requesting (P → R)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSafe ? (
            <span className="flex items-center gap-1 text-[#42be65] font-semibold bg-[#24a148]/15 px-2.5 py-1 border border-[#24a148]/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acyclic / Safe Sequence Feasible</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#fa4d56] font-semibold bg-[#da1e28]/15 px-2.5 py-1 border border-[#da1e28]/40 animate-pulse">
              <XCircle className="w-3.5 h-3.5" />
              <span>Deadlock Potential (Unresolved Requests)</span>
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="bg-[#161616] border border-[#393939] overflow-x-auto no-scrollbar">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto min-w-[700px] select-none"
        >
          <defs>
            {/* Arrow Marker: Allocation (Green) */}
            <marker 
              id="arrow-allocation" 
              viewBox="0 0 10 10" 
              refX="18" 
              refY="5" 
              markerWidth="6" 
              markerHeight="6" 
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#42be65" />
            </marker>

            {/* Arrow Marker: Request (Gold) */}
            <marker 
              id="arrow-request" 
              viewBox="0 0 10 10" 
              refX="18" 
              refY="5" 
              markerWidth="6" 
              markerHeight="6" 
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f1c21b" />
            </marker>

            {/* Arrow Marker: Deadlock Loop (Red) */}
            <marker 
              id="arrow-deadlock" 
              viewBox="0 0 10 10" 
              refX="18" 
              refY="5" 
              markerWidth="6" 
              markerHeight="6" 
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#fa4d56" />
            </marker>
          </defs>

          {/* Background Grid Pattern */}
          <line x1={width / 2} y1={20} x2={width / 2} y2={height - 20} stroke="#222" strokeDasharray="6 6" />
          <text x={padX + 50} y={25} fill="#8d8d8d" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">
            PROCESSES (P)
          </text>
          <text x={width - padX - 50} y={25} fill="#8d8d8d" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">
            RESOURCES (R) & INSTANCES
          </text>

          {/* RENDER EDGES */}
          {/* 1. Allocation Edges (R -> P) */}
          {(filterMode === 'all' || filterMode === 'allocation') && (
            allocationEdges.map((edge, idx) => {
              const highlighted = isEdgeHighlighted(edge);
              const dimmed = isEdgeDimmed(edge);
              const color = !isSafe ? '#ff8389' : '#42be65';

              // Curve path
              const dx = edge.target.x - edge.source.x;
              const dy = edge.target.y - edge.source.y;
              const cx1 = edge.source.x + dx * 0.4;
              const cy1 = edge.source.y + dy * 0.1;
              const cx2 = edge.target.x - dx * 0.4;
              const cy2 = edge.target.y - dy * 0.1;

              return (
                <g key={`alloc-${idx}`} opacity={dimmed ? 0.15 : highlighted ? 1 : 0.75}>
                  <path
                    d={`M ${edge.source.x} ${edge.source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${edge.target.x} ${edge.target.y}`}
                    fill="none"
                    stroke={highlighted ? '#ffffff' : color}
                    strokeWidth={highlighted ? "3.5" : "2"}
                    markerEnd="url(#arrow-allocation)"
                  />
                  {/* Unit Label Badge */}
                  <rect
                    x={(edge.source.x + edge.target.x) / 2 - 12}
                    y={(edge.source.y + edge.target.y) / 2 - 8}
                    width="24"
                    height="16"
                    fill="#161616"
                    stroke={color}
                    strokeWidth="1"
                    rx="2"
                  />
                  <text
                    x={(edge.source.x + edge.target.x) / 2}
                    y={(edge.source.y + edge.target.y) / 2 + 4}
                    fill={color}
                    fontSize="10"
                    fontFamily="IBM Plex Mono"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {edge.units}
                  </text>
                </g>
              );
            })
          )}

          {/* 2. Request Edges (P -> R) */}
          {(filterMode === 'all' || filterMode === 'request') && (
            requestEdges.map((edge, idx) => {
              const highlighted = isEdgeHighlighted(edge);
              const dimmed = isEdgeDimmed(edge);
              const color = !isSafe ? '#fa4d56' : '#f1c21b';

              const dx = edge.target.x - edge.source.x;
              const dy = edge.target.y - edge.source.y;
              const cx1 = edge.source.x + dx * 0.4;
              const cy1 = edge.source.y + dy * 0.1;
              const cx2 = edge.target.x - dx * 0.4;
              const cy2 = edge.target.y - dy * 0.1;

              return (
                <g key={`req-${idx}`} opacity={dimmed ? 0.15 : highlighted ? 1 : 0.75}>
                  <path
                    d={`M ${edge.source.x} ${edge.source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${edge.target.x} ${edge.target.y}`}
                    fill="none"
                    stroke={highlighted ? '#ffffff' : color}
                    strokeWidth={highlighted ? "3" : "1.8"}
                    strokeDasharray="5 3"
                    markerEnd={!isSafe ? "url(#arrow-deadlock)" : "url(#arrow-request)"}
                  />
                  {/* Unit Label Badge */}
                  <rect
                    x={(edge.source.x + edge.target.x) / 2 - 12}
                    y={(edge.source.y + edge.target.y) / 2 - 8}
                    width="24"
                    height="16"
                    fill="#161616"
                    stroke={color}
                    strokeWidth="1"
                    rx="2"
                  />
                  <text
                    x={(edge.source.x + edge.target.x) / 2}
                    y={(edge.source.y + edge.target.y) / 2 + 4}
                    fill={color}
                    fontSize="10"
                    fontFamily="IBM Plex Mono"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {edge.units}
                  </text>
                </g>
              );
            })
          )}

          {/* RENDER NODES */}
          {/* Processes (Left) */}
          {procPositions.map((p, idx) => {
            const isHovered = hoveredNode === p.id;
            const isInSafeSequence = safeSequence.includes(p.id);
            const seqOrder = safeSequence.indexOf(p.id) + 1;

            return (
              <g
                key={p.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(p.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Outer Glow */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="24"
                  fill="#0f62fe"
                  opacity={isHovered ? 0.35 : 0.15}
                  className={isHovered ? 'animate-pulse' : ''}
                />
                {/* Core Circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="18"
                  fill="#161616"
                  stroke={isHovered ? '#ffffff' : '#0f62fe'}
                  strokeWidth="2.5"
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  fill="#ffffff"
                  fontSize="12"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {p.id}
                </text>

                {/* Safe Sequence Sequence Order Tag */}
                {isSafe && isInSafeSequence && (
                  <g transform={`translate(${p.x - 30}, ${p.y - 14})`}>
                    <rect x="0" y="0" width="16" height="14" fill="#42be65" rx="2" />
                    <text x="8" y="11" fill="#000" fontSize="9" fontFamily="IBM Plex Mono" fontWeight="bold" textAnchor="middle">
                      #{seqOrder}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Resources (Right) */}
          {resPositions.map((r, rIdx) => {
            const isHovered = hoveredNode === r.id;
            const availCount = available[rIdx] ?? 0;
            const totalAlloc = processes.reduce((sum, _, pIdx) => sum + (allocationMatrix[pIdx]?.[rIdx] || 0), 0);

            return (
              <g
                key={r.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(r.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Resource Rectangle */}
                <rect
                  x={r.x - 32}
                  y={r.y - 20}
                  width="64"
                  height="40"
                  fill="#1e1e1e"
                  stroke={isHovered ? '#ffffff' : '#78a9ff'}
                  strokeWidth="2"
                  rx="3"
                />
                <text
                  x={r.x}
                  y={r.y - 3}
                  fill="#ffffff"
                  fontSize="12"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  Res {r.id}
                </text>

                {/* Instance Available Subtext */}
                <text
                  x={r.x}
                  y={r.y + 12}
                  fill="#42be65"
                  fontSize="9"
                  fontFamily="IBM Plex Mono"
                  textAnchor="middle"
                >
                  Avail: {availCount}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
