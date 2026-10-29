import React from 'react';
import { Cpu, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function MlVerdictCard({ mlData, isProcessing }) {
  if (!mlData) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Instant ML Prediction</h3>
              <p className="text-[11px] text-slate-500 font-mono">DistilBERT Sequence Classifier</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-800/50">
            Phase 1
          </span>
        </div>

        <div className="py-6 flex flex-col items-center justify-center text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <p className="text-xs text-indigo-300 font-medium">Running neural inference on token embeddings...</p>
              <p className="text-[11px] text-slate-500">Evaluating 512 context-window stylistic patterns</p>
            </div>
          ) : (
            <div className="text-slate-500 text-xs">
              Waiting for article submission to run instant classification...
            </div>
          )}
        </div>
      </div>
    );
  }

  const { ml_verdict, ml_confidence } = mlData;
  const isReal = ml_verdict?.toLowerCase() === 'real';
  const confidencePercent = Math.min(Math.max((ml_confidence * 100), 0), 100);

  return (
    <div
      className={`rounded-2xl p-5 border shadow-xl relative overflow-hidden transition-all duration-500 animate-fade-in ${
        isReal
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-500/5'
          : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40 shadow-rose-500/5'
      }`}
    >
      {/* Background glow orb */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isReal ? 'bg-emerald-400' : 'bg-rose-500'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isReal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Instant ML Prediction
              </h3>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live Result
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              DistilBERT Zero-Shot / Fine-Tuned Weights
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400 block">Response Time</span>
          <span className="text-xs font-mono font-semibold text-emerald-400">~250ms</span>
        </div>
      </div>

      {/* Main Verdict & Confidence Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 relative z-10">
        {/* Verdict Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
              isReal
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isReal ? (
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              Classifier Output
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-extrabold tracking-tight ${
                  isReal ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {ml_verdict}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  isReal
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {isReal ? 'Likely Authentic' : 'Deceptive Markers'}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
            <span className="text-slate-400">Confidence Score</span>
            <span
              className={`font-mono font-bold ${
                isReal ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {confidencePercent.toFixed(1)}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isReal
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-1.5">
            Evaluates stylistic cues, sensationalism, and linguistic markers in token representations.
          </p>
        </div>
      </div>
    </div>
  );
}
