import React from 'react';
import { MonitorUp, MonitorCheck, MonitorX } from 'lucide-react';
import { ScreenShareState } from '../services/ScreenShareManager';

interface ScreenShareButtonProps {
  state: ScreenShareState;
  onStart: () => void;
  onStop: () => void;
  variant?: 'compact' | 'full' | 'dock';
}

export const ScreenShareButton: React.FC<ScreenShareButtonProps> = ({
  state,
  onStart,
  onStop,
  variant = 'compact',
}) => {
  const isSharing = state.isSharing;

  const handleClick = () => {
    if (isSharing) {
      onStop();
    } else {
      onStart();
    }
  };

  if (variant === 'dock') {
    return (
      <button
        onClick={handleClick}
        className={`relative group px-4 py-3 rounded-2xl flex items-center space-x-2 border transition duration-300 cursor-pointer ${
          isSharing
            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_25px_rgba(0,232,255,0.4)]'
            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white shadow-lg'
        }`}
        title={isSharing ? 'Stop Screen Sharing' : 'Share Screen with Sanaya Vision'}
      >
        <div className="relative">
          {isSharing ? (
            <MonitorCheck className="w-5 h-5 text-cyan-400 animate-pulse" />
          ) : (
            <MonitorUp className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          )}
          {isSharing && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
          )}
        </div>
        <span className="text-xs font-mono font-bold tracking-wider uppercase">
          {isSharing ? 'Sharing Screen' : 'Share Screen'}
        </span>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={`w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2.5 border font-mono text-xs font-bold uppercase tracking-wider transition duration-300 cursor-pointer ${
          isSharing
            ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
            : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_rgba(0,232,255,0.25)]'
        }`}
      >
        {isSharing ? (
          <>
            <MonitorX className="w-4 h-4 text-rose-400" />
            <span>Stop Screen Sharing</span>
          </>
        ) : (
          <>
            <MonitorUp className="w-4 h-4 text-cyan-400" />
            <span>Start Screen Sharing</span>
          </>
        )}
      </button>
    );
  }

  // Default compact button for header / toolbars
  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-xl border transition shadow-lg flex items-center justify-center cursor-pointer ${
        isSharing
          ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,232,255,0.35)]'
          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/40'
      }`}
      title={isSharing ? 'Screen Sharing Active - Click to Stop' : 'Share Screen with Sanaya'}
    >
      {isSharing ? (
        <MonitorCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
      ) : (
        <MonitorUp className="w-4 h-4 text-cyan-400" />
      )}
    </button>
  );
};
