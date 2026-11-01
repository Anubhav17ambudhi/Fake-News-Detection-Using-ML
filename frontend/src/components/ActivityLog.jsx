import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export default function ActivityLog({ logs = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (logs.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-2xs overflow-hidden transition-colors animate-fade-in">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
          <span>Technical Telemetry Audit</span>
          <span className="mono text-[10px] text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-zinc-500">
          <span>{isOpen ? 'Collapse' : 'Inspect'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Log Messages */}
      {isOpen && (
        <div className="border-t border-stone-150 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-950/60 p-4 max-h-56 overflow-y-auto space-y-2">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-baseline gap-2.5 text-xs font-mono">
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 shrink-0 select-none">
                {log.timestamp}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-300 bg-stone-200/80 dark:bg-zinc-800 rounded px-1.5 py-0.5 shrink-0">
                {log.phase}
              </span>
              <span
                className={`leading-relaxed text-[11px] ${
                  log.level === 'error'
                    ? 'text-rose-700 dark:text-rose-400 font-semibold'
                    : log.level === 'warn'
                    ? 'text-amber-700 dark:text-amber-400'
                    : log.level === 'success'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-stone-700 dark:text-zinc-300'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
