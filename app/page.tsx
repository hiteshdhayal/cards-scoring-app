'use client';

import { useCallback, useEffect, useState } from 'react';

type Player = { id: number; name: string; position: number };
type Entry = { id: number; player_id: number; bid: number; made: boolean };
type Game = { id: number; target: number; status: string };
type State = {
  game: Game;
  players: Player[];
  entries: Entry[];
  totals: Record<number, number>;
  winner: string | null;
};

export default function Home() {
  const [gameId, setGameId] = useState<number | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [showTotal, setShowTotal] = useState(false);

  const [names, setNames] = useState(['', '', '', '']);
  const [target, setTarget] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [bids, setBids] = useState<Record<number, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('gameId');
    if (saved) setGameId(Number(saved));
  }, []);

  const load = useCallback(async (id: number) => {
    const res = await fetch(`/api/games/${id}`, { cache: 'no-store' });
    if (res.ok) setState(await res.json());
  }, []);

  useEffect(() => {
    if (gameId == null) return;
    localStorage.setItem('gameId', String(gameId));
    load(gameId);
    const t = setInterval(() => load(gameId), 3000);
    return () => clearInterval(t);
  }, [gameId, load]);

  async function createGame() {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, players: names }),
    });
    const data = await res.json();
    setGameId(data.id);
  }

  async function addEntry(playerId: number) {
    const bid = Math.abs(Number(bids[playerId]));
    if (!bid) return;
    await fetch(`/api/games/${gameId}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, bid, made: true }),
    });
    setBids((b) => ({ ...b, [playerId]: '' }));
    if (gameId) load(gameId);
  }

  async function toggleEntry(entry: Entry) {
    await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ made: !entry.made }),
    });
    if (gameId) load(gameId);
  }

  async function deleteEntry(entry: Entry) {
    await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
    if (gameId) load(gameId);
  }

  async function updateTarget(value: string) {
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: value }),
    });
    if (gameId) load(gameId);
  }

  function newGame() {
    localStorage.removeItem('gameId');
    setGameId(null);
    setState(null);
    setNames(['', '', '', '']);
    setTarget('');
    setShowTotal(false);
  }

  // ---------- SETUP SCREEN ----------
  if (gameId == null) {
    return (
      <main className="wrap">
        <h1 className="title">Card Scorekeeper</h1>
        <div className="card">
          <h2 className="h2">New game</h2>
          {names.map((n, i) => (
            <input
              key={i}
              className="input"
              placeholder={`Player ${i + 1} name`}
              value={n}
              onChange={(e) => {
                const copy = [...names];
                copy[i] = e.target.value;
                setNames(copy);
              }}
            />
          ))}
          <input
            className="input"
            inputMode="numeric"
            placeholder="Target (optional, e.g. 31)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <button className="btn btn-primary" onClick={createGame}>
            Start game
          </button>
        </div>

        <div className="card">
          <h2 className="h2">Join a game</h2>
          <input
            className="input"
            inputMode="numeric"
            placeholder="Enter game code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <button
            className="btn"
            onClick={() => joinCode && setGameId(Number(joinCode))}
          >
            Join
          </button>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="wrap">
        <p className="muted">Loading game #{gameId}…</p>
      </main>
    );
  }

  // ---------- GAME SCREEN ----------
  const sorted = [...state.players]
    .map((p) => ({ ...p, total: state.totals[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <main className="wrap">
      <header className="topbar">
        <div>
          <h1 className="title">Scoreboard</h1>
          <span className="muted">Code: {state.game.id}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTotal(true)}>
          Total
        </button>
      </header>

      <div className="targetrow">
        <label className="muted">Target</label>
        <input
          className="input input-sm"
          inputMode="numeric"
          defaultValue={state.game.target || ''}
          placeholder="none"
          onBlur={(e) => updateTarget(e.target.value)}
        />
      </div>

      {state.winner && <div className="winner">🏆 {state.winner} wins!</div>}

      {state.players.map((p) => {
        const theirEntries = state.entries.filter((e) => e.player_id === p.id);
        const total = state.totals[p.id] ?? 0;
        return (
          <section className="card" key={p.id}>
            <div className="playerhead">
              <span className="pname">{p.name}</span>
              <span className={`ptotal ${total < 0 ? 'neg' : ''}`}>{total}</span>
            </div>

            <div className="chips">
              {theirEntries.map((e) => (
                <button
                  key={e.id}
                  className={`chip ${e.made ? 'chip-pos' : 'chip-neg'}`}
                  onClick={() => toggleEntry(e)}
                  onDoubleClick={() => deleteEntry(e)}
                  title="Tap to flip +/- , double-tap to delete"
                >
                  {e.made ? '+' : '−'}
                  {e.bid}
                </button>
              ))}
            </div>

            <div className="addrow">
              <input
                className="input input-sm"
                inputMode="numeric"
                placeholder="bid"
                value={bids[p.id] ?? ''}
                onChange={(ev) =>
                  setBids((b) => ({ ...b, [p.id]: ev.target.value }))
                }
                onKeyDown={(ev) => ev.key === 'Enter' && addEntry(p.id)}
              />
              <button className="btn" onClick={() => addEntry(p.id)}>
                Add
              </button>
            </div>
          </section>
        );
      })}

      <button className="btn btn-ghost" onClick={newGame}>
        New game
      </button>

      {showTotal && (
        <div className="overlay" onClick={() => setShowTotal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2">Totals</h2>
            {state.winner && (
              <div className="winner">🏆 {state.winner} wins!</div>
            )}
            <ol className="ranklist">
              {sorted.map((p, i) => (
                <li key={p.id} className={i === 0 ? 'lead' : ''}>
                  <span>{p.name}</span>
                  <span className={p.total < 0 ? 'neg' : ''}>{p.total}</span>
                </li>
              ))}
            </ol>
            <button
              className="btn btn-primary"
              onClick={() => setShowTotal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
