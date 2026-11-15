import type { GameState } from '@/lib/game-state';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handle(res: Response): Promise<GameState> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore — not JSON
    }
    throw new ApiError(res.status, message);
  }
  return res.json();
}

export async function fetchGame(gameId: number, signal?: AbortSignal): Promise<GameState> {
  const res = await fetch(`/api/games/${gameId}`, { cache: 'no-store', signal });
  return handle(res);
}

export async function createGame(target: number, players: string[]): Promise<{ id: number }> {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, players }),
  });
  if (!res.ok) {
    let message = `Couldn't create the game (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return res.json();
}

export async function patchGame(
  gameId: number,
  patch: { target?: number; status?: string }
): Promise<GameState> {
  const res = await fetch(`/api/games/${gameId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return handle(res);
}

export async function addEntry(
  gameId: number,
  playerId: number,
  bid: number,
  made: boolean
): Promise<GameState> {
  const res = await fetch(`/api/games/${gameId}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, bid, made }),
  });
  return handle(res);
}

export async function addRound(
  gameId: number,
  entries: { playerId: number; bid: number; made: boolean }[]
): Promise<GameState> {
  const res = await fetch(`/api/games/${gameId}/rounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  return handle(res);
}

export async function toggleEntry(
  gameId: number,
  entryId: number,
  made: boolean
): Promise<GameState> {
  const res = await fetch(`/api/games/${gameId}/entries/${entryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ made }),
  });
  return handle(res);
}

export async function deleteEntry(gameId: number, entryId: number): Promise<GameState> {
  const res = await fetch(`/api/games/${gameId}/entries/${entryId}`, { method: 'DELETE' });
  return handle(res);
}

export function warmUp() {
  fetch('/api/health', { cache: 'no-store' }).catch(() => {});
}
