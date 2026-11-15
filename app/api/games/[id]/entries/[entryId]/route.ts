import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { writeAndLoadState } from '@/lib/game-state';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;
  const gameId = Number(id);
  const eId = Number(entryId);
  const body = await req.json();
  const made = Boolean(body.made);

  const write = sql`
    update entries set made = ${made}
    where id = ${eId} and game_id = ${gameId}
  `;

  const state = await writeAndLoadState(gameId, [write]);
  if (!state) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(state);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;
  const gameId = Number(id);
  const eId = Number(entryId);

  const write = sql`delete from entries where id = ${eId} and game_id = ${gameId}`;

  const state = await writeAndLoadState(gameId, [write]);
  if (!state) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(state);
}
