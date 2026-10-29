import React from 'react';
import { ShieldCheck, Cpu, Bot, Wifi, WifiOff, Activity } from 'lucide-react';

export default function Header({ connectionStatus, isProcessing, wsUrl, onWsUrlChange }) {
  const [showConfig, setShowConfig] = React.useState(false);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Connecting to Agent...
          </span>
        );
      case 'streaming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            Streaming Live Verification
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            Analysis Completed
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            Disconnected / Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Ready for Analysis
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                VERITAS<span className="text-indigo-400 font-extrabold">.AI</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Agentic v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Multi-Engine Fake News Verification & Fact Checking
            </p>
          </div>
        </div>

        {/* Tech Stack Pills & Connection Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 border-r border-slate-800 pr-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Cpu className="w-3 h-3 text-cyan-400" />
              DistilBERT
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Bot className="w-3 h-3 text-violet-400" />
              LangChain + Gemini Flash
            </span>
          </div>

          {getStatusBadge()}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-800/40 transition-colors"
            title="Configure WebSocket connection"
          >
            ⚙️ WS Config
          </button>
        </div>
      </div>

      {/* Collapsible WS Configuration */}
      {showConfig && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-3 text-xs animate-fade-in">
          <label className="text-slate-400 font-medium">WebSocket Endpoint:</label>
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => onWsUrlChange(e.target.value)}
            disabled={isProcessing}
            className="flex-1 max-w-md bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs disabled:opacity-50"
          />
          <button
            onClick={() => onWsUrlChange('ws://127.0.0.1:8000/ws/verify')}
            className="text-indigo-400 hover:underline"
          >
            Reset Default
          </button>
        </div>
      )}
    </header>
  );
}
