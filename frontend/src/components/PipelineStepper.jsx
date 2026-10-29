import React from 'react';
import { FileText, Cpu, ListChecks, Globe, Award, CheckCircle2 } from 'lucide-react';

export default function PipelineStepper({ mlData, articleHeading, facts, agentVerdict, isProcessing }) {
  // Determine status of each step
  const step1 = true; // Ingestion
  const step2 = mlData !== null; // ML Verdict
  const step3 = articleHeading !== null; // Heading & claims extracted
  const step4 = facts && facts.length > 0 && facts.some(f => f.status !== 'verifying'); // Fact checks underway/completed
  const step5 = agentVerdict !== null; // Final consensus

  const steps = [
    {
      id: 1,
      title: "Input Text",
      desc: "20+ words",
      icon: FileText,
      active: true,
      done: isProcessing || step2,
    },
    {
      id: 2,
      title: "DistilBERT ML",
      desc: mlData ? `${mlData.ml_verdict} (${(mlData.ml_confidence * 100).toFixed(0)}%)` : "Neural Classifier",
      icon: Cpu,
      active: isProcessing && !step2,
      done: step2,
    },
    {
      id: 3,
      title: "Claim Extraction",
      desc: articleHeading ? "Claims identified" : "Ollama LLM",
      icon: ListChecks,
      active: isProcessing && step2 && !step3,
      done: step3,
    },
    {
      id: 4,
      title: "Web Verification",
      desc: facts.length > 0 ? `${facts.filter(f => f.status !== 'verifying').length}/${facts.length} Verified` : "DuckDuckGo News",
      icon: Globe,
      active: isProcessing && step3 && !step5,
      done: facts.length > 0 && facts.every(f => f.status !== 'verifying'),
    },
    {
      id: 5,
      title: "Final Verdict",
      desc: agentVerdict ? agentVerdict : "Synthesized",
      icon: Award,
      active: isProcessing && step4 && !step5,
      done: step5,
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-3 px-1">
        <span>AGENTIC WORKFLOW PIPELINE</span>
        {isProcessing && (
          <span className="text-cyan-400 font-mono flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            ACTIVE EXECUTION
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              className={`relative rounded-xl p-3 border transition-all duration-300 flex flex-col justify-between ${
                st.done
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : st.active
                  ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-300 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    st.done
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : st.active
                      ? 'bg-indigo-500/20 text-indigo-400 animate-bounce'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {st.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : st.active ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600">#{st.id}</span>
                )}
              </div>
              <div>
                <p className={`text-xs font-semibold truncate ${st.done ? 'text-emerald-200' : st.active ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {st.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                  {st.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
