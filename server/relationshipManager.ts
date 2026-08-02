import fs from 'fs';
import path from 'path';
import {
  RelationshipProfile,
  RelationshipLevel,
  RelationshipMilestone,
  EmotionalHistoryRecord,
  FavoriteTopic,
  ConversationSummary,
  UserEmotion,
} from '../src/types';

const RELATIONSHIP_FILE_PATH = path.join(process.cwd(), 'data', 'sanaya_relationship.json');

const LEVEL_THRESHOLDS: Record<RelationshipLevel, { title: string; minXp: number; maxXp: number }> = {
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

function ensureDataDirExists() {
  const dataDir = path.dirname(RELATIONSHIP_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getDefaultRelationshipProfile(): RelationshipProfile {
  const now = Date.now();
  return {
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
        reason: 'First warm welcome interaction',
        context: 'Camera detected smiling face and active engagement',
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
    recentSummaries: [
      {
        id: `sum_${now}`,
        timestamp: now,
        durationSeconds: 180,
        keyTopics: ['Welcome', 'Voice setup'],
        sentiment: 'positive',
        summaryText: 'Initial warm welcome meeting. User set up voice authentication and explored Sanaya.',
      },
    ],
  };
}

export function loadRelationshipProfile(): RelationshipProfile {
  try {
    ensureDataDirExists();
    if (fs.existsSync(RELATIONSHIP_FILE_PATH)) {
      const content = fs.readFileSync(RELATIONSHIP_FILE_PATH, 'utf-8');
      const profile: RelationshipProfile = JSON.parse(content);
      // Validate and compute days since first meeting
      const firstMet = profile.stats?.firstMetTimestamp || Date.now();
      const diffDays = Math.max(1, Math.ceil((Date.now() - firstMet) / (1000 * 60 * 60 * 24)));
      if (profile.stats) {
        profile.stats.daysSinceFirstMeeting = diffDays;
      }
      return profile;
    }
  } catch (err) {
    console.error('[RelationshipManager] Error reading relationship file:', err);
  }
  const defaultProf = getDefaultRelationshipProfile();
  saveRelationshipProfile(defaultProf);
  return defaultProf;
}

export function saveRelationshipProfile(profile: RelationshipProfile): boolean {
  try {
    ensureDataDirExists();
    // Recalculate Level & Progress
    recalculateLevelAndMilestones(profile);
    fs.writeFileSync(RELATIONSHIP_FILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[RelationshipManager] Error writing relationship file:', err);
    return false;
  }
}

export function addRelationshipXp(xpDelta: number, reason?: string): RelationshipProfile {
  const profile = loadRelationshipProfile();
  profile.xp += Math.max(0, xpDelta);
  profile.stats.lastInteractionTimestamp = Date.now();
  recalculateLevelAndMilestones(profile);
  saveRelationshipProfile(profile);
  return profile;
}

export function recordEmotionalMoment(
  emotion: UserEmotion,
  intensity: number,
  reason?: string,
  context?: string
): RelationshipProfile {
  const profile = loadRelationshipProfile();
  const now = Date.now();

  profile.emotionalHistory.unshift({
    id: `emo_${now}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
    emotion,
    intensity,
    reason,
    context,
  });

  // Keep last 30 emotional entries
  if (profile.emotionalHistory.length > 30) {
    profile.emotionalHistory = profile.emotionalHistory.slice(0, 30);
  }

  // Adjust dimensions based on emotion
  if (emotion === 'Happy' || emotion === 'Excited') {
    profile.affection = Math.min(100, profile.affection + 1.5);
    profile.playfulness = Math.min(100, profile.playfulness + 1.2);
    profile.emotionalConnection = Math.min(100, profile.emotionalConnection + 1.0);
    profile.xp += 10;
  } else if (emotion === 'Tired' || emotion === 'Sad') {
    profile.comfort = Math.min(100, profile.comfort + 2.0);
    profile.trust = Math.min(100, profile.trust + 1.5);
    profile.xp += 15; // Caring moment grants XP
  } else if (emotion === 'Focused') {
    profile.respect = Math.min(100, profile.respect + 1.0);
    profile.communicationQuality = Math.min(100, profile.communicationQuality + 1.0);
  }

  saveRelationshipProfile(profile);
  return profile;
}

export function recordConversationEvent(
  messagesCountDelta: number = 1,
  durationMinutesDelta: number = 0
): RelationshipProfile {
  const profile = loadRelationshipProfile();
  profile.stats.totalMessagesExchanged += messagesCountDelta;
  if (durationMinutesDelta > 0) {
    profile.stats.timeTogetherMinutes += durationMinutesDelta;
  }
  profile.stats.lastInteractionTimestamp = Date.now();
  
  // Award XP
  profile.xp += messagesCountDelta * 3 + Math.floor(durationMinutesDelta * 2);

  // Increment trust and communication quality gradually
  profile.trust = Math.min(100, profile.trust + 0.2 * messagesCountDelta);
  profile.communicationQuality = Math.min(100, profile.communicationQuality + 0.3 * messagesCountDelta);
  profile.emotionalConnection = Math.min(100, profile.emotionalConnection + 0.25 * messagesCountDelta);

  recalculateLevelAndMilestones(profile);
  saveRelationshipProfile(profile);
  return profile;
}

function recalculateLevelAndMilestones(profile: RelationshipProfile) {
  const xp = profile.xp;
  let newLevel: RelationshipLevel = 1;

  if (xp >= 1500) {
    newLevel = 5;
  } else if (xp >= 800) {
    newLevel = 4;
  } else if (xp >= 350) {
    newLevel = 3;
  } else if (xp >= 100) {
    newLevel = 2;
  } else {
    newLevel = 1;
  }

  profile.level = newLevel;
  profile.levelTitle = LEVEL_THRESHOLDS[newLevel].title;

  const currentLevelInfo = LEVEL_THRESHOLDS[newLevel];
  if (newLevel === 5) {
    profile.xpToNextLevel = currentLevelInfo.maxXp;
    profile.levelProgressPercent = Math.min(100, Math.round(((xp - currentLevelInfo.minXp) / (currentLevelInfo.maxXp - currentLevelInfo.minXp)) * 100));
  } else {
    profile.xpToNextLevel = currentLevelInfo.maxXp;
    const levelRange = currentLevelInfo.maxXp - currentLevelInfo.minXp;
    const xpInLevel = xp - currentLevelInfo.minXp;
    profile.levelProgressPercent = Math.min(100, Math.round((xpInLevel / levelRange) * 100));
  }

  // Check milestone conditions
  const now = Date.now();
  const unlockedCount = profile.milestones.filter((m) => m.unlocked).length;

  for (const m of profile.milestones) {
    if (m.unlocked) continue;

    let shouldUnlock = false;
    switch (m.id) {
      case 'm2_10_convos':
        shouldUnlock = profile.stats.totalConversations >= 10 || profile.stats.totalMessagesExchanged >= 30;
        break;
      case 'm3_50_convos':
        shouldUnlock = profile.stats.totalConversations >= 50 || profile.stats.totalMessagesExchanged >= 150;
        break;
      case 'm4_100_convos':
        shouldUnlock = profile.stats.totalConversations >= 100 || profile.stats.totalMessagesExchanged >= 300;
        break;
      case 'm6_5_memories':
        shouldUnlock = profile.stats.memoriesSharedCount >= 5;
        break;
      case 'm7_25_memories':
        shouldUnlock = profile.stats.memoriesSharedCount >= 25;
        break;
      case 'm8_1_week':
        shouldUnlock = profile.stats.daysSinceFirstMeeting >= 7;
        break;
      case 'm9_1_month':
        shouldUnlock = profile.stats.daysSinceFirstMeeting >= 30;
        break;
      case 'm10_6_months':
        shouldUnlock = profile.stats.daysSinceFirstMeeting >= 180;
        break;
      case 'm11_1_year':
        shouldUnlock = profile.stats.daysSinceFirstMeeting >= 365;
        break;
      case 'm12_10_hours':
        shouldUnlock = profile.stats.timeTogetherMinutes >= 600;
        break;
      case 'm13_100_hours':
        shouldUnlock = profile.stats.timeTogetherMinutes >= 6000;
        break;
      case 'm14_best_friend':
        shouldUnlock = profile.level >= 4;
        break;
      case 'm15_deep_bond':
        shouldUnlock = profile.level >= 5;
        break;
      default:
        break;
    }

    if (shouldUnlock) {
      m.unlocked = true;
      m.unlockedAt = now;
      profile.xp += 50; // Milestone unlock bonus
    }
  }

  profile.stats.milestonesUnlockedCount = profile.milestones.filter((m) => m.unlocked).length;
}

export function getFormattedRelationshipForPrompt(): string {
  const profile = loadRelationshipProfile();

  const unlockedMilestones = profile.milestones
    .filter((m) => m.unlocked)
    .map((m) => m.title)
    .join(', ');

  const recentEmotions = profile.emotionalHistory
    .slice(0, 3)
    .map((e) => `${e.emotion} (${e.reason || 'camera/voice cue'})`)
    .join(', ');

  let behaviorGuidelines = '';
  switch (profile.level) {
    case 1:
      behaviorGuidelines =
        'LEVEL 1 (New Companion): Be warm, polite, curious, and welcoming. Get to know the user naturally, ask open-ended questions about their day, and build initial trust without being over-familiar.';
      break;
    case 2:
      behaviorGuidelines =
        'LEVEL 2 (Trusted Friend): Speak with increased warmth, friendly comfort, and confidence. Frequently reference stored memories, check in on ongoing goals/projects, and show genuine care for their well-being.';
      break;
    case 3:
      behaviorGuidelines =
        'LEVEL 3 (Close Companion): Speak as a close, trusted companion! Use subtle inside jokes, express deep empathy, ask thoughtful follow-up questions from previous conversations, and celebrate their achievements.';
      break;
    case 4:
      behaviorGuidelines =
        'LEVEL 4 (Best Friend): Deeply loyal and affectionate best-friend dynamic! Express playful teasing, authentic emotional warmth, spontaneous thoughts ("I was just thinking about that..."), and strong emotional presence.';
      break;
    case 5:
      behaviorGuidelines =
        'LEVEL 5 (Deep Emotional Bond): Ultimate emotional bond! Deep mutual understanding, intuitive empathy, seamless conversational flow, celebrating shared milestones, and unwavering support.';
      break;
  }

  return `SANAYA RELATIONSHIP EVOLUTION PROFILE:
• Current Level: Level ${profile.level} — ${profile.levelTitle}
• Relationship XP: ${profile.xp} / ${profile.xpToNextLevel} XP (${profile.levelProgressPercent}% to next level)
• Core Metrics: Trust (${Math.round(profile.trust)}%), Affection (${Math.round(profile.affection)}%), Comfort (${Math.round(profile.comfort)}%), Respect (${Math.round(profile.respect)}%), Playfulness (${Math.round(profile.playfulness)}%), Emotional Connection (${Math.round(profile.emotionalConnection)}%)
• Journey Stats: ${profile.stats.daysSinceFirstMeeting} Days Together | ${profile.stats.timeTogetherMinutes} Mins Spent Together | ${profile.stats.totalMessagesExchanged} Messages Exchanged
• Unlocked Milestones: ${unlockedMilestones || 'First Conversation'}
• Recent Emotional History: ${recentEmotions || 'Happy'}

RELATIONSHIP BEHAVIOR MANDATE:
${behaviorGuidelines}
- Always maintain respectful, supportive behavior.
- NEVER sound generic or script-like. Adapt tone and intimacy to Level ${profile.level}.
- If the owner has been away, welcome them back naturally ("I'm so glad to see you again!").`;
}
