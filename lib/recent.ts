export type RecentGame = { id: number; players: string[]; lastOpened: number };

const KEY = 'recentGames';
const MAX = 5;

export function getRecentGames(): RecentGame[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberGame(id: number, players: string[]) {
  try {
    const existing = getRecentGames().filter((g) => g.id !== id);
    const updated = [{ id, players, lastOpened: Date.now() }, ...existing].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private mode, etc.) — safe to ignore.
  }
}

export function forgetGame(id: number) {
  try {
    const updated = getRecentGames().filter((g) => g.id !== id);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
