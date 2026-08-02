import React, { useState } from 'react';
import {
  Brain,
  ChevronRight,
  User,
  Music,
  Heart,
  Target,
  AlertOctagon,
  Volume2,
  Sliders,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { TranscriptionMessage, VoiceSettings } from '../types';

interface RightHUDPanelProps {
  transcriptions: TranscriptionMessage[];
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
  onOpenMemoryBank: () => void;
}

export const RightHUDPanel: React.FC<RightHUDPanelProps> = ({
  transcriptions,
  settings,
  onUpdateSettings,
  onOpenMemoryBank,
}) => {
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState('Soft & Warm');

  return (
    <div className="flex flex-col space-y-3 w-60 sm:w-68 z-20 pointer-events-auto select-none">
      {/* 1. MEMORY RECALL CARD */}
      <div className="hud-glass-card rounded-2xl p-3.5 flex flex-col space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center space-x-1">
            <Brain className="w-3 h-3 text-purple-400" />
            <span>MEMORY RECALL</span>
          </span>
          <button
            onClick={onOpenMemoryBank}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-slate-800">
            <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-300 truncate">
              Your name: <strong className="text-white">Jeet</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-slate-800">
            <Music className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-slate-300 truncate">
              Favorite Music: <strong className="text-white">Atif Aslam</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-slate-800">
            <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="text-slate-300 truncate">
              Loves: <strong className="text-white">Coding</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-slate-800">
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-300 truncate">
              Goal: <strong className="text-white">Buy Bike</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-slate-800">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-slate-300 truncate">
              Hates: <strong className="text-white">Spiders</strong>
            </span>
          </div>

          <button
            onClick={onOpenMemoryBank}
            className="w-full text-center text-[10px] font-mono text-cyan-400 hover:text-cyan-300 pt-1 flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>+ 52 more memories</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. CURRENT CONVERSATION TRANSCRIPT CARD */}
      <div className="hud-glass-card-purple rounded-2xl p-3.5 flex flex-col space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-purple-500/20">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center space-x-1">
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span>CURRENT CONVERSATION</span>
          </span>
          <div className="flex items-center space-x-0.5 h-3">
            {[30, 80, 50, 90, 40].map((h, i) => (
              <div
                key={i}
                className="w-0.5 bg-cyan-400 rounded-full animate-pulse"
                style={{ height: `${h}%`, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-2 text-xs pr-1 scrollbar-thin scrollbar-thumb-purple-900/40">
          {transcriptions.length === 0 ? (
            <div className="space-y-2 pt-1">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-cyan-400 font-mono">You</span>
                <p className="text-slate-300 text-[11px] bg-black/40 p-1.5 rounded-lg border border-slate-800">
                  How are you today?
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-pink-400 font-mono">Sanaya</span>
                <p className="text-slate-200 text-[11px] bg-purple-950/40 p-1.5 rounded-lg border border-purple-500/30">
                  I'm perfect now that I'm talking to you 💜
                </p>
              </div>
            </div>
          ) : (
            transcriptions.slice(-6).map((msg) => (
              <div key={msg.id} className="space-y-0.5">
                <span
                  className={`text-[10px] font-semibold font-mono ${
                    msg.source === 'sanaya' ? 'text-pink-400' : 'text-cyan-400'
                  }`}
                >
                  {msg.source === 'sanaya' ? 'Sanaya' : 'You'}
                </span>
                <p
                  className={`text-[11px] p-1.5 rounded-lg border ${
                    msg.source === 'sanaya'
                      ? 'bg-purple-950/40 text-slate-100 border-purple-500/30'
                      : 'bg-black/40 text-slate-200 border-slate-800'
                  }`}
                >
                  {msg.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. VOICE SETTINGS CARD */}
      <div className="hud-glass-card rounded-2xl p-3.5 flex flex-col space-y-2.5">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
          VOICE SETTINGS
        </span>

        <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300">Voice Style</span>
          </div>
          <select
            value={selectedVoiceStyle}
            onChange={(e) => setSelectedVoiceStyle(e.target.value)}
            className="bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs rounded-lg px-2 py-1 outline-none font-medium cursor-pointer"
          >
            <option value="Soft & Warm">Soft & Warm</option>
            <option value="Cheerful">Cheerful</option>
            <option value="Holographic">Holographic</option>
            <option value="Whisper">Whisper</option>
          </select>
        </div>
      </div>
    </div>
  );
};
