import React, { useState, useEffect } from 'react';
import { Heart, Settings, Activity, Sparkles, Sliders } from 'lucide-react';
import { SessionStatus } from '../types';
import { ScreenShareButton } from './ScreenShareButton';
import { ScreenShareState } from '../services/ScreenShareManager';
import { LiveLocationBadge } from './LiveLocationBadge';

interface StatusHeaderProps {
  status: SessionStatus;
  isMuted: boolean;
  screenShareState?: ScreenShareState;
  onStartScreenShare?: () => void;
  onStopScreenShare?: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenMemoryBank?: () => void;
  onOpenRelationship?: () => void;
}

const StatusHeaderComponent: React.FC<StatusHeaderProps> = ({
  status,
  screenShareState,
  onStartScreenShare,
  onStopScreenShare,
  onOpenSettings,
  onOpenMemoryBank,
  onOpenRelationship,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = status !== 'disconnected' && status !== 'connecting';

  return (
    <header className="w-full px-4 py-2.5 flex items-center justify-between z-30 select-none">
      {/* LEFT: LIVE REAL-TIME CLOCK & DATE WIDGET */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,232,255,0.15)]">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wider text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            {timeStr || '10:42 PM'}
          </span>
          <span className="text-[10px] text-cyan-300/70 font-medium">
            {dateStr || 'Saturday, 24 May 2025'}
          </span>
        </div>
      </div>

      {/* CENTER: SANAYA BRAND LOGO + HEART ACCENT */}
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-extrabold text-2xl sm:text-3xl tracking-[0.25em] drop-shadow-[0_0_20px_rgba(0,232,255,0.9)] uppercase">
            SANAYA
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] font-mono tracking-[0.4em] text-cyan-300/80 uppercase mt-0.5">
          <span>AI COMPANION</span>
        </div>
        <Heart className="w-3 h-3 text-pink-500 fill-pink-500 animate-pulse mt-1 drop-shadow-[0_0_10px_rgba(236,72,153,0.9)]" />
      </div>

      {/* RIGHT: ONLINE STATUS BADGE + SPECTRUM TOGGLE & SETTINGS */}
      <div className="flex items-center space-x-2.5">
        {/* Status Pill Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,232,255,0.15)]">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            {isConnected ? '• ONLINE • CONNECTED' : '• STANDBY • IDLE'}
          </span>
        </div>

        {/* Live Location Badge */}
        <LiveLocationBadge />

        {/* Screen Share Button */}
        {screenShareState && onStartScreenShare && onStopScreenShare && (
          <ScreenShareButton
            state={screenShareState}
            onStart={onStartScreenShare}
            onStop={onStopScreenShare}
            variant="compact"
          />
        )}

        {/* Relationship Evolution Button */}
        {onOpenRelationship && (
          <button
            onClick={onOpenRelationship}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-pink-500/40 text-pink-300 transition shadow-[0_0_15px_rgba(236,72,153,0.2)] cursor-pointer flex items-center space-x-1"
            title="Relationship Evolution System"
          >
            <Heart className="w-4 h-4 text-pink-400 fill-pink-500/30 animate-pulse" />
          </button>
        )}

        {/* Brain Memory Button */}
        {onOpenMemoryBank && (
          <button
            onClick={onOpenMemoryBank}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-purple-500/40 text-purple-300 transition shadow-[0_0_15px_rgba(139,92,255,0.2)] cursor-pointer"
            title="Sanaya Memory Recall"
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
          title="System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export const StatusHeader = React.memo(StatusHeaderComponent);
