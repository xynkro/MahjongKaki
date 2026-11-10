// First open: one question, so a total beginner and a regular player land in the right place.
import { setLevel, type Level } from '../lib/progress';
import { haptics } from '../lib/haptics';

const OPTIONS: { level: Level; title: string; desc: string }[] = [
  { level: 'new', title: 'I’ve never played', desc: 'Start from the tiles. No experience needed.' },
  { level: 'basics', title: 'I know a little', desc: 'You’ve watched or played a few hands.' },
  { level: 'player', title: 'I already play', desc: 'Go straight to a game, with the coach on hand.' },
];

export function LevelPick({ onPicked }: { onPicked: (level: Level) => void }) {
  const pick = (level: Level) => {
    haptics.select();
    setLevel(level);
    onPicked(level);
  };

  return (
    <div className="app-full z-50 bg-bg flex flex-col px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
      <div className="max-w-lg w-full mx-auto">
        <h1 className="font-display text-[32px] leading-tight text-ink">
          Mahjong<span className="text-accent">Kaki</span>
        </h1>
        <p className="text-mute mt-2 text-[17px]">Singapore mahjong, in plain English. How much do you know already?</p>
        <div className="mt-8 flex flex-col gap-3">
          {OPTIONS.map((o, i) => (
            <button
              key={o.level}
              onClick={() => pick(o.level)}
              className="card p-4 text-left active:scale-[0.98] transition-transform anim-rise"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="text-lg font-semibold text-ink">{o.title}</div>
              <div className="text-mute text-sm mt-0.5">{o.desc}</div>
            </button>
          ))}
        </div>
        <p className="text-mute text-xs mt-6">You can change this any time. Everything stays on this phone.</p>
      </div>
    </div>
  );
}
