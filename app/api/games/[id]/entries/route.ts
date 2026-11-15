import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { writeAndLoadState } from '@/lib/game-state';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);
  const body = await req.json();

  const playerId = Number(body.playerId);
  const bid = Math.max(1, Math.min(99, Math.abs(Math.trunc(Number(body.bid))) || 0));
  const made = body.made ?? true;

  if (!bid) {
    return NextResponse.json({ error: 'bid must be a positive number' }, { status: 400 });
  }

  // Only inserts if playerId actually belongs to this game.
  const write = sql`
    insert into entries (game_id, player_id, bid, made)
    select ${gameId}, ${playerId}, ${bid}, ${Boolean(made)}
    where exists (select 1 from players where id = ${playerId} and game_id = ${gameId})
  `;

  const state = await writeAndLoadState(gameId, [write]);
  if (!state) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(state);
}
