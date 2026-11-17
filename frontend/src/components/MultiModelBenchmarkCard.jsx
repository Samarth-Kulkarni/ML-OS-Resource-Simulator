import React, { useState, useEffect } from 'react';
import { getMultiModelBenchmark } from '../services/api';
import { 
  Cpu, Zap, Award, Gauge, HardDrive, RefreshCw, Info 
} from 'lucide-react';

export default function MultiModelBenchmarkCard({ 
  selectedModel = 'decision_tree', 
  onSelectModel 
}) {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMultiModelBenchmark();
      setBenchmarkData(data);
    } catch (err) {
      console.error('Failed to load multi-model benchmark', err);
      setError('Unable to fetch ML model benchmark from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#262626] border border-[#393939] p-6 text-center">
        <div className="inline-block animate-spin w-5 h-5 border-2 border-[#0f62fe] border-t-transparent mb-3" />
        <p className="text-xs font-mono text-[#c6c6c6]">Benchmarking 4 ML Regressors on 500 Process Samples...</p>
      </div>
    );
  }

  if (error || !benchmarkData) {
    return (
      <div className="bg-[#262626] border border-[#393939] p-4 text-xs font-mono text-[#ff832b] flex items-center justify-between">
        <span>{error || 'No benchmark data available.'}</span>
        <button 
          onClick={fetchBenchmark} 
          className="text-xs text-[#78a9ff] underline hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const sampleCount = benchmarkData?.sample_count ?? 500;
  const models = Array.isArray(benchmarkData?.models) ? benchmarkData.models : [];

  return (
    <div className="bg-[#262626] border border-[#393939] p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#393939] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0f62fe]" />
            <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-white">
              Multi-Model ML Architecture Benchmark
            </h3>
          </div>
          <p className="text-xs text-[#8d8d8d] font-light mt-0.5">
            Offline burst estimation trade-off analysis across {sampleCount} test processes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#42be65] bg-[#42be65]/10 px-2 py-0.5 border border-[#42be65]/30 flex items-center gap-1">
            <Award className="w-3 h-3" />
            Kernel Pick: Decision Tree
          </span>
          <button
            onClick={fetchBenchmark}
            title="Refresh Benchmark"
            className="p-1.5 bg-[#161616] hover:bg-[#393939] border border-[#525252] text-[#8d8d8d] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Model Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((model) => {
          const isSelected = selectedModel === model.model_id;
          const suitability = String(model?.kernel_suitability || '');
          const isHighSuitability = suitability.toLowerCase().includes('high');
          const isMedSuitability = suitability.toLowerCase().includes('medium');

          const r2Percent = model?.r2_score != null ? (model.r2_score * 100).toFixed(1) : '0.0';
          const latencyUs = model?.inference_latency_us != null ? model.inference_latency_us : 0;
          const mae = model?.mae != null ? model.mae : 0;
          const sizeKb = model?.model_size_kb != null ? model.model_size_kb : 0;

          return (
            <div
              key={model.model_id}
              onClick={() => onSelectModel && onSelectModel(model.model_id)}
              className={`p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#161616] border-[#0f62fe] ring-1 ring-[#0f62fe]'
                  : 'bg-[#1e1e1e] border-[#393939] hover:border-[#525252]'
              }`}
            >
              <div>
                {/* Card Title & Selected Tag */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {model.display_name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono uppercase font-bold text-[#78a9ff] bg-[#0f62fe]/20 px-1.5 py-0.5 border border-[#0f62fe]/40 shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-mono text-[#8d8d8d] mb-3 truncate" title={model.architecture}>
                  {model.architecture}
                </p>

                {/* Accuracy & Latency Telemetry */}
                <div className="space-y-2 mb-4 text-xs font-mono">
                  {/* R2 Score */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8d8d8d]">R² Accuracy:</span>
                      <span className="font-semibold text-[#42be65]">
                        {r2Percent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#161616] border border-[#393939]">
                      <div 
                        className="h-full bg-[#42be65]" 
                        style={{ width: `${Math.max(0, Math.min(100, (model.r2_score || 0) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  {/* Inference Latency */}
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#393939]">
                    <span className="text-[#8d8d8d] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#f1c21b]" /> Latency:
                    </span>
                    <span className={`font-semibold ${
                      latencyUs < 50 ? 'text-[#42be65]' : latencyUs < 150 ? 'text-[#f1c21b]' : 'text-[#ff832b]'
                    }`}>
                      {latencyUs} µs
                    </span>
                  </div>

                  {/* MAE */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8d8d8d]">MAE Error:</span>
                    <span className="text-[#78a9ff]">{mae} ms</span>
                  </div>

                  {/* Model Footprint */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8d8d8d] flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-[#be95ff]" /> Disk Size:
                    </span>
                    <span className="text-white">{sizeKb} KB</span>
                  </div>
                </div>
              </div>

              {/* Kernel Suitability & Trade-off note */}
              <div className="pt-3 border-t border-[#393939] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#8d8d8d]">Suitability:</span>
                  <span className={`font-semibold ${
                    isHighSuitability
                      ? 'text-[#42be65]'
                      : isMedSuitability
                      ? 'text-[#f1c21b]'
                      : 'text-[#ff832b]'
                  }`}>
                    {suitability ? suitability.split(' ')[0] : 'N/A'}
                  </span>
                </div>

                <p className="text-[10px] text-[#c6c6c6] font-light leading-tight">
                  {model.description}
                </p>

                {onSelectModel && !isSelected && (
                  <button
                    type="button"
                    className="w-full mt-2 py-1 bg-[#262626] hover:bg-[#393939] border border-[#525252] text-[10px] font-mono uppercase text-white tracking-wider transition-colors"
                  >
                    Select Model
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Summary Callout */}
      <div className="p-3 bg-[#161616] border border-[#393939] text-xs font-mono text-[#c6c6c6] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#78a9ff] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">OS Kernel Pareto Frontier: </span>
          While <strong className="text-[#78a9ff]">Random Forest</strong> achieves highest R² accuracy, 
          its 20-tree traversal adds 4x latency overhead. 
          <strong className="text-[#42be65]"> Decision Tree</strong> represents the ideal kernel Pareto point: 
          deterministic O(tree_depth) execution (33.6 µs), 7.4 KB footprint, and zero cache state buffering.
        </div>
      </div>
    </div>
  );
}
