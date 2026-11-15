import { sql } from '@/lib/db';
import { computeTotals, computeWinner, type Entry, type Game, type Player } from '@/lib/score';

export type GameState = {
  game: Game;
  players: Player[];
  entries: Entry[];
  totals: Record<number, number>;
  winner: string | null;
  version: string;
};

function buildVersion(game: Game, players: Player[], entries: Entry[]): string {
  const entrySig = entries.map((e) => `${e.id}:${e.bid}:${e.made ? 1 : 0}`).join(',');
  const playerSig = players.map((p) => `${p.id}:${p.name}`).join(',');
  return `${game.target}:${game.status}:${playerSig}:${entrySig}`;
}

/** Loads the full game state in a single HTTP round trip to Neon. */
export async function loadGameState(gameId: number): Promise<GameState | null> {
  const [games, players, entries] = (await sql.transaction([
    sql`select * from games where id = ${gameId}`,
    sql`select * from players where game_id = ${gameId} order by position, id`,
    sql`select * from entries where game_id = ${gameId} order by id`,
  ])) as [Game[], Player[], Entry[]];

  if (games.length === 0) return null;
  const game = games[0];

  const totals = computeTotals(players, entries);
  const winner = computeWinner(players, totals, game.target);

  return {
    game,
    players,
    entries,
    totals,
    winner,
    version: buildVersion(game, players, entries),
  };
}

type SqlPromise = ReturnType<typeof sql>;

/**
 * Runs one or more write queries and the full state read in a single
 * non-interactive Postgres transaction (one HTTP round trip to Neon), so a
 * write and the state it produces always cost exactly one round trip.
 */
export async function writeAndLoadState(
  gameId: number,
  writeQueries: SqlPromise[]
): Promise<GameState | null> {
  const results = await sql.transaction([
    ...writeQueries,
    sql`select * from games where id = ${gameId}`,
    sql`select * from players where game_id = ${gameId} order by position, id`,
    sql`select * from entries where game_id = ${gameId} order by id`,
  ]);

  const games = results[results.length - 3] as Game[];
  const players = results[results.length - 2] as Player[];
  const entries = results[results.length - 1] as Entry[];

  if (games.length === 0) return null;
  const game = games[0];

  const totals = computeTotals(players, entries);
  const winner = computeWinner(players, totals, game.target);

  return {
    game,
    players,
    entries,
    totals,
    winner,
    version: buildVersion(game, players, entries),
  };
}
