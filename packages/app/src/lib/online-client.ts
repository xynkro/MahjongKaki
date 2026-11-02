// The app's only link to Firebase. Imported lazily with the online screens.

import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence, browserSessionPersistence, connectAuthEmulator, indexedDBLocalPersistence,
  initializeAuth, signInAnonymously,
} from 'firebase/auth';
import { connectFirestoreEmulator, doc, initializeFirestore, onSnapshot } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import type { GameAction } from '@mahjongkaki/game';
import type { RulesConfig } from '@mahjongkaki/engine';
import type { SeatView } from '@mahjongkaki/online';

// Public by design: access is controlled by firestore.rules and the Cloud Functions.
const app = initializeApp({
  apiKey: 'AIzaSyCLjugvubXs9FYNCtZNODCBEBvsxT7AWA0',
  authDomain: 'mahjongkaki-online.firebaseapp.com',
  projectId: 'mahjongkaki-online',
  appId: '1:20440280105:web:b57dba7f8add7d627e0038',
});

const EMULATOR = import.meta.env.VITE_FB_EMULATOR === '1';

// Explicit persistence and long polling: the defaults hang in an iOS WKWebView.
// Per-tab identity under the emulator, so two tabs can be two players.
const auth = initializeAuth(app, {
  persistence: EMULATOR ? browserSessionPersistence : [indexedDBLocalPersistence, browserLocalPersistence],
});
const firestore = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
const functions = getFunctions(app, 'asia-southeast1');

if (EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// Shared promise: two calls racing here would each create a user, and seat one phone twice.
let signingIn: Promise<void> | null = null;
function ensureSignedIn(): Promise<void> {
  signingIn ??= (async () => {
    await auth.authStateReady();
    if (!auth.currentUser) await signInAnonymously(auth);
  })().catch(e => { signingIn = null; throw e; });
  return signingIn;
}

async function call<T>(name: string, data: object): Promise<T> {
  await ensureSignedIn();
  const res = await httpsCallable(functions, name)(data);
  return res.data as T;
}

export interface Seated { code: string; seat: number }

export const createRoom = (name: string, rules: RulesConfig) => call<Seated>('createRoom', { name, rules });
export const joinRoom = (code: string, name: string) => call<Seated>('joinRoom', { code, name });
export const startRoom = (code: string) => call<unknown>('startRoom', { code });
export const playMove = (code: string, action: GameAction) => call<{ applied: boolean }>('playMove', { code, action });
export const tickRoom = (code: string) => call<{ applied: boolean }>('tickRoom', { code });
export const readyUp = (code: string) => call<{ applied: boolean }>('readyUp', { code });
export const comeBack = (code: string) => call<{ applied: boolean }>('comeBack', { code });
export const leaveRoom = (code: string) => call<unknown>('leaveRoom', { code });
export const finishMatch = (code: string) => call<{ applied: boolean }>('finishMatch', { code });

// null means this phone no longer has that seat.
export function watchSeat(code: string, seat: number, onView: (v: SeatView | null) => void, onError: (e: Error) => void) {
  return onSnapshot(
    doc(firestore, 'rooms', code, 'views', String(seat)),
    snap => onView(snap.exists() ? (JSON.parse(snap.get('json')) as SeatView) : null),
    onError,
  );
}

export function friendlyError(e: unknown): string {
  const err = e as { code?: string; message?: string };
  if (err.code?.startsWith('functions/') && err.code !== 'functions/internal' && err.code !== 'functions/unavailable' && err.message) {
    return err.message;
  }
  return 'Could not reach the server. Check your connection and try again.';
}
