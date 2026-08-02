import React, { useEffect, useRef, useState } from 'react';
import {
  Monitor,
  Pause,
  Play,
  Square,
  RefreshCw,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Code,
  FileText,
  BarChart2,
  Layout,
  HelpCircle,
  Layers,
} from 'lucide-react';
import {
  ScreenShareState,
  screenShareManager,
} from '../services/ScreenShareManager';

interface ScreenShareWidgetProps {
  state: ScreenShareState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSwitch: () => void;
  onAskSanaya: (question: string) => void;
}

export const ScreenShareWidget: React.FC<ScreenShareWidgetProps> = ({
  state,
  onPause,
  onResume,
  onStop,
  onSwitch,
  onAskSanaya,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Attach live stream to video element for real-time preview
  useEffect(() => {
    const stream = screenShareManager.getMediaStream();
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [state.isSharing, state.captureSource]);

  if (!state.isSharing) {
    return null;
  }

  const quickQuestions = [
    { label: "What's on my screen?", icon: Eye, prompt: "Can you tell me what is currently on my screen?" },
    { label: 'Explain this code', icon: Code, prompt: 'Please explain the code visible on my screen.' },
    { label: 'Detect errors', icon: AlertCircle, prompt: 'Do you notice any errors, warnings, or bugs on my screen?' },
    { label: 'Review UI design', icon: Layout, prompt: 'Can you review this UI layout and suggest design improvements?' },
    { label: 'Analyze dashboard/data', icon: BarChart2, prompt: 'Analyze the dashboard and visible metrics on my screen.' },
    { label: 'Summarize content', icon: FileText, prompt: 'Summarize the main content and text visible on my screen.' },
  ];

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-40 max-w-sm sm:max-w-md w-full pointer-events-auto select-none transition-all duration-300">
      <div className="hud-glass-card rounded-2xl p-3 sm:p-4 border border-cyan-500/40 shadow-[0_0_40px_rgba(0,232,255,0.25)] flex flex-col space-y-3 backdrop-blur-2xl bg-black/80">
        {/* HEADER BAR: BADGE, SOURCE, MINIMIZE & CLOSE */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              {!state.isPaused ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
              )}
            </span>

            <div className="flex flex-col">
              <span className="text-xs font-extrabold tracking-wider text-white flex items-center space-x-1.5 font-mono uppercase">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>SCREEN SHARING ACTIVE</span>
              </span>
              <span className="text-[10px] text-cyan-300/80 font-mono">
                Source: <strong className="text-white">{state.captureSource}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title={isMinimized ? 'Expand Preview' : 'Minimize Preview'}
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onStop}
              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/40 text-rose-300 transition cursor-pointer"
              title="Stop Sharing Screen"
            >
              <Square className="w-3.5 h-3.5 fill-rose-400" />
            </button>
          </div>
        </div>

        {/* MINIMIZED COMPACT VIEW */}
        {isMinimized ? (
          <div className="flex items-center justify-between bg-black/60 p-2 rounded-xl border border-cyan-500/20 text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-slate-300 font-mono text-[11px]">
                {state.isPaused ? 'Vision Paused' : `Frames Analyzed: ${state.processedFramesCount}`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={state.isPaused ? onResume : onPause}
                className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {state.isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
          </div>
        ) : (
          /* EXPANDED LIVE PREVIEW CARD */
          <>
            <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden bg-slate-950 border border-cyan-500/30 group shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
              />

              {/* OVERLAY STATUS BADGE */}
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/30 flex items-center space-x-1.5 text-[10px] font-mono text-cyan-300">
                <Eye className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>
                  {state.isPaused
                    ? 'PAUSED'
                    : state.visionStatus === 'analyzing'
                    ? 'GEMINI ANALYZING...'
                    : 'GEMINI VISION ACTIVE'}
                </span>
              </div>

              {/* FRAME COUNTER BADGE */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-slate-700 text-[9px] font-mono text-slate-300">
                Frames: {state.processedFramesCount}
              </div>

              {/* PAUSED OVERLAY BACKDROP */}
              {state.isPaused && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 text-amber-300">
                  <Pause className="w-8 h-8 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Screen Sharing Paused</span>
                  <button
                    onClick={onResume}
                    className="mt-1 px-3 py-1 rounded-lg bg-cyan-500 text-black font-extrabold text-xs hover:bg-cyan-400 transition cursor-pointer"
                  >
                    Resume Capture
                  </button>
                </div>
              )}
            </div>

            {/* CONTROL ACTION BUTTONS */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={state.isPaused ? onResume : onPause}
                className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  state.isPaused
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {state.isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={onSwitch}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-purple-300 font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                title="Switch Shared Screen or Window"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Switch</span>
              </button>

              <button
                onClick={onStop}
                className="py-2 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Stop</span>
              </button>
            </div>

            {/* SCREEN VISION QUICK PROMPTS BAR */}
            <div className="pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>ASK SANAYA ABOUT SCREEN</span>
                </span>
                <button
                  onClick={() => setShowQuickPrompts((prev) => !prev)}
                  className="text-[9px] font-mono text-slate-400 hover:text-slate-200"
                >
                  {showQuickPrompts ? 'Hide' : 'Show'}
                </button>
              </div>

              {showQuickPrompts && (
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5 scrollbar-thin">
                  {quickQuestions.map((q, idx) => {
                    const IconComponent = q.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => onAskSanaya(q.prompt)}
                        className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-black/50 hover:bg-purple-950/40 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-slate-300 hover:text-white transition text-left cursor-pointer group"
                      >
                        <IconComponent className="w-3 h-3 text-cyan-400 group-hover:text-pink-400 shrink-0" />
                        <span className="truncate">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
