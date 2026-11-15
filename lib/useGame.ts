'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState } from '@/lib/game-state';
import {
  ApiError,
  addEntry as apiAddEntry,
  addRound as apiAddRound,
  deleteEntry as apiDeleteEntry,
  fetchGame,
  patchGame,
  toggleEntry as apiToggleEntry,
} from '@/lib/api';
import { computeTotals, computeWinner } from '@/lib/score';

const POLL_INTERVAL_MS = 2000;

export type ToastMessage = { id: number; text: string; retry?: () => void };
type RoundEntry = { playerId: number; bid: number; made: boolean };

export function useGame(gameId: number) {
  const [state, setState] = useState<GameState | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const stateRef = useRef<GameState | null>(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const pollSeqRef = useRef(0);
  const changeSeqRef = useRef(0);
  const inFlightMutationsRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const toastIdRef = useRef(0);

  const showToast = useCallback((text: string, retry?: () => void) => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, text, retry });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const poll = useCallback(async () => {
    if (inFlightMutationsRef.current > 0) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const seq = ++pollSeqRef.current;
    const changeSeqAtStart = changeSeqRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fresh = await fetchGame(gameId, controller.signal);
      // Discard this response if a newer poll already landed, or a
      // mutation started while this request was in flight.
      if (seq !== pollSeqRef.current) return;
      if (changeSeqRef.current !== changeSeqAtStart) return;
      setNotFound(false);
      setState((prev) => (prev && prev.version === fresh.version ? prev : fresh));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404 && changeSeqRef.current === changeSeqAtStart) {
        setNotFound(true);
      }
      // Other failures (aborted, offline) are silent; the next tick retries.
    }
  }, [gameId]);

  useEffect(() => {
    // Fetch on mount, then keep polling. `poll`'s own setState calls happen
    // asynchronously after its `await fetchGame(...)`, which the lint rule
    // can't see through — this is the standard data-fetching effect shape.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onVisible);
      abortRef.current?.abort();
    };
  }, [poll]);

  const runMutation = useCallback(
    (
      optimisticUpdate: (current: GameState) => GameState,
      request: () => Promise<GameState>,
      errorMessage: string
    ) => {
      function attempt() {
        const current = stateRef.current;
        if (!current) return;

        abortRef.current?.abort();

        const mySeq = ++changeSeqRef.current;
        inFlightMutationsRef.current += 1;
        const previous = current;
        setState(optimisticUpdate(current));

        request()
          .then((fresh) => {
            if (changeSeqRef.current === mySeq) setState(fresh);
          })
          .catch(() => {
            if (changeSeqRef.current === mySeq) {
              setState(previous);
              showToast(errorMessage, attempt);
            }
          })
          .finally(() => {
            inFlightMutationsRef.current -= 1;
          });
      }
      attempt();
    },
    [showToast]
  );

  const addEntry = useCallback(
    (playerId: number, bid: number, made: boolean) => {
      runMutation(
        (current) => {
          const tempId = -Date.now();
          const entries = [...current.entries, { id: tempId, player_id: playerId, bid, made }];
          const totals = computeTotals(current.players, entries);
          const winner = computeWinner(current.players, totals, current.game.target);
          return { ...current, entries, totals, winner, version: `optimistic:add:${tempId}` };
        },
        () => apiAddEntry(gameId, playerId, bid, made),
        "Couldn't add that score"
      );
    },
    [gameId, runMutation]
  );

  const addRound = useCallback(
    (entries: RoundEntry[]) => {
      if (entries.length === 0) return;
      runMutation(
        (current) => {
          const tempEntries = entries.map((e, i) => ({
            id: -Date.now() - i,
            player_id: e.playerId,
            bid: e.bid,
            made: e.made,
          }));
          const newEntries = [...current.entries, ...tempEntries];
          const totals = computeTotals(current.players, newEntries);
          const winner = computeWinner(current.players, totals, current.game.target);
          return { ...current, entries: newEntries, totals, winner, version: `optimistic:round:${Date.now()}` };
        },
        () => apiAddRound(gameId, entries),
        "Couldn't save that round"
      );
    },
    [gameId, runMutation]
  );

  const toggleEntry = useCallback(
    (entryId: number, made: boolean) => {
      runMutation(
        (current) => {
          const entries = current.entries.map((e) => (e.id === entryId ? { ...e, made } : e));
          const totals = computeTotals(current.players, entries);
          const winner = computeWinner(current.players, totals, current.game.target);
          return { ...current, entries, totals, winner, version: `optimistic:toggle:${entryId}:${made}` };
        },
        () => apiToggleEntry(gameId, entryId, made),
        "Couldn't update that score"
      );
    },
    [gameId, runMutation]
  );

  const deleteEntry = useCallback(
    (entryId: number) => {
      runMutation(
        (current) => {
          const entries = current.entries.filter((e) => e.id !== entryId);
          const totals = computeTotals(current.players, entries);
          const winner = computeWinner(current.players, totals, current.game.target);
          return { ...current, entries, totals, winner, version: `optimistic:del:${entryId}` };
        },
        () => apiDeleteEntry(gameId, entryId),
        "Couldn't delete that score"
      );
    },
    [gameId, runMutation]
  );

  const setTarget = useCallback(
    (target: number) => {
      runMutation(
        (current) => {
          const winner = computeWinner(current.players, current.totals, target);
          return {
            ...current,
            game: { ...current.game, target },
            winner,
            version: `optimistic:target:${target}`,
          };
        },
        () => patchGame(gameId, { target }),
        "Couldn't update the target"
      );
    },
    [gameId, runMutation]
  );

  return {
    state,
    loading: state === null && !notFound,
    notFound,
    toast,
    dismissToast,
    addEntry,
    addRound,
    toggleEntry,
    deleteEntry,
    setTarget,
    reload: poll,
  };
}
