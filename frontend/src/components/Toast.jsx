import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { id, type = 'info', title, message, duration = 4000 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const config = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100',
      icon: AlertCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      bg: 'bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100',
      icon: Info,
      iconColor: 'text-stone-700 dark:text-zinc-300',
    },
  }[type] || {
    bg: 'bg-stone-50 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100',
    icon: Info,
    iconColor: 'text-stone-600 dark:text-stone-400',
  };

  const IconComponent = config.icon;

  return (
    <div
      className={`pointer-events-auto border rounded-lg p-3.5 shadow-lg backdrop-blur-md animate-toast transition-all flex items-start justify-between gap-3 ${config.bg}`}
    >
      <div className="flex items-start gap-2.5 flex-1">
        <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="space-y-0.5">
          {title && <h5 className="text-xs font-semibold">{title}</h5>}
          {message && <p className="text-xs leading-relaxed opacity-90">{message}</p>}
        </div>
      </div>

      <button
        onClick={() => onDismiss?.(id)}
        className="opacity-50 hover:opacity-100 p-0.5 rounded transition-opacity"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

