import React from 'react';
import { AlertOctagon, X, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onDismiss, onRetry }) {
  if (!message) return null;

  return (
    <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-4.5 text-rose-200 shadow-xl flex items-start justify-between gap-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-500/30">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-100">Verification Error</h4>
          <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
            {message}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            )}
            <span className="text-[11px] text-rose-300/70">
              Check if FastAPI backend is listening on ws://127.0.0.1:8000/ws/verify
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-900/50 transition-colors flex-shrink-0"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
