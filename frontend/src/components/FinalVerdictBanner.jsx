import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Award, FileText } from 'lucide-react';

export default function FinalVerdictBanner({
  agentVerdict,
  mlData,
  facts = [],
  onOpenDossier
}) {
  if (!agentVerdict && !mlData) return null;

  const isReal = (agentVerdict || '').toLowerCase() === 'real';
  const isFake = (agentVerdict || '').toLowerCase() === 'fake';
  const isInconclusive = !isReal && !isFake;

  // Fact counts
  const supportedCount = facts.filter(
    (f) => (f.status || '').toLowerCase().includes('strong support') || f.status === 'Real'
  ).length;
  const contradictionCount = facts.filter(
    (f) => (f.status || '').toLowerCase().includes('contradiction') || f.status === 'Fake'
  ).length;
  const inconclusiveCount = facts.filter(
    (f) =>
      !(
        (f.status || '').toLowerCase().includes('strong support') ||
        (f.status || '').toLowerCase().includes('contradiction')
      )
  ).length;

  // Balanced consensus narrative synthesizing ML stylometry and agent retrieval
  const getExplanation = () => {
    const mlVerdict = mlData?.ml_verdict?.toLowerCase();
    const mlConf = mlData ? `${(mlData.ml_confidence * 100).toFixed(0)}%` : null;

    if (isReal && mlVerdict === 'real') {
      return `Dual-engine consensus reached: DistilBERT linguistic analysis (${mlConf} confidence) and live wire search independently corroborate the core assertions.`;
    }
    if (isFake && mlVerdict === 'real') {
      return `Critical divergence: While writing style mirrors typical journalistic structure, live news archives directly refute the core claims. The article is flagged as fabricated.`;
    }
    if (isReal && mlVerdict === 'fake') {
      return `Linguistic caution: Although the text contains sensationalist phrasing markers, multiple authoritative wire outlets corroborate the underlying factual event.`;
    }
    if (isFake && mlVerdict === 'fake') {
      return `Strong consensus: Both transformer pattern classification (${mlConf} confidence) and live web searches identified factual falsehoods and deceptive markers.`;
    }
    if (mlVerdict === 'fake' && mlData.ml_confidence > 0.8) {
      return `Linguistic alert: While live news archives provided inconclusive search corroboration, DistilBERT detected heavy deceptive markers (${mlConf} confidence). Proceed with caution.`;
    }
    return `Inconclusive consensus: Available journalistic reporting is insufficient or conflicting to verify or refute the article's core claims with certainty.`;
  };

  const getTheme = () => {
    if (isReal) {
      return {
        bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-950 dark:text-emerald-100',
        title: 'Article Verified as Credible',
        Icon: ShieldCheck,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
      };
    }
    if (isFake) {
      return {
        bg: 'bg-rose-50/90 dark:bg-rose-950/40',
        border: 'border-rose-200 dark:border-rose-800',
        text: 'text-rose-950 dark:text-rose-100',
        title: 'Article Flagged as Misinformation',
        Icon: ShieldAlert,
        iconColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
      };
    }
    return {
      bg: 'bg-amber-50/90 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-950 dark:text-amber-100',
      title: 'Verification Inconclusive',
      Icon: ShieldQuestion,
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    };
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <div
      className={`rounded-xl border ${theme.border} ${theme.bg} p-6 shadow-sm animate-fade-in transition-colors mb-6`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Icon & Headline */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs shrink-0">
            <IconComponent className={`w-8 h-8 ${theme.iconColor}`} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-stone-700 dark:text-zinc-300" />
                Editorial Consensus
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${theme.badgeBg}`}>
                {agentVerdict || 'Inconclusive'}
              </span>
            </div>

            <h2 className={`editorial-heading text-2xl sm:text-3xl font-semibold tracking-tight ${theme.text}`}>
              {theme.title}
            </h2>

            <p className="text-sm text-stone-700 dark:text-zinc-300 mt-2 max-w-2xl leading-relaxed">
              {getExplanation()}
            </p>
          </div>
        </div>

        {/* Right: Scorecard Stats + Dossier Trigger */}
        <div className="shrink-0 bg-white/95 dark:bg-zinc-900/95 border border-stone-200/80 dark:border-zinc-800 rounded-lg p-4 text-xs space-y-2.5 min-w-[220px] shadow-2xs">
          <div className="font-semibold text-stone-900 dark:text-zinc-100 pb-1.5 border-b border-stone-150 dark:border-zinc-800 flex items-center justify-between">
            <span>Consensus Matrix</span>
            {onOpenDossier && (
              <button
                type="button"
                onClick={onOpenDossier}
                className="text-[11px] text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 font-semibold underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Dossier
              </button>
            )}
          </div>

          {mlData && (
            <div className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
              <span>DistilBERT:</span>
              <span className="font-semibold text-stone-900 dark:text-zinc-100">
                {mlData.ml_verdict} ({(mlData.ml_confidence * 100).toFixed(0)}%)
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
            <span>Corroborated:</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {supportedCount} / {facts.length}
            </span>
          </div>

          <div className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
            <span>Refuted / Debunked:</span>
            <span className="font-semibold text-rose-700 dark:text-rose-400">
              {contradictionCount} / {facts.length}
            </span>
          </div>

          {inconclusiveCount > 0 && (
            <div className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
              <span>Inconclusive:</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {inconclusiveCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
