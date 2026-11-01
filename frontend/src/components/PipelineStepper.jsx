import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function PipelineStepper({ mlData, articleHeading, facts = [], agentVerdict, isProcessing }) {
  const step1Done = isProcessing || mlData !== null;
  const step2Done = mlData !== null;
  const step3Done = articleHeading !== null;
  const step4Done = facts.length > 0 && facts.every((f) => f.status !== 'verifying');
  const step5Done = agentVerdict !== null;

  const steps = [
    {
      id: 1,
      label: 'Article Ingestion',
      status: step1Done ? 'done' : isProcessing ? 'current' : 'pending',
    },
    {
      id: 2,
      label: 'DistilBERT Stylometry',
      status: step2Done ? 'done' : isProcessing && !step2Done ? 'current' : 'pending',
    },
    {
      id: 3,
      label: 'Claim Extraction',
      status: step3Done ? 'done' : isProcessing && step2Done && !step3Done ? 'current' : 'pending',
    },
    {
      id: 4,
      label: 'Live Wire Verification',
      status: step4Done ? 'done' : isProcessing && step3Done && !step4Done ? 'current' : 'pending',
    },
    {
      id: 5,
      label: 'Consensus Synthesis',
      status: step5Done ? 'done' : isProcessing && step4Done && !step5Done ? 'current' : 'pending',
    },
  ];

  const hasStarted = isProcessing || mlData || articleHeading || agentVerdict;
  if (!hasStarted) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-5 sm:px-6 py-3.5 shadow-2xs mb-6 animate-fade-in transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-stone-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px] shrink-0">
          Pipeline Status:
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3.5">
          {steps.map((st, idx) => (
            <React.Fragment key={st.id}>
              <div className="flex items-center gap-1.5">
                {st.status === 'done' ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : st.status === 'current' ? (
                  <span className="w-4 h-4 rounded-full bg-stone-200 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-stone-700 dark:text-zinc-200" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center text-[10px] font-mono shrink-0">
                    {st.id}
                  </span>
                )}
                <span
                  className={`text-xs ${
                    st.status === 'done'
                      ? 'text-stone-700 dark:text-zinc-300 font-medium'
                      : st.status === 'current'
                      ? 'text-stone-900 dark:text-zinc-100 font-bold'
                      : 'text-stone-400 dark:text-zinc-500'
                  }`}
                >
                  {st.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <span className="text-stone-300 dark:text-zinc-700 hidden sm:inline">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
