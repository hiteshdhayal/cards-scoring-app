'use client';

import type { Entry } from '@/lib/score';

export function EntryChip({ entry, onTap }: { entry: Entry; onTap: (entry: Entry) => void }) {
  return (
    <button
      type="button"
      className={`chip chip-enter ${entry.made ? 'chip-made' : 'chip-missed'}`}
      onClick={() => onTap(entry)}
    >
      {entry.made ? '+' : '−'}
      {entry.bid}
    </button>
  );
}
