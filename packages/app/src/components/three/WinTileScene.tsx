import { useEffect, useRef, useState } from 'react';
import { indexToTile } from '@mahjongkaki/engine';
import { TileFace } from '../game/TileFace';
import { tileLabelLong } from '../../lib/tile-labels';
import { prefersReducedMotion } from './motion';

// 'loading' hides the tile while the lazy 3D chunk arrives (so the CSS tile does
// not flash and vanish), 'slow' shows the static CSS tile if that takes too long,
// 'fallback' is the CSS spin (reduced motion, no WebGL, import failed, context lost).
type Mode = 'loading' | 'slow' | 'ready' | 'fallback';

const SLOW_MS = 600;
const GIVE_UP_MS = 4000;

/**
 * The win tile. The CSS version (real TileFace art) is always in the DOM and is
 * what shows unless the 3D version is up. The scene box is reserved from first
 * paint, so nothing shifts when the canvas arrives.
 */
export function WinTileScene({ tile }: { tile: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(() => (prefersReducedMotion() ? 'fallback' : 'loading'));

  useEffect(() => {
    if (prefersReducedMotion()) { setMode('fallback'); return; }
    setMode('loading');
    let cancelled = false;
    let isReady = false;
    let dispose: (() => void) | null = null;
    const slow = window.setTimeout(() => setMode(m => (m === 'loading' ? 'slow' : m)), SLOW_MS);
    const giveUp = window.setTimeout(() => {
      if (isReady) return;
      cancelled = true;
      dispose?.();
      setMode('fallback');
    }, GIVE_UP_MS);

    import('./winTile')
      .then(m => {
        const host = hostRef.current;
        if (cancelled || !host) return;
        dispose = m.mountWinTile(host, tile, {
          ready: () => { if (!cancelled) { isReady = true; setMode('ready'); } },
          fail: () => { if (!cancelled) setMode('fallback'); },
        });
      })
      .catch(() => { if (!cancelled) setMode('fallback'); });

    return () => {
      cancelled = true;
      clearTimeout(slow);
      clearTimeout(giveUp);
      dispose?.();
    };
  }, [tile]);

  return (
    <div className="wintile-scene mb-3" data-3d={mode} role="img" aria-label={`Winning tile: ${tileLabelLong(indexToTile(tile))}`}>
      <div className="wintile3d">
        <div className="wintile-front">
          <div className="wintile-face"><TileFace index={tile} /></div>
        </div>
        <div className="wintile-back" />
      </div>
      <div className="wintile-gl" ref={hostRef} />
    </div>
  );
}
