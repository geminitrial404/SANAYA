import React, { useRef, useEffect, useState } from 'react';
import { SessionStatus } from '../types';

export type AvatarState = 'WAITING' | 'THINKING' | 'SPEAKING';

interface SanayaVideoAvatarProps {
  status: SessionStatus;
  userVolume?: number;
  sanayaVolume?: number;
}

export const SanayaVideoAvatarComponent: React.FC<SanayaVideoAvatarProps> = ({
  status,
}) => {
  let activeState: AvatarState = 'WAITING';
  if (status === 'thinking') {
    activeState = 'THINKING';
  } else if (status === 'speaking') {
    activeState = 'SPEAKING';
  } else {
    activeState = 'WAITING';
  }

  // Hidden Video Elements for preloading & continuous playback
  const waitingRef = useRef<HTMLVideoElement>(null);
  const thinkingRef = useRef<HTMLVideoElement>(null);
  const speakingRef = useRef<HTMLVideoElement>(null);

  // Chroma Key Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isLoadedRef = useRef<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing video pipeline...');

  // Preload and continuously play all 3 videos silently in parallel on startup
  useEffect(() => {
    const videos = [
      { name: 'WAITING', ref: waitingRef, src: '/sanaya_waiting.mp4', fallback: '/GIRL%20WAITING.mp4' },
      { name: 'THINKING', ref: thinkingRef, src: '/sanaya_thinking.mp4', fallback: '/GIRL%20THINKING.mp4' },
      { name: 'SPEAKING', ref: speakingRef, src: '/sanaya_speaking.mp4', fallback: '/GIRL%20TALKING.mp4' },
    ];

    videos.forEach(({ name, ref }) => {
      const video = ref.current;
      if (video) {
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        video.preload = 'auto';

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`[Avatar Debug] Video [${name}] playing successfully. currentTime=${video.currentTime}`);
            })
            .catch((err) => {
              console.warn(`[Avatar Debug] Video [${name}] play pending user interaction:`, err);
            });
        }
      }
    });
  }, []);

  // Guarantee active state video is playing on state shift
  useEffect(() => {
    const videoMap = {
      WAITING: waitingRef.current,
      THINKING: thinkingRef.current,
      SPEAKING: speakingRef.current,
    };

    const currentVideo = videoMap[activeState];
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play().catch((e) => console.warn('[Avatar Debug] Active video play error:', e));
      }
      console.log(`[Avatar Debug] Shifted active state to ${activeState}. Video readyState=${currentVideo.readyState}, currentTime=${currentVideo.currentTime}`);
    }
  }, [activeState]);

  // Real-time Canvas Chroma Key Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.warn('[Avatar Debug] 2D Context not available');
      return;
    }

    let animId: number;

    const renderFrame = () => {
      const videoMap = {
        WAITING: waitingRef.current,
        THINKING: thinkingRef.current,
        SPEAKING: speakingRef.current,
      };

      const activeVideo = videoMap[activeState] || waitingRef.current;

      if (activeVideo && activeVideo.readyState >= 2 && activeVideo.videoWidth > 0) {
        if (!isLoadedRef.current) {
          isLoadedRef.current = true;
          setIsLoaded(true);
          setDebugInfo(`Active state: ${activeState} (${activeVideo.videoWidth}x${activeVideo.videoHeight})`);
        }

        if (canvas.width !== activeVideo.videoWidth || canvas.height !== activeVideo.videoHeight) {
          canvas.width = activeVideo.videoWidth;
          canvas.height = activeVideo.videoHeight;
        }

        // 1. Draw raw video frame onto canvas
        ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);

        // 2. Perform high-performance green screen chroma key removal
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;
        const len = data.length;

        // Key green parameters
        // Green backdrop is bright green (high G, low R & B)
        const width = canvas.width;
        const height = canvas.height;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // CbCr chroma calculations for clean green keying
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

            // Distance from target green chroma (Cb ~ 80, Cr ~ 90)
            const dist = Math.sqrt((cb - 80) * (cb - 80) + (cr - 90) * (cr - 90));

            // Green screen removal logic
            if (dist < 48 && g > r * 1.05 && g > b * 1.05) {
              // Smooth edge alpha falloff
              const alpha = Math.min(1, Math.max(0, (dist - 20) / 25));
              data[i + 3] = Math.round(data[i + 3] * alpha);

              // Spill suppression (removes green tint on edges/hair)
              if (alpha > 0) {
                const maxRB = Math.max(r, b);
                if (g > maxRB) {
                  data[i + 1] = maxRB;
                }
              }
            } else {
              // Global green spill check for preserved character pixels
              const maxRB = Math.max(r, b);
              if (g > maxRB + 10) {
                data[i + 1] = Math.round(maxRB + (g - maxRB) * 0.2);
              }
            }

            // Radial & border edge feathering to completely erase video rectangular bounds
            const edgeDistX = Math.min(x, width - x) / (width * 0.08);
            const edgeDistY = Math.min(y, height - y) / (height * 0.08);
            const edgeFactor = Math.min(1, Math.max(0, Math.min(edgeDistX, edgeDistY)));
            if (edgeFactor < 1) {
              data[i + 3] = Math.round(data[i + 3] * edgeFactor);
            }
          }
        }

        ctx.putImageData(frame, 0, 0);
      }

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeState]);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>, name: string) => {
    const target = e.currentTarget;
    console.warn(`[Avatar Debug] Video element notice/fallback trigger for ${name}:`, target.error?.message || target.error);
    
    // Attempt fallback source if first attempt failed
    if (target.src.includes('sanaya_')) {
      if (name === 'WAITING') target.src = '/GIRL%20WAITING.mp4';
      if (name === 'THINKING') target.src = '/GIRL%20THINKING.mp4';
      if (name === 'SPEAKING') target.src = '/GIRL%20TALKING.mp4';
      target.load();
      target.play().catch((err) => console.warn(`Fallback video play error for ${name}:`, err));
    } else {
      setHasError(true);
      setDebugInfo(`Video error on ${name}: ${target.error?.message || 'Failed to load'}`);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none pointer-events-none">
      {/* Background HTML5 Video Elements for continuous background playback */}
      {/* Kept with visibility hidden so video decoder stays fully active */}
      <div className="absolute top-0 left-0 w-1 h-1 overflow-hidden pointer-events-none opacity-0">
        <video
          ref={waitingRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => handleError(e, 'WAITING')}
          onLoadedData={() => console.log('[Avatar Debug] WAITING video loaded data')}
          onTimeUpdate={() => {
            if (waitingRef.current && waitingRef.current.currentTime > 0) {
              setIsLoaded(true);
            }
          }}
          src="/sanaya_waiting.mp4"
        />

        <video
          ref={thinkingRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => handleError(e, 'THINKING')}
          onLoadedData={() => console.log('[Avatar Debug] THINKING video loaded data')}
          onTimeUpdate={() => {
            if (thinkingRef.current && thinkingRef.current.currentTime > 0) {
              setIsLoaded(true);
            }
          }}
          src="/sanaya_thinking.mp4"
        />

        <video
          ref={speakingRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => handleError(e, 'SPEAKING')}
          onLoadedData={() => console.log('[Avatar Debug] SPEAKING video loaded data')}
          onTimeUpdate={() => {
            if (speakingRef.current && speakingRef.current.currentTime > 0) {
              setIsLoaded(true);
            }
          }}
          src="/sanaya_speaking.mp4"
        />
      </div>

      {/* HERO AVATAR CONTAINER */}
      <div
        className="relative w-full max-w-[750px] h-[75vh] max-h-[85%] flex items-center justify-center pointer-events-none"
      >
        {/* Loading Indicator */}
        {!isLoaded && !hasError && (
          <div className="absolute flex flex-col items-center justify-center space-y-2 text-cyan-300 font-mono text-xs z-30">
            <div className="w-9 h-9 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span>Loading Sanaya Avatar...</span>
            <span className="text-[10px] text-cyan-400/60">{debugInfo}</span>
          </div>
        )}

        {/* Error Fallback Notice */}
        {hasError && (
          <div className="absolute flex flex-col items-center justify-center space-y-2 text-red-400 font-mono text-xs z-30 bg-black/60 p-4 rounded-lg border border-red-500/30">
            <span>Avatar video failed to load</span>
            <span className="text-[10px] text-red-300/80">{debugInfo}</span>
          </div>
        )}

        {/* Real-time Chroma-Keyed Canvas Output */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain object-center transition-opacity duration-300 ease-in-out pointer-events-none drop-shadow-[0_0_35px_rgba(0,243,255,0.25)] ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />
      </div>
    </div>
  );
};

export const SanayaVideoAvatar = React.memo(SanayaVideoAvatarComponent);





