'use client';

import { use, useState } from 'react';
import { browser } from 'react-dom';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Switch } from '@/components/ui/Switch';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ChevronRight } from '@/components/ui/Icon';
import { createGame, ApiError } from '@/lib/api';
import { getRecentGames, type RecentGame } from '@/lib/recent';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const DEFAULT_PLAYERS = 4;

export function HomeScreen({
  onStart,
  initialJoinCode,
}: {
  onStart: (gameId: number) => void;
  initialJoinCode?: string;
}) {
  const [tab, setTab] = useState<'new' | 'join'>(initialJoinCode ? 'join' : 'new');
  const [names, setNames] = useState<string[]>(Array(DEFAULT_PLAYERS).fill(''));
  const [targetEnabled, setTargetEnabled] = useState(true);
  const [target, setTarget] = useState(31);
  const [joinCode, setJoinCode] = useState(initialJoinCode ?? '');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  use(browser('Reads the recently played games list from localStorage.'));
  const [recent] = useState<RecentGame[]>(() => getRecentGames());

  const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);
  const canStart = validNames.length >= MIN_PLAYERS && !creating;

  function updateName(i: number, value: string) {
    setNames((prev) => {
      const copy = [...prev];
      copy[i] = value.slice(0, 20);
      return copy;
    });
  }

  function addPlayer() {
    setNames((prev) => (prev.length < MAX_PLAYERS ? [...prev, ''] : prev));
  }

  function removePlayer(i: number) {
    setNames((prev) => (prev.length > MIN_PLAYERS ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function handleStart() {
    if (!canStart) return;
    setCreating(true);
    setError(null);
    try {
      const { id } = await createGame(targetEnabled ? target : 0, validNames);
      onStart(id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't create the game. Check your connection.");
      setCreating(false);
    }
  }

  function handleJoin() {
    const code = Number(joinCode.trim());
    if (!code || joining) return;
    setJoining(true);
    onStart(code);
  }

  return (
    <main className="page">
      <div className="topbar">
        <span className="topbar-title" />
      </div>
      <div className="content">
        <h1 className="large-title" style={{ margin: '6px 0 16px' }}>
          Scorekeeper
        </h1>

        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'new', label: 'New Game' },
            { value: 'join', label: 'Join' },
          ]}
        />

        {tab === 'new' ? (
          <>
            <div className="section-label">Players</div>
            <div className="card">
              {names.map((name, i) => (
                <div className="card-row" key={i}>
                  <Avatar name={name || `Player ${i + 1}`} index={i} size="sm" />
                  <div className="card-row-content">
                    <input
                      className="input"
                      style={{ background: 'transparent', padding: '4px 0' }}
                      placeholder={`Player ${i + 1} name`}
                      value={name}
                      autoCapitalize="words"
                      onChange={(e) => updateName(i, e.target.value)}
                    />
                  </div>
                  {names.length > MIN_PLAYERS && (
                    <button
                      type="button"
                      className="topbar-link"
                      style={{ color: 'var(--red)' }}
                      onClick={() => removePlayer(i)}
                      aria-label={`Remove player ${i + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {names.length < MAX_PLAYERS && (
                <button type="button" className="card-row" onClick={addPlayer} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
                  <span className="body-text" style={{ color: 'var(--blue)' }}>
                    + Add player
                  </span>
                </button>
              )}
            </div>

            <div className="section-label">Game</div>
            <div className="card">
              <div className="card-row">
                <div className="card-row-content body-text">Play to a target score</div>
                <Switch checked={targetEnabled} onChange={setTargetEnabled} label="Play to a target score" />
              </div>
              {targetEnabled && (
                <div className="card-row">
                  <div className="card-row-content body-text">Target</div>
                  <Stepper value={target} onChange={setTarget} min={1} max={500} step={1} />
                </div>
              )}
            </div>

            {recent.length > 0 && (
              <>
                <div className="section-label">Recent</div>
                <div className="card">
                  {recent.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="card-row"
                      style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onClick={() => onStart(g.id)}
                    >
                      <div className="card-row-content">
                        <div className="body-text">Game {g.id}</div>
                        <div className="footnote">{g.players.join(', ')}</div>
                      </div>
                      <ChevronRight size={18} className="footnote" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && (
              <p className="footnote" style={{ color: 'var(--red)', margin: '10px 4px 0' }}>
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="section-label">Game code</div>
            <div className="card" style={{ padding: '20px 16px' }}>
              <input
                className="input tabular"
                style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', background: 'transparent' }}
                inputMode="numeric"
                placeholder="0000"
                value={joinCode}
                autoFocus
                onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <p className="footnote" style={{ margin: '8px 4px 0' }}>
              Ask whoever started the game for their code, or open the link they shared.
            </p>
          </>
        )}
      </div>

      <div className="action-bar">
        {tab === 'new' ? (
          <Button variant="primary" loading={creating} disabled={!canStart} onClick={handleStart}>
            {creating ? 'Starting…' : 'Start Game'}
          </Button>
        ) : (
          <Button variant="primary" loading={joining} disabled={!joinCode.trim()} onClick={handleJoin}>
            {joining ? 'Joining…' : 'Join Game'}
          </Button>
        )}
      </div>
    </main>
  );
}
