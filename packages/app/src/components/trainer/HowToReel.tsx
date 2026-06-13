import { useState, useEffect } from 'react';
import { suit, wind, dragon, tileToIndex, type PlayTile } from '@mahjongkaki/engine';
import { TileFace } from '../game/TileFace';
import { haptics } from '../../lib/haptics';

// An animated, accurate "how to play" reel — built from the app's real painted
// tiles (never an AI video, so it can't show illegal hands). It cycles through
// the core ideas; each step re-deals its tiles with the standard entrance
// animation. Lightweight + fully offline. Auto-advance pauses under
// prefers-reduced-motion (users navigate with taps / dots instead).

interface Group { label: string; tiles: PlayTile[]; accent?: 'gold' | 'jade' }
interface Step { caption: string; groups: Group[] }

const STEPS: Step[] = [
  {
    caption: 'Win by building 4 sets + 1 pair — 14 tiles.',
    groups: [
      { label: 'Chow', tiles: [suit('bamboo', 2), suit('bamboo', 3), suit('bamboo', 4)] },
      { label: 'Pung', tiles: [suit('dot', 5), suit('dot', 5), suit('dot', 5)] },
      { label: 'Chow', tiles: [suit('character', 6), suit('character', 7), suit('character', 8)] },
      { label: 'Pung', tiles: [wind('east'), wind('east'), wind('east')] },
      { label: 'Pair', tiles: [dragon('red'), dragon('red')], accent: 'gold' },
    ],
  },
  {
    caption: 'A Pung is three identical tiles. Claim a discard to finish one.',
    groups: [
      { label: 'In hand', tiles: [suit('dot', 5), suit('dot', 5)] },
      { label: 'Claimed', tiles: [suit('dot', 5)], accent: 'jade' },
    ],
  },
  {
    caption: 'A Chow is a run of three in one suit (claim from your left).',
    groups: [
      { label: 'In hand', tiles: [suit('bamboo', 3), suit('bamboo', 4)] },
      { label: 'Claimed', tiles: [suit('bamboo', 5)], accent: 'jade' },
    ],
  },
];

function DemoTile({ tile, i }: { tile: PlayTile; i: number }) {
  return (
    <div
      className="w-9 h-12 relative rounded-[7px] flex items-center justify-center overflow-hidden tile-sheen border border-[#C6AE84] shadow-tile anim-tile"
      style={{
        backgroundImage: 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)',
        animationDelay: `${i * 55}ms`,
      }}
    >
      <TileFace index={tileToIndex(tile)} size="sm" />
    </div>
  );
}

export function HowToReel() {
  const [step, setStep] = useState(0);
  const total = STEPS.length;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % total), 4200);
    return () => clearTimeout(t);
  }, [step, total]);

  const advance = () => { haptics.tap(); setStep((s) => (s + 1) % total); };
  const s = STEPS[step];

  // A flat running index so the deal stagger flows across all groups.
  let runningIndex = 0;

  return (
    <button
      type="button"
      onClick={advance}
      aria-label="How to play — tap for the next idea"
      className="card w-full p-4 flex flex-col items-center gap-3 text-center active:scale-[0.99] transition-transform"
    >
      <div key={step} className="flex flex-wrap items-end justify-center gap-x-3 gap-y-3 min-h-[88px]">
        {s.groups.map((g, gi) => (
          <div key={gi} className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1">
              {g.tiles.map((t) => <DemoTile key={runningIndex} tile={t} i={runningIndex++} />)}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                g.accent === 'gold' ? 'gold-foil' : g.accent === 'jade' ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {g.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-200 leading-snug max-w-xs">{s.caption}</p>

      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-600'
            }`}
          />
        ))}
      </div>
    </button>
  );
}
