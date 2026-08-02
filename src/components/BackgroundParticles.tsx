import React, { useEffect, useRef } from 'react';

interface BackgroundParticlesProps {
  status: string;
  userVolume: number;
  sanayaVolume: number;
}

const BackgroundParticlesComponent: React.FC<BackgroundParticlesProps> = ({
  status,
  userVolume,
  sanayaVolume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep latest state in refs to avoid recreating animation loop on every volume/status change
  const stateRef = useRef({ status, userVolume, sanayaVolume });
  useEffect(() => {
    stateRef.current = { status, userVolume, sanayaVolume };
  }, [status, userVolume, sanayaVolume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const numParticles = Math.min(45, Math.floor((width * height) / 22000));
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      baseAlpha: Math.random() * 0.4 + 0.2,
      color: Math.random() > 0.5 ? '#a855f7' : '#ec4899',
    }));

    let wavePhase = 0;

    const render = () => {
      const { status: curStatus, userVolume: curUserVol, sanayaVolume: curSanayaVol } = stateRef.current;
      const activeEnergy = Math.max(curUserVol, curSanayaVol);
      const isSpeaking = curStatus === 'speaking';
      const isListening = curStatus === 'listening';

      ctx.clearRect(0, 0, width, height);

      // Deep radial background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );

      if (isSpeaking) {
        bgGrad.addColorStop(0, `rgba(168, 85, 247, ${0.15 + activeEnergy * 0.2})`);
        bgGrad.addColorStop(0.5, `rgba(236, 72, 153, ${0.08 + activeEnergy * 0.1})`);
        bgGrad.addColorStop(1, '#05050d');
      } else if (isListening) {
        bgGrad.addColorStop(0, `rgba(59, 130, 246, ${0.12 + activeEnergy * 0.2})`);
        bgGrad.addColorStop(0.5, `rgba(14, 165, 233, ${0.06 + activeEnergy * 0.1})`);
        bgGrad.addColorStop(1, '#05050d');
      } else if (curStatus === 'thinking') {
        bgGrad.addColorStop(0, 'rgba(234, 179, 8, 0.15)');
        bgGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
        bgGrad.addColorStop(1, '#05050d');
      } else {
        bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
        bgGrad.addColorStop(1, '#05050d');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient sine wave grid
      wavePhase += 0.015 + activeEnergy * 0.03;
      ctx.beginPath();
      ctx.strokeStyle = isSpeaking
        ? `rgba(236, 72, 153, ${0.08 + activeEnergy * 0.15})`
        : `rgba(147, 51, 234, ${0.05 + activeEnergy * 0.1})`;
      ctx.lineWidth = 1.5;

      const waveY = height * 0.5;
      for (let x = 0; x < width; x += 12) {
        const y = waveY + Math.sin(x * 0.005 + wavePhase) * (20 + activeEnergy * 40);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Floating particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * (1 + activeEnergy * 1.5);
        p.y += p.vy * (1 + activeEnergy * 1.5);

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 + activeEnergy * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.baseAlpha + activeEnergy * 0.3;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transform-gpu"
      style={{ transform: 'translate3d(0,0,0)' }}
    />
  );
};

export const BackgroundParticles = React.memo(BackgroundParticlesComponent);

