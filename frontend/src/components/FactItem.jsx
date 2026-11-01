import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Quote,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Globe
} from 'lucide-react';

// Credible international news and public institutions
const TRUSTED_DOMAINS = [
  'reuters.com',
  'apnews.com',
  'afp.com',
  'factcheck.afp.com',
  'bbc.com',
  'bbc.co.uk',
  'thehindu.com',
  'ndtv.com',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'wsj.com',
  'bloomberg.com',
  'politifact.com',
  'snopes.com',
  'fullfact.org',
  'nature.com',
  'science.org',
  'nasa.gov',
  'gov.in',
  'who.int',
  'un.org',
  'nih.gov',
  'cdc.gov'
];

export default function FactItem({ fact, index }) {
  const [isOpen, setIsOpen] = useState(true);

  const isVerifying = fact.status === 'verifying';
  const statusLower = (fact.status || '').toLowerCase();

  const isStrongSupport = statusLower.includes('strong support') || statusLower === 'real';
  const isContradiction = statusLower.includes('contradiction') || statusLower === 'fake';
  const isInconclusive = !isVerifying && !isStrongSupport && !isContradiction;

  // Clean URL string extraction that safely strips markdown links or surrounding quotes
  const cleanUrl = (rawStr) => {
    if (!rawStr || typeof rawStr !== 'string') return '';
    let url = rawStr.trim();
    // Match markdown link: [label](url)
    const mdMatch = url.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (mdMatch) return mdMatch[1];
    // Match raw URL in text
    const urlMatch = url.match(/(https?:\/\/[^\s"')]+)/);
    if (urlMatch) return urlMatch[1];
    // Strip leading/trailing quotes or brackets
    url = url.replace(/^["'(<]+|["')>]+$/g, '');
    return url;
  };

  const getDomainFromUrl = (urlStr) => {
    try {
      const cleaned = cleanUrl(urlStr);
      let target = cleaned;
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target;
      }
      const parsed = new URL(target);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return urlStr.length > 25 ? urlStr.slice(0, 22) + '...' : urlStr;
    }
  };

  const isTrustedDomain = (urlStr) => {
    const domain = getDomainFromUrl(urlStr).toLowerCase();
    return TRUSTED_DOMAINS.some((td) => domain.includes(td)) || domain.endsWith('.gov') || domain.endsWith('.edu');
  };

  const getBorderColor = () => {
    if (isVerifying) return 'border-l-stone-300 dark:border-l-zinc-700';
    if (isStrongSupport) return 'border-l-emerald-600 dark:border-l-emerald-500';
    if (isContradiction) return 'border-l-rose-600 dark:border-l-rose-500';
    return 'border-l-amber-500 dark:border-l-amber-500';
  };

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 border-l-4 ${getBorderColor()} rounded-xl shadow-2xs overflow-hidden transition-all duration-200 animate-fade-in`}
    >
      {/* ── ACCORDION HEADER (Click to toggle) ── */}
      <button
        type="button"
        onClick={() => !isVerifying && setIsOpen(!isOpen)}
        disabled={isVerifying}
        aria-expanded={isOpen}
        className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-left hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors disabled:cursor-wait"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mono text-xs font-semibold text-stone-600 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded px-2 py-0.5 mt-0.5 shrink-0">
            Claim {index !== undefined ? index + 1 : ''}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="editorial-heading text-base sm:text-lg font-medium text-stone-900 dark:text-zinc-100 leading-snug">
              "{fact.text}"
            </h4>
          </div>
        </div>

        {/* Right Status Pill + Accordion Chevron */}
        <div className="flex items-center gap-2.5 shrink-0 ml-2">
          {isVerifying ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600 dark:text-zinc-300" />
              Cross-referencing…
            </span>
          ) : isStrongSupport ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Corroborated
            </span>
          ) : isContradiction ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Refuted / Debunked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Inconclusive
            </span>
          )}

          {!isVerifying && (
            <span className="text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors p-1">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          )}
        </div>
      </button>

      {/* ── ACCORDION BODY (Open State: Evidence & Sources) ── */}
      {isOpen && !isVerifying && (
        <div className="px-5 pb-5 pt-1 border-t border-stone-150 dark:border-zinc-800 space-y-4 animate-fade-in">
          {/* Evidence Synthesis Box */}
          {fact.reasoning && (
            <div className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-zinc-300 bg-stone-50/80 dark:bg-zinc-800/40 rounded-lg p-3.5 border border-stone-200/80 dark:border-zinc-700/70">
              <Quote className="w-4 h-4 text-stone-400 dark:text-zinc-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-stone-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] block mb-1">
                  Corroboration Synthesis:
                </span>
                <p>{fact.reasoning}</p>
              </div>
            </div>
          )}

          {/* Source Citations with Credibility Badges */}
          {fact.sources && fact.sources.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 block">
                Investigative Citations ({fact.sources.length}):
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {fact.sources.map((rawUrl, idx) => {
                  const cleaned = cleanUrl(rawUrl);
                  const domainName = getDomainFromUrl(cleaned);
                  const trusted = isTrustedDomain(cleaned);

                  return (
                    <a
                      key={idx}
                      href={cleaned}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-zinc-300 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 border border-stone-200 dark:border-zinc-700 rounded-md shadow-2xs hover:shadow-xs transition-all"
                      title={cleaned}
                    >
                      {trusted ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" title="Recognized Journalistic Source" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500 shrink-0" />
                      )}
                      <span className="font-medium group-hover:text-stone-900 dark:group-hover:text-zinc-100">
                        {domainName}
                      </span>
                      {trusted && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100/60 dark:bg-emerald-950/60 px-1 rounded">
                          Trusted
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 text-stone-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
