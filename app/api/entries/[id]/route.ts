import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { made } = await req.json();
  await sql`update entries set made = ${made} where id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sql`delete from entries where id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
