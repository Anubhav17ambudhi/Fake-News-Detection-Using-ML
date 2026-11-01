import React, { useState } from 'react';
import { Search, Globe, ShieldCheck, ExternalLink, Award, CheckCircle2 } from 'lucide-react';
import { SOURCE_DIRECTORY } from '../data/sourceDirectoryData';

export default function SourceDirectory() {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterOptions = ['All', 'Wire Services', 'Fact-Checkers', 'Public Broadcast', 'Scientific Press'];

  const filtered = SOURCE_DIRECTORY.filter((s) => {
    const q = query.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      s.name.toLowerCase().includes(q) ||
      s.domain.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q);

    if (selectedFilter === 'All') return matchesSearch;
    if (selectedFilter === 'Wire Services') return matchesSearch && s.category.includes('Wire');
    if (selectedFilter === 'Fact-Checkers') return matchesSearch && (s.category.includes('Fact-Checker') || s.name.includes('Fact Check'));
    if (selectedFilter === 'Public Broadcast') return matchesSearch && (s.category.includes('Broadcast') || s.category.includes('Daily'));
    if (selectedFilter === 'Scientific Press') return matchesSearch && (s.category.includes('Academic') || s.category.includes('Health'));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* ── Section Header ── */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Credibility Registry
            </div>
            <h2 className="editorial-heading text-2xl sm:text-3xl font-normal text-stone-900 dark:text-zinc-50">
              Journalistic Source Trust Index
            </h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Vetted international news organizations, wire services, and IFCN-certified signatories used by Veritas during claim cross-referencing.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-400 font-mono bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg shrink-0">
            <span>{SOURCE_DIRECTORY.length} Accredited Outlets</span>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="mt-6 pt-5 border-t border-stone-150 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by publication, domain (e.g. reuters.com), or focus..."
              className="w-full text-xs pl-10 pr-4 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedFilter(opt)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedFilter === opt
                    ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sources Directory Grid ── */}
      <div className="space-y-3">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs hover:border-stone-300 dark:hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="editorial-heading text-lg font-medium text-stone-900 dark:text-zinc-100">
                  {item.name}
                </h3>
                <span className="mono text-[10px] text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                  {item.domain}
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  {item.ifcnStatus}
                </span>
              </div>

              <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-stone-400 dark:text-zinc-500 pt-1">
                <span>{item.category}</span>
                <span>•</span>
                <span>{item.country}</span>
                <span>•</span>
                <span className="font-medium text-stone-700 dark:text-zinc-300">{item.reliabilityTier}</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <a
                href={item.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-zinc-300 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 border border-stone-200 dark:border-zinc-700 rounded-lg shadow-2xs transition-all"
              >
                <span>Visit Outlet</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

