import React, { useState, useEffect } from 'react';
import { User, Mic, Heart, Volume2 } from 'lucide-react';
import { SessionStatus } from '../types';

interface BottomVoiceDockProps {
  status: SessionStatus;
  userVolume: number;
  sanayaVolume: number;
  onToggleConnection: () => void;
}

export const BottomVoiceDock: React.FC<BottomVoiceDockProps> = ({
  status,
  userVolume,
  sanayaVolume,
  onToggleConnection,
}) => {
  const [speakingTimeSec, setSpeakingTimeSec] = useState<number>(0);
  const [responseTimeSec, setResponseTimeSec] = useState<number>(0);

  const isConnected =
    status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'interrupted';

  // Live timer tickers
  useEffect(() => {
    let timer: any = null;
    if (isConnected) {
      timer = setInterval(() => {
        if (status === 'listening') {
          setSpeakingTimeSec((prev) => prev + 1);
        } else if (status === 'speaking' || status === 'thinking') {
          setResponseTimeSec((prev) => prev + 1);
        }
      }, 1000);
    } else {
      setSpeakingTimeSec(0);
      setResponseTimeSec(0);
    }
    return () => clearInterval(timer);
  }, [isConnected, status]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `00:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto z-30 pointer-events-auto select-none px-2 sm:px-4">
      <div className="hud-glass-card rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-6 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,232,255,0.18)]">
        {/* 1. LEFT SIDE: YOU AUDIO BLOCK & WAVEFORM */}
        <div className="flex items-center space-x-3 w-1/3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_12px_rgba(0,232,255,0.3)]">
            <User className="w-4 h-4" />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-bold text-cyan-300 tracking-wider">YOU</span>
              <span className="text-[10px] font-mono text-cyan-400/80">
                {formatTimer(speakingTimeSec)}
              </span>
            </div>

            {/* Cyan Waveform Spectrum Bars */}
            <div className="flex items-center gap-0.5 h-4 w-full">
              {[40, 75, 100, 60, 85, 45, 90, 65, 30, 80, 50, 95, 70, 40].map((val, idx) => {
                const activeHeight = isConnected && (status === 'listening' || userVolume > 0.05)
                  ? Math.max(20, Math.min(100, val * (0.3 + userVolume * 1.5)))
                  : 20;
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-cyan-400 rounded-full transition-all duration-75 shadow-[0_0_8px_#00E8FF]"
                    style={{ height: `${activeHeight}%` }}
                  />
                );
              })}
            </div>

            <span className="text-[9px] text-slate-400 font-mono mt-0.5 hidden sm:inline">
              Speaking Time
            </span>
          </div>
        </div>

        {/* 2. CENTER: GLOWING MIC ORB BUTTON */}
        <div className="flex flex-col items-center justify-center shrink-0 -mt-6">
          <button
            onClick={onToggleConnection}
            className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isConnected
                ? 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_60px_rgba(0,232,255,0.9)] border-2 border-white'
                : 'bg-black/90 border-2 border-cyan-500/60 hover:border-cyan-300 shadow-[0_0_35px_rgba(0,232,255,0.4)]'
            }`}
            title={isConnected ? 'Tap to Stop Sanaya' : 'Tap to Talk to Sanaya'}
          >
            {/* Pulsing Outer Rings */}
            {isConnected && (
              <>
                <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
                <span className="absolute -inset-2 rounded-full border border-cyan-400/50 animate-pulse" />
              </>
            )}

            <Mic
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110 ${
                isConnected ? 'text-white' : 'text-cyan-400'
              }`}
            />
          </button>

          <span className="mt-1 text-[10px] font-mono font-medium text-cyan-300 tracking-wide drop-shadow-[0_0_8px_rgba(0,232,255,0.6)]">
            {isConnected ? 'Tap to stop' : 'Tap to speak'}
          </span>
        </div>

        {/* 3. RIGHT SIDE: SANAYA AUDIO BLOCK & WAVEFORM */}
        <div className="flex items-center space-x-3 w-1/3 justify-end">
          <div className="flex flex-col flex-1 min-w-0 text-right">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-mono text-purple-400/80">
                {formatTimer(responseTimeSec)}
              </span>
              <span className="text-xs font-bold text-purple-300 tracking-wider">SANAYA</span>
            </div>

            {/* Purple Waveform Spectrum Bars */}
            <div className="flex items-center justify-end gap-0.5 h-4 w-full">
              {[40, 75, 100, 60, 85, 45, 90, 65, 30, 80, 50, 95, 70, 40].map((val, idx) => {
                const activeHeight = isConnected && (status === 'speaking' || sanayaVolume > 0.05)
                  ? Math.max(20, Math.min(100, val * (0.3 + sanayaVolume * 1.5)))
                  : 20;
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-purple-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                    style={{ height: `${activeHeight}%` }}
                  />
                );
              })}
            </div>

            <span className="text-[9px] text-slate-400 font-mono mt-0.5 hidden sm:inline">
              Response Time
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_12px_rgba(139,92,255,0.3)]">
            <Heart className="w-4 h-4 fill-purple-400/30" />
          </div>
        </div>
      </div>
    </div>
  );
};
