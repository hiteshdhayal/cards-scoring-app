'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/Button';

export function TargetSheet({
  target,
  onClose,
  onSave,
}: {
  target: number;
  onClose: () => void;
  onSave: (target: number) => void;
}) {
  const [enabled, setEnabled] = useState(target > 0);
  const [value, setValue] = useState(target > 0 ? target : 31);

  function handleSave() {
    onSave(enabled ? value : 0);
    onClose();
  }

  return (
    <Sheet title="Target Score" onClose={onClose}>
      <div className="card">
        <div className="card-row">
          <div className="card-row-content body-text">Play to a target score</div>
          <Switch checked={enabled} onChange={setEnabled} label="Play to a target score" />
        </div>
        {enabled && (
          <div className="card-row">
            <div className="card-row-content body-text">Target</div>
            <Stepper value={value} onChange={setValue} min={1} max={500} />
          </div>
        )}
      </div>
      <Button variant="primary" onClick={handleSave} style={{ marginTop: 14 }}>
        Save
      </Button>
    </Sheet>
  );
}
