'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setFlash(value > prev ? 'up' : 'down');
    const flashTimer = setTimeout(() => setFlash(null), 500);

    if (reduceMotion) {
      setDisplay(value);
      return () => clearTimeout(flashTimer);
    }

    const start = performance.now();
    const duration = 350;
    const from = prev;
    const to = value;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      clearTimeout(flashTimer);
    };
  }, [value]);

  return (
    <span
      className={className}
      style={{
        color: flash === 'up' ? 'var(--green)' : flash === 'down' ? 'var(--red)' : undefined,
        transition: 'color 0.4s',
      }}
    >
      {display}
    </span>
  );
}
