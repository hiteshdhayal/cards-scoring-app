'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function AddBidSheet({
  playerName,
  onClose,
  onSubmit,
}: {
  playerName: string;
  onClose: () => void;
  onSubmit: (bid: number, made: boolean) => void;
}) {
  const [made, setMade] = useState<'made' | 'missed'>('made');
  const [other, setOther] = useState('');

  function pick(bid: number) {
    onSubmit(bid, made === 'made');
    onClose();
  }

  function submitOther() {
    const bid = Math.abs(Math.trunc(Number(other)));
    if (bid > 0) {
      onSubmit(bid, made === 'made');
      onClose();
    }
  }

  return (
    <Sheet title={`Add for ${playerName}`} onClose={onClose}>
      <SegmentedControl
        value={made}
        onChange={setMade}
        options={[
          { value: 'made', label: 'Made' },
          { value: 'missed', label: 'Missed' },
        ]}
      />
      <div className="keypad" style={{ marginTop: 16 }}>
        {KEYS.map((n) => (
          <button key={n} type="button" className="key" onClick={() => pick(n)}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <input
          className="input"
          inputMode="numeric"
          placeholder="Other amount"
          value={other}
          onChange={(e) => setOther(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submitOther()}
        />
        <Button variant="secondary" className="btn-sm" onClick={submitOther} disabled={!other}>
          Add
        </Button>
      </div>
    </Sheet>
  );
}
