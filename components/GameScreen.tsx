'use client';

import { use, useEffect, useState } from 'react';
import { browser } from 'react-dom';
import { useGame } from '@/lib/useGame';
import { rememberGame } from '@/lib/recent';
import { vibrate } from '@/lib/haptics';
import { PlayerCard } from '@/components/PlayerCard';
import { AddBidSheet } from '@/components/AddBidSheet';
import { AddRoundSheet } from '@/components/AddRoundSheet';
import { StandingsSheet } from '@/components/StandingsSheet';
import { TargetSheet } from '@/components/TargetSheet';
import { WinnerCelebration } from '@/components/WinnerCelebration';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { Toast } from '@/components/ui/Toast';
import { ChevronLeft, Share as ShareIcon, Target as TargetIcon } from '@/components/ui/Icon';
import type { Entry, Player } from '@/lib/score';

function winnerSeenKey(gameId: number, winner: string) {
  return `winnerSeen:${gameId}:${winner}`;
}

export function GameScreen({ gameId, onLeave }: { gameId: number; onLeave: () => void }) {
  use(browser('Reads online status and the "winner already celebrated" flag from localStorage.'));

  const {
    state,
    loading,
    notFound,
    toast,
    dismissToast,
    addEntry,
    addRound,
    toggleEntry,
    deleteEntry,
    setTarget,
  } = useGame(gameId);

  const [addBidFor, setAddBidFor] = useState<Player | null>(null);
  const [showAddRound, setShowAddRound] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [actionSheetEntry, setActionSheetEntry] = useState<Entry | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (state && state.players.length > 0) {
      rememberGame(gameId, state.players.map((p) => p.name));
    }
  }, [gameId, state]);

  // A new winner is shown once: adjust state directly while rendering
  // (React's documented alternative to an Effect for "value changed"
  // checks), then sync the localStorage flag in its own effect below.
  const [celebrate, setCelebrate] = useState(false);
  const [lastSeenWinner, setLastSeenWinner] = useState<string | null>(null);
  if (state?.winner && state.winner !== lastSeenWinner) {
    setLastSeenWinner(state.winner);
    if (!localStorage.getItem(winnerSeenKey(gameId, state.winner))) {
      setCelebrate(true);
    }
  }
  useEffect(() => {
    if (celebrate && state?.winner) {
      localStorage.setItem(winnerSeenKey(gameId, state.winner), '1');
      vibrate([30, 60, 30]);
    }
  }, [celebrate, gameId, state?.winner]);

  if (notFound) {
    return (
      <main className="page">
        <div className="state-screen">
          <p className="headline" style={{ color: 'var(--label)' }}>
            No game with code {gameId}
          </p>
          <p className="footnote">It may have been removed, or the code is wrong.</p>
          <button type="button" className="btn btn-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={onLeave}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  if (loading || !state) {
    return (
      <main className="page">
        <div className="topbar">
          <div className="topbar-side" />
          <span className="topbar-title">Scoreboard</span>
          <div className="topbar-side" />
        </div>
        <div className="content">
          {[0, 1, 2, 3].map((i) => (
            <div className="card" key={i} style={{ height: 92, marginTop: i ? 12 : 0 }}>
              <div className="skeleton" style={{ height: '100%' }} />
            </div>
          ))}
        </div>
      </main>
    );
  }

  const { game, players, entries, totals, winner } = state;
  const leaderId = players.reduce<number | null>((best, p) => {
    if (best === null) return p.id;
    return (totals[p.id] ?? 0) > (totals[best] ?? 0) ? p.id : best;
  }, null);

  async function handleShare() {
    const url = `${window.location.origin}/?code=${gameId}`;
    const shareData = { title: 'Card Scorekeeper', text: `Join my game — code ${gameId}`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do silently
    }
  }

  return (
    <main className="page">
      <div className="topbar">
        <div className="topbar-side">
          <button type="button" className="topbar-link" onClick={() => setShowLeaveConfirm(true)}>
            <ChevronLeft size={20} />
            Leave
          </button>
        </div>
        <span className="topbar-title">Game {gameId}</span>
        <div className="topbar-side" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="topbar-link" onClick={handleShare} aria-label="Share game code">
            <ShareIcon size={20} />
          </button>
        </div>
      </div>

      <div className="content">
        <h1 className="large-title" style={{ margin: '2px 0 0' }}>
          Scoreboard
        </h1>
        <button
          type="button"
          onClick={() => setShowTarget(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            padding: '4px 0 12px',
            cursor: 'pointer',
          }}
        >
          <TargetIcon size={14} className="footnote" />
          <span className="footnote">{game.target > 0 ? `Target ${game.target}` : 'No target'}</span>
          <span className="footnote">·</span>
          <span className={`live-dot ${online ? 'live' : 'offline'}`} />
          <span className="footnote">{online ? 'Live' : 'Offline'}</span>
        </button>

        {shareCopied && <p className="footnote" style={{ color: 'var(--green)' }}>Link copied</p>}

        <div className="player-grid">
          {players.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              index={i}
              total={totals[p.id] ?? 0}
              entries={entries.filter((e) => e.player_id === p.id)}
              target={game.target}
              isLeader={p.id === leaderId}
              onAddTap={() => setAddBidFor(p)}
              onChipTap={setActionSheetEntry}
            />
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button type="button" className="btn btn-secondary" onClick={() => setShowAddRound(true)}>
          + Add Round
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setShowStandings(true)}>
          Standings
        </button>
      </div>

      {addBidFor && (
        <AddBidSheet
          playerName={addBidFor.name}
          onClose={() => setAddBidFor(null)}
          onSubmit={(bid, made) => addEntry(addBidFor.id, bid, made)}
        />
      )}

      {showAddRound && (
        <AddRoundSheet
          players={players}
          onClose={() => setShowAddRound(false)}
          onSubmit={(roundEntries) => addRound(roundEntries)}
        />
      )}

      {showStandings && (
        <StandingsSheet
          players={players}
          totals={totals}
          winner={winner}
          onClose={() => setShowStandings(false)}
        />
      )}

      {showTarget && (
        <TargetSheet
          target={game.target}
          onClose={() => setShowTarget(false)}
          onSave={(t) => setTarget(t)}
        />
      )}

      {actionSheetEntry && (
        <ActionSheet
          title={`${actionSheetEntry.made ? '+' : '−'}${actionSheetEntry.bid}`}
          onCancel={() => setActionSheetEntry(null)}
          actions={[
            {
              label: actionSheetEntry.made ? 'Mark as Missed' : 'Mark as Made',
              onSelect: () => {
                toggleEntry(actionSheetEntry.id, !actionSheetEntry.made);
                setActionSheetEntry(null);
              },
            },
            {
              label: 'Delete',
              destructive: true,
              onSelect: () => {
                deleteEntry(actionSheetEntry.id);
                setActionSheetEntry(null);
              },
            },
          ]}
        />
      )}

      {showLeaveConfirm && (
        <ActionSheet
          title={`Leave this game? You can rejoin with code ${gameId}.`}
          onCancel={() => setShowLeaveConfirm(false)}
          actions={[{ label: 'Leave', destructive: true, onSelect: onLeave }]}
        />
      )}

      {celebrate && winner && (
        <WinnerCelebration
          winnerName={winner}
          total={totals[players.find((p) => p.name === winner)?.id ?? -1] ?? 0}
          onKeepPlaying={() => setCelebrate(false)}
          onNewGame={() => {
            setCelebrate(false);
            onLeave();
          }}
        />
      )}

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </main>
  );
}
