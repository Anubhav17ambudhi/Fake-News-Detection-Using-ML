import React, { useState, useEffect } from 'react';
import { ListChecks, Newspaper, Loader2, CheckCircle2, Copy, Check, Download, FileText } from 'lucide-react';
import FactItem from './FactItem';

export default function FactCheckList({
  heading,
  facts = [],
  isProcessing,
  onCopyReport,
}) {
  const [copied, setCopied] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const verifiedCount = facts.filter((f) => f.status !== 'verifying').length;
  const totalCount = facts.length;
  const allVerified = totalCount > 0 && verifiedCount === totalCount;

  // Multi-step thinking sequence messages (Progressive — never loops back to Step 1)
  const THINKING_STEPS = [
    'Analyzing linguistic style & stylistic patterns with DistilBERT...',
    'Decomposing article into core verifiable assertions with Gemini...',
    'Dispatching concurrent web queries to live news archives...',
    'Cross-referencing evidence from Reuters, BBC & global wires...',
    'Synthesizing consensus findings and source citations...',
  ];

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setLoadingStepIndex((prev) => {
          // Progress up to step 4 (live cross-referencing) and hold until server responds
          if (prev < THINKING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setLoadingStepIndex(0);
    }
  }, [isProcessing]);

  const handleCopyClick = () => {
    if (onCopyReport) {
      onCopyReport();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // State 1: EMPTY STATE (Before article is submitted)
  if (!heading && (!facts || facts.length === 0)) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs transition-colors">
        <div className="flex items-center gap-2.5 mb-4 border-b border-stone-150 dark:border-zinc-800 pb-3.5">
          <ListChecks className="w-4 h-4 text-stone-700 dark:text-zinc-300" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-zinc-100">
              Live Web Fact-Checking Audit
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              DuckDuckGo news cross-referencing & journalistic verification
            </p>
          </div>
        </div>

        <div className="py-12 flex flex-col items-center justify-center text-center">
          {isProcessing ? (
            /* Engineered dynamic loading state */
            <div className="flex flex-col items-center gap-3.5 max-w-md animate-fade-in">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-stone-300 dark:border-zinc-700 border-t-stone-900 dark:border-t-zinc-100 animate-spin" />
                <ListChecks className="w-5 h-5 text-stone-700 dark:text-zinc-300 absolute" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100 transition-all duration-300">
                  {THINKING_STEPS[loadingStepIndex]}
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Step {loadingStepIndex + 1} of {THINKING_STEPS.length} in automated verification pipeline
                </p>
              </div>

              {/* Skeleton placeholders */}
              <div className="w-full space-y-3 mt-4">
                <div className="h-16 w-full rounded-lg bg-stone-100 dark:bg-zinc-800 animate-shimmer" />
                <div className="h-16 w-full rounded-lg bg-stone-100 dark:bg-zinc-800 animate-shimmer" />
              </div>
            </div>
          ) : (
            /* Accessible empty state with illustrative wireframe */
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-20 opacity-35 dark:opacity-25 flex items-center justify-center text-stone-500 dark:text-zinc-400">
                <svg viewBox="0 0 100 80" className="w-full h-full fill-none stroke-current" strokeWidth="2">
                  <rect x="15" y="10" width="70" height="60" rx="4" />
                  <line x1="25" y1="24" x2="65" y2="24" strokeWidth="3" />
                  <line x1="25" y1="36" x2="75" y2="36" />
                  <line x1="25" y1="46" x2="55" y2="46" />
                  <circle cx="70" cy="55" r="10" />
                  <line x1="77" y1="62" x2="85" y2="70" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              <p className="text-sm font-semibold text-stone-800 dark:text-zinc-200">
                Audit Checklist Ready
              </p>
              <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                Extracted assertions, live search corroboration, and source links will populate here as the pipeline runs.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // State 2: DATA AVAILABLE OR STREAMING IN
  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs space-y-5 animate-fade-in transition-colors">
      {/* ── Top Bar: Section Title + Utilities ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-150 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-stone-700 dark:text-zinc-300" />
            Claim Verification Audit
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Cross-referenced with live news archives via DuckDuckGo search threads
          </p>
        </div>

        {/* Counter Badge + Copy Utility */}
        <div className="flex items-center gap-2.5">
          {allVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              All {totalCount} claims resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600 dark:text-zinc-300" />
              Verified {verifiedCount} of {totalCount} claims
            </span>
          )}

          {/* Copy Report Utility Button */}
          {facts.length > 0 && (
            <button
              onClick={handleCopyClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-stone-700 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 border border-stone-200 dark:border-zinc-700 rounded-md shadow-2xs transition-all"
              title="Copy formatted audit report to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  Copy Audit
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Extracted Headline Callout ── */}
      {heading && (
        <div className="bg-stone-50/80 dark:bg-zinc-800/40 border border-stone-200 dark:border-zinc-700/80 rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1">
            <Newspaper className="w-3.5 h-3.5" />
            Extracted Article Subject
          </div>
          <p className="editorial-heading text-lg sm:text-xl font-medium text-stone-900 dark:text-zinc-100 leading-snug">
            {heading}
          </p>
        </div>
      )}

      {/* ── Claims Accordion List ── */}
      <div className="space-y-3.5">
        {facts.map((fact, index) => (
          <FactItem key={fact.id || index} fact={fact} index={index} />
        ))}

        {/* Pulsing Skeleton Placeholder while more claims are being analyzed */}
        {isProcessing && facts.length > 0 && !allVerified && (
          <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs text-stone-600 dark:text-zinc-300 animate-pulse bg-stone-50/50 dark:bg-zinc-800/30">
            <Loader2 className="w-4 h-4 animate-spin text-stone-700 dark:text-zinc-300" />
            <span>
              Evaluating live evidence for claim {verifiedCount + 1} of {totalCount} across news archives…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
