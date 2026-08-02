import React, { useState } from 'react';
import {
  MessageSquare,
  Brain,
  Mic,
  Image as ImageIcon,
  Settings,
  Heart,
  Target,
  Smile,
  Star,
  Activity,
  Zap,
  MonitorUp,
  Eye,
  Sparkles,
  Frown,
  AlertCircle,
} from 'lucide-react';
import { SessionStatus, EmotionalIntelligence } from '../types';
import { ScreenShareState } from '../services/ScreenShareManager';

interface LeftHUDPanelProps {
  status: SessionStatus;
  userVolume: number;
  sanayaVolume: number;
  screenShareState?: ScreenShareState;
  emotionalIntelligence?: EmotionalIntelligence;
  onStartScreenShare?: () => void;
  onStopScreenShare?: () => void;
  onOpenMemoryBank: () => void;
  onOpenSettings: () => void;
  onOpenRelationship?: () => void;
  onSelectNavTab?: (tab: string) => void;
}

export const LeftHUDPanel: React.FC<LeftHUDPanelProps> = ({
  status,
  userVolume,
  sanayaVolume,
  screenShareState,
  emotionalIntelligence,
  onStartScreenShare,
  onStopScreenShare,
  onOpenMemoryBank,
  onOpenSettings,
  onOpenRelationship,
}) => {
  const [activeTab, setActiveTab] = useState<string>('chat');

  const isConnected = status !== 'disconnected' && status !== 'connecting';
  const currentEmotion = emotionalIntelligence?.currentEmotion || 'Happy';
  const moodText = emotionalIntelligence?.moodEstimation || "I'm feeling great today!";
  const smileScore = emotionalIntelligence?.smileScore || 85;

  const getEmotionIcon = () => {
    switch (currentEmotion) {
      case 'Happy':
      case 'Excited':
        return <Smile className="w-4 h-4 text-pink-400" />;
      case 'Tired':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'Focused':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      case 'Confused':
      case 'Sad':
        return <Frown className="w-4 h-4 text-purple-400" />;
      default:
        return <Heart className="w-4 h-4 text-pink-400 fill-pink-500/30" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 z-20 pointer-events-auto select-none">
      {/* 1. FAR-LEFT VERTICAL DOCK NAVBAR */}
      <div className="hud-glass-card rounded-2xl p-2 flex flex-col space-y-3 shadow-[0_0_25px_rgba(0,232,255,0.1)] border border-cyan-500/20">
        <button
          onClick={() => setActiveTab('chat')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(0,232,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setActiveTab('memory');
            onOpenMemoryBank();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            activeTab === 'memory'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-400 shadow-[0_0_15px_rgba(139,92,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Memory"
        >
          <Brain className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setActiveTab('relationship');
            if (onOpenRelationship) onOpenRelationship();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            activeTab === 'relationship'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
              : 'text-slate-400 hover:text-pink-300 hover:bg-slate-900/60'
          }`}
          title="Relationship Evolution"
        >
          <Heart className="w-4 h-4 text-pink-400 fill-pink-500/20" />
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            activeTab === 'voice'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(0,232,255,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Voice"
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (screenShareState?.isSharing) {
              if (onStopScreenShare) onStopScreenShare();
            } else {
              if (onStartScreenShare) onStartScreenShare();
            }
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            screenShareState?.isSharing
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 shadow-[0_0_20px_rgba(0,232,255,0.5)] animate-pulse'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60'
          }`}
          title={screenShareState?.isSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <MonitorUp className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            activeTab === 'gallery'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Gallery"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            onOpenSettings();
          }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-white border border-slate-600'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 2. HUD CARDS STACK */}
      <div className="flex flex-col space-y-3 w-56 sm:w-64">
        {/* STATUS CARD WITH LIVE PULSE SINE WAVE */}
        <div className="hud-glass-card rounded-2xl p-3.5 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              STATUS
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Live OS
            </span>
          </div>

          {/* Sine Wave Visual Representation */}
          <div className="relative w-full h-8 overflow-hidden rounded-lg bg-black/40 border border-cyan-500/20 flex items-center px-1">
            <svg className="w-full h-full text-cyan-400" viewBox="0 0 200 40" preserveAspectRatio="none">
              <path
                d="M 0,20 Q 25,5 50,20 T 100,20 T 150,20 T 200,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-70"
              />
              {isConnected && (
                <path
                  d="M 0,20 Q 15,0 30,20 T 60,38 T 90,5 T 120,35 T 150,10 T 180,30 T 200,20"
                  fill="none"
                  stroke="#00E8FF"
                  strokeWidth="2.5"
                  className="animate-pulse drop-shadow-[0_0_8px_#00E8FF]"
                />
              )}
            </svg>
          </div>

          <div className="flex items-center space-x-2 pt-0.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'speaking'
                  ? 'bg-purple-400 animate-ping'
                  : status === 'listening'
                  ? 'bg-cyan-400 animate-ping'
                  : status === 'thinking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-200 capitalize font-mono">
              {status === 'disconnected'
                ? 'System Ready'
                : status === 'listening'
                ? 'Listening...'
                : status === 'speaking'
                ? 'Speaking...'
                : status === 'thinking'
                ? 'Thinking...'
                : status}
            </span>
          </div>
        </div>

        {/* EMOTIONAL STATE CARD */}
        <div className="hud-glass-card-purple rounded-2xl p-3.5 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              EMOTIONAL ENGINE
            </span>
            <span className="text-[10px] font-mono text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
              {currentEmotion}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              {getEmotionIcon()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wide">{currentEmotion}</span>
              <span className="text-[11px] text-pink-200/80 font-medium line-clamp-1">
                {moodText}
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>SMILE: {smileScore}%</span>
            <span>ENGAGEMENT: {emotionalIntelligence?.engagementLevel || 80}%</span>
          </div>
        </div>

        {/* AI PERSONALITY CARD */}
        <div className="hud-glass-card rounded-2xl p-3.5 flex flex-col space-y-2.5">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            AI PERSONALITY
          </span>

          <div className="space-y-1.5 text-xs font-medium">
            <div className="flex items-center space-x-2.5 bg-black/40 p-1.5 rounded-xl border border-slate-800">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-200">Witty</span>
            </div>

            <div className="flex items-center space-x-2.5 bg-black/40 p-1.5 rounded-xl border border-slate-800">
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-slate-200">Caring</span>
            </div>

            <div className="flex items-center space-x-2.5 bg-black/40 p-1.5 rounded-xl border border-slate-800">
              <Smile className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-200">Playful</span>
            </div>

            <div className="flex items-center space-x-2.5 bg-black/40 p-1.5 rounded-xl border border-slate-800">
              <Star className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-200">Loyal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
