import React from 'react';
import { X, Server, Terminal, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BackendStatusModal({ isOpen, onClose, backendStatus }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Backend Connection &amp; Setup</h3>
                <p className="text-xs text-slate-400">Zero backend modifications required</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Status */}
          <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">FastAPI Server Status:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              backendStatus === 'online'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
              }`} />
              {backendStatus === 'online' ? 'Online on http://127.0.0.1:8000' : 'Offline / Unreachable'}
            </span>
          </div>

          {/* Instructions */}
          <div className="mt-5 space-y-4 text-xs sm:text-sm text-slate-300">
            <div>
              <p className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                1. How to run your untouched backend:
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl font-mono text-xs text-sky-300 border border-slate-800 space-y-1">
                <p className="text-slate-400"># Open terminal and enter backend directory</p>
                <p>cd backend</p>
                <p className="text-slate-400 mt-2"># Start the FastAPI server</p>
                <p>uvicorn main:app --reload</p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                2. How React works without changing backend code:
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                FastAPI by default blocks cross-origin requests unless CORS is added. However, the Vite dev server is configured with a built-in reverse proxy (<code className="text-sky-300">/api &rarr; http://127.0.0.1:8000</code>). When React calls <code className="text-sky-300">/api/v1/verify</code>, Vite forwards the request server-side without triggering any browser CORS restrictions!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs space-y-1">
              <strong className="text-amber-300 block flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Backend Requirements Checklist:
              </strong>
              <p>&bull; Article must contain at least 20 words (built into backend validation).</p>
              <p>&bull; Ensure your <code className="text-amber-100 font-mono">GOOGLE_API_KEY</code> is present in <code className="text-amber-100 font-mono">backend/.env</code> for the Gemini agent service.</p>
              <p>&bull; Trained models must exist in <code className="text-amber-100 font-mono">backend/models/</code>.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition"
            >
              Got it
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
