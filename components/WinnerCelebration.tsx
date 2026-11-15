'use client';

import { useEffect, useRef } from 'react';
import { Trophy } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export function WinnerCelebration({
  winnerName,
  total,
  onKeepPlaying,
  onNewGame,
}: {
  winnerName: string;
  total: number;
  onKeepPlaying: () => void;
  onNewGame: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#ff2d55'];
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    }));

    let frame: number;
    let elapsed = 0;

    function tick() {
      if (!ctx || !canvas) return;
      elapsed += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (elapsed < 2600) {
        frame = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="winner-confetti" />
      <div className="winner-overlay">
        <div className="winner-card">
          <Trophy size={48} className="winner-trophy" />
          <h2 className="title2" style={{ margin: '4px 0 2px' }}>
            {winnerName} wins!
          </h2>
          <p className="subhead" style={{ margin: '0 0 20px' }}>
            Final score: {total}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={onKeepPlaying}>
              Keep Playing
            </Button>
            <Button variant="primary" onClick={onNewGame}>
              New Game
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
