'use client';

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="stepper-value tabular">{value}</span>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
