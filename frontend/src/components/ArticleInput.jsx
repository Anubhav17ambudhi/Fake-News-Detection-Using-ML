import React from 'react';
import { Play, RotateCcw, StopCircle, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { SAMPLE_ARTICLES } from '../data/sampleArticles';

export default function ArticleInput({
  text,
  setText,
  onSubmit,
  onReset,
  onCancel,
  isProcessing
}) {
  const wordsCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const isMinimumReached = wordsCount >= 20;

  const handleSampleClick = (sampleText) => {
    if (isProcessing) return;
    setText(sampleText);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Article Text Input
          </h2>
        </div>

        {/* Word count & threshold info */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`font-mono px-2 py-0.5 rounded-md border font-medium ${
              isMinimumReached
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {wordsCount} / 20 words min
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {text.length} chars
          </span>
        </div>
      </div>

      {/* Main Text Area */}
      <div className="relative">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isProcessing}
          placeholder="Paste or type the full news article or claim here (minimum 20 words required for AI fact decomposition and neural analysis)..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm leading-relaxed font-normal resize-y transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {!text && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-xs text-slate-600 font-medium bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800/80">
              Paste article text to begin analysis
            </span>
          </div>
        )}
      </div>

      {/* Sample Quick-Loaders */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Quick Samples:
        </span>
        {SAMPLE_ARTICLES.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isProcessing}
            onClick={() => handleSampleClick(sample.text)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              sample.type === 'real'
                ? 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border-emerald-500/30'
                : sample.type === 'fake'
                ? 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border-rose-500/30'
                : 'bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border-amber-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Action Controls */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isMinimumReached && text.trim().length > 0 && (
            <span className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Need {20 - wordsCount} more words to meet backend verification minimum.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {/* Reset / Clear Button */}
          <button
            type="button"
            disabled={isProcessing || (!text && wordsCount === 0)}
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>

          {/* Cancel button if running */}
          {isProcessing && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 transition-colors"
            >
              <StopCircle className="w-3.5 h-3.5 text-rose-400" />
              Stop Agent
            </button>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={isProcessing || !isMinimumReached}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Verifying in Real Time...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Verify Article
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
