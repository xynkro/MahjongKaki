import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, GameAction, WallTile } from '@mahjongkaki/game';
import { FRAME_MS, type FrameView, type SeatView } from '@mahjongkaki/online';
import { comeBack, playMove, tickRoom, watchSeat } from '../../lib/online-client';

// Past this many unplayed frames (phone was asleep) jump to the end rather than replay a whole hand.
const MAX_REPLAY = 8;

function hydrate(f: FrameView, prev: GameState | null): GameState {
  const { wallCount, ...open } = f.game;
  const lastDraw = open.lastDraw && prev?.lastDraw
    && prev.lastDraw.player === open.lastDraw.player && prev.lastDraw.tile === open.lastDraw.tile
    ? prev.lastDraw // GameBoard flashes on a new object; JSON hands us one every frame
    : open.lastDraw;
  return { ...open, lastDraw, wall: new Array<WallTile>(wallCount), deadWall: [] };
}

export interface Seat {
  /** Latest server word on the room. Stage changes wait for the replay, so a win isn't announced early. */
  view: SeatView | null;
  game: GameState | null;
  actions: GameAction[];
  secondsLeft: number | null;
  error: string | null;
  lost: boolean;
  move: (action: GameAction) => void;
  back: () => void;
  clearError: () => void;
}

export function useSeat(code: string, seat: number): Seat {
  const [view, setView] = useState<SeatView | null>(null);
  const [frame, setFrame] = useState<{ game: GameState; actions: GameAction[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lost, setLost] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const queue = useRef<FrameView[]>([]);
  const pendingView = useRef<SeatView | null>(null);
  const shownSeq = useRef(0);
  const lastGame = useRef<GameState | null>(null);
  const lastServerFrame = useRef<FrameView | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockOffset = useRef(0);
  const inFlight = useRef(false);

  const show = useCallback((f: FrameView) => {
    const game = hydrate(f, lastGame.current);
    lastGame.current = game;
    lastServerFrame.current = f;
    shownSeq.current = f.seq;
    setFrame({ game, actions: f.actions });
  }, []);

  const pump = useCallback(() => {
    timer.current = null;
    const next = queue.current.shift();
    if (next) {
      show(next);
      // Hold the last frame a beat before a result screen replaces the table.
      const hold = queue.current.length > 0 || pendingView.current?.stage === 'result';
      timer.current = setTimeout(pump, hold ? FRAME_MS : 0);
      return;
    }
    if (pendingView.current) setView(pendingView.current);
  }, [show]);

  useEffect(() => {
    const unsub = watchSeat(code, seat, v => {
      if (!v) { setLost(true); return; }
      clockOffset.current = v.serverNow - Date.now();
      pendingView.current = v;
      // Only the end of a hand waits for the replay. A new hand has to replace the old result screen at once.
      if (v.stage !== 'result' && v.stage !== 'over') setView(v);
      // Equal seq is the same frame restated (a vote landed, someone left): swap it without a beat.
      const fresh = v.frames.filter(f => f.seq >= shownSeq.current);
      const unseen = fresh.filter(f => f.seq > shownSeq.current);
      if (unseen.length === 0) {
        const same = fresh[fresh.length - 1];
        if (same) show(same);
        if (!timer.current) setView(v);
        return;
      }
      queue.current.push(...unseen);
      if (queue.current.length > MAX_REPLAY) queue.current = queue.current.slice(-1);
      if (!timer.current) pump();
    }, e => {
      // The read rule refuses a seat that isn't ours any more: the view was removed when we left.
      if ((e as { code?: string }).code === 'permission-denied') setLost(true);
      else setError('Lost touch with the room. Trying to reconnect…');
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [code, seat, pump, show]);

  // The clock: show the countdown, and once it runs out nudge the server, which checks for itself.
  const deadline = view?.deadline ?? null;
  useEffect(() => {
    if (deadline === null) { setSecondsLeft(null); return; }
    let nudged = 0;
    const id = setInterval(() => {
      const now = Date.now() + clockOffset.current;
      setSecondsLeft(Math.max(0, Math.ceil((deadline - now) / 1000)));
      if (now >= deadline + 1000 && now - nudged > 5000) {
        nudged = now;
        tickRoom(code).catch(() => { /* retried next round */ });
      }
    }, 500);
    return () => clearInterval(id);
  }, [deadline, code]);

  const away = view?.players[seat]?.away ?? false;
  const back = useCallback(() => { comeBack(code).catch(() => { /* retried on next visibility change */ }); }, [code]);

  // Coming back to the app means you're back at the table.
  useEffect(() => {
    if (!away) return;
    const onVisible = () => { if (document.visibilityState === 'visible') back(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [away, back]);

  const move = useCallback((action: GameAction) => {
    const cur = lastGame.current;
    if (!cur || inFlight.current) return;
    inFlight.current = true;
    // Show your own move at once. The server's next frame replaces this either way.
    let optimistic = cur;
    if (action.type === 'discard') {
      const hand = [...cur.hands[seat]];
      hand.splice(hand.indexOf(action.tile), 1);
      optimistic = {
        ...cur,
        hands: cur.hands.map((h, s) => (s === seat ? hand : h)),
        discardLog: [...cur.discardLog, { tile: action.tile, player: seat }],
        phase: 'draw', // stops the hand taking a second throw
        currentPlayer: (seat + 1) % 4,
      };
    } else if (cur.phase === 'claim') {
      optimistic = { ...cur, pendingClaims: [] };
    }
    lastGame.current = optimistic;
    setFrame({ game: optimistic, actions: [] });

    const undo = () => {
      const last = lastServerFrame.current;
      if (last && shownSeq.current === last.seq) show(last);
    };
    playMove(code, action)
      .then(r => { if (!r.applied) undo(); })
      .catch(() => { undo(); setError('That move did not reach the table. Try again.'); })
      .finally(() => { inFlight.current = false; });
  }, [code, seat, show]);

  return {
    view,
    game: frame?.game ?? null,
    actions: frame?.actions ?? [],
    secondsLeft,
    error,
    lost,
    move,
    back,
    clearError: () => setError(null),
  };
}
