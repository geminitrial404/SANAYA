/**
 * Captures microphone audio, downsamples/converts to 16kHz 16-bit PCM (little-endian),
 * and emits base64 encoded audio buffers along with real-time volume meters.
 */
export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private onAudioDataCallback: ((base64Pcm: string) => void) | null = null;
  private onVolumeCallback: ((level: number) => void) | null = null;
  private isStreaming = false;
  private sensitivity = 1.0;

  public setSensitivity(sensitivity: number) {
    this.sensitivity = sensitivity;
  }

  public async start(
    onAudioData: (base64Pcm: string) => void,
    onVolume?: (level: number) => void
  ): Promise<void> {
    if (this.isStreaming) return;

    this.onAudioDataCallback = onAudioData;
    this.onVolumeCallback = onVolume || null;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      // Target sample rate for Gemini Live Input is 16000Hz
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

      // 2048 sample buffer size (~128ms chunks at 16kHz)
      this.scriptNode = this.audioCtx.createScriptProcessor(2048, 1, 1);

      this.scriptNode.onaudioprocess = (e) => {
        if (!this.isStreaming) return;

        const inputBuffer = e.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);

        // Compute RMS volume level for UI visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const normVolume = Math.min(1.0, rms * 5 * this.sensitivity);

        if (this.onVolumeCallback) {
          this.onVolumeCallback(normVolume);
        }

        // Convert Float32Array to 16-bit PCM ArrayBuffer
        const pcm16Data = this.floatTo16BitPCM(inputData, this.sensitivity);
        const base64Pcm = this.arrayBufferToBase64(pcm16Data);

        if (this.onAudioDataCallback) {
          this.onAudioDataCallback(base64Pcm);
        }
      };

      this.sourceNode.connect(this.scriptNode);
      this.scriptNode.connect(this.audioCtx.destination);
      this.isStreaming = true;
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        console.warn('[AudioStreamer] Microphone permission was denied or cancelled.');
      } else {
        console.warn('[AudioStreamer] Error starting microphone stream:', err?.message || err);
      }
      this.stop();
      throw err;
    }
  }

  public stop(): void {
    this.isStreaming = false;

    if (this.scriptNode) {
      this.scriptNode.onaudioprocess = null;
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    if (this.onVolumeCallback) {
      this.onVolumeCallback(0);
    }
  }

  private floatTo16BitPCM(input: Float32Array, gain: number): ArrayBuffer {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i] * gain));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
