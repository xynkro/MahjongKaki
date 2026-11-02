import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DiceHandle, DiceValues } from './dice';
import { prefersReducedMotion } from './motion';

export interface DiceRoll {
  id: number;
  /** Already drawn from the RNG: the animation only lands on these. */
  values: DiceValues;
}

interface Props {
  roll: DiceRoll | null;
  /** Called exactly once per roll when the final faces are showing (3D landed, or CSS shown). */
  onSettled: (id: number) => void;
  /** The CSS dice, shown when 3D is unavailable (reduced motion, no WebGL, import failed, context lost). */
  fallback: (values: DiceValues) => ReactNode;
}

// How long the first roll may wait for the lazy 3D chunk before showing the CSS dice instead.
const GRACE_MS = 800;

/**
 * Fixed-size dice tray. The size is reserved from first paint (the canvas fills
 * it), so rolling never moves the page. The 3D module loads on the first roll;
 * one renderer then serves every later roll in this mount and is disposed on
 * unmount. Each mount creates its own canvas (StrictMode mount/unmount/mount safe).
 */
export function DiceStage({ roll, onSettled, fallback }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'gl' | 'css'>('gl');
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  const ctl = useRef({
    gen: 0,
    handle: null as DiceHandle | null,
    pending: null as Promise<DiceHandle | null> | null,
    broken: false,
    inflight: null as number | null,
  });

  // Unmount (and the StrictMode dev remount cycle): drop the renderer and its canvas.
  useEffect(() => {
    const c = ctl.current;
    return () => {
      c.gen++;
      c.handle?.dispose();
      c.handle = null;
      c.pending = null;
      c.broken = false;
      c.inflight = null;
    };
  }, []);

  useEffect(() => {
    if (!roll) return;
    const c = ctl.current;
    const { id, values } = roll;
    const showCss = () => { setView('css'); settledRef.current(id); };
    if (c.broken || prefersReducedMotion()) { showCss(); return; }

    const gen = c.gen;
    const ensure = (): Promise<DiceHandle | null> => {
      if (c.handle) return Promise.resolve(c.handle);
      if (!c.pending) {
        c.pending = import('./dice')
          .then(m => {
            const host = hostRef.current;
            if (!host || gen !== c.gen) return null;
            c.handle = m.createDiceStage(host, {
              lost: () => {
                c.handle = null;
                c.pending = null;
                c.broken = true;
                setView('css');
                if (c.inflight !== null) { const f = c.inflight; c.inflight = null; settledRef.current(f); }
              },
            });
            return c.handle;
          })
          .catch(() => { c.broken = true; return null; }); // import failed or no WebGL
      }
      return c.pending;
    };

    let stale = false;
    let timer = 0;
    const grace = new Promise<null>(resolve => { timer = window.setTimeout(() => resolve(null), GRACE_MS); });
    Promise.race([ensure(), grace]).then(handle => {
      clearTimeout(timer);
      if (stale || gen !== c.gen) return;
      if (!handle) { showCss(); return; }
      setView('gl');
      c.inflight = id;
      handle.roll(values, () => {
        if (c.inflight !== id) return;
        c.inflight = null;
        settledRef.current(id);
      });
    });
    return () => { stale = true; clearTimeout(timer); };
  }, [roll?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative mt-3 h-[120px] overflow-hidden rounded-xl bg-slate-900/50">
      <div
        ref={hostRef}
        aria-hidden="true"
        className={`absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full ${view === 'gl' ? '' : 'invisible'}`}
      />
      {!roll && (
        <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Dice land here</p>
      )}
      {roll && view === 'css' && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">{fallback(roll.values)}</div>
      )}
    </div>
  );
}
