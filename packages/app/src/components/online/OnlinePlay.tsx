import { useEffect, useRef, useState } from 'react';
import type { Claim } from '@mahjongkaki/game';
import { GameBoard } from '../game/GameBoard';
import { ClaimOverlay } from '../game/ClaimOverlay';
import { RoundResult } from '../game/RoundResult';
import { Scoreboard, points } from '../game/Scoreboard';
import { haptics } from '../../lib/haptics';
import { getRules } from '../../lib/settings';
import { roomLink, savedRoom, saveRoom } from '../../lib/room-link';
import { createRoom, finishMatch, friendlyError, joinRoom, leaveRoom, readyUp, startRoom } from '../../lib/online-client';
import { useSeat } from './useSeat';

const NAME_KEY = 'mk_nick';

function savedName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; }
}

export function OnlinePlay({ initialCode, onExit }: { initialCode: string | null; onExit: () => void }) {
  const [seated, setSeated] = useState<{ code: string; seat: number } | null>(null);
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState(initialCode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enter = async (attempt: () => Promise<{ code: string; seat: number }>) => {
    setBusy(true);
    setError(null);
    try {
      const s = await attempt();
      saveRoom(s.code);
      setSeated(s);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const keepName = () => {
    try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* re-typed next time */ }
  };

  // Back into a room this phone is still in. joinRoom gives a seated player their own seat back.
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    const saved = savedRoom();
    const nick = savedName();
    if (saved && nick && (!initialCode || initialCode === saved)) {
      setBusy(true);
      joinRoom(saved, nick)
        .then(setSeated)
        .catch(() => {
          saveRoom(null);
          if (!initialCode) onExit(); // that room has gone: back to Play, not a join form nobody asked for
        })
        .finally(() => setBusy(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (busy && !seated && savedRoom()) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Finding your seat…</div>;
  }

  if (seated) {
    return <Room code={seated.code} seat={seated.seat} onLeft={() => { saveRoom(null); setSeated(null); setCode(''); onExit(); }} />;
  }

  const canName = name.trim().length > 0;
  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div>
        <button type="button" onClick={onExit} className="-ml-2 min-h-[44px] px-2 text-sm text-slate-400 active:text-slate-200">← Back</button>
        <h2 className="page-title">Play with friends</h2>
        <div className="page-title-rule" />
      </div>

      <section className="card p-4 space-y-2">
        <label htmlFor="nick" className="section-title block">Your nickname</label>
        <input
          id="nick"
          value={name}
          maxLength={16}
          autoComplete="off"
          onChange={e => setName(e.target.value)}
          className="w-full min-h-[44px] rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 text-base text-slate-100 outline-none focus:border-amber-400/60"
          placeholder="What friends call you"
        />
      </section>

      <section className="card p-4 space-y-3">
        <h3 className="section-title">Join a room</h3>
        <div className="flex gap-2">
          <input
            aria-label="Room code"
            value={code}
            maxLength={4}
            autoCapitalize="characters"
            autoComplete="off"
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="flex-1 min-w-0 min-h-[44px] rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 text-lg tracking-[0.3em] text-center text-slate-100 outline-none focus:border-amber-400/60"
            placeholder="CODE"
          />
          <button
            type="button"
            disabled={busy || !canName || code.trim().length !== 4}
            onClick={() => { haptics.select(); keepName(); void enter(() => joinRoom(code.trim(), name.trim())); }}
            className="min-h-[44px] px-5 btn-primary rounded-lg text-sm font-semibold disabled:opacity-40"
          >
            Join
          </button>
        </div>
      </section>

      <button
        type="button"
        disabled={busy || !canName}
        onClick={() => { haptics.success(); keepName(); void enter(async () => createRoom(name.trim(), getRules())); }}
        className="w-full min-h-[52px] btn-gold rounded-xl text-base font-semibold disabled:opacity-40"
      >
        {busy ? 'One moment…' : 'Create a room'}
      </button>

      {error && <p role="alert" className="text-sm text-red-300 text-center">{error}</p>}

      <p className="text-xs text-slate-500 leading-relaxed">
        Points only, for fun. Nothing here is money, and it isn&apos;t for playing for money.
        Your nickname and moves go through our server for this game, and are deleted automatically within about two days.
      </p>
    </div>
  );
}

function Room({ code, seat, onLeft }: { code: string; seat: number; onLeft: () => void }) {
  const s = useSeat(code, seat);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [sent, setSent] = useState(false);
  const [readyError, setReadyError] = useState<string | null>(null);
  const { view, game } = s;

  useEffect(() => { if (s.lost) onLeft(); }, [s.lost]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSent(false); }, [view?.progress.handNo, view?.stage]);

  const leave = () => {
    setConfirmLeave(false);
    leaveRoom(code).catch(() => { /* the deadline hands the seat to the AI anyway */ });
    onLeft();
  };

  if (!view) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Finding your seat…</div>;
  }

  const me = view.players[seat];
  const names = view.players.map((p, i) => (i === seat ? 'You' : p.name));

  const leaveDialog = confirmLeave && (
    <div className="app-full z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="leave-title" className="card anim-pop w-full max-w-sm p-6 text-center space-y-4">
        <h2 id="leave-title" className="font-display text-2xl text-slate-100">Leave this room?</h2>
        <p className="text-sm text-slate-300">An AI takes your seat, and you can&apos;t rejoin this game.</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setConfirmLeave(false)} className="min-h-[44px] btn-ghost rounded-xl text-sm font-medium">Stay</button>
          <button type="button" onClick={leave} className="min-h-[44px] text-sm font-medium text-red-300 bg-red-900/40 rounded-xl active:bg-red-900/60">Leave</button>
        </div>
      </div>
    </div>
  );

  if (view.stage === 'lobby') {
    const humans = view.players.filter(p => !p.isAi).length;
    const share = async () => {
      haptics.select();
      const url = roomLink(code);
      try {
        if (navigator.share) await navigator.share({ title: 'MahjongKaki', text: `Join my mahjong room: ${code}`, url });
        else await navigator.clipboard.writeText(url);
      } catch { /* cancelled the share sheet */ }
    };
    return (
      <div className="px-4 pt-4 pb-4 space-y-4">
        <section className="card anim-rise p-6 text-center">
          <p className="section-title">Room code</p>
          <p className="font-display text-5xl tracking-[0.2em] text-slate-50 mt-2 pl-[0.2em]">{code}</p>
          <button type="button" onClick={() => void share()} className="mt-4 min-h-[44px] px-6 btn-ghost rounded-xl text-sm font-medium">Invite friends</button>
        </section>
        <section className="card p-4">
          <h3 className="section-title mb-2">At the table</h3>
          <ul className="space-y-2">
            {view.players.map((p, i) => (
              <li key={i} className="flex items-center justify-between text-sm min-h-[28px]">
                <span className={p.isAi ? 'text-slate-500' : 'text-slate-100'}>{i === seat ? `${p.name} (you)` : p.isAi ? 'Empty: AI plays' : p.name}</span>
                {p.isHost && <span className="text-xs text-amber-400">Host</span>}
              </li>
            ))}
          </ul>
        </section>
        {s.error && <p role="alert" className="text-sm text-red-300 text-center">{s.error}</p>}
        {me.isHost ? (
          <button
            type="button"
            onClick={() => { haptics.success(); startRoom(code).catch(e => setReadyError(friendlyError(e))); }}
            className="w-full min-h-[52px] btn-primary rounded-xl text-base font-semibold"
          >
            {humans === 4 ? 'Start' : `Start with ${4 - humans} AI`}
          </button>
        ) : (
          <p className="text-sm text-slate-300 text-center">Waiting for the host to start…</p>
        )}
        {readyError && <p role="alert" className="text-sm text-red-300 text-center">{readyError}</p>}
        <button type="button" onClick={leave} className="w-full min-h-[44px] text-sm text-slate-400 active:text-slate-200">Leave room</button>
      </div>
    );
  }

  if (view.stage === 'over') {
    const leader = view.progress.totals.indexOf(Math.max(...view.progress.totals));
    return (
      <div className="space-y-4 px-4 pt-4 pb-4">
        <section className="card anim-rise p-6 text-center">
          <h2 className={`text-2xl font-bold mb-1 ${leader === seat ? 'text-emerald-400' : 'text-slate-200'}`}>
            {leader === seat ? 'You came out ahead!' : `${names[leader]} came out ahead`}
          </h2>
          <p className="text-slate-400 text-xs">{view.progress.handNo - 1} hands played</p>
        </section>
        <Scoreboard match={{ ...view.progress, humanSeat: seat }} amount={points} names={names} />
        <button type="button" onClick={onLeft} className="w-full min-h-[48px] btn-primary text-base font-semibold rounded-xl">Done</button>
      </div>
    );
  }

  if (!game) return null;

  if (view.stage === 'result') {
    const others = view.players.filter((p, i) => i !== seat && !p.isAi && !p.ready && !p.away).map(p => p.name);
    return (
      <div className="px-4 pt-4">
        {/* key: a new hand is a new result screen, with its own sounds and chips */}
        <RoundResult
          key={view.progress.handNo}
          state={game}
          match={{ ...view.progress, humanSeat: seat }}
          deltas={view.deltas ?? [0, 0, 0, 0]}
          amount={points}
          names={names}
          waitingNote={sent || me.ready ? `Waiting for ${others.join(', ') || 'the deal'}…` : undefined}
          endLabel={me.isHost ? 'End match' : 'Leave'}
          onNextHand={() => {
            setSent(true);
            readyUp(code).catch(e => { setSent(false); setReadyError(friendlyError(e)); });
          }}
          onEndMatch={() => {
            if (me.isHost) finishMatch(code).catch(e => setReadyError(friendlyError(e)));
            else setConfirmLeave(true);
          }}
        />
        {readyError && <p role="alert" className="text-sm text-red-300 text-center pb-4">{readyError}</p>}
        {leaveDialog}
      </div>
    );
  }

  const myClaims = game.phase === 'claim' ? game.pendingClaims.filter(c => c.player === seat) : [];
  const myTurn = game.phase === 'discard' && game.currentPlayer === seat;
  const waitingFor = view.waitingOn.filter(w => w !== seat).map(w => view.players[w].name);
  const clock = s.secondsLeft !== null && (myTurn || myClaims.length > 0) ? ` · ${s.secondsLeft}s` : '';
  const statusText = myTurn
    ? `Your turn${clock}`
    : myClaims.length > 0
      ? `Claim?${clock}`
      : waitingFor.length > 0 ? `Waiting for ${waitingFor[0]}…` : `${names[game.currentPlayer]} playing…`;

  return (
    <div className="flex flex-col h-full">
      {me.away && (
        <button type="button" onClick={s.back} className="min-h-[44px] bg-amber-600/90 text-white text-sm font-semibold active:bg-amber-500">
          The AI is playing for you. Tap when you&apos;re back.
        </button>
      )}
      {s.error && (
        <button type="button" onClick={s.clearError} role="alert" className="min-h-[36px] bg-red-900/80 text-red-100 text-xs px-3">{s.error}</button>
      )}
      <div className="flex-1 overflow-hidden">
        <GameBoard
          state={game}
          availableActions={s.actions}
          onDiscard={tile => s.move({ type: 'discard', tile })}
          onDeclareKong={tile => s.move({ type: 'declare_kong', tile })}
          onTsumo={() => s.move({ type: 'claim', claimType: 'win', player: seat, tilesFromHand: [] })}
          onQuit={() => setConfirmLeave(true)}
          seatNames={names}
          statusText={statusText}
        />
      </div>
      {myClaims.length > 0 && game.lastDiscard && s.actions.length > 0 && (
        <ClaimOverlay
          claims={myClaims}
          lastDiscardTile={game.lastDiscard.tile}
          onClaim={(c: Claim) => s.move({ type: 'claim', claimType: c.claimType, player: seat, tilesFromHand: c.tilesFromHand })}
          onSkip={() => s.move({ type: 'skip_claim' })}
        />
      )}
      {leaveDialog}
    </div>
  );
}
