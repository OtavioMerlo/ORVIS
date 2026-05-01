import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream?: MediaStream | null;
  audioUrl?: string | null;
  isActive?: boolean;
}

const BAR_COUNT = 48;
const PRIMARY_COLOR = { r: 0, g: 243, b: 255 };
const SECONDARY_COLOR = { r: 124, g: 58, b: 237 };
const ACCENT_COLOR = { r: 244, g: 63, b: 94 };

function lerpColor(a: typeof PRIMARY_COLOR, b: typeof PRIMARY_COLOR, t: number) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const barsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas sharp on high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const time = Date.now() / 1000;
      const centerY = H / 2;
      const barWidth = (W / BAR_COUNT) * 0.55;
      const gap = W / BAR_COUNT;

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = gap * i + (gap - barWidth) / 2;
        const normalizedPos = i / BAR_COUNT;

        let targetHeight: number;
        if (isActive) {
          // Active state: energetic waveform
          const wave1 = Math.sin(time * 3.5 + i * 0.25) * 0.5;
          const wave2 = Math.sin(time * 5.2 + i * 0.15) * 0.3;
          const wave3 = Math.cos(time * 2.1 + i * 0.4) * 0.2;
          const centerFade = 1 - Math.abs(normalizedPos - 0.5) * 1.2;
          targetHeight = (0.3 + wave1 + wave2 + wave3) * H * 0.45 * Math.max(centerFade, 0.2);
        } else {
          // Idle state: calm breathing
          const wave = Math.sin(time * 1.5 + i * 0.15);
          const centerFade = 1 - Math.abs(normalizedPos - 0.5) * 1.5;
          targetHeight = (3 + wave * 4) * Math.max(centerFade, 0.15);
        }

        // Smooth interpolation
        barsRef.current[i] += (targetHeight - barsRef.current[i]) * (isActive ? 0.15 : 0.08);
        const height = barsRef.current[i];

        // Color gradient based on position
        let color;
        if (normalizedPos < 0.33) {
          color = lerpColor(PRIMARY_COLOR, SECONDARY_COLOR, normalizedPos * 3);
        } else if (normalizedPos < 0.66) {
          color = lerpColor(SECONDARY_COLOR, ACCENT_COLOR, (normalizedPos - 0.33) * 3);
        } else {
          color = lerpColor(ACCENT_COLOR, PRIMARY_COLOR, (normalizedPos - 0.66) * 3);
        }

        const alpha = isActive ? 0.8 : 0.4;
        const glowIntensity = isActive ? 12 : 4;

        // Glow
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;

        // Draw bar (mirrored from center)
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        
        // Top half
        const roundRadius = Math.min(barWidth / 2, 2);
        ctx.beginPath();
        ctx.roundRect(x, centerY - height, barWidth, height, [roundRadius, roundRadius, 0, 0]);
        ctx.fill();

        // Bottom half (mirror)
        ctx.beginPath();
        ctx.roundRect(x, centerY, barWidth, height, [0, 0, roundRadius, roundRadius]);
        ctx.fill();
      }

      // Center line
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, centerY, W, centerY);
      gradient.addColorStop(0, 'rgba(0, 243, 255, 0)');
      gradient.addColorStop(0.3, `rgba(0, 243, 255, ${isActive ? 0.15 : 0.06})`);
      gradient.addColorStop(0.7, `rgba(124, 58, 237, ${isActive ? 0.15 : 0.06})`);
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, centerY - 0.5, W, 1);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive]);

  return (
    <div className="w-full h-16 glass-card px-4 py-2 relative overflow-hidden flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface/60 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface/60 to-transparent pointer-events-none" />
    </div>
  );
};

export default AudioVisualizer;
