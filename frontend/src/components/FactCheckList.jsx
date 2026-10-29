import React from 'react';
import { ListChecks, Newspaper, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import FactItem from './FactItem';

export default function FactCheckList({ heading, facts, isProcessing }) {
  if (!heading && (!facts || facts.length === 0)) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300">
              Agent Claim Extraction & Web Evidence Checklist
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Gemini Flash + DuckDuckGo Live Search
            </p>
          </div>
        </div>

        <div className="py-8 flex flex-col items-center justify-center text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <p className="text-xs text-indigo-300 font-medium">
                Decomposing article into core verifiable claims...
              </p>
              <p className="text-[11px] text-slate-500">
                Extracting up to 3 factual assertions for live journalistic fact-checking
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">
              Extracted claims and live news verification will stream here once analysis begins.
            </p>
          )}
        </div>
      </div>
    );
  }

  const verifiedCount = facts.filter((f) => f.status !== 'verifying').length;
  const totalCount = facts.length;
  const allVerified = totalCount > 0 && verifiedCount === totalCount;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-fade-in">
      {/* Header and Extracted Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ListChecks className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Agentic Verification Checklist
              </h3>
              <p className="text-[11px] text-slate-400">
                Independent concurrent web search threads
              </p>
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          {allVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Claims Investigated ({totalCount}/{totalCount})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Investigating ({verifiedCount}/{totalCount} Completed)
            </span>
          )}
        </div>
      </div>

      {/* Synthesized Article Heading */}
      {heading && (
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
          <Newspaper className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-0.5">
              Extracted Article Heading
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 italic">
              "{heading}"
            </p>
          </div>
        </div>
      )}

      {/* Claims List */}
      <div className="space-y-3">
        {facts.map((fact, index) => (
          <FactItem key={fact.id || index} fact={fact} index={index} />
        ))}
      </div>
    </div>
  );
}
