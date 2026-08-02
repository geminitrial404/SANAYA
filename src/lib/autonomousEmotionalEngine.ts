import { SessionStatus, TranscriptionMessage } from '../types';

export type HiddenEmotion =
  | 'happy'
  | 'soft'
  | 'laughing'
  | 'thinking'
  | 'embarrassed'
  | 'sad'
  | 'concerned'
  | 'excited'
  | 'curious'
  | 'sleepy'
  | 'focused'
  | 'surprised'
  | 'proud'
  | 'confident'
  | 'relaxed';

export interface InternalEmotionalState {
  currentMood: HiddenEmotion;
  targetMood: HiddenEmotion;
  emotionalIntensity: number; // 0.0 to 1.0
  energyLevel: number; // 0.0 to 1.0
  curiosityLevel: number; // 0.0 to 1.0
  empathyLevel: number; // 0.0 to 1.0
  confidenceLevel: number; // 0.0 to 1.0
  stressLevel: number; // 0.0 to 1.0 (Sanaya stays calm even if high)
  playfulnessLevel: number; // 0.0 to 1.0
}

// Pathway map for smooth organic transition steps
const EMOTION_PATHWAYS: Partial<Record<HiddenEmotion, Partial<Record<HiddenEmotion, HiddenEmotion>>>> = {
  happy: {
    sad: 'concerned',
    surprised: 'curious',
    sleepy: 'relaxed',
  },
  sad: {
    happy: 'soft',
    excited: 'curious',
  },
  excited: {
    sad: 'curious',
    sleepy: 'relaxed',
  },
};

export class AutonomousEmotionalEngine {
  private state: InternalEmotionalState = {
    currentMood: 'happy',
    targetMood: 'happy',
    emotionalIntensity: 0.7,
    energyLevel: 0.8,
    curiosityLevel: 0.75,
    empathyLevel: 0.85,
    confidenceLevel: 0.9,
    stressLevel: 0.1,
    playfulnessLevel: 0.8,
  };

  private lastStepTime = performance.now();
  private stepTimer = 0;

  public getState(): InternalEmotionalState {
    return { ...this.state };
  }

  // Update engine with latest inputs
  public update(
    status: SessionStatus,
    userVolume: number,
    sanayaVolume: number,
    recentTranscripts: TranscriptionMessage[] = []
  ): InternalEmotionalState {
    const now = performance.now();
    const dt = Math.min((now - this.lastStepTime) / 1000, 0.1);
    this.lastStepTime = now;

    this.stepTimer += dt;

    // 1. Analyze recent transcript text sentiment if present
    let textSuggestedMood: HiddenEmotion | null = null;
    if (recentTranscripts.length > 0) {
      const latestMsg = recentTranscripts[recentTranscripts.length - 1];
      const text = (latestMsg.text || '').toLowerCase();

      if (/happy|awesome|great|love|yay|wonderful|fantastic|fun|ha|lol|laugh/.test(text)) {
        textSuggestedMood = text.includes('lol') || text.includes('ha') ? 'laughing' : 'happy';
        this.state.playfulnessLevel = Math.min(1.0, this.state.playfulnessLevel + 0.1);
        this.state.energyLevel = Math.min(1.0, this.state.energyLevel + 0.08);
      } else if (/sad|hurt|cry|crying|pain|miss|depressed|hard|heartbreak/.test(text)) {
        textSuggestedMood = 'concerned';
        this.state.empathyLevel = Math.min(1.0, this.state.empathyLevel + 0.2);
        this.state.energyLevel = Math.max(0.3, this.state.energyLevel - 0.1);
      } else if (/excited|celebrate|passed|won|bought|bike|dream/.test(text)) {
        textSuggestedMood = 'excited';
        this.state.energyLevel = Math.min(1.0, this.state.energyLevel + 0.25);
      } else if (/confused|understand|what|why|how|explain|doubt/.test(text)) {
        textSuggestedMood = 'curious';
        this.state.curiosityLevel = Math.min(1.0, this.state.curiosityLevel + 0.2);
      } else if (/tired|sleep|sleepy|exhausted|night|rest|bed/.test(text)) {
        textSuggestedMood = 'sleepy';
        this.state.energyLevel = Math.max(0.2, this.state.energyLevel - 0.15);
      } else if (/sorry|embarrassed|mistake|oops/.test(text)) {
        textSuggestedMood = 'soft';
        this.state.empathyLevel = Math.min(1.0, this.state.empathyLevel + 0.15);
      }
    }

    // 2. Audio & Status Driven Target Determination
    let desiredTarget: HiddenEmotion = this.state.targetMood;

    if (textSuggestedMood) {
      desiredTarget = textSuggestedMood;
    } else {
      switch (status) {
        case 'speaking':
          if (sanayaVolume > 0.5) {
            desiredTarget = 'excited';
          } else {
            desiredTarget = 'happy';
          }
          this.state.energyLevel = Math.min(1.0, this.state.energyLevel + dt * 0.2);
          break;

        case 'listening':
          if (userVolume > 0.65) {
            desiredTarget = 'curious';
            this.state.curiosityLevel = Math.min(1.0, this.state.curiosityLevel + dt * 0.3);
          } else if (userVolume > 0.1) {
            desiredTarget = 'focused';
          } else {
            desiredTarget = 'focused';
          }
          break;

        case 'thinking':
          desiredTarget = 'thinking';
          break;

        case 'interrupted':
          desiredTarget = 'surprised';
          break;

        case 'connecting':
          desiredTarget = 'excited';
          break;

        case 'disconnected':
        default:
          desiredTarget = 'happy';
          break;
      }
    }

    // 3. Smooth Step-Wise Mood Evolution (Gradual Transitions)
    if (this.stepTimer > 1.2) {
      this.stepTimer = 0;

      if (this.state.currentMood !== desiredTarget) {
        // Find stepping emotion if available or advance step
        const current = this.state.currentMood;
        if (current === 'happy' && desiredTarget === 'sad') {
          this.state.currentMood = 'concerned';
        } else if (current === 'concerned' && desiredTarget === 'sad') {
          this.state.currentMood = 'sad';
        } else if (current === 'sad' && desiredTarget === 'happy') {
          this.state.currentMood = 'soft';
        } else if (current === 'soft' && desiredTarget === 'happy') {
          this.state.currentMood = 'happy';
        } else if (current === 'surprised') {
          this.state.currentMood = 'curious';
        } else {
          this.state.currentMood = desiredTarget;
        }
      }
      this.state.targetMood = desiredTarget;
    }

    // 4. Natural Homeostasis & Decay toward default warm baseline over time
    if (status === 'disconnected' || (status === 'listening' && userVolume < 0.05)) {
      this.state.energyLevel += (0.6 - this.state.energyLevel) * dt * 0.1;
      this.state.stressLevel *= Math.max(0, 1 - dt * 0.2);
      if (this.state.currentMood !== 'happy' && this.state.currentMood !== 'relaxed') {
        if (Math.random() < dt * 0.15) {
          this.state.currentMood = 'happy';
          this.state.targetMood = 'happy';
        }
      }
    }

    return { ...this.state };
  }
}
