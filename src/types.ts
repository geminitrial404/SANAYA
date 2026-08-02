export type SessionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'reconnecting';

export interface TranscriptionMessage {
  id: string;
  source: 'sanaya' | 'user';
  text: string;
  timestamp: number;
}

export interface ToolCallItem {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
  status: 'executing' | 'completed' | 'failed';
  result?: any;
}

export interface MemoryItem {
  id: string;
  category:
    | 'Identity'
    | 'Preferences'
    | 'Lifestyle'
    | 'Relationships'
    | 'Goals'
    | 'Dislikes'
    | 'Conversation Style'
    | 'Health'
    | 'Project Memory'
    | 'Devices'
    | 'Skills'
    | 'Favorites'
    | 'Important Dates';
  topic: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  updatedAt: number;
  notes?: string;
}

export interface AppActionState {
  activeApp: 'notes' | 'weather' | 'calc' | 'soundboard' | 'theme' | 'memory' | null;
  data?: any;
}

export interface VoiceSettings {
  micSensitivity: number; // 0.1 to 2.0
  playbackVolume: number; // 0.0 to 1.0
  autoReconnect: boolean;
  selectedVoice: string; // 'Kore' | 'Zephyr' | 'Aoede' | 'Puck' | 'Fenrir'
  hinglishMode: boolean;
  autoLockTimeoutSec: number; // 15, 30, 60, 120, 300
}

// ==========================================
// BIOMETRIC AUTHENTICATION TYPES
// ==========================================

export type BiometricAngle = 'front' | 'left' | 'right' | 'up' | 'down';
export type LivenessChallenge = 'none' | 'blink' | 'tilt_left' | 'tilt_right' | 'tilt_up' | 'blink_and_tilt';

export interface FaceEmbedding {
  angle: BiometricAngle;
  vector: number[]; // 128-dimensional facial landmark & texture feature vector
  landmarks: { x: number; y: number; z?: number }[];
  luminance: number;
  sharpness: number;
  timestamp: number;
}

export interface VoiceEmbedding {
  sampleIndex: number;
  mfccVector: number[]; // 64-dimensional Mel-Frequency Cepstral Coefficients + spectral formants
  phrase: string;
  pitchHarmonics: number;
  energyProfile: number[];
  timestamp: number;
}

export interface BiometricOwnerProfile {
  id: string; // Single owner ID e.g. "owner_jay"
  ownerName: string; // e.g. "Jay"
  verificationPhrase: string; // Default: "Golden River Seven"
  faceEmbeddings?: FaceEmbedding[];
  voiceEmbeddings: VoiceEmbedding[]; // Multi-sample voice recordings
  registeredAt: number;
  lastUpdated: number;
}

export type AuthLockState =
  | 'uninitialized' // No owner voice profile registered yet
  | 'enrolling' // Owner voice enrollment in progress
  | 'locked' // System locked, awaiting voice challenge response
  | 'verifying_voice' // Listening and evaluating random phrase & speaker voice embedding
  | 'unlocked' // Voice identity verified, Sanaya unlocked
  | 'unauthorized'; // Speaker mismatch or incorrect phrase spoken

export interface BiometricStatus {
  hasOwner: boolean;
  lockState: AuthLockState;
  voiceMatchScore: number; // 0.0 to 1.0 (strict threshold >= 0.72)
  challengePhrase: string; // Dynamic random phrase e.g. "Golden River Seven"
  enrollmentStep?: number; // Voice sample 1 to 4
  totalVoiceSamples?: number; // Default: 4
  statusMessage: string;
  ownerName: string;
  verificationPhrase: string;
  autoLockTimeoutSec: number;
}

// ==========================================
// EMOTIONAL INTELLIGENCE & VISUAL INTERACTION
// ==========================================

export type UserEmotion =
  | 'Happy'
  | 'Sad'
  | 'Angry'
  | 'Confused'
  | 'Focused'
  | 'Excited'
  | 'Tired'
  | 'Neutral';

export interface EmotionalIntelligence {
  currentEmotion: UserEmotion;
  smileScore: number; // 0 to 100
  eyeContact: number; // 0 to 100
  attentionLevel: number; // 0 to 100
  engagementLevel: number; // 0 to 100
  moodEstimation: string;
  headPose: { yaw: number; pitch: number; roll: number };
  lastAnalyzed: number;
}

// ==========================================
// RELATIONSHIP EVOLUTION SYSTEM TYPES
// ==========================================

export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

export type MilestoneCategory = 'interaction' | 'memory' | 'time' | 'bond' | 'special';

export interface RelationshipMilestone {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  unlocked: boolean;
  unlockedAt?: number;
  iconName?: string;
}

export interface EmotionalHistoryRecord {
  id: string;
  timestamp: number;
  emotion: UserEmotion;
  intensity: number; // 0 to 100
  reason?: string;
  context?: string;
}

export interface MoodTrend {
  period: 'daily' | 'weekly';
  dominantEmotion: UserEmotion;
  averageSmile: number;
  averageEngagement: number;
  positivePercent: number;
}

export interface FavoriteTopic {
  topic: string;
  category: string;
  interestLevel: number; // 0 to 100
  mentionCount: number;
  lastMentioned: number;
}

export interface ConversationSummary {
  id: string;
  timestamp: number;
  durationSeconds: number;
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'empathetic' | 'playful';
  summaryText: string;
}

export interface RelationshipXP {
  currentXp: number;
  xpToNextLevel: number;
  level: RelationshipLevel;
  levelTitle: string;
  levelProgressPercent: number;
}

export interface RelationshipStatistics {
  totalConversations: number;
  totalMessagesExchanged: number;
  timeTogetherMinutes: number;
  daysSinceFirstMeeting: number;
  firstMetTimestamp: number;
  lastInteractionTimestamp: number;
  avgDailyConversationMinutes: number;
  memoriesSharedCount: number;
  milestonesUnlockedCount: number;
}

export interface RelationshipProfile {
  level: RelationshipLevel;
  levelTitle: string;
  xp: number;
  xpToNextLevel: number;
  levelProgressPercent: number;
  trust: number; // 0 to 100
  affection: number; // 0 to 100
  comfort: number; // 0 to 100
  respect: number; // 0 to 100
  playfulness: number; // 0 to 100
  emotionalConnection: number; // 0 to 100
  communicationQuality: number; // 0 to 100
  conversationFrequency: number; // 0 to 100
  conversationQuality: number; // 0 to 100
  consistency: number; // 0 to 100
  stats: RelationshipStatistics;
  milestones: RelationshipMilestone[];
  emotionalHistory: EmotionalHistoryRecord[];
  favoriteTopics: FavoriteTopic[];
  recentSummaries: ConversationSummary[];
}


