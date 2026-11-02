// The only code that can change a room. Clients have no write access to Firestore;
// they call these, and each call is one transaction over the room's server-only state.

import { initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore, type Transaction } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { DEFAULT_RULES, type RulesConfig } from '@mahjongkaki/engine';
import type { GameAction } from '@mahjongkaki/game';
import {
  type Table, type TableResult,
  act, endMatch, join, leave, newTable, ready, setBack, startMatch, tick, viewFor,
} from '@mahjongkaki/online';

initializeApp();
const db = getFirestore();

setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10, memory: '256MiB', concurrency: 40 });

const ORIGINS = ['https://xynkro.github.io', /^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
const opts = { cors: ORIGINS };

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
// No I/O/0/1: a code gets read aloud across a table or typed from a chat.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{4}$`);

const roomRef = (code: string) => db.collection('rooms').doc(code);
const secretRef = (code: string) => roomRef(code).collection('secret').doc('table');
const viewRef = (code: string, seat: number) => roomRef(code).collection('views').doc(String(seat));

function uidOf(req: CallableRequest): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Not signed in.');
  return uid;
}

function codeOf(data: unknown): string {
  const code = String((data as { code?: unknown } | null)?.code ?? '').trim().toUpperCase();
  if (!CODE_RE.test(code)) throw new HttpsError('invalid-argument', 'That room code is not valid.');
  return code;
}

function nameOf(data: unknown): string {
  const raw = String((data as { name?: unknown } | null)?.name ?? '');
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!name) throw new HttpsError('invalid-argument', 'Enter a nickname first.');
  return name;
}

function rulesOf(data: unknown): RulesConfig {
  const given = (data as { rules?: Partial<RulesConfig> } | null)?.rules;
  const merged: Record<string, unknown> = { ...DEFAULT_RULES };
  // Only known keys of the right type: this object is stored and used for scoring.
  for (const [k, v] of Object.entries(given ?? {})) {
    if (k in DEFAULT_RULES && typeof v === typeof (DEFAULT_RULES as unknown as Record<string, unknown>)[k]) merged[k] = v;
  }
  return merged as unknown as RulesConfig;
}

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

function expiry(now: number) {
  return Timestamp.fromMillis(now + ROOM_TTL_MS);
}

function write(tx: Transaction, code: string, { table, frames }: TableResult, now: number, before?: Table) {
  tx.set(secretRef(code), { json: JSON.stringify(table), expireAt: expiry(now) });
  table.players.forEach((p, seat) => {
    if (p.uid === null) {
      // Seat just handed to the AI: its old owner loses the view.
      if (before?.players[seat].uid) tx.delete(viewRef(code, seat));
      return;
    }
    tx.set(viewRef(code, seat), {
      uid: p.uid,
      json: JSON.stringify(viewFor(table, frames, seat, now)),
      expireAt: expiry(now),
    });
  });
}

async function withTable(
  code: string,
  change: (table: Table, now: number) => TableResult | null,
): Promise<boolean> {
  return db.runTransaction(async tx => {
    const snap = await tx.get(secretRef(code));
    if (!snap.exists) throw new HttpsError('not-found', 'No room with that code.');
    const table = JSON.parse(snap.get('json')) as Table;
    const now = Date.now();
    const result = change(table, now);
    if (!result) return false;
    write(tx, code, result, now, table);
    return true;
  });
}

export const createRoom = onCall(opts, async req => {
  const uid = uidOf(req);
  const name = nameOf(req.data);
  const rules = rulesOf(req.data);
  const table = newTable(uid, name, rules);

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const made = await db.runTransaction(async tx => {
      const snap = await tx.get(secretRef(code));
      if (snap.exists) return false;
      write(tx, code, { table, frames: [] }, Date.now());
      return true;
    });
    if (made) return { code, seat: 0 };
  }
  throw new HttpsError('unavailable', 'Could not make a room. Try again.');
});

export const joinRoom = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  const name = nameOf(req.data);
  let seat = -1;
  await withTable(code, table => {
    const joined = join(table, uid, name);
    if (!joined) {
      throw new HttpsError('failed-precondition', table.stage === 'lobby' ? 'That room is full.' : 'That game has already started.');
    }
    seat = joined.seat;
    return { table: joined.table, frames: [] };
  });
  return { code, seat };
});

export const startRoom = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  await withTable(code, (table, now) => {
    if (table.hostUid !== uid) throw new HttpsError('permission-denied', 'Only the host can start.');
    if (table.stage !== 'lobby') return null;
    return startMatch(table, now);
  });
  return { ok: true };
});

export const playMove = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  const action = (req.data as { action?: GameAction }).action;
  if (!action || typeof action !== 'object') throw new HttpsError('invalid-argument', 'No move given.');
  // A refused move isn't an error: it is usually a late tap, and the view already shows the truth.
  const applied = await withTable(code, (table, now) => act(table, uid, action, now));
  return { applied };
});

// Called by any seated phone once it thinks a deadline has passed. The server checks the clock.
export const tickRoom = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  const applied = await withTable(code, (table, now) =>
    table.players.some(p => p.uid === uid) ? tick(table, now) : null);
  return { applied };
});

export const readyUp = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  const applied = await withTable(code, (table, now) => ready(table, uid, now));
  return { applied };
});

export const comeBack = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  const applied = await withTable(code, table => {
    const next = setBack(table, uid);
    return next && { table: next, frames: [] };
  });
  return { applied };
});

export const leaveRoom = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  await withTable(code, (table, now) => leave(table, uid, now));
  return { ok: true };
});

export const finishMatch = onCall(opts, async req => {
  const uid = uidOf(req);
  const code = codeOf(req.data);
  const applied = await withTable(code, table => {
    const next = endMatch(table, uid);
    return next && { table: next, frames: [] };
  });
  return { applied };
});
