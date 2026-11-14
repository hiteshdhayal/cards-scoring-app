import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);

  const games = await sql`select * from games where id = ${gameId}`;
  if (games.length === 0) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const game = games[0];
  const players = await sql`select * from players
                            where game_id = ${gameId}
                            order by position, id`;
  const entries = await sql`select * from entries
                            where game_id = ${gameId}
                            order by id`;

  const totals: Record<number, number> = {};
  for (const p of players) totals[p.id] = 0;
  for (const e of entries) {
    totals[e.player_id] = (totals[e.player_id] ?? 0) + (e.made ? e.bid : -e.bid);
  }

  let winner: string | null = null;
  if (game.target > 0) {
    const reached = players
      .map((p: any) => ({ name: p.name, total: totals[p.id] ?? 0 }))
      .filter((p: any) => p.total >= game.target)
      .sort((a: any, b: any) => b.total - a.total);
    if (reached.length) winner = reached[0].name;
  }

  return NextResponse.json({ game, players, entries, totals, winner });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);
  const body = await req.json();

  if (body.target !== undefined) {
    await sql`update games set target = ${Number(body.target) || 0}
              where id = ${gameId}`;
  }
  if (body.status !== undefined) {
    await sql`update games set status = ${String(body.status)}
              where id = ${gameId}`;
  }
  return NextResponse.json({ ok: true });
}
