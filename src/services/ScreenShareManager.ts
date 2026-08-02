export type CaptureSource = 'Entire Screen' | 'Application Window' | 'Browser Tab' | 'Screen Share';
export type VisionStatus = 'idle' | 'capturing' | 'analyzing' | 'paused' | 'error';

export interface ScreenShareState {
  isSharing: boolean;
  isPaused: boolean;
  captureSource: CaptureSource;
  processedFramesCount: number;
  visionStatus: VisionStatus;
  error: string | null;
}

export type ScreenShareStateCallback = (state: ScreenShareState) => void;
export type FrameCallback = (base64Jpeg: string) => void;

export class ScreenShareManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private captureInterval: any = null;
  private frameCallback: FrameCallback | null = null;
  private stateCallback: ScreenShareStateCallback | null = null;

  private isSharing = false;
  private isPaused = false;
  private captureSource: CaptureSource = 'Screen Share';
  private processedFramesCount = 0;
  private visionStatus: VisionStatus = 'idle';
  private error: string | null = null;

  // Optimized capture interval (e.g. 1 frame every 1.5 seconds = 1500ms)
  private captureIntervalMs = 1500;

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public setStateCallback(cb: ScreenShareStateCallback) {
    this.stateCallback = cb;
    this.emitState();
  }

  public getState(): ScreenShareState {
    return {
      isSharing: this.isSharing,
      isPaused: this.isPaused,
      captureSource: this.captureSource,
      processedFramesCount: this.processedFramesCount,
      visionStatus: this.visionStatus,
      error: this.error,
    };
  }

  private emitState() {
    if (this.stateCallback) {
      this.stateCallback(this.getState());
    }
  }

  public async startSharing(onFrame: FrameCallback): Promise<boolean> {
    this.frameCallback = onFrame;
    this.error = null;

    console.log('[ScreenShare] Permission requested for display media capture...');

    if (typeof window !== 'undefined') {
      const isSecure =
        window.isSecureContext ||
        location.protocol === 'https:' ||
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1';
      if (!isSecure) {
        console.warn('[ScreenShare] Application is running in an insecure context. DisplayMedia may be restricted.');
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      const msg = 'Screen sharing is not supported by your browser environment.';
      console.error('[ScreenShare]', msg);
      this.error = msg;
      this.visionStatus = 'error';
      this.emitState();
      return false;
    }

    try {
      // 1. Trigger native browser display media picker directly on user click
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { max: 15 },
        } as any,
        audio: false,
      });

      console.log('[ScreenShare] Permission granted. Stream ID:', displayStream.id);
      this.setupStream(displayStream);
      return true;
    } catch (err: any) {
      console.warn('[ScreenShare] Permission denied or error encountered:', err.name, err.message);

      let userFriendlyMsg = '';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyMsg = 'Screen share permission was cancelled or denied.';
      } else if (err.name === 'AbortError') {
        userFriendlyMsg = 'Screen sharing request was aborted.';
      } else if (err.name === 'NotFoundError') {
        userFriendlyMsg = 'No screen or window display source was found.';
      } else if (err.name === 'InvalidStateError') {
        userFriendlyMsg = 'Screen capture failed due to invalid media state.';
      } else if (err.name === 'NotReadableError') {
        userFriendlyMsg = 'Could not access display. Please check OS screen recording permissions.';
      } else if (err.name === 'SecurityError') {
        userFriendlyMsg = 'Screen sharing was blocked by security policy or iframe constraints.';
      } else {
        userFriendlyMsg = err.message || 'Failed to start screen capture.';
      }

      this.isSharing = false;
      this.isPaused = false;
      this.visionStatus = 'idle';
      this.processedFramesCount = 0;
      this.error = userFriendlyMsg;
      this.emitState();

      return false;
    }
  }

  public async switchScreen(): Promise<boolean> {
    if (!this.frameCallback) return false;
    console.log('[ScreenShare] Requesting switch of screen capture source...');
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { max: 15 },
        } as any,
        audio: false,
      });

      console.log('[ScreenShare] Switch permission granted. New Stream ID:', newStream.id);

      // Stop old tracks cleanly
      if (this.stream) {
        this.stream.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });
      }

      this.setupStream(newStream);
      return true;
    } catch (err: any) {
      console.warn('[ScreenShare] Switch screen cancelled or failed:', err.name, err.message);
      return false;
    }
  }

  public pauseSharing(): void {
    if (!this.isSharing || this.isPaused) return;
    console.log('[ScreenShare] Pausing screen frame capture.');
    this.isPaused = true;
    this.visionStatus = 'paused';
    this.stopCaptureInterval();
    this.emitState();
  }

  public resumeSharing(): void {
    if (!this.isSharing || !this.isPaused) return;
    console.log('[ScreenShare] Resuming screen frame capture.');
    this.isPaused = false;
    this.visionStatus = 'capturing';
    this.startCaptureInterval();
    this.emitState();
  }

  public stopSharing(): void {
    console.log('[ScreenShare] Stopping stream and cleaning up tracks...');
    this.stopCaptureInterval();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
        console.log('[ScreenShare] Track stopped:', track.kind, track.label);
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.isSharing = false;
    this.isPaused = false;
    this.visionStatus = 'idle';
    this.processedFramesCount = 0;
    this.error = null;
    this.emitState();
    console.log('[ScreenShare] Stream ended and vision state reset.');
  }

  private setupStream(newStream: MediaStream) {
    this.stream = newStream;
    this.isSharing = true;
    this.isPaused = false;
    this.visionStatus = 'capturing';
    this.error = null;

    // Detect capture source surface if possible
    const videoTrack = newStream.getVideoTracks()[0];
    if (videoTrack) {
      console.log('[ScreenShare] Stream started with video track:', videoTrack.label, 'Track ID:', videoTrack.id);

      const settings = videoTrack.getSettings() as any;
      const surface = settings.displaySurface;
      if (surface === 'monitor') {
        this.captureSource = 'Entire Screen';
      } else if (surface === 'window') {
        this.captureSource = 'Application Window';
      } else if (surface === 'browser') {
        this.captureSource = 'Browser Tab';
      } else {
        this.captureSource = 'Screen Share';
      }

      // Automatically handle track end event (e.g. user clicks browser "Stop sharing" bar)
      videoTrack.onended = () => {
        console.log('[ScreenShare] User stopped screen share via browser floating bar or system control.');
        this.stopSharing();
      };
    }

    // Prepare hidden video element for canvas rendering
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
    }
    this.videoElement.srcObject = newStream;
    this.videoElement.play().catch((err) => {
      console.warn('[ScreenShare] Video element play error:', err);
    });

    // Prepare canvas
    if (!this.canvasElement) {
      this.canvasElement = document.createElement('canvas');
    }

    // Start frame capture loop
    this.startCaptureInterval();
    this.emitState();
  }

  private startCaptureInterval() {
    this.stopCaptureInterval();
    this.captureInterval = setInterval(() => {
      this.captureFrame();
    }, this.captureIntervalMs);
  }

  private stopCaptureInterval() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  private handleVisibilityChange = () => {
    if (!this.isSharing || this.isPaused) return;

    if (document.hidden) {
      // Pause interval when tab/window is hidden
      this.stopCaptureInterval();
      this.visionStatus = 'paused';
      this.emitState();
    } else {
      // Resume when visible again
      this.visionStatus = 'capturing';
      this.startCaptureInterval();
      this.emitState();
    }
  };

  private captureFrame() {
    if (!this.isSharing || this.isPaused || document.hidden || !this.videoElement || !this.canvasElement) {
      return;
    }

    const video = this.videoElement;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const maxDim = 1280;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    this.canvasElement.width = width;
    this.canvasElement.height = height;

    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Compress to JPEG base64 (quality 0.65 for high readability & optimized bandwidth)
    const dataUrl = this.canvasElement.toDataURL('image/jpeg', 0.65);
    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    this.processedFramesCount++;
    this.visionStatus = 'analyzing';
    this.emitState();

    console.log(`[ScreenShare] Frame captured (#${this.processedFramesCount}), resolution: ${width}x${height}, size: ${Math.round(base64Data.length * 0.75 / 1024)} KB`);

    if (this.frameCallback) {
      this.frameCallback(base64Data);
    }

    setTimeout(() => {
      if (this.isSharing && !this.isPaused && this.visionStatus === 'analyzing') {
        this.visionStatus = 'capturing';
        this.emitState();
      }
    }, 600);
  }

  public getMediaStream(): MediaStream | null {
    return this.stream;
  }
}

export const screenShareManager = new ScreenShareManager();
