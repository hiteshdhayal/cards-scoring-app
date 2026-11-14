import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  const { target, players } = await req.json();
  const t = Number(target) || 0;

  const rows = await sql`insert into games (target) values (${t}) returning id`;
  const gameId = rows[0].id as number;

  const names: string[] = Array.isArray(players) ? players : [];
  for (let i = 0; i < names.length; i++) {
    const name = String(names[i] ?? '').trim();
    if (name) {
      await sql`insert into players (game_id, name, position)
                values (${gameId}, ${name}, ${i})`;
    }
  }
  return NextResponse.json({ id: gameId });
}
