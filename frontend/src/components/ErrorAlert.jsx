import React from 'react';
import { AlertCircle, X, RotateCcw } from 'lucide-react';

export default function ErrorAlert({ message, onDismiss, onRetry }) {
  if (!message) return null;

  return (
    <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-rose-900 dark:text-rose-200 text-sm shadow-2xs flex items-start justify-between gap-3 animate-fade-in mb-6">
      <div className="flex items-start gap-3 flex-1">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-rose-950 dark:text-rose-100">Verification Notice</p>
          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 dark:text-rose-200 hover:underline mt-1"
            >
              <RotateCcw className="w-3 h-3" />
              Retry analysis
            </button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 p-1 rounded transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
