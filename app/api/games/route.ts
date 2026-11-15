import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json();
  const target = Math.max(0, Math.min(999, Number(body.target) || 0));

  const rawNames: unknown[] = Array.isArray(body.players) ? body.players : [];
  const names = rawNames
    .map((n) => String(n ?? '').trim().slice(0, 20))
    .filter((n) => n.length > 0)
    .slice(0, 6);

  if (names.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 player names are required' },
      { status: 400 }
    );
  }

  // One statement: create the game and all its players together, so
  // starting a game costs a single round trip to the database.
  const rows = await sql`
    with new_game as (
      insert into games (target) values (${target}) returning id
    ), inserted_players as (
      insert into players (game_id, name, position)
      select new_game.id, p.name, p.ord - 1
      from new_game, unnest(${names}::text[]) with ordinality as p(name, ord)
      returning id
    )
    select id from new_game
  `;

  const gameId = rows[0].id as number;
  return NextResponse.json({ id: gameId });
}
