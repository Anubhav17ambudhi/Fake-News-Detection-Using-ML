import React from 'react';
import { ShieldCheck, History, HelpCircle, Activity, Sparkles } from 'lucide-react';

export default function Header({ 
  backendStatus, 
  onOpenHistory, 
  historyCount, 
  onOpenHelp 
}) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
                TruthLens AI
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Sparkles className="w-3 h-3 mr-1" /> Dual-Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Dual-Branch Deep Learning (TF-IDF + LSTM) &amp; Autonomous Fact-Checking Agent
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend Status indicator */}
          <button
            onClick={onOpenHelp}
            title="Backend Server Status"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/70 border border-slate-700 hover:bg-slate-800 transition"
          >
            <span className={`inline-block w-2 h-2 rounded-full ${
              backendStatus === 'online' 
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' 
                : backendStatus === 'offline' 
                ? 'bg-rose-400 shadow-sm shadow-rose-400/50' 
                : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="text-slate-300 hidden md:inline">
              Backend: {backendStatus === 'online' ? 'Connected (Port 8000)' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700/80 hover:border-slate-600 transition"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                {historyCount}
              </span>
            )}
          </button>

          {/* Instructions / Help */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
            title="Architecture & Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
