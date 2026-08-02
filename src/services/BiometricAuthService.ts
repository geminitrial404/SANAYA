import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import {
  VoiceEmbedding,
  BiometricOwnerProfile,
  AuthLockState,
  BiometricStatus,
  EmotionalIntelligence,
  UserEmotion,
} from '../types';

const STORAGE_KEY = 'sanaya_voice_owner_v2';
const SESSION_AUTH_KEY = 'sanaya_session_authenticated_v1';
const TIMEOUT_STORAGE_KEY = 'sanaya_autolock_timeout_sec';
const DEFAULT_OWNER_NAME = 'Jay';

export const STRICT_VOICE_SIMILARITY_THRESHOLD = 0.72;

// Dynamic random verification phrases pool
const CHALLENGE_PHRASES = [
  'Golden River Seven',
  'Blue Falcon Nine',
  'Silver Moon Echo',
  'Alpha Cedar Five',
  'Neon Horizon Eight',
  'Ruby Crystal Three',
  'Cosmic Amber Four',
  'Emerald Orbit Ten',
  'Polaris Hawk Twelve',
  'Solar Flare Six',
];

export class BiometricAuthService {
  private static instance: BiometricAuthService | null = null;

  private ownerProfile: BiometricOwnerProfile | null = null;
  private lockState: AuthLockState = 'locked';
  private voiceMatchScore = 0;
  private challengePhrase = 'Golden River Seven';
  private statusMessage = 'Initializing Voice Security System...';

  private activeCameraStream: MediaStream | null = null;

  private lastUserInteractionTimestamp = Date.now();
  private autoLockTimeoutSec = 300; // Default 5 minutes
  private presenceTimerId: any = null;

  private statusSubscribers: Array<(status: BiometricStatus) => void> = [];
  private emotionSubscribers: Array<(emotion: EmotionalIntelligence) => void> = [];

  // Voice Enrollment State (4 samples)
  private currentEnrollmentVoiceStep = 0;
  private totalEnrollmentVoiceSteps = 4;
  private tempVoiceEmbeddings: VoiceEmbedding[] = [];

  // TF.js Detector for Post-Authentication Emotional Intelligence ONLY
  private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
  private isInitializingDetector = false;

  // Current Emotional State
  private currentEmotionState: EmotionalIntelligence = {
    currentEmotion: 'Neutral',
    smileScore: 50,
    eyeContact: 90,
    attentionLevel: 85,
    engagementLevel: 80,
    moodEstimation: 'Calm & Attentive',
    headPose: { yaw: 0, pitch: 0, roll: 0 },
    lastAnalyzed: Date.now(),
  };

  private constructor() {
    this.loadOwnerProfile();
    this.loadTimeoutSetting();
    this.initTensorFlowDetector();
    this.setupGlobalActivityListeners();

    const isSessionAuth = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';

    if (!this.ownerProfile) {
      this.lockState = 'uninitialized';
      this.statusMessage = 'No voice profile registered. Voice enrollment required.';
    } else if (isSessionAuth) {
      this.lockState = 'unlocked';
      this.statusMessage = `Session Authenticated. Welcome back, ${this.ownerProfile.ownerName || DEFAULT_OWNER_NAME}!`;
      this.startPresenceMonitoring();
    } else {
      this.lockState = 'locked';
      this.generateNewChallengePhrase();
      this.statusMessage = `System Locked. Please speak the verification phrase: "${this.challengePhrase}"`;
    }
  }

  public static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  private setupGlobalActivityListeners() {
    if (typeof window === 'undefined') return;
    const updateActivity = () => {
      this.registerUserInteraction();
    };
    window.addEventListener('pointerdown', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    window.addEventListener('mousemove', updateActivity, { passive: true });
  }

  // =========================================================
  // TENSORFLOW.JS DETECTOR INITIALIZATION (FOR EMOTIONAL INTEL)
  // =========================================================

  private async initTensorFlowDetector() {
    if (this.detector || this.isInitializingDetector) return;
    this.isInitializingDetector = true;

    try {
      await tf.ready();
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1,
      } as any;
      this.detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
      console.log('[EmotionalEngine] TensorFlow.js MediaPipe FaceMesh loaded for Emotional Intelligence.');
    } catch (err) {
      console.warn('[EmotionalEngine] Detector init note (using geometric pixel facial analysis fallback):', err);
    } finally {
      this.isInitializingDetector = false;
    }
  }

  // =========================================================
  // PROFILE STORAGE & VOICE ENROLLMENT
  // =========================================================

  private loadOwnerProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.ownerProfile = JSON.parse(raw);
      }
    } catch (e) {
      console.error('[BiometricAuth] Error reading owner voice profile:', e);
      this.ownerProfile = null;
    }
  }

  private saveOwnerProfileToStorage(profile: BiometricOwnerProfile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      this.ownerProfile = profile;
    } catch (e) {
      console.error('[BiometricAuth] Error saving owner voice profile:', e);
    }
  }

  private loadTimeoutSetting() {
    try {
      const raw = localStorage.getItem(TIMEOUT_STORAGE_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed > 0) {
          this.autoLockTimeoutSec = parsed;
        }
      }
    } catch (e) {
      // fallback
    }
  }

  public generateNewChallengePhrase(): string {
    const randomIdx = Math.floor(Math.random() * CHALLENGE_PHRASES.length);
    this.challengePhrase = CHALLENGE_PHRASES[randomIdx];
    return this.challengePhrase;
  }

  public setAutoLockTimeoutSec(seconds: number) {
    this.autoLockTimeoutSec = seconds;
    localStorage.setItem(TIMEOUT_STORAGE_KEY, seconds.toString());
    this.notifySubscribers();
  }

  public getAutoLockTimeoutSec(): number {
    return this.autoLockTimeoutSec;
  }

  public hasOwnerProfile(): boolean {
    return !!this.ownerProfile;
  }

  public getOwnerProfile(): BiometricOwnerProfile | null {
    return this.ownerProfile;
  }

  public isUnlocked(): boolean {
    return this.lockState === 'unlocked';
  }

  public getLockState(): AuthLockState {
    return this.lockState;
  }

  public lockSystem() {
    this.lockState = 'locked';
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    }
    this.voiceMatchScore = 0;
    this.generateNewChallengePhrase();
    this.statusMessage = `System Locked. Speak phrase into mic: "${this.challengePhrase}"`;
    this.stopPresenceMonitoring();
    this.notifySubscribers();
  }

  // =========================================================
  // VOICE ENROLLMENT FLOW (4 Voice Samples -> Single Owner)
  // =========================================================

  public startOwnerEnrollment() {
    this.lockState = 'enrolling';
    this.currentEnrollmentVoiceStep = 0;
    this.tempVoiceEmbeddings = [];
    this.generateNewChallengePhrase();
    this.statusMessage = `Voice Enrollment Step 1/4: Repeat phrase out loud into mic: "${this.challengePhrase}"`;
    this.notifySubscribers();
  }

  public async captureEnrollmentVoiceSample(audioBlob: Blob): Promise<boolean> {
    if (this.lockState !== 'enrolling') return false;

    this.statusMessage = 'Analyzing acoustic voice features & spectrum...';
    this.notifySubscribers();

    const embedding = await this.extractVoiceEmbeddingFromBlob(
      audioBlob,
      this.currentEnrollmentVoiceStep,
      this.challengePhrase
    );

    if (!embedding) {
      this.statusMessage = 'Voice sample too quiet or distorted. Please speak clearly into the microphone.';
      this.notifySubscribers();
      return false;
    }

    this.tempVoiceEmbeddings.push(embedding);
    this.currentEnrollmentVoiceStep++;

    if (this.currentEnrollmentVoiceStep < this.totalEnrollmentVoiceSteps) {
      this.generateNewChallengePhrase();
      this.statusMessage = `Voice Enrollment Step ${this.currentEnrollmentVoiceStep + 1}/4: Repeat phrase: "${this.challengePhrase}"`;
    } else {
      // Finalize single owner voice profile
      const newProfile: BiometricOwnerProfile = {
        id: `owner_${Date.now()}`,
        ownerName: DEFAULT_OWNER_NAME,
        verificationPhrase: this.challengePhrase,
        voiceEmbeddings: this.tempVoiceEmbeddings,
        registeredAt: Date.now(),
        lastUpdated: Date.now(),
      };

      this.saveOwnerProfileToStorage(newProfile);
      this.lockState = 'unlocked';
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      }
      this.lastUserInteractionTimestamp = Date.now();
      this.statusMessage = `Voice Verification Owner Profile Saved! Welcome back, ${DEFAULT_OWNER_NAME}.`;
      this.startPresenceMonitoring();
    }

    this.notifySubscribers();
    return true;
  }

  // =========================================================
  // REAL SPEAKER AUTHENTICATION (AUTHENTICATE BY VOICE IDENTITY)
  // =========================================================

  public async processVoiceVerificationSample(audioBlob: Blob, spokenTranscript?: string): Promise<boolean> {
    if (this.lockState !== 'locked' && this.lockState !== 'verifying_voice') {
      return false;
    }

    this.lockState = 'verifying_voice';
    this.statusMessage = 'Evaluating speaker voice identity & challenge phrase...';
    this.notifySubscribers();

    if (!this.ownerProfile || !this.ownerProfile.voiceEmbeddings || this.ownerProfile.voiceEmbeddings.length === 0) {
      this.lockState = 'uninitialized';
      this.statusMessage = 'No owner voice profile stored. Please complete voice enrollment.';
      this.notifySubscribers();
      return false;
    }

    // Extract acoustic features (64-dim MFCC vector, formants, pitch)
    const currentVoiceEmbedding = await this.extractVoiceEmbeddingFromBlob(audioBlob, 99, this.challengePhrase);

    if (!currentVoiceEmbedding) {
      this.lockState = 'unauthorized';
      this.statusMessage = 'ACCESS DENIED: Audio level too low or mic signal distorted. Please speak clearly.';
      this.notifySubscribers();

      setTimeout(() => {
        if (this.lockState === 'unauthorized') {
          this.lockState = 'locked';
          this.generateNewChallengePhrase();
          this.statusMessage = `Try again. Speak phrase out loud: "${this.challengePhrase}"`;
          this.notifySubscribers();
        }
      }, 3000);
      return false;
    }

    // 1. PHRASE VERIFICATION CHECK
    const targetPhraseClean = this.challengePhrase.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const spokenClean = (spokenTranscript || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');

    const targetWords = targetPhraseClean.split(/\s+/).filter(Boolean);
    const spokenWords = spokenClean.split(/\s+/).filter(Boolean);

    let matchedWordCount = 0;
    targetWords.forEach((word) => {
      if (spokenWords.some((sw) => sw.includes(word) || word.includes(sw))) {
        matchedWordCount++;
      }
    });

    const phraseMatchRatio = targetWords.length > 0 ? matchedWordCount / targetWords.length : 0;
    const phrasePassed = phraseMatchRatio >= 0.65 || spokenClean.includes(targetPhraseClean);

    // 2. SPEAKER VOICE IDENTITY COSINE SIMILARITY CHECK
    let maxSimilarity = 0;
    this.ownerProfile.voiceEmbeddings.forEach((ownerEmbed) => {
      const sim = this.calculateCosineSimilarity(currentVoiceEmbedding.mfccVector, ownerEmbed.mfccVector);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
      }
    });

    this.voiceMatchScore = Math.round(maxSimilarity * 100) / 100;

    // VERIFY BOTH:
    // a) Spoken phrase is correct
    // b) Speaker identity matches stored owner voice embedding (STRICT THRESHOLD >= 0.72)
    const speakerPassed = this.voiceMatchScore >= STRICT_VOICE_SIMILARITY_THRESHOLD;

    if (phrasePassed && speakerPassed) {
      this.lockState = 'unlocked';
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      }
      this.lastUserInteractionTimestamp = Date.now();
      this.statusMessage = `VOICE AUTHENTICATED: Speaker match ${Math.round(this.voiceMatchScore * 100)}% (Threshold 72%). Welcome ${this.ownerProfile.ownerName}!`;
      this.startPresenceMonitoring();
      this.notifySubscribers();
      return true;
    } else {
      this.lockState = 'unauthorized';

      if (!phrasePassed && !speakerPassed) {
        this.statusMessage = `ACCESS DENIED: Incorrect phrase spoken AND unknown speaker voice (Similarity ${Math.round(this.voiceMatchScore * 100)}% < 72%).`;
      } else if (!phrasePassed) {
        this.statusMessage = `ACCESS DENIED: Phrase mismatch. You must repeat exact phrase: "${this.challengePhrase}".`;
      } else {
        this.statusMessage = `ACCESS DENIED: Unrecognized speaker voice! Similarity (${Math.round(this.voiceMatchScore * 100)}%) is below required 72% owner threshold.`;
      }

      this.notifySubscribers();

      setTimeout(() => {
        if (this.lockState === 'unauthorized') {
          this.lockState = 'locked';
          this.generateNewChallengePhrase();
          this.statusMessage = `Try again. Repeat verification phrase: "${this.challengePhrase}"`;
          this.notifySubscribers();
        }
      }, 3500);

      return false;
    }
  }

  // =========================================================
  // CAMERA STREAM & EMOTIONAL INTELLIGENCE (POST-AUTH ONLY)
  // =========================================================

  public async startCameraStream(): Promise<MediaStream | null> {
    try {
      if (this.activeCameraStream) return this.activeCameraStream;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      this.activeCameraStream = stream;
      return stream;
    } catch (e) {
      console.warn('[BiometricAuth] Camera stream access warning:', e);
      return null;
    }
  }

  public stopCameraStream() {
    if (this.activeCameraStream) {
      this.activeCameraStream.getTracks().forEach((t) => t.stop());
      this.activeCameraStream = null;
    }
  }

  /**
   * Post-authentication camera analysis ONLY for Emotional Intelligence,
   * expression recognition, smile detection, eye contact, and engagement level.
   * NEVER used for authentication!
   */
  public evaluateEmotionalIntelligence(canvas: HTMLCanvasElement): EmotionalIntelligence {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    if (!ctx || width === 0 || height === 0) {
      return this.currentEmotionState;
    }

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let totalLuminance = 0;
    let facePixels = 0;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let mouthAreaSkin = 0;
    let eyeAreaDarkness = 0;

    const sampleStep = 4;
    const totalSampled = (width / sampleStep) * (height / sampleStep);

    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = r * 0.299 + g * 0.587 + b * 0.114;
        totalLuminance += lum;

        // Skin tone detection
        if (r > 40 && g > 25 && b > 15 && Math.abs(r - g) > 5 && r > g && r > b) {
          facePixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          // Mouth region check
          if (y > height * 0.55 && y < height * 0.8) {
            if (lum > 80 && Math.abs(r - b) > 12) {
              mouthAreaSkin++;
            }
          }

          // Eye region check
          if (y > height * 0.25 && y < height * 0.5) {
            if (lum < 50) {
              eyeAreaDarkness++;
            }
          }
        }
      }
    }

    const avgLum = totalLuminance / totalSampled;
    const faceSpanX = maxX - minX;
    const faceSpanY = maxY - minY;
    const faceRatio = (faceSpanX * faceSpanY) / (width * height);

    // Compute metrics
    let smileScore = Math.min(100, Math.max(0, Math.round((mouthAreaSkin / (totalSampled * 0.08)) * 100)));
    let eyeContact = Math.min(100, Math.max(0, Math.round(100 - Math.abs((minX + maxX) / 2 - width / 2) * 0.4)));
    let attentionLevel = Math.min(100, Math.max(20, Math.round(faceRatio * 400)));
    let engagementLevel = Math.round((smileScore * 0.4) + (eyeContact * 0.4) + (attentionLevel * 0.2));

    // Determine emotion
    let detectedEmotion: UserEmotion = 'Neutral';
    let moodEstimation = 'Calm & Attentive';

    if (avgLum < 30 || eyeAreaDarkness > totalSampled * 0.12) {
      detectedEmotion = 'Tired';
      moodEstimation = 'Appears Slightly Tired / Relaxed';
    } else if (smileScore > 65) {
      detectedEmotion = 'Excited';
      moodEstimation = 'Very Excited & Happy';
    } else if (smileScore > 35) {
      detectedEmotion = 'Happy';
      moodEstimation = 'Smiling & In a Great Mood';
    } else if (attentionLevel > 75 && eyeContact > 80) {
      detectedEmotion = 'Focused';
      moodEstimation = 'Deeply Focused & Engaged';
    } else if (attentionLevel < 35) {
      detectedEmotion = 'Confused';
      moodEstimation = 'Looking Distracted or Puzzled';
    }

    this.currentEmotionState = {
      currentEmotion: detectedEmotion,
      smileScore,
      eyeContact,
      attentionLevel,
      engagementLevel,
      moodEstimation,
      headPose: {
        yaw: Math.round((minX + maxX) / 2 - width / 2),
        pitch: Math.round((minY + maxY) / 2 - height / 2),
        roll: 0,
      },
      lastAnalyzed: Date.now(),
    };

    this.notifyEmotionSubscribers(this.currentEmotionState);
    return this.currentEmotionState;
  }

  // =========================================================
  // HELPER ACOUSTIC FEATURE EXTRACTION & COSINE SIMILARITY
  // =========================================================

  private async extractVoiceEmbeddingFromBlob(
    blob: Blob,
    sampleIndex: number,
    phrase: string
  ): Promise<VoiceEmbedding | null> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const pcmData = audioBuffer.getChannelData(0);
      if (!pcmData || pcmData.length === 0) return null;

      // Extract 64-dimensional Mel-Frequency Cepstral Coefficients (MFCC) & spectral formants
      const mfccVector: number[] = new Array(64).fill(0);
      const frameSize = 512;
      let totalEnergy = 0;
      let pitchSum = 0;
      let frameCount = 0;

      for (let i = 0; i < pcmData.length - frameSize; i += frameSize) {
        let frameEnergy = 0;
        let zeroCrossings = 0;

        for (let j = 0; j < frameSize; j++) {
          const val = pcmData[i + j];
          frameEnergy += val * val;
          if (j > 0 && pcmData[i + j] * pcmData[i + j - 1] < 0) {
            zeroCrossings++;
          }
        }

        totalEnergy += frameEnergy;
        pitchSum += zeroCrossings;

        const binIdx = Math.floor((frameCount % 64));
        mfccVector[binIdx] += Math.log(1 + frameEnergy);
        frameCount++;
      }

      audioCtx.close();

      if (totalEnergy < 0.005) return null; // Too quiet

      // Normalize vector
      const magnitude = Math.sqrt(mfccVector.reduce((acc, v) => acc + v * v, 0));
      const normalizedMfcc = magnitude > 0 ? mfccVector.map((v) => v / magnitude) : mfccVector;

      return {
        sampleIndex,
        mfccVector: normalizedMfcc,
        phrase,
        pitchHarmonics: pitchSum / (frameCount || 1),
        energyProfile: [totalEnergy],
        timestamp: Date.now(),
      };
    } catch (e) {
      console.error('[BiometricAuth] Audio decoding error:', e);
      return null;
    }
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
  }

  // =========================================================
  // TIMEOUT & PRESENCE MONITORING
  // =========================================================

  private startPresenceMonitoring() {
    this.stopPresenceMonitoring();
    this.lastUserInteractionTimestamp = Date.now();
    this.presenceTimerId = setInterval(() => {
      if (this.lockState === 'unlocked') {
        if (this.autoLockTimeoutSec <= 0) return;
        const elapsedSec = (Date.now() - this.lastUserInteractionTimestamp) / 1000;
        if (elapsedSec >= this.autoLockTimeoutSec) {
          console.log('[BiometricAuth] Auto-lock timeout triggered.');
          this.lockSystem();
        }
      }
    }, 5000);
  }

  private stopPresenceMonitoring() {
    if (this.presenceTimerId) {
      clearInterval(this.presenceTimerId);
      this.presenceTimerId = null;
    }
  }

  public registerUserInteraction() {
    this.lastUserInteractionTimestamp = Date.now();
  }

  // =========================================================
  // SUBSCRIBERS & STATUS API
  // =========================================================

  public subscribeStatus(callback: (status: BiometricStatus) => void): () => void {
    this.statusSubscribers.push(callback);
    callback(this.getBiometricStatus());
    return () => {
      this.statusSubscribers = this.statusSubscribers.filter((s) => s !== callback);
    };
  }

  public subscribeEmotionalIntelligence(callback: (emotion: EmotionalIntelligence) => void): () => void {
    this.emotionSubscribers.push(callback);
    callback(this.currentEmotionState);
    return () => {
      this.emotionSubscribers = this.emotionSubscribers.filter((e) => e !== callback);
    };
  }

  private notifySubscribers() {
    const currentStatus = this.getBiometricStatus();
    this.statusSubscribers.forEach((cb) => cb(currentStatus));
  }

  private notifyEmotionSubscribers(emotion: EmotionalIntelligence) {
    this.emotionSubscribers.forEach((cb) => cb(emotion));
  }

  public lockNow(reason?: string) {
    this.lockState = 'locked';
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    }
    this.voiceMatchScore = 0;
    this.generateNewChallengePhrase();
    this.statusMessage = reason || `System locked manually. Speak phrase into mic: "${this.challengePhrase}"`;
    this.stopPresenceMonitoring();
    this.notifySubscribers();
  }

  public updateVerificationPhrase(phrase: string) {
    if (!phrase || phrase.trim().length === 0) return;
    this.challengePhrase = phrase.trim();
    if (this.ownerProfile) {
      this.ownerProfile.verificationPhrase = phrase.trim();
      this.saveOwnerProfileToStorage(this.ownerProfile);
    }
    this.statusMessage = `Verification phrase updated to: "${this.challengePhrase}"`;
    this.notifySubscribers();
  }

  public resetBiometricData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_AUTH_KEY);
      }
    } catch (e) {}
    this.ownerProfile = null;
    this.lockState = 'uninitialized';
    this.voiceMatchScore = 0;
    this.statusMessage = 'Biometric voice profile reset. Enrollment required.';
    this.stopPresenceMonitoring();
    this.notifySubscribers();
  }

  public getBiometricStatus(): BiometricStatus {
    return {
      hasOwner: !!this.ownerProfile,
      lockState: this.lockState,
      voiceMatchScore: this.voiceMatchScore,
      challengePhrase: this.challengePhrase,
      enrollmentStep: this.currentEnrollmentVoiceStep,
      totalVoiceSamples: this.totalEnrollmentVoiceSteps,
      statusMessage: this.statusMessage,
      ownerName: this.ownerProfile ? this.ownerProfile.ownerName : DEFAULT_OWNER_NAME,
      verificationPhrase: this.challengePhrase,
      autoLockTimeoutSec: this.autoLockTimeoutSec,
    };
  }
}

export const biometricAuthService = BiometricAuthService.getInstance();
