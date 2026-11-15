'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { Player } from '@/lib/score';

export function AddRoundSheet({
  players,
  onClose,
  onSubmit,
}: {
  players: Player[];
  onClose: () => void;
  onSubmit: (entries: { playerId: number; bid: number; made: boolean }[]) => void;
}) {
  const [bids, setBids] = useState<Record<number, string>>({});
  const [made, setMade] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(players.map((p) => [p.id, true]))
  );

  function setBid(id: number, value: string) {
    setBids((prev) => ({ ...prev, [id]: value.replace(/[^0-9]/g, '') }));
  }

  function toggleMade(id: number) {
    setMade((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const entries = players
    .map((p) => ({ playerId: p.id, bid: Number(bids[p.id] || 0), made: made[p.id] }))
    .filter((e) => e.bid > 0);

  function handleSave() {
    if (entries.length === 0) return;
    onSubmit(entries);
    onClose();
  }

  return (
    <Sheet title="Add Round" onClose={onClose}>
      <div className="card" style={{ marginBottom: 14 }}>
        {players.map((p, i) => (
          <div className="card-row" key={p.id}>
            <Avatar name={p.name} index={i} size="sm" />
            <div className="card-row-content body-text">{p.name}</div>
            <input
              className="input"
              style={{ width: 60, textAlign: 'center', padding: '8px 4px' }}
              inputMode="numeric"
              placeholder="0"
              value={bids[p.id] ?? ''}
              onChange={(e) => setBid(p.id, e.target.value)}
            />
            <button
              type="button"
              className={`chip ${made[p.id] ? 'chip-made' : 'chip-missed'}`}
              onClick={() => toggleMade(p.id)}
            >
              {made[p.id] ? 'Made' : 'Missed'}
            </button>
          </div>
        ))}
      </div>
      <Button variant="primary" disabled={entries.length === 0} onClick={handleSave}>
        Save Round
      </Button>
    </Sheet>
  );
}
