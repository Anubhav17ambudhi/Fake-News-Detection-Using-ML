import React, { useState, useEffect } from 'react';
import { 
  Send, 
  ClipboardPaste, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileText 
} from 'lucide-react';
import { SAMPLE_ARTICLES } from '../data/sampleArticles';

export default function ArticleInput({ 
  text, 
  setText, 
  onSubmit, 
  isLoading, 
  error 
}) {
  const [loadingStage, setLoadingStage] = useState(0);

  // Dynamic progress indicator messages while waiting for backend
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStage(0);
      const stages = [0, 1, 2, 3];
      interval = setInterval(() => {
        setLoadingStage((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const stages = [
    { title: "Analyzing text & running dual-branch Keras neural network...", sub: "Evaluating TF-IDF vectors and sequence tokens" },
    { title: "Gemini Agent extracting primary factual claim...", sub: "Distilling statement into targeted verifiable query" },
    { title: "Searching live web & DuckDuckGo news sources...", sub: "Retrieving ground-truth reporting & fact-checking archives" },
    { title: "Synthesizing multimodal verdict & cross-verifying...", sub: "Aggregating ML confidence score with agent synthesis" }
  ];

  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const isWordCountSufficient = wordCount >= 20;

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
      }
    } catch (err) {
      console.warn("Clipboard access denied or unsupported", err);
    }
  };

  const handleClear = () => {
    setText('');
  };

  const handleSelectSample = (sample) => {
    setText(sample.content);
  };

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Card Header & Sample Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" />
          <h2 className="text-base sm:text-lg font-semibold text-slate-100">
            Analyze News Article / Text Claim
          </h2>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Samples:
          </span>
          {SAMPLE_ARTICLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              disabled={isLoading}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${sample.badgeColor} hover:brightness-125 disabled:opacity-50`}
            >
              {sample.title.split(' ')[0]} {sample.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or write the news article text here... (minimum 20 words required for deep-learning & agent fact-checking)"
          rows={7}
          disabled={isLoading}
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition resize-y font-normal leading-relaxed disabled:opacity-60"
        />

        {/* Quick textarea floating tools */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
          {text && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              title="Clear text"
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border border-slate-700 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handlePaste}
            disabled={isLoading}
            title="Paste from clipboard"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-xs transition"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Paste</span>
          </button>
        </div>
      </div>

      {/* Meta Bar: Word counter & Submit */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Word count meter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {wordCount === 0 ? (
              <span className="text-slate-400">0 words</span>
            ) : isWordCountSufficient ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {wordCount} words (Ready to verify)
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {wordCount} / 20 minimum words
              </span>
            )}
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-500">
            {text.length} characters
          </span>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!isWordCountSufficient || isLoading}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg ${
            isWordCountSufficient && !isLoading
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 ring-1 ring-white/20 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
              <span>Verifying Article...</span>
            </>
          ) : (
            <>
              <span>Run Verification</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>

      </div>

      {/* Dynamic Processing Status Box */}
      {isLoading && (
        <div className="mt-5 p-4 rounded-xl bg-sky-950/30 border border-sky-800/40 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sky-200">
                {stages[loadingStage].title}
              </p>
              <p className="text-xs text-sky-400/80 mt-0.5">
                {stages[loadingStage].sub}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Verification Request Failed</p>
            <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

    </div>
  );
}
