import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import PipelineStepper from './components/PipelineStepper';
import ArticleInput from './components/ArticleInput';
import MlVerdictCard from './components/MlVerdictCard';
import FactCheckList from './components/FactCheckList';
import FinalVerdictBanner from './components/FinalVerdictBanner';
import ActivityLog from './components/ActivityLog';
import ErrorAlert from './components/ErrorAlert';

export default function App() {
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

  // Telemetry logs for live transparency
  const [activityLogs, setActivityLogs] = useState([]);

  // Ref to hold the active WebSocket connection
  const wsRef = useRef(null);
  const factsListRef = useRef(null);

  // Helper to append telemetry log
  const addLog = useCallback((phase, message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs((prev) => [
      ...prev,
      { timestamp, phase, message, level }
    ]);
  }, []);

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Reset all verification state
  const handleReset = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsProcessing(false);
    setConnectionStatus('idle');
    setMlData(null);
    setArticleHeading(null);
    setFacts([]);
    setAgentVerdict(null);
    setErrorMessage(null);
    setActivityLogs([]);
  }, []);

  // Cancel/Stop active verification
  const handleCancel = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsProcessing(false);
    setConnectionStatus('closed');
    addLog('USER', 'Verification aborted by user.', 'warn');
  }, [addLog]);

  // Main verification trigger (WebSocket connection contract)
  const handleVerify = useCallback(() => {
    const trimmed = inputText.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

    if (wordCount < 20) {
      setErrorMessage(`Article is too short (${wordCount} words). Please provide at least 20 words for rigorous multi-agent analysis.`);
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

    addLog('INIT', `Opening WebSocket connection to ${wsUrl}...`);

    try {
      // Close any pre-existing socket
      if (wsRef.current) {
        wsRef.current.close();
      }

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      // 1. Connection opened: send article text payload
      socket.onopen = () => {
        setConnectionStatus('streaming');
        addLog('WS_OPEN', 'Connected to FastAPI Agent server. Dispatching article payload...', 'success');
        
        // Exact payload specified by backend contract: {"text": "<user_input_text>"}
        const payload = JSON.stringify({ text: trimmed });
        socket.send(payload);
        addLog('AGENT', 'Article dispatched. Waiting for DistilBERT and LLM workers...');
      };

      // 2. Incoming streaming messages handler
      socket.onmessage = (event) => {
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
                `Instant ML Result: ${data.ml_verdict} (${confidencePct}% confidence)`,
                data.ml_verdict?.toLowerCase() === 'real' ? 'success' : 'warn'
              );
              break;
            }

            // STEP 2: LLM Claim Decomposition & Heading Extraction
            case 'extraction_complete': {
              const heading = message.heading || 'News Article';
              const rawFacts = message.facts || [];
              setArticleHeading(heading);

              // Initial facts list with 'verifying' status
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
                `Extracted heading "${heading}" and ${formattedFacts.length} claims. Firing concurrent web verification agents...`,
                'info'
              );
              break;
            }

            // STEP 3: Individual Fact Verified (from concurrent DuckDuckGo search threads)
            case 'fact_verified': {
              const verified = message.data || {};
              const targetFact = verified.fact || '';
              const newStatus = verified.status || 'Inconclusive';
              const reasoning = verified.reasoning || '';
              const sources = verified.sources || [];

              setFacts((prevFacts) => {
                // Find matching fact by:
                // 1. Exact match
                // 2. Trimmed lowercase match
                // 3. Substring containment
                // 4. Fallback to first currently verifying item
                let matchIndex = prevFacts.findIndex(
                  (f) => f.text === targetFact
                );

                if (matchIndex === -1) {
                  const targetLower = targetFact.trim().toLowerCase();
                  matchIndex = prevFacts.findIndex(
                    (f) => f.text.trim().toLowerCase() === targetLower
                  );
                }

                if (matchIndex === -1) {
                  const targetLower = targetFact.trim().toLowerCase();
                  matchIndex = prevFacts.findIndex(
                    (f) =>
                      f.text.toLowerCase().includes(targetLower) ||
                      targetLower.includes(f.text.toLowerCase())
                  );
                }

                if (matchIndex === -1) {
                  matchIndex = prevFacts.findIndex((f) => f.status === 'verifying');
                }

                if (matchIndex === -1) {
                  // If not found in previous array, append as new verified fact
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
                `Verified claim: "${targetFact.slice(0, 35)}..." -> [${newStatus}]`,
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
              addLog('SYNTHESIS', `Agentic workflow concluded. Final System Verdict: ${overall}`, 'success');

              // Close WebSocket cleanly
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
          addLog('ERROR', 'Malformed JSON received from backend', 'error');
        }
      };

      // 3. Error Event Handler
      socket.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setErrorMessage(
          `Unable to connect to WebSocket server at ${wsUrl}. Please verify that your FastAPI backend is running (python -m uvicorn main:app --reload).`
        );
        setIsProcessing(false);
        setConnectionStatus('error');
        addLog('WS_ERROR', `Connection failed to ${wsUrl}`, 'error');
      };

      // 4. Close Event Handler
      socket.onclose = (event) => {
        setIsProcessing(false);
        setConnectionStatus((prev) => (prev === 'error' ? 'error' : 'closed'));
        addLog('WS_CLOSE', `WebSocket session closed (Code: ${event.code || 1000})`);
      };
    } catch (e) {
      setErrorMessage(`Failed to initiate WebSocket connection: ${e.message}`);
      setIsProcessing(false);
      setConnectionStatus('error');
      addLog('EXCEPTION', e.message, 'error');
    }
  }, [inputText, wsUrl, addLog]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <Header
        connectionStatus={connectionStatus}
        isProcessing={isProcessing}
        wsUrl={wsUrl}
        onWsUrlChange={setWsUrl}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error Alert Display */}
        {errorMessage && (
          <ErrorAlert
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            onRetry={handleVerify}
          />
        )}

        {/* Real-time Pipeline Progress Stepper */}
        <PipelineStepper
          mlData={mlData}
          articleHeading={articleHeading}
          facts={facts}
          agentVerdict={agentVerdict}
          isProcessing={isProcessing}
        />

        {/* Article Input Panel */}
        <ArticleInput
          text={inputText}
          setText={setInputText}
          onSubmit={handleVerify}
          onReset={handleReset}
          onCancel={handleCancel}
          isProcessing={isProcessing}
        />

        {/* Analysis Stream Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Instant ML Prediction (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <MlVerdictCard
              mlData={mlData}
              isProcessing={isProcessing && !mlData}
            />

            {/* Live Agent Execution Telemetry */}
            <ActivityLog logs={activityLogs} />
          </div>

          {/* Right Column: Claim Decomposition & Real-time Web Evidence (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6" ref={factsListRef}>
            <FactCheckList
              heading={articleHeading}
              facts={facts}
              isProcessing={isProcessing && (!facts || facts.length === 0)}
            />
          </div>
        </div>

        {/* Final System Verdict Banner (Revealed when agent completes) */}
        {agentVerdict && (
          <div className="pt-2">
            <FinalVerdictBanner
              agentVerdict={agentVerdict}
              mlData={mlData}
              facts={facts}
            />
          </div>
        )}
      </main>

      {/* Trust & Architecture Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Veritas AI • Real-Time Agentic Disinformation Detection</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI WebSocket</span>
            <span>•</span>
            <span>DistilBERT Classifier</span>
            <span>•</span>
            <span>LangChain + Gemini Flash</span>
            <span>•</span>
            <span>DuckDuckGo News</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
