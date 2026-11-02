// End-to-end against the Firebase emulators: real auth, real rules, real functions.
//   firebase emulators:exec --only auth,firestore,functions --project mahjongkaki-online "node functions/e2e/run.mjs"
// Against the deployed project: E2E_API_KEY=<web api key> node functions/e2e/run.mjs
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

const LIVE_KEY = process.env.E2E_API_KEY;

function client(name) {
  const app = initializeApp({ apiKey: LIVE_KEY ?? 'demo', projectId: 'mahjongkaki-online', appId: 'demo' }, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const fns = getFunctions(app, 'asia-southeast1');
  if (!LIVE_KEY) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  }
  const call = (n, data) => httpsCallable(fns, n)(data).then(r => r.data);
  return { auth, db, call };
}

const denied = async p => {
  try { await p; } catch (e) { assert.match(String(e.code), /permission-denied/); return; }
  assert.fail('expected permission-denied');
};
const code = e => e.code;
const view = async (c, room, seat) => JSON.parse((await getDoc(doc(c.db, 'rooms', room, 'views', String(seat)))).get('json'));

const a = client('a'), b = client('b'), stranger = client('s');
await Promise.all([a, b, stranger].map(c => signInAnonymously(c.auth)));

// Unauthenticated and bad input
const nobody = client('n');
await nobody.call('createRoom', { name: 'x' }).then(() => assert.fail('anon allowed'), e => assert.equal(code(e), 'functions/unauthenticated'));
await a.call('createRoom', { name: '   ' }).then(() => assert.fail('blank name allowed'), e => assert.equal(code(e), 'functions/invalid-argument'));
await a.call('joinRoom', { code: 'ZZZZ', name: 'A' }).then(() => assert.fail(), e => assert.equal(code(e), 'functions/not-found'));

const { code: room, seat: seatA } = await a.call('createRoom', { name: ' Ann\u0007ie  B ', rules: { taiCap: 6, evil: 'x' } });
const { seat: seatB } = await b.call('joinRoom', { code: room, name: 'Ben' });
assert.deepEqual([seatA, seatB], [0, 1]);
const lobby = await view(a, room, 0);
assert.equal(lobby.stage, 'lobby');
assert.equal(lobby.players[0].name, 'Annie B');
assert.equal(lobby.players[1].name, 'Ben');
assert.equal(lobby.players[2].isAi, true);

// Only the host starts
await b.call('startRoom', { code: room }).then(() => assert.fail(), e => assert.equal(code(e), 'functions/permission-denied'));
await a.call('startRoom', { code: room });

// Late joiner is turned away; a stranger can't read anything
await stranger.call('joinRoom', { code: room, name: 'Late' }).then(() => assert.fail(), e => assert.equal(code(e), 'functions/failed-precondition'));
await denied(getDoc(doc(stranger.db, 'rooms', room, 'views', '0')));
await denied(getDoc(doc(stranger.db, 'rooms', room, 'secret', 'table')));

// Players can't read each other, can't read the wall, can't write anything
await denied(getDoc(doc(a.db, 'rooms', room, 'views', '1')));
await denied(getDoc(doc(b.db, 'rooms', room, 'views', '0')));
await denied(getDoc(doc(a.db, 'rooms', room, 'secret', 'table')));
await denied(setDoc(doc(a.db, 'rooms', room, 'views', '0'), { uid: 'x', json: '{}' }));
await denied(setDoc(doc(a.db, 'rooms', room, 'secret', 'table'), { json: '{}' }));

// Play: both humans make real moves through the real functions until three hands finish.
const players = [a, b];
let hands = 0, moves = 0;
for (let i = 0; i < 5000 && hands < 3; i++) {
  const va = await view(a, room, 0);
  if (va.stage === 'result') {
    hands++;
    assert.equal(va.progress.totals.reduce((x, y) => x + y, 0), 0, 'points net to zero');
    await a.call('readyUp', { code: room });
    await b.call('readyUp', { code: room });
    continue;
  }
  const vb = await view(b, room, 1);
  // Each phone only ever holds its own tiles.
  const fa = va.frames.at(-1).game;
  const fb = vb.frames.at(-1).game;
  assert.ok(fa.hands[1].every(t => t === -1) && fa.hands[2].every(t => t === -1));
  assert.ok(fb.hands[0].every(t => t === -1) && fb.hands[3].every(t => t === -1));
  assert.equal(JSON.stringify(va).includes('"wall"'), false);

  let acted = false;
  for (const [i2, v] of [[0, va], [1, vb]]) {
    const acts = v.frames.at(-1).actions;
    if (acts.length === 0) continue;
    const pick = acts.find(x => x.type === 'claim' && x.claimType === 'win')
      ?? acts.find(x => x.type === 'skip_claim') ?? acts.find(x => x.type === 'discard');
    const r = await players[i2].call('playMove', { code: room, action: pick });
    assert.equal(r.applied, true, `move refused: ${JSON.stringify(pick)}`);
    moves++;
    acted = true;
    break;
  }
  assert.ok(acted, 'game is stuck: no one has a move');
}
assert.equal(hands, 3);

// A forged move is ignored, not an error.
const before = await view(a, room, 0);
const forged = await b.call('playMove', { code: room, action: { type: 'claim', claimType: 'win', player: 0, tilesFromHand: [] } });
assert.equal(forged.applied, false);
const notYet = await b.call('tickRoom', { code: room });
assert.equal(notYet.applied, false, 'tick must not fire before the deadline');
assert.deepEqual((await view(a, room, 0)).progress, before.progress);

// Leaving: the seat goes to AI and the leaver loses access. Host passes on, then the room closes.
await a.call('leaveRoom', { code: room });
await denied(getDoc(doc(a.db, 'rooms', room, 'views', '0')));
const afterLeave = await view(b, room, 1);
assert.equal(afterLeave.players[0].isAi, true);
assert.equal(afterLeave.players[1].isHost, true);
await b.call('finishMatch', { code: room });
assert.equal((await view(b, room, 1)).stage, 'over');

console.log(`OK: room ${room}, ${hands} hands, ${moves} human moves, all rules held.`);
process.exit(0);
