import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Cpu, 
  Bot, 
  ExternalLink, 
  Share2, 
  Copy, 
  Check, 
  Layers, 
  Info, 
  Sparkles 
} from 'lucide-react';

export default function VerificationResult({ result, originalText }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const isReal = result.final_verdict.toLowerCase() === 'real';
  const isMlReal = result.ml_verdict.toLowerCase() === 'real';

  // Format ML probability:
  // In the model, probability > 0.5 means Real, <= 0.5 means Fake
  const prob = typeof result.ml_confidence === 'number' ? result.ml_confidence : 0.5;
  const confidencePercent = isMlReal 
    ? (prob * 100).toFixed(1) 
    : ((1 - prob) * 100).toFixed(1);

  const handleCopyReport = () => {
    const reportText = `[TruthLens Verification Report]
Final Verdict: ${result.final_verdict.toUpperCase()}
ML Model Verdict: ${result.ml_verdict} (Confidence: ${confidencePercent}%, Raw Score: ${prob.toFixed(3)})
Fact-Checking Agent Reasoning:
${result.agent_reasoning}
Sources:
${result.agent_sources && result.agent_sources.length ? result.agent_sources.join('\n') : 'No direct external URLs'}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-500">
      
      {/* FINAL VERDICT HERO BANNER */}
      <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border shadow-2xl ${
        isReal
          ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/30'
          : 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border-rose-500/40 shadow-rose-950/30'
      }`}>
        {/* Subtle decorative background pulse */}
        <div className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isReal ? 'bg-emerald-400' : 'bg-rose-500'
        }`} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`p-4 rounded-2xl border flex-shrink-0 ${
              isReal 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-inner' 
                : 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-inner'
            }`}>
              {isReal ? (
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
              ) : (
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
                  Aggregate System Verdict
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" /> Verified via Dual-Branch Logic
                </span>
              </div>
              <h3 className={`text-2xl sm:text-4xl font-extrabold mt-1 tracking-tight ${
                isReal ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {isReal ? 'Authentic / Real News' : 'Suspect / Fake News Detected'}
              </h3>
              <p className="text-sm text-slate-300 mt-1.5 max-w-2xl">
                {isReal
                  ? 'The claim exhibits authentic linguistic patterns and was validated or supported by live web search evidence.'
                  : 'The content shows deceptive or synthetic markers, or has been explicitly contradicted by live fact-checking sources.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied Report</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DUAL ENGINE DETAILED BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BRANCH 1: MACHINE LEARNING MODEL */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-base">
                    Deep Learning Neural Network
                  </h4>
                  <p className="text-xs text-slate-400">
                    Dual-Branch Model (.h5) &bull; TF-IDF + Token Sequences
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                isMlReal 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                {result.ml_verdict}
              </span>
            </div>

            {/* Confidence Gauge */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-400">Classification Certainty:</span>
                <span className="text-slate-200 font-mono font-bold text-sm">
                  {confidencePercent}% towards {result.ml_verdict}
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isMlReal 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-400' 
                      : 'bg-gradient-to-r from-rose-600 to-amber-500'
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, confidencePercent))}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-1 font-mono">
                <span>0.0 (Fake Probability)</span>
                <span>Raw Score: {prob.toFixed(4)}</span>
                <span>1.0 (Real Probability)</span>
              </div>
            </div>

            {/* Architecture Details Box */}
            <div className="mt-6 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Dual-Branch Architecture Analysis</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Branch A captures global semantic word frequencies via a pre-fit TF-IDF vectorizer, while Branch B parses word sequence patterns padded to 500 tokens to detect subtle stylistic deception markers.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-500 flex items-center justify-between">
            <span>Inference: Keras / TensorFlow</span>
            <span className="text-slate-400 font-mono">Threshold: 0.50</span>
          </div>
        </div>

        {/* BRANCH 2: GEMINI FACT-CHECKING AGENT */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-base">
                    Autonomous Fact-Checking Agent
                  </h4>
                  <p className="text-xs text-slate-400">
                    Google Gemini 3.5 &bull; Live DuckDuckGo Search Verification
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Live Evidence
              </span>
            </div>

            {/* Agent Reasoning */}
            <div className="mt-5 space-y-2">
              <span className="text-xs font-medium text-slate-400 block">
                Agent Synthesized Reasoning:
              </span>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed italic border-l-4 border-l-purple-500">
                "{result.agent_reasoning || 'No reasoning provided by agent.'}"
              </div>
            </div>

            {/* Agent Sources */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-medium text-slate-400 block">
                Cited Sources &amp; Web Evidence:
              </span>

              {result.agent_sources && result.agent_sources.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {result.agent_sources.map((src, index) => {
                    const isUrl = src.startsWith('http://') || src.startsWith('https://');
                    let displayLabel = src;
                    if (isUrl) {
                      try {
                        const parsed = new URL(src);
                        displayLabel = parsed.hostname.replace('www.', '');
                      } catch {
                        displayLabel = src;
                      }
                    }

                    return isUrl ? (
                      <a
                        key={index}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700/80 text-sky-300 hover:text-sky-200 border border-slate-700 transition"
                      >
                        <ExternalLink className="w-3 h-3 text-sky-400" />
                        <span className="font-mono">{displayLabel}</span>
                      </a>
                    ) : (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 text-slate-300 border border-slate-700 font-mono"
                      >
                        {src}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500">
                  No explicit web URLs cited. Reasoning derived from search summaries or general verification corpus.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-500 flex items-center justify-between">
            <span>Agent Pipeline: LangChain Expression Language</span>
            <span className="text-slate-400">Structured Output</span>
          </div>
        </div>

      </div>

      {/* SYSTEM AGGREGATION LOGIC BANNER */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-300">How the final verdict is calculated:</strong> The backend computes the machine learning confidence score. If the ML predicts "Real" but the real-time fact-checking agent discovers contradictory evidence, the aggregate status is corrected to "Fake". Conversely, if ML detects synthetic patterns but real-time reporting confirms the event, the agent overrides to "Real".
        </div>
      </div>

    </div>
  );
}
