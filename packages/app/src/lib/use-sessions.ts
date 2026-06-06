import { useState, useEffect, useCallback } from 'react';
import { db } from './db';
import type { Session, Round } from './db';

export function useActiveSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const active = await db.sessions.where('isActive').equals(1).first();
    if (active) {
      setSession(active);
      const r = await db.rounds.where('sessionId').equals(active.id!).sortBy('timestamp');
      setRounds(r);
    } else {
      setSession(null);
      setRounds([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const startSession = useCallback(async (
    playerNames: [string, string, string, string],
    stakeLabel: string,
  ) => {
    await db.sessions.where('isActive').equals(1).modify({ isActive: 0 });
    const now = Date.now();
    const id = await db.sessions.add({
      createdAt: now,
      updatedAt: now,
      playerNames,
      stakeLabel,
      isActive: 1,
    });
    await refresh();
    return id;
  }, [refresh]);

  const addRound = useCallback(async (round: Omit<Round, 'id' | 'sessionId' | 'timestamp'>) => {
    if (!session) return;
    await db.rounds.add({
      ...round,
      sessionId: session.id!,
      timestamp: Date.now(),
    });
    await db.sessions.update(session.id!, { updatedAt: Date.now() });
    await refresh();
  }, [session, refresh]);

  const deleteRound = useCallback(async (roundId: number) => {
    await db.rounds.delete(roundId);
    if (session) {
      await db.sessions.update(session.id!, { updatedAt: Date.now() });
    }
    await refresh();
  }, [session, refresh]);

  const endSession = useCallback(async () => {
    if (!session) return;
    await db.sessions.update(session.id!, { isActive: 0 });
    await refresh();
  }, [session, refresh]);

  const balances = computeBalances(rounds);

  return {
    session, rounds, balances, loading,
    startSession, addRound, deleteRound, endSession, refresh,
  };
}

export function computeBalances(rounds: Round[]): [number, number, number, number] {
  const b: [number, number, number, number] = [0, 0, 0, 0];
  for (const r of rounds) {
    for (let i = 0; i < 4; i++) {
      b[i] += r.deltas[i];
    }
  }
  return b;
}

export function usePastSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    db.sessions
      .where('isActive').equals(0)
      .reverse()
      .sortBy('createdAt')
      .then(setSessions);
  }, []);

  return sessions;
}
