import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { loadGameState, writeAndLoadState } from '@/lib/game-state';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);

  const state = await loadGameState(gameId);
  if (!state) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(state);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);
  const body = await req.json();

  const writes = [];
  if (body.target !== undefined) {
    const target = Math.max(0, Math.min(999, Number(body.target) || 0));
    writes.push(sql`update games set target = ${target} where id = ${gameId}`);
  }
  if (body.status !== undefined) {
    const status = String(body.status).slice(0, 20);
    writes.push(sql`update games set status = ${status} where id = ${gameId}`);
  }

  const state = await writeAndLoadState(gameId, writes);
  if (!state) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(state);
}
