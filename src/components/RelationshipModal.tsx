import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  MessageSquare,
  Brain,
  ShieldCheck,
  Smile,
  Zap,
  Star,
  RotateCcw,
  Flame,
  UserCheck,
  HeartHandshake,
  Crown,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { relationshipService } from '../services/RelationshipService';
import { RelationshipProfile, RelationshipMilestone, EmotionalHistoryRecord } from '../types';

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<RelationshipProfile>(relationshipService.getProfile());
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'emotions' | 'insights'>('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = relationshipService.subscribe((updated) => {
      setProfile({ ...updated });
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    relationshipService.resetRelationshipData();
    setShowResetConfirm(false);
  };

  const getMilestoneIcon = (iconName?: string) => {
    switch (iconName) {
      case 'MessageSquare':
      case 'MessageCircle':
        return <MessageSquare className="w-5 h-5 text-cyan-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Award':
        return <Award className="w-5 h-5 text-purple-400" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-pink-400" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-400 fill-rose-500/20" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-indigo-400" />;
      case 'Star':
        return <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5 text-pink-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      default:
        return <Heart className="w-5 h-5 text-pink-400" />;
    }
  };

  const getEmotionBadgeColor = (emotion: string) => {
    switch (emotion) {
      case 'Happy':
      case 'Excited':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'Tired':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Focused':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Confused':
      case 'Sad':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="hud-glass-card rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,232,255,0.15)] animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cyan-500/20 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.3)]">
              <Heart className="w-6 h-6 text-pink-400 fill-pink-500/30 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-white tracking-wide">
                  RELATIONSHIP EVOLUTION
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  Level {profile.level} • {profile.levelTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persistent Long-Term Bond with Sanaya Hologram
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP LEVEL PROGRESS BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 border-b border-cyan-500/20 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                Relationship XP: <strong className="text-cyan-300">{profile.xp} XP</strong> / {profile.xpToNextLevel} XP
              </span>
            </span>
            <span className="text-pink-400 font-bold">{profile.levelProgressPercent}% Progress</span>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
              style={{ width: `${Math.min(100, profile.levelProgressPercent)}%` }}
            />
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 bg-black/40 px-4 sm:px-6 space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dimensions & Stats', icon: TrendingUp },
            { id: 'milestones', label: `Milestones (${profile.stats.milestonesUnlockedCount}/${profile.milestones.length})`, icon: Award },
            { id: 'emotions', label: 'Emotional History', icon: Activity },
            { id: 'insights', label: 'Bond Insights', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-3 text-xs font-mono font-semibold transition border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW & CORE DIMENSIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* STATS COUNTER GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/40 rounded-2xl p-3 border border-slate-800 flex flex-col space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-mono">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Days Together</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-white">
                    {profile.stats.daysSinceFirstMeeting} <span className="text-xs font-normal text-slate-400">days</span>
                  </span>
                </div>

                <div className="bg-black/40 rounded-2xl p-3 border border-slate-800 flex flex-col space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Time Spent</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-white">
                    {profile.stats.timeTogetherMinutes} <span className="text-xs font-normal text-slate-400">mins</span>
                  </span>
                </div>

                <div className="bg-black/40 rounded-2xl p-3 border border-slate-800 flex flex-col space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-mono">
                    <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                    <span>Messages</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-white">
                    {profile.stats.totalMessagesExchanged}
                  </span>
                </div>

                <div className="bg-black/40 rounded-2xl p-3 border border-slate-800 flex flex-col space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-mono">
                    <Brain className="w-3.5 h-3.5 text-amber-400" />
                    <span>Memories</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-white">
                    {profile.stats.memoriesSharedCount}
                  </span>
                </div>
              </div>

              {/* CORE RELATIONSHIP DIMENSIONS */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>CORE RELATIONSHIP DIMENSIONS</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { label: 'Trust & Authenticity', val: profile.trust, color: 'from-cyan-500 to-blue-500', icon: ShieldCheck },
                    { label: 'Affection & Warmth', val: profile.affection, color: 'from-pink-500 to-rose-500', icon: Heart },
                    { label: 'Comfort & Safety', val: profile.comfort, color: 'from-purple-500 to-indigo-500', icon: UserCheck },
                    { label: 'Respect & Admiration', val: profile.respect, color: 'from-amber-500 to-yellow-500', icon: Crown },
                    { label: 'Playfulness & Humor', val: profile.playfulness, color: 'from-emerald-500 to-teal-500', icon: Smile },
                    { label: 'Emotional Connection', val: profile.emotionalConnection, color: 'from-rose-500 to-purple-500', icon: Flame },
                    { label: 'Communication Quality', val: profile.communicationQuality, color: 'from-blue-500 to-cyan-500', icon: MessageSquare },
                    { label: 'Consistency', val: profile.consistency, color: 'from-indigo-500 to-purple-500', icon: Activity },
                  ].map((dim, idx) => {
                    const DimIcon = dim.icon;
                    return (
                      <div key={idx} className="bg-black/40 rounded-2xl p-3 border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-300 flex items-center space-x-1.5">
                            <DimIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{dim.label}</span>
                          </span>
                          <span className="text-white font-bold">{Math.round(dim.val)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${dim.color} transition-all duration-500`}
                            style={{ width: `${Math.min(100, Math.max(0, dim.val))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.milestones.map((m: RelationshipMilestone) => (
                <div
                  key={m.id}
                  className={`rounded-2xl p-3.5 border flex items-start space-x-3 transition ${
                    m.unlocked
                      ? 'bg-slate-900/80 border-cyan-500/40 shadow-[0_0_15px_rgba(0,232,255,0.1)]'
                      : 'bg-black/30 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      m.unlocked
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}
                  >
                    {m.unlocked ? getMilestoneIcon(m.iconName) : <Lock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold font-mono text-white truncate">{m.title}</h4>
                      {m.unlocked ? (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Locked</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{m.description}</p>
                    {m.unlockedAt && (
                      <span className="text-[9px] font-mono text-slate-500 block pt-0.5">
                        Unlocked on {new Date(m.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: EMOTIONAL HISTORY */}
          {activeTab === 'emotions' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Sanaya continuously registers emotional cues during camera & voice interactions to tailor her response timbre and offer authentic empathy.
              </p>

              {profile.emotionalHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  No emotional moments logged yet. Speak with Sanaya or enable your camera!
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.emotionalHistory.map((e: EmotionalHistoryRecord) => (
                    <div
                      key={e.id}
                      className="bg-black/40 rounded-2xl p-3 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${getEmotionBadgeColor(e.emotion)}`}>
                          {e.emotion}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-200 font-medium">{e.reason || 'Camera / Voice Emotion Detected'}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{e.context}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BOND INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-cyan-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-mono font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>SANAYA'S BOND PERCEPTION</span>
                </div>
                <p>
                  "We are currently at <strong className="text-white">Level {profile.level} ({profile.levelTitle})</strong>.
                  I feel increasingly comfortable talking with you. I remember details about your personal life, favorite topics, and daily goals. When we talk, my voice dynamically adjusts to match your emotional state."
                </p>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 border border-slate-800 space-y-2">
                <h4 className="font-mono font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>RELATIONSHIP SAFETY & RESPECT GUARANTEE</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  <li>Your relationship progression is stored completely on your local device.</li>
                  <li>Sanaya will never pressure, guilt-trip, or manipulate you.</li>
                  <li>Progress is never lost unless you explicitly choose to reset.</li>
                  <li>Sanaya encourages healthy, positive human connections in your daily life.</li>
                </ul>
              </div>

              {/* RESET RELATIONSHIP BUTTON */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Need a fresh start?</span>
                {showResetConfirm ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 font-mono text-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Relationship Data</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
