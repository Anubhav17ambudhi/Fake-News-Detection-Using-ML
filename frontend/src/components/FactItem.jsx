import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Loader2,
  Globe,
  Quote,
  Sparkles
} from 'lucide-react';

export default function FactItem({ fact, index }) {
  const isVerifying = fact.status === 'verifying';
  const statusLower = (fact.status || '').toLowerCase();

  // Status mapping
  const isStrongSupport = statusLower.includes('strong support') || statusLower === 'real';
  const isContradiction = statusLower.includes('contradiction') || statusLower === 'fake';
  const isInconclusive = !isVerifying && !isStrongSupport && !isContradiction;

  // Extract clean domain for sources
  const getDomainFromUrl = (urlStr) => {
    try {
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        urlStr = 'https://' + urlStr;
      }
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return urlStr.length > 28 ? urlStr.slice(0, 25) + '...' : urlStr;
    }
  };

  return (
    <div
      className={`rounded-xl border p-4.5 transition-all duration-500 animate-fade-in relative ${
        isVerifying
          ? 'bg-slate-900/70 border-cyan-500/30 ring-1 ring-cyan-500/10'
          : isStrongSupport
          ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900/90 to-slate-900 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
          : isContradiction
          ? 'bg-gradient-to-r from-rose-950/30 via-slate-900/90 to-slate-900 border-rose-500/40 shadow-sm shadow-rose-500/5'
          : 'bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900 border-amber-500/40 shadow-sm shadow-amber-500/5'
      }`}
    >
      {/* Top row: Claim Index, Fact Text, and Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 mt-0.5 ${
              isVerifying
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : isStrongSupport
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : isContradiction
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            #{index + 1}
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-100 leading-snug">
              {fact.text}
            </h4>
          </div>
        </div>

        {/* Dynamic Status Pill */}
        <div className="self-start">
          {isVerifying ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-sm animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Verifying Web Evidence...</span>
            </span>
          ) : isStrongSupport ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Strong Support
            </span>
          ) : isContradiction ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              Contradiction
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Inconclusive
            </span>
          )}
        </div>
      </div>

      {/* Verified Details (Reasoning & Evidence Sources) */}
      {!isVerifying && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 space-y-2.5 animate-fade-in">
          {/* AI Reasoning */}
          {fact.reasoning && (
            <div className="flex items-start gap-2 bg-slate-950/60 rounded-lg p-3 border border-slate-800/60 text-xs">
              <Quote className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Investigative Agent Reasoning:
                </span>
                {fact.reasoning}
              </div>
            </div>
          )}

          {/* Sources Section */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-400" />
              Evidence Sources:
            </span>

            {fact.sources && fact.sources.length > 0 ? (
              fact.sources.map((srcUrl, sIdx) => {
                const domain = getDomainFromUrl(srcUrl);
                const safeUrl =
                  srcUrl.startsWith('http://') || srcUrl.startsWith('https://')
                    ? srcUrl
                    : `https://${srcUrl}`;

                return (
                  <a
                    key={sIdx}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 border border-slate-700/70 hover:border-indigo-500/50 transition-colors shadow-sm"
                    title={srcUrl}
                  >
                    <span>{domain}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                );
              })
            ) : (
              <span className="text-[11px] text-slate-500 italic">
                No external web source URLs indexed for this specific claim
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
