import React, { useState } from 'react';
import { Search, RotateCcw, X, Loader, Sparkles, Highlighter, Edit3, Clipboard, CornerDownLeft } from 'lucide-react';
import { SAMPLE_ARTICLES } from '../data/sampleArticles';

export default function ArticleInput({
  text,
  setText,
  onSubmit,
  onReset,
  onCancel,
  isProcessing,
  facts = [],
}) {
  const [activeTab, setActiveTab] = useState('editor');

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  const isTooShort = wordCount < 20;
  const canSubmit = !isProcessing && !isTooShort && text.trim().length > 0;
  const hasAnalysis = facts && facts.length > 0 && facts.some(f => f.status !== 'verifying');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canSubmit) {
      onSubmit();
    }
  };

  const handleClear = () => {
    if (isProcessing) return;
    setText('');
    setActiveTab('editor');
  };

  const handlePaste = async () => {
    if (isProcessing) return;
    try {
      if (navigator?.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setText(clipText);
          setActiveTab('editor');
        }
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  // Safe claim matcher that requires genuine semantic overlap, avoiding tiny transitional phrases
  const matchSentenceToClaim = (sentence) => {
    const trimmedSentence = sentence.trim().toLowerCase();
    if (trimmedSentence.length < 15) return null;

    const sentenceWords = new Set(trimmedSentence.split(/\s+/).filter(w => w.length > 3));

    return facts.find((f) => {
      if (!f.text) return false;
      const factLower = f.text.trim().toLowerCase();
      // Exact or substantial substring
      if (trimmedSentence.includes(factLower) || (factLower.length > 30 && trimmedSentence.length > 30 && factLower.includes(trimmedSentence))) {
        return true;
      }
      // Word overlap threshold for longer assertions
      const factWords = factLower.split(/\s+/).filter(w => w.length > 3);
      if (factWords.length === 0) return false;
      const overlapCount = factWords.filter(w => sentenceWords.has(w)).length;
      return overlapCount >= 4 && (overlapCount / factWords.length) > 0.45;
    });
  };

  // Render annotated text preserving paragraph structure
  const renderAnnotatedText = () => {
    if (!text) return null;

    const paragraphs = text.split(/\n\s*\n/);

    return (
      <div className="space-y-3 text-sm leading-relaxed p-4 bg-stone-50/70 dark:bg-zinc-950/60 rounded-md border border-stone-200 dark:border-zinc-800 min-h-[160px] max-h-[360px] overflow-y-auto">
        {paragraphs.map((para, pIdx) => {
          const sentences = para.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [para];

          return (
            <p key={pIdx} className="leading-relaxed">
              {sentences.map((sentence, sIdx) => {
                const matchedFact = matchSentenceToClaim(sentence);

                if (!matchedFact || matchedFact.status === 'verifying') {
                  return (
                    <span key={sIdx} className="text-stone-700 dark:text-zinc-300">
                      {sentence}{' '}
                    </span>
                  );
                }

                const status = (matchedFact.status || '').toLowerCase();
                const isSupported = status.includes('strong support') || status === 'real';
                const isDebunked = status.includes('contradiction') || status === 'fake';

                if (isSupported) {
                  return (
                    <mark
                      key={sIdx}
                      className="bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 px-1 py-0.5 rounded border-b-2 border-emerald-600 font-medium inline transition-all mr-1"
                      title={`Corroborated Assertion: ${matchedFact.text}`}
                    >
                      {sentence}
                      <span className="ml-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                        [Corroborated]
                      </span>{' '}
                    </mark>
                  );
                }

                if (isDebunked) {
                  return (
                    <mark
                      key={sIdx}
                      className="bg-rose-100/90 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 px-1 py-0.5 rounded border-b-2 border-rose-600 font-medium inline transition-all mr-1"
                      title={`Refuted / Debunked Assertion: ${matchedFact.text}`}
                    >
                      {sentence}
                      <span className="ml-1 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
                        [Refuted]
                      </span>{' '}
                    </mark>
                  );
                }

                return (
                  <mark
                    key={sIdx}
                    className="bg-amber-100/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 px-1 py-0.5 rounded border-b-2 border-amber-600 font-medium inline transition-all mr-1"
                    title={`Inconclusive Evidence: ${matchedFact.text}`}
                  >
                    {sentence}
                    <span className="ml-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      [Inconclusive]
                    </span>{' '}
                  </mark>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden mb-8 transition-colors">
      {/* ── Top Bar: Realistic Case Studies + View Toggle ── */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-stone-150 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/60">
        {/* Sample Articles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium mr-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-stone-600 dark:text-zinc-400" />
            Exemplar Cases:
          </span>

          {SAMPLE_ARTICLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                setText(sample.text);
                setActiveTab('editor');
              }}
              disabled={isProcessing}
              className="group inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-stone-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md shadow-2xs hover:border-stone-400 dark:hover:border-zinc-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  sample.type === 'real'
                    ? 'bg-emerald-600'
                    : sample.type === 'fake'
                    ? 'bg-rose-600'
                    : 'bg-amber-500'
                }`}
              />
              {sample.label}
            </button>
          ))}
        </div>

        {/* View Toggle (Editor vs Claim Heatmap) */}
        {hasAnalysis && (
          <div className="flex items-center rounded-lg bg-stone-100 dark:bg-zinc-800 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('annotated')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'annotated'
                  ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
              }`}
            >
              <Highlighter className="w-3 h-3" />
              Claim Heatmap
            </button>
          </div>
        )}
      </div>

      {/* ── Main Input Body ── */}
      <div className="p-5 pb-2">
        {activeTab === 'annotated' ? (
          renderAnnotatedText()
        ) : (
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste news dispatch, social media assertion, or full article here (minimum 20 words required for transformer stylometry and live web corroboration)..."
              rows={6}
              disabled={isProcessing}
              className="w-full resize-y rounded-lg border border-stone-200 dark:border-zinc-700/80 bg-stone-50/40 dark:bg-zinc-950/60 p-4 text-stone-900 dark:text-zinc-100 text-sm leading-relaxed placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 focus:border-stone-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-950 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />

            {/* Quick Action Overlay inside Textarea */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              {text.length === 0 && !isProcessing && typeof navigator !== 'undefined' && navigator.clipboard && (
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 transition-colors shadow-2xs"
                >
                  <Clipboard className="w-3 h-3" />
                  Paste
                </button>
              )}

              {text.length > 0 && !isProcessing && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear text"
                  className="p-1 rounded-md text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer: Word Count + Action Controls ── */}
      <div className="px-5 pb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Word Count Metric */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold tabular-nums px-2.5 py-0.5 rounded border ${
              text.trim().length === 0
                ? 'text-stone-500 dark:text-zinc-400 border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/40'
                : isTooShort
                ? 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30'
                : 'text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30'
            }`}
          >
            {wordCount} / 20 words min
          </span>

          {text.trim().length > 0 && isTooShort && (
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Need {20 - wordCount} more words for reliable claim decomposition
            </span>
          )}

          {!isProcessing && canSubmit && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-400 dark:text-zinc-500 font-mono">
              <CornerDownLeft className="w-3 h-3" />
              Ctrl+Enter to verify
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Reset All */}
          {text.trim().length > 0 && !isProcessing && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Workspace
            </button>
          )}

          {/* Cancel */}
          {isProcessing && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              Stop Analysis
            </button>
          )}

          {/* PRIMARY CTA: Editorial Dark Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 bg-stone-900 dark:bg-zinc-100 rounded-lg hover:bg-stone-800 dark:hover:bg-white active:bg-black shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-stone-300 dark:text-zinc-700" />
                Cross-Checking Article…
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Verify Article
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
