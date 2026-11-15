'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { Crown, Trophy } from '@/components/ui/Icon';
import { sortedStandings, type Player } from '@/lib/score';

export function StandingsSheet({
  players,
  totals,
  winner,
  onClose,
}: {
  players: Player[];
  totals: Record<number, number>;
  winner: string | null;
  onClose: () => void;
}) {
  const standings = sortedStandings(players, totals);
  const leaderTotal = standings[0]?.total ?? 0;

  return (
    <Sheet title="Standings" onClose={onClose}>
      {winner && (
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <Trophy size={32} className="winner-trophy" />
          <div className="headline">{winner} wins!</div>
        </div>
      )}
      <div className="card">
        {standings.map((p, i) => (
          <div className={`standing-row ${i === 0 ? 'lead' : ''}`} key={p.id}>
            <span className="standing-rank">{i + 1}</span>
            <Avatar name={p.name} index={players.findIndex((pp) => pp.id === p.id)} size="sm" />
            <div className="card-row-content">
              <div className="body-text">{p.name}</div>
              {i > 0 && <div className="footnote">−{leaderTotal - p.total} behind leader</div>}
            </div>
            <span
              className="tabular headline"
              style={{ color: p.total < 0 ? 'var(--red)' : undefined }}
            >
              {p.total}
            </span>
            {i === 0 && <Crown size={16} className="crown" />}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
