import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Award, ArrowRight, Bot, Cpu } from 'lucide-react';

export default function FinalVerdictBanner({ agentVerdict, mlData, facts }) {
  if (!agentVerdict) return null;

  const verdictLower = agentVerdict.toLowerCase();
  const isReal = verdictLower === 'real';
  const isFake = verdictLower === 'fake';
  const isInconclusive = !isReal && !isFake;

  // Analysis summary stats
  const totalFacts = facts?.length || 0;
  const supportCount = facts?.filter(f => (f.status || '').toLowerCase().includes('strong support')).length || 0;
  const contradictionCount = facts?.filter(f => (f.status || '').toLowerCase().includes('contradiction')).length || 0;
  const inconclusiveCount = facts?.filter(f => (f.status || '').toLowerCase().includes('inconclusive')).length || 0;

  return (
    <div
      className={`rounded-2xl p-6 border shadow-2xl relative overflow-hidden transition-all duration-700 animate-fade-in ${
        isReal
          ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/50 shadow-emerald-500/10'
          : isFake
          ? 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border-rose-500/50 shadow-rose-500/10'
          : 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-amber-500/50 shadow-amber-500/10'
      }`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isReal ? 'bg-emerald-400' : isFake ? 'bg-rose-500' : 'bg-amber-500'
        }`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Final Verdict Title & Icon */}
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border flex-shrink-0 ${
              isReal
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                : isFake
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/20'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/20'
            }`}
          >
            {isReal ? (
              <ShieldCheck className="w-9 h-9" />
            ) : isFake ? (
              <ShieldAlert className="w-9 h-9" />
            ) : (
              <AlertTriangle className="w-9 h-9" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                SYSTEM CONCLUSION • MULTI-ENGINE SYNTHESIS
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isReal
                    ? 'text-emerald-400'
                    : isFake
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                VERDICT: {agentVerdict.toUpperCase()}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {isReal &&
                'The factual claims withstood rigorous live web verification with strong supporting evidence from verified news sources, corroborating the DistilBERT model assessment.'}
              {isFake &&
                'Critical contradictions were identified against credible global reporting. The article exhibits definitive markers of disinformation or fabrication.'}
              {isInconclusive &&
                'Insufficient public corroboration or conflicting reporting was found for the extracted claims. Independent editorial discretion is advised.'}
            </p>
          </div>
        </div>

        {/* Right: Synthesis Details Card */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 min-w-[280px] space-y-2.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
            Consensus Matrix
          </span>

          {/* ML vs Agent comparison */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                DistilBERT
              </span>
              <span className={`font-bold font-mono ${mlData?.ml_verdict?.toLowerCase() === 'real' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mlData ? `${mlData.ml_verdict} (${(mlData.ml_confidence * 100).toFixed(0)}%)` : 'N/A'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Bot className="w-2.5 h-2.5 text-violet-400" />
                Agent Search
              </span>
              <span className={`font-bold font-mono ${isReal ? 'text-emerald-400' : isFake ? 'text-rose-400' : 'text-amber-400'}`}>
                {agentVerdict}
              </span>
            </div>
          </div>

          {/* Facts score breakdown */}
          {totalFacts > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400">✓ {supportCount} Support</span>
              <span className="text-rose-400">✗ {contradictionCount} Contradict</span>
              <span className="text-amber-400">? {inconclusiveCount} Inconclusive</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
