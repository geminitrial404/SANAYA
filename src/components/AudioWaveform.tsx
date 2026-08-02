import React, { useEffect, useRef } from 'react';
import { SessionStatus } from '../types';

interface AudioWaveformProps {
  status: SessionStatus;
  userVolume: number;
  sanayaVolume: number;
}

const AudioWaveformComponent: React.FC<AudioWaveformProps> = ({
  status,
  userVolume,
  sanayaVolume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({ status, userVolume, sanayaVolume });
  useEffect(() => {
    stateRef.current = { status, userVolume, sanayaVolume };
  }, [status, userVolume, sanayaVolume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 320);
    let height = (canvas.height = 70);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 70;
    };

    window.addEventListener('resize', handleResize);

    let phase = 0;

    const render = () => {
      const { status: curStatus, userVolume: curUserVol, sanayaVolume: curSanayaVol } = stateRef.current;
      const activeVolume = curStatus === 'speaking' ? curSanayaVol : curUserVol;
      const isActive = curStatus === 'listening' || curStatus === 'speaking' || curStatus === 'thinking';

      ctx.clearRect(0, 0, width, height);

      phase += 0.08 + activeVolume * 0.15;

      const numBars = Math.floor(width / 6);
      const barWidth = 3;
      const barGap = 3;

      // Primary gradient
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      if (curStatus === 'speaking') {
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, '#6366f1');
      } else if (curStatus === 'listening') {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.5, '#818cf8');
        grad.addColorStop(1, '#c084fc');
      } else if (curStatus === 'thinking') {
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#818cf8');
      } else {
        grad.addColorStop(0, '#475569');
        grad.addColorStop(1, '#334155');
      }

      ctx.fillStyle = grad;

      const centerY = height / 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + barGap);

        // Sine base height
        const normalizedIndex = i / numBars;
        const sineMultiplier = Math.sin(normalizedIndex * Math.PI); // Peak in center

        let barHeight = 4;
        if (isActive) {
          const waveVal = Math.sin(phase + i * 0.25) * Math.cos(phase * 0.5 + i * 0.1);
          const dynamicHeight = Math.abs(waveVal) * (activeVolume * 45 + 12);
          barHeight = Math.max(4, dynamicHeight * sineMultiplier);
        }

        const y = centerY - barHeight / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      <canvas
        ref={canvasRef}
        className="w-full h-[70px] rounded-xl bg-slate-900/40 border border-white/10 backdrop-blur-md shadow-inner transform-gpu"
        style={{ transform: 'translate3d(0,0,0)' }}
      />
    </div>
  );
};

export const AudioWaveform = React.memo(AudioWaveformComponent);

