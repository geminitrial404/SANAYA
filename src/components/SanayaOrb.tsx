import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Sparkles, Loader2, RefreshCw, Zap, Volume2 } from 'lucide-react';
import { SessionStatus } from '../types';

interface SanayaOrbProps {
  status: SessionStatus;
  userVolume: number;
  sanayaVolume: number;
  onToggleConnection: () => void;
}

export const SanayaOrb: React.FC<SanayaOrbProps> = ({
  status,
  userVolume,
  sanayaVolume,
  onToggleConnection,
}) => {
  const isConnected =
    status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'interrupted';
  const isConnecting = status === 'connecting' || status === 'reconnecting';
  const isSpeaking = status === 'speaking';
  const isThinking = status === 'thinking';

  // Dynamic scale factor based on volume
  const volumeEnergy = isSpeaking ? sanayaVolume : userVolume;
  const pulseScale = 1 + Math.min(0.35, volumeEnergy * 0.5);

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return 'from-blue-500 via-indigo-500 to-cyan-400';
      case 'speaking':
        return 'from-purple-500 via-fuchsia-500 to-pink-500';
      case 'thinking':
        return 'from-amber-400 via-orange-500 to-yellow-400';
      case 'interrupted':
        return 'from-rose-500 via-pink-500 to-purple-500';
      case 'connecting':
      case 'reconnecting':
        return 'from-sky-400 via-indigo-500 to-purple-500';
      case 'disconnected':
      default:
        return 'from-slate-700 via-slate-800 to-slate-900';
    }
  };

  const getGlowColor = () => {
    switch (status) {
      case 'listening':
        return 'rgba(59, 130, 246, 0.6)';
      case 'speaking':
        return 'rgba(217, 70, 239, 0.7)';
      case 'thinking':
        return 'rgba(245, 158, 11, 0.7)';
      case 'interrupted':
        return 'rgba(244, 63, 94, 0.7)';
      case 'connecting':
      case 'reconnecting':
        return 'rgba(129, 140, 248, 0.6)';
      case 'disconnected':
      default:
        return 'rgba(100, 116, 139, 0.2)';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'listening':
        return 'Sanaya is Listening...';
      case 'speaking':
        return 'Sanaya is Speaking...';
      case 'thinking':
        return 'Sanaya is Thinking...';
      case 'interrupted':
        return 'Interrupted';
      case 'connecting':
        return 'Connecting to Sanaya...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
      default:
        return 'Tap to Talk with Sanaya';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center my-6 py-4 select-none">
      {/* Outer Pulse Rings */}
      {isConnected && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: isSpeaking ? 1.2 : 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              boxShadow: `0 0 60px ${getGlowColor()}`,
            }}
            className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-purple-500/30 pointer-events-none"
          />

          <motion.div
            animate={{
              scale: [1.1, 1.6, 1.1],
              opacity: [0.1, 0.35, 0.1],
            }}
            transition={{
              duration: isSpeaking ? 0.9 : 3.0,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-pink-500/20 pointer-events-none"
          />
        </>
      )}

      {/* Main Interactive Orb Button */}
      <motion.button
        id="sanaya-power-orb"
        onClick={onToggleConnection}
        disabled={isConnecting}
        animate={{ scale: pulseScale }}
        whileHover={{ scale: isConnecting ? 1 : pulseScale * 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          boxShadow: `0 0 50px ${getGlowColor()}, inset 0 0 20px rgba(255, 255, 255, 0.3)`,
        }}
        className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr ${getStatusColor()} p-1 flex items-center justify-center cursor-pointer transition-colors duration-500 border border-white/20 backdrop-blur-xl group overflow-hidden`}
      >
        {/* Animated Inner Glass Sphere Overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-transparent to-black/40 pointer-events-none" />

        {/* Ambient Shimmer / Particle Effect Inside Orb */}
        {(isSpeaking || isThinking) && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-cyan-500/30 blur-md pointer-events-none"
          />
        )}

        {/* Center Icon & Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white space-y-2">
          {isConnecting ? (
            <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 animate-spin text-white/90" />
          ) : isConnected ? (
            isSpeaking ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Volume2 className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
              </motion.div>
            ) : isThinking ? (
              <Sparkles className="w-12 h-12 sm:w-14 sm:h-14 animate-pulse text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            ) : (
              <Mic className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
            )
          ) : (
            <MicOff className="w-12 h-12 sm:w-14 sm:h-14 text-slate-400 group-hover:text-white transition-colors" />
          )}

          <span className="text-xs font-semibold uppercase tracking-wider text-white/80 drop-shadow">
            {isConnected ? 'Live Voice' : 'Start Session'}
          </span>
        </div>
      </motion.button>

      {/* Status Label & Subtext */}
      <div className="mt-6 text-center space-y-1 z-10">
        <div className="flex items-center justify-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected
                ? isSpeaking
                  ? 'bg-pink-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
                : isConnecting
                ? 'bg-amber-400 animate-bounce'
                : 'bg-slate-500'
            }`}
          />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide drop-shadow">
            {getStatusLabel()}
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
          {isConnected
            ? isSpeaking
              ? 'Sanaya is responding to you in real-time.'
              : 'Speak naturally. You can interrupt Sanaya anytime.'
            : 'Tap the central orb to launch Sanaya voice session.'}
        </p>
      </div>
    </div>
  );
};
