'use client';

import { useEffect, useRef, useState } from 'react';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    function measure() {
      const idx = options.findIndex((o) => o.value === value);
      const btn = btnRefs.current[idx];
      const container = containerRef.current;
      if (btn && container) {
        const cRect = container.getBoundingClientRect();
        const bRect = btn.getBoundingClientRect();
        setThumb({ left: bRect.left - cRect.left, width: bRect.width });
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, options]);

  return (
    <div className="segmented" ref={containerRef}>
      {thumb && <span className="segmented-thumb" style={{ left: thumb.left, width: thumb.width }} />}
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          ref={(el) => {
            btnRefs.current[i] = el;
          }}
          className="segmented-option"
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
