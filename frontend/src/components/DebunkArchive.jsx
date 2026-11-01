import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, ShieldAlert, AlertTriangle, ArrowUpRight, Calendar, ExternalLink, BookOpen } from 'lucide-react';
import { DEBUNK_ARCHIVE } from '../data/debunkArchiveData';

export default function DebunkArchive({ onSelectArticle }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'AI & Politics', 'Health & Medicine', 'Science & Space', 'Finance & Economy', 'Climate & Energy', 'Geopolitics'];

  const filteredItems = DEBUNK_ARCHIVE.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      item.claim.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.leadSource.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Section Header ── */}
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-stone-700 dark:text-zinc-300" />
              Intelligence Feed
            </div>
            <h2 className="editorial-heading text-2xl sm:text-3xl font-normal text-stone-900 dark:text-zinc-50">
              Debunk Archive & Trending Cases
            </h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Curated repository of recent viral disinformation campaigns, manipulated media, and verified claims analyzed through dual-engine corroboration.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-400 font-mono bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg shrink-0">
            <span>{DEBUNK_ARCHIVE.length} Cases Documented</span>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="mt-6 pt-5 border-t border-stone-150 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, topic, or investigated subject..."
              className="w-full text-xs pl-10 pr-4 py-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-zinc-600 font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Case Studies Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isReal = item.verdict === 'Supported';
          const isFake = item.verdict === 'Fabricated';

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 dark:hover:border-zinc-700 transition-all group"
            >
              <div>
                {/* Card Header: Category + Verdict Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                    {item.category}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isReal
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : isFake
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {isReal ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : isFake ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                    {item.verdict}
                  </span>
                </div>

                {/* Subject Title */}
                <h3 className="editorial-heading text-lg font-medium text-stone-900 dark:text-zinc-100 group-hover:text-stone-700 dark:group-hover:text-zinc-300 transition-colors leading-snug">
                  {item.subject}
                </h3>

                {/* Investigated Claim */}
                <p className="text-xs text-stone-700 dark:text-zinc-300 mt-2 bg-stone-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-stone-200/70 dark:border-zinc-800 italic leading-relaxed">
                  "{item.claim}"
                </p>

                {/* Brief Synthesis */}
                <p className="text-xs text-stone-600 dark:text-zinc-400 mt-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Card Footer: Metadata + Load into Desk Button */}
              <div className="mt-5 pt-3.5 border-t border-stone-150 dark:border-zinc-800 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>{item.leadSource}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectArticle && onSelectArticle(item.fullText)}
                  className="inline-flex items-center gap-1 font-semibold text-stone-900 dark:text-zinc-100 hover:underline"
                >
                  Verify in Desk
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

