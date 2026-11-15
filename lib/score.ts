export type Player = { id: number; name: string; position: number };
export type Entry = {
  id: number;
  player_id: number;
  bid: number;
  made: boolean;
};
export type Game = { id: number; target: number; status: string };

export type RankedPlayer = Player & { total: number; rank: number };

export function computeTotals(players: Player[], entries: Entry[]): Record<number, number> {
  const totals: Record<number, number> = {};
  for (const p of players) totals[p.id] = 0;
  for (const e of entries) {
    totals[e.player_id] = (totals[e.player_id] ?? 0) + (e.made ? e.bid : -e.bid);
  }
  return totals;
}

export function rankPlayers(players: Player[], totals: Record<number, number>): RankedPlayer[] {
  const withTotals = players.map((p) => ({ ...p, total: totals[p.id] ?? 0 }));
  const sorted = [...withTotals].sort((a, b) => b.total - a.total);
  let rank = 0;
  let lastTotal: number | null = null;
  const ranked = sorted.map((p, i) => {
    if (lastTotal === null || p.total !== lastTotal) {
      rank = i + 1;
      lastTotal = p.total;
    }
    return { ...p, rank };
  });
  // re-sort back to original player order for rendering; callers that want
  // ranking order should use rankPlayers(...).slice() sorted themselves or
  // read `sorted` via computeWinner.
  return players.map((p) => ranked.find((r) => r.id === p.id)!);
}

export function computeWinner(
  players: Player[],
  totals: Record<number, number>,
  target: number
): string | null {
  if (target <= 0) return null;
  const reached = players
    .map((p) => ({ name: p.name, total: totals[p.id] ?? 0 }))
    .filter((p) => p.total >= target)
    .sort((a, b) => b.total - a.total);
  return reached.length ? reached[0].name : null;
}

export function sortedStandings(players: Player[], totals: Record<number, number>) {
  return [...players]
    .map((p) => ({ ...p, total: totals[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
}
