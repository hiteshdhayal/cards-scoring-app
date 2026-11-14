import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);
  const { playerId, bid, made } = await req.json();

  const rows = await sql`
    insert into entries (game_id, player_id, bid, made)
    values (${gameId}, ${Number(playerId)}, ${Math.abs(Number(bid)) || 0}, ${made ?? true})
    returning id`;
  return NextResponse.json({ id: rows[0].id });
}
