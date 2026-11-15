import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { writeAndLoadState } from '@/lib/game-state';

type RoundEntry = { playerId: number; bid: number; made: boolean };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);
  const body = await req.json();

  const rawEntries: unknown[] = Array.isArray(body.entries) ? body.entries : [];

  const playerIds: number[] = [];
  const bids: number[] = [];
  const mades: boolean[] = [];

  for (const raw of rawEntries) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Partial<RoundEntry>;
    const playerId = Number(e.playerId);
    const bid = Math.max(1, Math.min(99, Math.abs(Math.trunc(Number(e.bid))) || 0));
    if (!playerId || !bid) continue;
    playerIds.push(playerId);
    bids.push(bid);
    mades.push(Boolean(e.made ?? true));
  }

  if (playerIds.length === 0) {
    return NextResponse.json({ error: 'no valid entries' }, { status: 400 });
  }

  // All of this round's bids are inserted (and the fresh state read back)
  // in a single round trip to the database.
  const write = sql`
    insert into entries (game_id, player_id, bid, made)
    select ${gameId}, v.player_id, v.bid, v.made
    from unnest(${playerIds}::int[], ${bids}::int[], ${mades}::bool[])
      as v(player_id, bid, made)
    where exists (
      select 1 from players where id = v.player_id and game_id = ${gameId}
    )
  `;

  const state = await writeAndLoadState(gameId, [write]);
  if (!state) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(state);
}
