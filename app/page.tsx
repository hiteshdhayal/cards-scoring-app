'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { browser } from 'react-dom';
import { HomeScreen } from '@/components/HomeScreen';
import { GameScreen } from '@/components/GameScreen';
import { warmUp } from '@/lib/api';

function AppShell() {
  use(browser('Reads the saved game code from localStorage and the shared-link URL.'));

  const [{ gameId, joinedViaLink }, setGameState] = useState<{
    gameId: number | null;
    joinedViaLink: boolean;
  }>(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && /^\d+$/.test(codeParam)) {
      return { gameId: Number(codeParam), joinedViaLink: true };
    }

    const saved = localStorage.getItem('gameId');
    if (saved) return { gameId: Number(saved), joinedViaLink: false };

    warmUp();
    return { gameId: null, joinedViaLink: false };
  });

  const [joinCode] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') ?? undefined;
  });

  // A link join came in through the URL, not through handleStart — persist
  // it the same way and clean the URL so a later reload isn't forced back
  // into this game once the player has moved on to another one.
  useEffect(() => {
    if (joinedViaLink && gameId != null) {
      localStorage.setItem('gameId', String(gameId));
      window.history.replaceState(null, '', '/');
    }
  }, [joinedViaLink, gameId]);

  function handleStart(id: number) {
    localStorage.setItem('gameId', String(id));
    window.history.replaceState(null, '', '/');
    setGameState({ gameId: id, joinedViaLink: false });
  }

  function handleLeave() {
    localStorage.removeItem('gameId');
    window.history.replaceState(null, '', '/');
    setGameState({ gameId: null, joinedViaLink: false });
  }

  return gameId == null ? (
    <HomeScreen onStart={handleStart} initialJoinCode={joinCode} />
  ) : (
    <GameScreen gameId={gameId} onLeave={handleLeave} />
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}
