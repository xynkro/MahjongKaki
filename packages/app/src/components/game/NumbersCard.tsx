// Quick reference for the Chinese numbers on character tiles, opened from the game's status bar.
import { useEffect, useRef } from 'react';
import { tileToIndex, suit } from '@mahjongkaki/engine';
import { TileFace } from './TileFace';

const ROWS: { v: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; say: string; cue: string }[] = [
  { v: 1, say: 'yī', cue: 'one line' },
  { v: 2, say: 'èr', cue: 'two lines' },
  { v: 3, say: 'sān', cue: 'three lines' },
  { v: 4, say: 'sì', cue: 'box, two marks inside' },
  { v: 5, say: 'wǔ', cue: 'flat top and bottom' },
  { v: 6, say: 'liù', cue: 'dot on top, two legs' },
  { v: 7, say: 'qī', cue: 'cross, bends right' },
  { v: 8, say: 'bā', cue: 'two strokes spreading' },
  { v: 9, say: 'jiǔ', cue: 'leg sweeps down-left' },
];

export function NumbersCard({ onClose }: { onClose: () => void }) {
  const done = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  // Move focus into the card, close on Escape, and hand focus back to the opener afterwards.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    done.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, []); // once: the game re-renders under the card as bots play

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose} role="dialog" aria-modal="true" aria-label="Chinese numbers 1 to 9">
      <div
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-[#1d0d07] border-t border-amber-400/20 px-4 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-amber-50 text-[18px] font-semibold">Chinese numbers 1 to 9</h2>
        <p className="text-amber-100/75 text-[14px] mt-1">The top character is the number. 萬 underneath means a character tile.</p>
        <ul className="grid grid-cols-3 gap-2 mt-4">
          {ROWS.map(r => (
            <li key={r.v} className="flex flex-col items-center rounded-xl bg-black/30 py-2">
              <div className="w-[46px] h-[64px] rounded-md bg-[#FBF4E4] shadow overflow-hidden">
                <TileFace index={tileToIndex(suit('character', r.v))} tag={false} />
              </div>
              <span className="text-amber-50 text-[22px] font-bold leading-none mt-1.5">{r.v}</span>
              <span className="text-amber-100/70 text-[12px] italic">{r.say}</span>
              <span className="text-amber-100/80 text-[12px] text-center leading-tight px-1">{r.cue}</span>
            </li>
          ))}
        </ul>
        <button ref={done} onClick={onClose} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-4">Got it</button>
      </div>
    </div>
  );
}
