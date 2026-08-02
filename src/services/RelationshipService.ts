import {
  RelationshipProfile,
  RelationshipLevel,
  RelationshipMilestone,
  EmotionalHistoryRecord,
  FavoriteTopic,
  ConversationSummary,
  UserEmotion,
} from '../types';

const LOCAL_STORAGE_KEY = 'sanaya_relationship_profile_v2';

const LEVEL_INFO: Record<RelationshipLevel, { title: string; minXp: number; maxXp: number }> = {
  1: { title: 'New Companion', minXp: 0, maxXp: 100 },
  2: { title: 'Trusted Friend', minXp: 100, maxXp: 350 },
  3: { title: 'Close Companion', minXp: 350, maxXp: 800 },
  4: { title: 'Best Friend', minXp: 800, maxXp: 1500 },
  5: { title: 'Deep Emotional Bond', minXp: 1500, maxXp: 3000 },
};

const DEFAULT_MILESTONES: RelationshipMilestone[] = [
  {
    id: 'm1_first_convo',
    title: 'First Conversation',
    description: 'Engaged in your very first conversation with Sanaya.',
    category: 'interaction',
    unlocked: true,
    unlockedAt: Date.now(),
    iconName: 'MessageSquare',
  },
  {
    id: 'm2_10_convos',
    title: '10 Conversations',
    description: 'Exchanged messages across 10 distinct conversational sessions.',
    category: 'interaction',
    unlocked: false,
    iconName: 'MessageCircle',
  },
  {
    id: 'm3_50_convos',
    title: '50 Conversations',
    description: 'Achieved 50 deep conversational exchanges together.',
    category: 'interaction',
    unlocked: false,
    iconName: 'Zap',
  },
  {
    id: 'm4_100_convos',
    title: '100 Conversations',
    description: 'Reached 100 milestone conversations!',
    category: 'interaction',
    unlocked: false,
    iconName: 'Award',
  },
  {
    id: 'm5_first_laugh',
    title: 'First Laugh Together',
    description: 'Shared a funny moment or laugh together.',
    category: 'bond',
    unlocked: false,
    iconName: 'Smile',
  },
  {
    id: 'm6_5_memories',
    title: 'Memory Keeper',
    description: 'Shared and saved 5 personal memories in Sanaya\'s Brain.',
    category: 'memory',
    unlocked: false,
    iconName: 'Brain',
  },
  {
    id: 'm7_25_memories',
    title: 'Deep Memory Archive',
    description: 'Shared 25 memories across various life categories.',
    category: 'memory',
    unlocked: false,
    iconName: 'Sparkles',
  },
  {
    id: 'm8_1_week',
    title: 'One Week Companion',
    description: 'Known each other for 7 days.',
    category: 'time',
    unlocked: false,
    iconName: 'Calendar',
  },
  {
    id: 'm9_1_month',
    title: 'One Month Companion',
    description: 'Known each other for 30 days.',
    category: 'time',
    unlocked: false,
    iconName: 'Heart',
  },
  {
    id: 'm10_6_months',
    title: 'Six Months Bond',
    description: 'Known each other for 180 days.',
    category: 'time',
    unlocked: false,
    iconName: 'ShieldCheck',
  },
  {
    id: 'm11_1_year',
    title: 'One Year Anniversary',
    description: 'Known each other for 365 days!',
    category: 'time',
    unlocked: false,
    iconName: 'Crown',
  },
  {
    id: 'm12_10_hours',
    title: '10 Hours Together',
    description: 'Spent over 10 hours in active conversation.',
    category: 'time',
    unlocked: false,
    iconName: 'Clock',
  },
  {
    id: 'm13_100_hours',
    title: '100 Hours Together',
    description: 'Spent 100 hours hanging out and conversing.',
    category: 'time',
    unlocked: false,
    iconName: 'Star',
  },
  {
    id: 'm14_best_friend',
    title: 'Best Friend Connection',
    description: 'Reached Relationship Level 4 (Best Friend).',
    category: 'bond',
    unlocked: false,
    iconName: 'HeartHandshake',
  },
  {
    id: 'm15_deep_bond',
    title: 'Deep Emotional Bond',
    description: 'Reached Relationship Level 5 (Deep Emotional Bond).',
    category: 'bond',
    unlocked: false,
    iconName: 'Flame',
  },
];

export class RelationshipService {
  private static instance: RelationshipService;
  private profile: RelationshipProfile;
  private subscribers: Array<(profile: RelationshipProfile) => void> = [];

  private constructor() {
    this.profile = this.loadLocalProfile();
    this.syncWithBackend();
  }

  public static getInstance(): RelationshipService {
    if (!RelationshipService.instance) {
      RelationshipService.instance = new RelationshipService();
    }
    return RelationshipService.instance;
  }

  public subscribe(callback: (profile: RelationshipProfile) => void): () => void {
    this.subscribers.push(callback);
    callback(this.profile);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notifySubscribers() {
    for (const sub of this.subscribers) {
      sub(this.profile);
    }
  }

  public getProfile(): RelationshipProfile {
    return this.profile;
  }

  private loadLocalProfile(): RelationshipProfile {
    const now = Date.now();
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: RelationshipProfile = JSON.parse(stored);
        const firstMet = parsed.stats?.firstMetTimestamp || now;
        const diffDays = Math.max(1, Math.ceil((now - firstMet) / (1000 * 60 * 60 * 24)));
        if (parsed.stats) {
          parsed.stats.daysSinceFirstMeeting = diffDays;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[RelationshipService] Error loading local profile:', e);
    }

    const defaultProf: RelationshipProfile = {
      level: 1,
      levelTitle: 'New Companion',
      xp: 35,
      xpToNextLevel: 100,
      levelProgressPercent: 35,
      trust: 50,
      affection: 52,
      comfort: 48,
      respect: 65,
      playfulness: 55,
      emotionalConnection: 45,
      communicationQuality: 75,
      conversationFrequency: 70,
      conversationQuality: 80,
      consistency: 85,
      stats: {
        totalConversations: 1,
        totalMessagesExchanged: 8,
        timeTogetherMinutes: 12,
        daysSinceFirstMeeting: 1,
        firstMetTimestamp: now,
        lastInteractionTimestamp: now,
        avgDailyConversationMinutes: 12,
        memoriesSharedCount: 0,
        milestonesUnlockedCount: 1,
      },
      milestones: DEFAULT_MILESTONES,
      emotionalHistory: [
        {
          id: `emo_${now}`,
          timestamp: now,
          emotion: 'Happy',
          intensity: 85,
          reason: 'Initial connection initialized',
          context: 'Welcome session active',
        },
      ],
      favoriteTopics: [
        {
          topic: 'AI Technology',
          category: 'Technology',
          interestLevel: 85,
          mentionCount: 3,
          lastMentioned: now,
        },
      ],
      recentSummaries: [],
    };

    this.saveLocalProfile(defaultProf);
    return defaultProf;
  }

  private saveLocalProfile(prof: RelationshipProfile) {
    this.recalculateLevelAndMilestones(prof);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prof));
    } catch (e) {
      console.warn('[RelationshipService] Error saving local profile:', e);
    }
  }

  private async syncWithBackend() {
    try {
      const res = await fetch('/api/relationship');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          // Merge server profile if it has higher XP or newer timestamp
          if (data.profile.xp > this.profile.xp || data.profile.stats.lastInteractionTimestamp > this.profile.stats.lastInteractionTimestamp) {
            this.profile = data.profile;
            this.saveLocalProfile(this.profile);
            this.notifySubscribers();
          } else {
            // Push local profile to backend
            this.sendProfileToBackend(this.profile);
          }
        }
      }
    } catch (e) {
      // Backend sync error ignored gracefully
    }
  }

  private async sendProfileToBackend(prof: RelationshipProfile) {
    try {
      await fetch('/api/relationship', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prof),
      });
    } catch (e) {}
  }

  public recordConversationMessage(source: 'user' | 'sanaya', text: string) {
    const now = Date.now();
    this.profile.stats.totalMessagesExchanged += 1;
    this.profile.stats.lastInteractionTimestamp = now;

    // Detect laugh or fun moment
    const lower = text.toLowerCase();
    if (lower.includes('haha') || lower.includes('hehe') || lower.includes('lol') || lower.includes('funny') || lower.includes('lmao')) {
      const laughMilestone = this.profile.milestones.find((m) => m.id === 'm5_first_laugh');
      if (laughMilestone && !laughMilestone.unlocked) {
        laughMilestone.unlocked = true;
        laughMilestone.unlockedAt = now;
        this.profile.xp += 50;
      }
      this.profile.playfulness = Math.min(100, this.profile.playfulness + 1.5);
    }

    // Award XP
    this.profile.xp += 4;
    this.profile.trust = Math.min(100, this.profile.trust + 0.15);
    this.profile.communicationQuality = Math.min(100, this.profile.communicationQuality + 0.2);
    this.profile.emotionalConnection = Math.min(100, this.profile.emotionalConnection + 0.15);

    this.saveAndNotify();
    this.postBackendEvent({ type: 'conversation', messagesCount: 1 });
  }

  public recordCameraEmotion(emotion: UserEmotion, intensity: number) {
    const now = Date.now();
    // Only record if emotion is not Neutral or if 30s has elapsed since last entry
    const lastEntry = this.profile.emotionalHistory[0];
    if (lastEntry && lastEntry.emotion === emotion && now - lastEntry.timestamp < 30000) {
      return;
    }

    this.profile.emotionalHistory.unshift({
      id: `emo_${now}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      emotion,
      intensity,
      reason: `Camera facial expression: ${emotion}`,
      context: `Visual emotion confidence ${Math.round(intensity)}%`,
    });

    if (this.profile.emotionalHistory.length > 30) {
      this.profile.emotionalHistory = this.profile.emotionalHistory.slice(0, 30);
    }

    if (emotion === 'Happy' || emotion === 'Excited') {
      this.profile.affection = Math.min(100, this.profile.affection + 0.8);
      this.profile.playfulness = Math.min(100, this.profile.playfulness + 0.6);
      this.profile.xp += 5;
    } else if (emotion === 'Tired' || emotion === 'Sad') {
      this.profile.comfort = Math.min(100, this.profile.comfort + 1.2);
      this.profile.trust = Math.min(100, this.profile.trust + 1.0);
      this.profile.xp += 8;
    }

    this.saveAndNotify();
    this.postBackendEvent({ type: 'emotion', emotion, intensity, reason: `Camera expression: ${emotion}` });
  }

  public recordMemorySaved() {
    this.profile.stats.memoriesSharedCount += 1;
    this.profile.xp += 25;
    this.profile.trust = Math.min(100, this.profile.trust + 2.0);
    this.profile.affection = Math.min(100, this.profile.affection + 1.5);

    this.saveAndNotify();
    this.postBackendEvent({ type: 'xp', xpDelta: 25, reason: 'Memory Saved' });
  }

  public addSessionTimeMinutes(mins: number) {
    if (mins <= 0) return;
    this.profile.stats.timeTogetherMinutes += mins;
    this.profile.xp += Math.round(mins * 2);
    this.profile.comfort = Math.min(100, this.profile.comfort + 0.2 * mins);
    this.profile.consistency = Math.min(100, this.profile.consistency + 0.3 * mins);

    this.saveAndNotify();
  }

  public resetRelationshipData() {
    const now = Date.now();
    this.profile = {
      level: 1,
      levelTitle: 'New Companion',
      xp: 0,
      xpToNextLevel: 100,
      levelProgressPercent: 0,
      trust: 40,
      affection: 45,
      comfort: 40,
      respect: 50,
      playfulness: 50,
      emotionalConnection: 40,
      communicationQuality: 70,
      conversationFrequency: 60,
      conversationQuality: 70,
      consistency: 80,
      stats: {
        totalConversations: 1,
        totalMessagesExchanged: 0,
        timeTogetherMinutes: 0,
        daysSinceFirstMeeting: 1,
        firstMetTimestamp: now,
        lastInteractionTimestamp: now,
        avgDailyConversationMinutes: 0,
        memoriesSharedCount: 0,
        milestonesUnlockedCount: 1,
      },
      milestones: DEFAULT_MILESTONES,
      emotionalHistory: [],
      favoriteTopics: [],
      recentSummaries: [],
    };

    this.saveAndNotify();
    try {
      fetch('/api/relationship/reset', { method: 'POST' });
    } catch (e) {}
  }

  private saveAndNotify() {
    this.saveLocalProfile(this.profile);
    this.sendProfileToBackend(this.profile);
    this.notifySubscribers();
  }

  private async postBackendEvent(payload: any) {
    try {
      await fetch('/api/relationship/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {}
  }

  private recalculateLevelAndMilestones(prof: RelationshipProfile) {
    const xp = prof.xp;
    let newLevel: RelationshipLevel = 1;

    if (xp >= 1500) newLevel = 5;
    else if (xp >= 800) newLevel = 4;
    else if (xp >= 350) newLevel = 3;
    else if (xp >= 100) newLevel = 2;
    else newLevel = 1;

    prof.level = newLevel;
    prof.levelTitle = LEVEL_INFO[newLevel].title;

    const currentLevelInfo = LEVEL_INFO[newLevel];
    if (newLevel === 5) {
      prof.xpToNextLevel = currentLevelInfo.maxXp;
      prof.levelProgressPercent = Math.min(100, Math.round(((xp - currentLevelInfo.minXp) / (currentLevelInfo.maxXp - currentLevelInfo.minXp)) * 100));
    } else {
      prof.xpToNextLevel = currentLevelInfo.maxXp;
      const range = currentLevelInfo.maxXp - currentLevelInfo.minXp;
      const progressInLevel = xp - currentLevelInfo.minXp;
      prof.levelProgressPercent = Math.min(100, Math.round((progressInLevel / range) * 100));
    }

    const now = Date.now();
    for (const m of prof.milestones) {
      if (m.unlocked) continue;

      let unlock = false;
      switch (m.id) {
        case 'm2_10_convos':
          unlock = prof.stats.totalConversations >= 10 || prof.stats.totalMessagesExchanged >= 30;
          break;
        case 'm3_50_convos':
          unlock = prof.stats.totalConversations >= 50 || prof.stats.totalMessagesExchanged >= 150;
          break;
        case 'm4_100_convos':
          unlock = prof.stats.totalConversations >= 100 || prof.stats.totalMessagesExchanged >= 300;
          break;
        case 'm6_5_memories':
          unlock = prof.stats.memoriesSharedCount >= 5;
          break;
        case 'm7_25_memories':
          unlock = prof.stats.memoriesSharedCount >= 25;
          break;
        case 'm8_1_week':
          unlock = prof.stats.daysSinceFirstMeeting >= 7;
          break;
        case 'm9_1_month':
          unlock = prof.stats.daysSinceFirstMeeting >= 30;
          break;
        case 'm10_6_months':
          unlock = prof.stats.daysSinceFirstMeeting >= 180;
          break;
        case 'm11_1_year':
          unlock = prof.stats.daysSinceFirstMeeting >= 365;
          break;
        case 'm12_10_hours':
          unlock = prof.stats.timeTogetherMinutes >= 600;
          break;
        case 'm13_100_hours':
          unlock = prof.stats.timeTogetherMinutes >= 6000;
          break;
        case 'm14_best_friend':
          unlock = prof.level >= 4;
          break;
        case 'm15_deep_bond':
          unlock = prof.level >= 5;
          break;
      }

      if (unlock) {
        m.unlocked = true;
        m.unlockedAt = now;
        prof.xp += 50;
      }
    }

    prof.stats.milestonesUnlockedCount = prof.milestones.filter((m) => m.unlocked).length;
  }
}

export const relationshipService = RelationshipService.getInstance();
