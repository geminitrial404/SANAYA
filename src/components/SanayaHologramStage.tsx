import React from 'react';
import { SessionStatus } from '../types';
import { SanayaVideoAvatar } from './SanayaVideoAvatar';

interface SanayaHologramStageProps {
  status: SessionStatus;
  userVolume: number;
  sanayaVolume: number;
}

const SanayaHologramStageComponent: React.FC<SanayaHologramStageProps> = ({
  status,
  userVolume,
  sanayaVolume,
}) => {
  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-hidden select-none pointer-events-none">
      {/* 1. VOLUMETRIC TOP LIGHT CONE BEAM */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] sm:w-[70%] h-[90%] z-0 pointer-events-none animate-float-beam opacity-85"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(0, 232, 255, 0.32) 0%, rgba(139, 92, 255, 0.15) 50%, transparent 80%)',
        }}
      />

      {/* 2. CENTRAL RADIAL BLOOM & GLOW */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-700"
        style={{
          background:
            status === 'speaking'
              ? 'radial-gradient(circle at center, rgba(139, 92, 255, 0.38) 0%, rgba(236, 72, 153, 0.2) 45%, transparent 75%)'
              : status === 'thinking'
              ? 'radial-gradient(circle at center, rgba(234, 179, 8, 0.3) 0%, rgba(139, 92, 255, 0.18) 45%, transparent 75%)'
              : 'radial-gradient(circle at center, rgba(0, 232, 255, 0.25) 0%, rgba(139, 92, 255, 0.14) 50%, transparent 75%)',
        }}
      />

      {/* 3. FUTURISTIC SCANLINES */}
      <div className="absolute inset-0 z-0 scanlines-overlay opacity-20 pointer-events-none" />

      {/* 4. HOLOGRAM PLATFORM (3 ROTATING 3D RINGS & FLOOR REFLECTION) */}
      <div className="absolute bottom-[10%] sm:bottom-[12%] left-1/2 -translate-x-1/2 z-10 pointer-events-none w-[360px] sm:w-[560px] h-[120px] perspective-stage flex items-center justify-center">
        {/* Floor Reflection Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cyan-500/30 via-purple-500/15 to-transparent blur-xl rounded-full" />

        {/* Ring 1 (Outer Dashed Ring - Clockwise) */}
        <div className="absolute w-[360px] sm:w-[520px] h-[90px] sm:h-[120px] rounded-full border-2 border-dashed border-cyan-400/60 animate-spin-slow shadow-[0_0_30px_rgba(0,232,255,0.45)]" />

        {/* Ring 2 (Middle Solid Ring - Counter Clockwise) */}
        <div className="absolute w-[260px] sm:w-[380px] h-[70px] sm:h-[95px] rounded-full border border-purple-500/70 animate-spin-slow-reverse shadow-[0_0_35px_rgba(139,92,255,0.55)]" />

        {/* Ring 3 (Inner Energy Core Ring - Pulse) */}
        <div className="absolute w-[180px] sm:w-[260px] h-[50px] sm:h-[68px] rounded-full bg-gradient-to-r from-cyan-500/35 via-pink-500/35 to-purple-500/35 border border-white/80 animate-pulse shadow-[0_0_45px_rgba(0,232,255,0.85)]" />

        {/* Energy Particles Accent Dots */}
        <div className="absolute w-[120px] sm:w-[170px] h-[30px] sm:h-[42px] rounded-full bg-cyan-400/30 blur-sm animate-ping opacity-70" />
      </div>

      {/* 5. CENTER STAGE: SANAYA AI VIDEO AVATAR (NO BOX, NO BORDER) */}
      <div className="relative z-20 w-full h-full flex items-center justify-center pointer-events-none">
        <SanayaVideoAvatar
          status={status}
          userVolume={userVolume}
          sanayaVolume={sanayaVolume}
        />
      </div>
    </div>
  );
};

export const SanayaHologramStage = React.memo(SanayaHologramStageComponent);
