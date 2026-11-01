import React, { useState, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, Loader, ShieldCheck, Newspaper, BookOpen, Layers, Award } from 'lucide-react';

const STATUS_CONFIG = {
  idle: {
    color: 'bg-stone-400 dark:bg-zinc-500',
    label: 'Checking...',
    pulse: true,
  },
  ready: {
    color: 'bg-emerald-500',
    label: 'Connected',
    pulse: false,
  },
  connecting: {
    color: 'bg-amber-400',
    label: 'Connecting...',
    pulse: true,
  },
  streaming: {
    color: 'bg-emerald-500',
    label: 'Live Verifying',
    pulse: true,
  },
  closed: {
    color: 'bg-emerald-500',
    label: 'Ready',
    pulse: false,
  },
  error: {
    color: 'bg-rose-500',
    label: 'Offline',
    pulse: false,
  },
};

export default function Header({
  connectionStatus = 'idle',
  isProcessing = false,
  wsUrl = '',
  onWsUrlChange,
  isDark = false,
  onToggleTheme,
  activeTab = 'desk',
  onTabChange,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const status = STATUS_CONFIG[connectionStatus] || STATUS_CONFIG.idle;

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        settingsOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  const navItems = [
    { id: 'desk', label: 'Investigation Desk', icon: Newspaper },
    { id: 'archive', label: 'Debunk Archive', icon: BookOpen },
    { id: 'methodology', label: 'Methodology', icon: Layers },
    { id: 'sources', label: 'Source Directory', icon: Award },
  ];

  return (
    <header className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800 px-4 sm:px-6 py-3 sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Left — Editorial Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="editorial-heading text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight leading-none">
              Veritas
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500 hidden md:inline">
              Journalistic Fact-Checking
            </span>
          </div>
        </div>

        {/* Center — Navigation Tabs */}
        <nav className="hidden sm:flex items-center gap-1 bg-stone-100/80 dark:bg-zinc-800/80 p-1 rounded-lg border border-stone-200/60 dark:border-zinc-700/60 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange && onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right — Status & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Status Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
            {isProcessing ? (
              <Loader
                size={12}
                className="animate-spin text-stone-700 dark:text-zinc-300"
                aria-label="Processing"
              />
            ) : (
              <span
                className={`inline-block h-2 w-2 rounded-full ${status.color} ${
                  status.pulse ? 'animate-pulse' : ''
                }`}
              />
            )}
            <span className="text-xs font-medium text-stone-600 dark:text-zinc-300">
              {status.label}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Settings Gear Popover */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setSettingsOpen((prev) => !prev)}
              aria-expanded={settingsOpen}
              className="p-1.5 rounded-md text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Connection settings"
              title="Connection settings"
            >
              <Settings size={17} />
            </button>

            {settingsOpen && (
              <div
                ref={popoverRef}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-xl p-4 z-50 animate-fade-in"
              >
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-2">
                  WebSocket Server Endpoint
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => onWsUrlChange?.(e.target.value)}
                    placeholder="ws://127.0.0.1:8000/ws/verify"
                    className="flex-1 text-xs px-3 py-1.5 border border-stone-300 dark:border-zinc-700 rounded-md bg-stone-50 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 font-mono"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 dark:text-zinc-500">
                    FastAPI streaming endpoint
                  </span>
                  <button
                    onClick={() => onWsUrlChange?.('ws://127.0.0.1:8000/ws/verify')}
                    className="text-[11px] text-stone-700 dark:text-zinc-300 font-semibold hover:underline"
                  >
                    Reset default
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="sm:hidden flex items-center justify-around border-t border-stone-150 dark:border-zinc-800 pt-2 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange && onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium ${
                isActive
                  ? 'text-stone-900 dark:text-zinc-100 font-bold'
                  : 'text-stone-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
