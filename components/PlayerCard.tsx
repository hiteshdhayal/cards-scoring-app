'use client';

import { Avatar } from '@/components/ui/Avatar';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Crown } from '@/components/ui/Icon';
import { EntryChip } from '@/components/EntryChip';
import type { Entry, Player } from '@/lib/score';

export function PlayerCard({
  player,
  index,
  total,
  entries,
  target,
  isLeader,
  onAddTap,
  onChipTap,
}: {
  player: Player;
  index: number;
  total: number;
  entries: Entry[];
  target: number;
  isLeader: boolean;
  onAddTap: () => void;
  onChipTap: (entry: Entry) => void;
}) {
  const progress = target > 0 ? Math.max(0, Math.min(100, (total / target) * 100)) : null;

  return (
    <section className="card">
      <button
        type="button"
        className="card-row"
        style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
        onClick={onAddTap}
      >
        <Avatar name={player.name} index={index} />
        <div className="card-row-content">
          <div className="player-name-row">
            <span className="headline">{player.name}</span>
            {isLeader && total > 0 && <Crown size={16} className="crown" />}
          </div>
          {progress !== null && (
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%`, background: total < 0 ? 'var(--red)' : 'var(--green)' }}
              />
            </div>
          )}
        </div>
        <AnimatedNumber
          value={total}
          className={`player-total tabular ${total < 0 ? 'negative' : ''}`}
        />
      </button>

      {entries.length > 0 && (
        <div className="card-row" style={{ paddingTop: 2 }}>
          <div className="chip-row" style={{ flex: 1 }}>
            {entries.map((e) => (
              <EntryChip key={e.id} entry={e} onTap={onChipTap} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
