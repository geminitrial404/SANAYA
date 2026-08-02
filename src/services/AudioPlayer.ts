/**
 * Receives 24kHz PCM16 audio chunks from Gemini Live server, decodes them,
 * and schedules them for smooth gapless Web Audio API playback.
 * Supports instant interruption / barge-in.
 */
export class AudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSourceNodes: Set<AudioBufferSourceNode> = new Set();
  private volumeGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private onVolumeCallback: ((level: number) => void) | null = null;
  private animFrameId: number | null = null;
  private isPlaying = false;
  private volume = 1.0;

  constructor() {
    // Lazy audio context init
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      // Model output sample rate is 24000Hz
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      this.volumeGainNode = this.audioCtx.createGain();
      this.volumeGainNode.gain.value = this.volume;

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;

      this.volumeGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

      this.startVolumeMeter();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public setVolume(volume: number) {
    this.volume = volume;
    if (this.volumeGainNode) {
      this.volumeGainNode.gain.value = volume;
    }
  }

  public setOnVolumeCallback(cb: (level: number) => void) {
    this.onVolumeCallback = cb;
  }

  public async playChunk(base64Audio: string): Promise<void> {
    this.initAudioContext();
    if (!this.audioCtx || !this.volumeGainNode) return;

    try {
      const pcmData = this.base64ToPCM16(base64Audio);
      if (pcmData.length === 0) return;

      const audioBuffer = this.audioCtx.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.volumeGainNode);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSourceNodes.add(source);
      this.isPlaying = true;

      source.onended = () => {
        this.activeSourceNodes.delete(source);
        if (this.activeSourceNodes.size === 0) {
          this.isPlaying = false;
          if (this.onVolumeCallback) this.onVolumeCallback(0);
        }
      };
    } catch (err) {
      console.error('[AudioPlayer] Error playing audio chunk:', err);
    }
  }

  public interrupt(): void {
    // Immediately stop all active playing chunks on barge-in
    for (const source of this.activeSourceNodes) {
      try {
        source.stop(0);
        source.disconnect();
      } catch (e) {
        // Source might have already finished
      }
    }
    this.activeSourceNodes.clear();

    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.isPlaying = false;
    if (this.onVolumeCallback) this.onVolumeCallback(0);
  }

  public stop(): void {
    this.interrupt();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private startVolumeMeter() {
    if (!this.analyserNode) return;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const updateMeter = () => {
      if (this.analyserNode && this.isPlaying) {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normVolume = Math.min(1.0, avg / 128.0);
        if (this.onVolumeCallback) {
          this.onVolumeCallback(normVolume);
        }
      } else if (this.onVolumeCallback && !this.isPlaying) {
        this.onVolumeCallback(0);
      }
      this.animFrameId = requestAnimationFrame(updateMeter);
    };

    updateMeter();
  }

  private base64ToPCM16(base64: string): Int16Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }
}
