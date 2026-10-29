import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Clock, Bot } from 'lucide-react';

export default function ActivityLog({ logs }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg text-xs font-mono">
      {/* Accordion Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-900/80 hover:bg-slate-850 flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-300">Live Agent Execution Telemetry</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {logs.length} events
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span>{isOpen ? 'Hide Stream' : 'View Stream'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Log Feed */}
      {isOpen && (
        <div className="p-3 bg-slate-950/90 max-h-60 overflow-y-auto space-y-1.5 border-t border-slate-800/80">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
              <span className="text-slate-600 flex-shrink-0 flex items-center gap-1 font-mono">
                <Clock className="w-2.5 h-2.5" />
                {log.timestamp}
              </span>
              <span
                className={`flex-shrink-0 font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                  log.level === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : log.level === 'warn'
                    ? 'bg-amber-500/20 text-amber-400'
                    : log.level === 'error'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {log.phase}
              </span>
              <span className="text-slate-300 break-words flex-1">
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
