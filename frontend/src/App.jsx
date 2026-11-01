import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import PipelineStepper from './components/PipelineStepper';
import ArticleInput from './components/ArticleInput';
import MlVerdictCard from './components/MlVerdictCard';
import FactCheckList from './components/FactCheckList';
import FinalVerdictBanner from './components/FinalVerdictBanner';
import ActivityLog from './components/ActivityLog';
import ErrorAlert from './components/ErrorAlert';
import ToastContainer from './components/Toast';
import DebunkArchive from './components/DebunkArchive';
import MethodologyView from './components/MethodologyView';
import SourceDirectory from './components/SourceDirectory';
import VerificationDossierModal from './components/VerificationDossierModal';

export default function App() {
  // Navigation active tab: 'desk' | 'archive' | 'methodology' | 'sources'
  const [activeTab, setActiveTab] = useState('desk');

  // Dossier modal state
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Theme state (Dark/Light mode)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('veritas_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Toasts state
  const [toasts, setToasts] = useState([]);

  // Input & WS Config state
  const [inputText, setInputText] = useState('');
  const [wsUrl, setWsUrl] = useState('ws://127.0.0.1:8000/ws/verify');

  // Streaming Analysis state
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'connecting' | 'streaming' | 'closed' | 'error'

  // Backend payload states
  const [mlData, setMlData] = useState(null); // { ml_verdict: string, ml_confidence: number }
  const [articleHeading, setArticleHeading] = useState(null); // string
  const [facts, setFacts] = useState([]); // Array of fact objects
  const [agentVerdict, setAgentVerdict] = useState(null); // string: 'Real' | 'Fake' | 'Inconclusive'
  const [errorMessage, setErrorMessage] = useState(null); // string

  // Audit logs for live transparency
  const [activityLogs, setActivityLogs] = useState([]);

  // Ref to hold the active WebSocket connection
  const wsRef = useRef(null);

  // Apply dark mode class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('veritas_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('veritas_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // Toast dispatch helper
  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Telemetry log helper
  const addLog = useCallback((phase, message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs((prev) => [
      ...prev,
      { timestamp, phase, message, level }
    ]);
  }, []);

  // Safely close and detach socket
  const cleanupCurrentSocket = useCallback(() => {
    if (wsRef.current) {
      const sock = wsRef.current;
      wsRef.current = null;
      sock.onopen = null;
      sock.onmessage = null;
      sock.onerror = null;
      sock.onclose = null;
      try {
        sock.close();
      } catch {
        // ignore
      }
    }
  }, []);

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      cleanupCurrentSocket();
    };
  }, [cleanupCurrentSocket]);

  // Proactive background connectivity health check
  useEffect(() => {
    if (isProcessing) return;
    let active = true;

    try {
      const probe = new WebSocket(wsUrl);
      probe.onopen = () => {
        if (active) {
          setConnectionStatus('ready');
        }
        probe.close();
      };
      probe.onerror = () => {
        if (active) {
          setConnectionStatus('error');
        }
      };
    } catch {
      if (active) {
        setConnectionStatus('error');
      }
    }

    return () => {
      active = false;
    };
  }, [wsUrl, isProcessing]);

  // Reset all verification state
  const handleReset = useCallback(() => {
    cleanupCurrentSocket();
    setIsProcessing(false);
    setConnectionStatus('ready');
    setMlData(null);
    setArticleHeading(null);
    setFacts([]);
    setAgentVerdict(null);
    setErrorMessage(null);
    setActivityLogs([]);
    addToast('info', 'Workspace Reset', 'All input and audit results cleared.');
  }, [cleanupCurrentSocket, addToast]);

  // Cancel/Stop active verification
  const handleCancel = useCallback(() => {
    cleanupCurrentSocket();
    setIsProcessing(false);
    setConnectionStatus('closed');
    addLog('USER', 'Verification halted by user.', 'warn');
    addToast('warning', 'Analysis Stopped', 'Verification sequence was cancelled.');
  }, [cleanupCurrentSocket, addLog, addToast]);

  // Select article from archive and switch to desk
  const handleSelectArchiveArticle = useCallback((text) => {
    setInputText(text);
    setActiveTab('desk');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('info', 'Case Loaded', 'Selected claim loaded into the Investigation Desk.');
  }, [addToast]);

  // Copy full audit report to clipboard
  const handleCopyReport = useCallback(() => {
    const headingText = articleHeading || 'News Verification Report';
    const mlVerdict = mlData ? `${mlData.ml_verdict} (${(mlData.ml_confidence * 100).toFixed(1)}% confidence)` : 'N/A';
    const finalV = agentVerdict || 'Inconclusive';

    const claimsMarkdown = facts
      .map((f, i) => {
        const sourcesText = (f.sources || []).map((s) => `  - ${s}`).join('\n');
        return `### Claim ${i + 1}: "${f.text}"\n- **Status:** ${f.status}\n- **Findings:** ${f.reasoning || 'Evaluated via web sources.'}\n- **Sources Cited:**\n${sourcesText || '  - None cited'}`;
      })
      .join('\n\n');

    const markdown = `# Veritas Fact-Checking Audit Report\n\n**Subject:** ${headingText}\n**Consensus Verdict:** ${finalV}\n**DistilBERT Classifier:** ${mlVerdict}\n\n---\n\n## Claim-by-Claim Breakdown\n\n${claimsMarkdown}\n\n---\n*Report generated by Veritas AI Dual-Engine Verification System.*`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(markdown);
      addToast('success', 'Audit Report Copied', 'Markdown summary copied to clipboard.');
    }
  }, [articleHeading, mlData, agentVerdict, facts, addToast]);

  // Main verification trigger (WebSocket connection contract)
  const handleVerify = useCallback(() => {
    const trimmed = inputText.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

    if (wordCount < 20) {
      const msg = `Article is too short (${wordCount} words). Minimum 20 words required for deep claim decomposition.`;
      setErrorMessage(msg);
      addToast('error', 'Validation Error', msg);
      return;
    }

    // Reset previous results
    setErrorMessage(null);
    setMlData(null);
    setArticleHeading(null);
    setFacts([]);
    setAgentVerdict(null);
    setActivityLogs([]);
    setIsProcessing(true);
    setConnectionStatus('connecting');

    addLog('INIT', `Opening connection to verification server at ${wsUrl}...`);
    addToast('info', 'Analysis Started', 'Dispatching article to DistilBERT and Gemini agent...');

    try {
      cleanupCurrentSocket();

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      // 1. Connection opened: send article text payload
      socket.onopen = () => {
        if (wsRef.current !== socket) return;
        setConnectionStatus('streaming');
        addLog('WS_OPEN', 'Connected to verification server. Dispatching article text...', 'success');

        const payload = JSON.stringify({ text: trimmed });
        socket.send(payload);
        addLog('PIPELINE', 'Article submitted. Awaiting DistilBERT classifier and claim decomposition...');
      };

      // 2. Incoming streaming messages handler
      socket.onmessage = (event) => {
        if (wsRef.current !== socket) return;

        try {
          const message = JSON.parse(event.data);
          const { step } = message;

          switch (step) {
            // STEP 1: Instant ML Prediction (DistilBERT)
            case 'ml_verdict': {
              const data = message.data || {};
              setMlData(data);
              const confidencePct = data.ml_confidence
                ? (data.ml_confidence * 100).toFixed(1)
                : '0';
              addLog(
                'DISTILBERT',
                `Linguistic pattern classifier output: ${data.ml_verdict} (${confidencePct}% confidence)`,
                data.ml_verdict?.toLowerCase() === 'real' ? 'success' : 'warn'
              );
              break;
            }

            // STEP 2: LLM Claim Decomposition & Heading Extraction
            case 'extraction_complete': {
              const heading = message.heading || 'News Article';
              const rawFacts = message.facts || [];
              setArticleHeading(heading);

              const formattedFacts = rawFacts.map((factText, index) => ({
                id: `claim-${index}`,
                text: factText,
                status: 'verifying',
                reasoning: '',
                sources: []
              }));

              setFacts(formattedFacts);
              addLog(
                'EXTRACTION',
                `Identified subject "${heading}" and ${formattedFacts.length} claims. Initiating live web searches...`,
                'info'
              );
              break;
            }

            // STEP 3: Individual Fact Verified (With robust normalized key matching to prevent race conditions)
            case 'fact_verified': {
              const verified = message.data || {};
              const targetFact = (verified.fact || '').trim();
              const newStatus = verified.status || 'Inconclusive';
              const reasoning = verified.reasoning || '';
              const sources = verified.sources || [];

              setFacts((prevFacts) => {
                const normalize = (str) =>
                  (str || '')
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                const targetNorm = normalize(targetFact);

                // Strategy 1: Exact text match
                let matchIndex = prevFacts.findIndex((f) => f.text === targetFact);

                // Strategy 2: Normalized alphanumeric match
                if (matchIndex === -1 && targetNorm) {
                  matchIndex = prevFacts.findIndex((f) => normalize(f.text) === targetNorm);
                }

                // Strategy 3: Significant substring match (> 15 chars)
                if (matchIndex === -1 && targetNorm.length > 15) {
                  matchIndex = prevFacts.findIndex((f) => {
                    const fNorm = normalize(f.text);
                    return fNorm.includes(targetNorm) || targetNorm.includes(fNorm);
                  });
                }

                // Strategy 4: High word overlap match
                if (matchIndex === -1 && targetNorm.length > 15) {
                  const targetWords = new Set(targetNorm.split(' ').filter((w) => w.length > 3));
                  let bestOverlap = 0;
                  let bestIdx = -1;

                  prevFacts.forEach((f, idx) => {
                    if (f.status === 'verifying') {
                      const fWords = normalize(f.text).split(' ').filter((w) => w.length > 3);
                      const common = fWords.filter((w) => targetWords.has(w)).length;
                      if (common > bestOverlap && common >= 3) {
                        bestOverlap = common;
                        bestIdx = idx;
                      }
                    }
                  });

                  if (bestIdx !== -1) {
                    matchIndex = bestIdx;
                  }
                }

                // Strategy 5: First verifying slot only as strict fallback
                if (matchIndex === -1) {
                  matchIndex = prevFacts.findIndex((f) => f.status === 'verifying');
                }

                if (matchIndex === -1) {
                  return [
                    ...prevFacts,
                    {
                      id: `claim-${prevFacts.length}`,
                      text: targetFact,
                      status: newStatus,
                      reasoning,
                      sources
                    }
                  ];
                }

                const updated = [...prevFacts];
                updated[matchIndex] = {
                  ...updated[matchIndex],
                  status: newStatus,
                  reasoning,
                  sources
                };
                return updated;
              });

              addLog(
                'FACT_CHECK',
                `Claim resolved: "${targetFact.slice(0, 35)}..." [${newStatus}]`,
                newStatus.toLowerCase().includes('strong support')
                  ? 'success'
                  : newStatus.toLowerCase().includes('contradiction')
                  ? 'error'
                  : 'warn'
              );
              break;
            }

            // STEP 4: Agent Complete (Final overall verdict reached)
            case 'agent_complete': {
              const overall = message.overall_verdict || 'Inconclusive';
              setAgentVerdict(overall);
              setIsProcessing(false);
              setConnectionStatus('closed');
              addLog('CONSENSUS', `Fact-checking complete. Consensus: ${overall}`, 'success');
              addToast(
                overall === 'Real' ? 'success' : overall === 'Fake' ? 'error' : 'warning',
                'Audit Complete',
                `Consensus verdict reached: ${overall}`
              );

              if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
              }
              break;
            }

            // STEP 5: Backend Error handling
            case 'error': {
              const errMsg = message.message || 'An error occurred during verification.';
              setErrorMessage(errMsg);
              setIsProcessing(false);
              setConnectionStatus('error');
              addLog('ERROR', errMsg, 'error');
              addToast('error', 'Server Error', errMsg);

              if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
              }
              break;
            }

            default:
              addLog('WS_RAW', `Received message: ${JSON.stringify(message)}`);
              break;
          }
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError, event.data);
          addLog('ERROR', 'Malformed response received from server', 'error');
        }
      };

      // 3. Error Event Handler
      socket.onerror = (err) => {
        if (wsRef.current !== socket) return;
        console.error('WebSocket Error:', err);
        const errText = `Unable to connect to verification server at ${wsUrl}. Ensure FastAPI backend is running (python -m uvicorn main:app --reload).`;
        setErrorMessage(errText);
        setIsProcessing(false);
        setConnectionStatus('error');
        addLog('WS_ERROR', `Connection failed to ${wsUrl}`, 'error');
        addToast('error', 'Connection Refused', 'FastAPI backend is offline or unreachable.');
      };

      // 4. Close Event Handler
      socket.onclose = (event) => {
        if (wsRef.current !== socket) return;
        setIsProcessing(false);
        setConnectionStatus((prev) => (prev === 'error' ? 'error' : 'closed'));
        addLog('WS_CLOSE', `Session closed (Code: ${event.code || 1000})`);
      };
    } catch (e) {
      setErrorMessage(`Failed to initiate connection: ${e.message}`);
      setIsProcessing(false);
      setConnectionStatus('error');
      addLog('EXCEPTION', e.message, 'error');
      addToast('error', 'Exception', e.message);
    }
  }, [inputText, wsUrl, cleanupCurrentSocket, addLog, addToast]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Official Verification Dossier Modal */}
      <VerificationDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        articleHeading={articleHeading}
        agentVerdict={agentVerdict}
        mlData={mlData}
        facts={facts}
        rawText={inputText}
      />

      {/* Header with Navigation Tabs & Dark/Light Toggle */}
      <Header
        connectionStatus={connectionStatus}
        isProcessing={isProcessing}
        wsUrl={wsUrl}
        onWsUrlChange={setWsUrl}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Error Alert Display */}
        {errorMessage && (
          <ErrorAlert
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            onRetry={handleVerify}
          />
        )}

        {/* ── TAB 1: INVESTIGATION DESK (Core Tool) ── */}
        {activeTab === 'desk' && (
          <div className="space-y-6 animate-fade-in">
            {/* Editorial Subtitle / Mission */}
            <div className="text-center max-w-2xl mx-auto space-y-2 pt-1 pb-2">
              <h2 className="editorial-heading text-3xl sm:text-4xl font-normal text-stone-900 dark:text-zinc-50 tracking-tight">
                Dual-Engine News Fact-Checking Desk
              </h2>
              <p className="text-sm text-stone-600 dark:text-zinc-400 leading-relaxed">
                Corroborating investigative assertions through fine-tuned DistilBERT transformer stylometry and live international news wire cross-referencing.
              </p>
            </div>

            {/* Article Input Panel */}
            <ArticleInput
              text={inputText}
              setText={setInputText}
              onSubmit={handleVerify}
              onReset={handleReset}
              onCancel={handleCancel}
              isProcessing={isProcessing}
              facts={facts}
            />

            {/* Real-time Pipeline Stepper */}
            <PipelineStepper
              mlData={mlData}
              articleHeading={articleHeading}
              facts={facts}
              agentVerdict={agentVerdict}
              isProcessing={isProcessing}
            />

            {/* Final Verdict Banner */}
            {agentVerdict && (
              <FinalVerdictBanner
                agentVerdict={agentVerdict}
                mlData={mlData}
                facts={facts}
                onOpenDossier={() => setIsDossierOpen(true)}
              />
            )}

            {/* Audit Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: DistilBERT Stylometric Card + Audit Trail */}
              <div className="md:col-span-4 space-y-5">
                <MlVerdictCard
                  mlData={mlData}
                  isProcessing={isProcessing && !mlData}
                  text={inputText}
                />

                <ActivityLog logs={activityLogs} />
              </div>

              {/* Right Column: Claim-by-Claim Accordion Verification Audit */}
              <div className="md:col-span-8">
                <FactCheckList
                  heading={articleHeading}
                  facts={facts}
                  isProcessing={isProcessing && (!facts || facts.length === 0)}
                  onCopyReport={handleCopyReport}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DEBUNK ARCHIVE ── */}
        {activeTab === 'archive' && (
          <DebunkArchive onSelectArticle={handleSelectArchiveArticle} />
        )}

        {/* ── TAB 3: METHODOLOGY & STANDARDS ── */}
        {activeTab === 'methodology' && (
          <MethodologyView />
        )}

        {/* ── TAB 4: SOURCE DIRECTORY ── */}
        {activeTab === 'sources' && (
          <SourceDirectory />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 mt-16 text-xs text-stone-500 dark:text-zinc-500 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="editorial-heading text-sm text-stone-800 dark:text-zinc-300">
            Veritas AI • Academic Research & Disinformation Detection
          </p>
          <div className="flex items-center gap-3 text-stone-400 dark:text-zinc-500 text-[11px]">
            <span>FastAPI WebSocket</span>
            <span>•</span>
            <span>DistilBERT (Transformer)</span>
            <span>•</span>
            <span>Gemini + DuckDuckGo</span>
            <span>•</span>
            <span>IFCN Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
