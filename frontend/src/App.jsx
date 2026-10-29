import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ArticleInput from './components/ArticleInput';
import VerificationResult from './components/VerificationResult';
import HistoryDrawer from './components/HistoryDrawer';
import BackendStatusModal from './components/BackendStatusModal';
import { verifyArticle, checkBackendConnection } from './services/api';
import { RotateCcw, ShieldCheck, Cpu, Bot, CheckCircle } from 'lucide-react';

const STORAGE_KEY = 'truthlens_history_v1';

export default function App() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const resultRef = useRef(null);

  // Check backend connectivity on mount and every 30 seconds
  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      const isUp = await checkBackendConnection();
      if (isMounted) {
        setBackendStatus(isUp ? 'online' : 'offline');
      }
    };

    probe();
    const interval = setInterval(probe, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn("Failed to persist history", err);
    }
  }, [history]);

  const handleVerify = async () => {
    if (!text.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const data = await verifyArticle(text);
      setResult(data);
      setBackendStatus('online');

      // Add to history
      const newEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        text: text.trim(),
        result: data,
      };

      setHistory((prev) => [newEntry, ...prev.slice(0, 24)]);

      // Scroll to result smoothly
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item) => {
    setText(item.text);
    setResult(item.result);
    setError(null);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        backendStatus={backendStatus}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Dual-Branch Verification Pipeline</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Detect Deceptive News with{' '}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Deep Learning &amp; AI Agents
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Combines a pre-trained dual-branch neural network (TF-IDF + LSTM) with real-time web search fact-checking powered by Google Gemini to catch breaking misinformation.
          </p>

          {/* Feature Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-400" /> Keras Model Inference
            </span>
            <span className="text-slate-700">&bull;</span>
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-purple-400" /> Gemini Fact-Check Agent
            </span>
            <span className="text-slate-700">&bull;</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Live Search Cross-Verification
            </span>
          </div>
        </div>

        {/* Input Card */}
        <ArticleInput
          text={text}
          setText={setText}
          onSubmit={handleVerify}
          isLoading={isLoading}
          error={error}
        />

        {/* Results Card */}
        <div ref={resultRef}>
          {result && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-200">
                  Verification Report
                </h3>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Analyze Another Article</span>
                </button>
              </div>

              <VerificationResult result={result} originalText={text} />
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/40">
        <p>TruthLens AI &bull; Built with React, Tailwind CSS, FastAPI, TensorFlow &amp; Google Gemini</p>
        <p className="mt-1 text-[11px] text-slate-600">Zero backend file alterations &bull; Seamless proxy integration</p>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* Help & Backend Status Modal */}
      <BackendStatusModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        backendStatus={backendStatus}
      />

    </div>
  );
}
