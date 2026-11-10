import { useState } from 'react';
import { type AiProfile, ALL_PROFILES } from '@mahjongkaki/ai';
import { STAKE_PRESETS } from '@mahjongkaki/engine';
import { haptics } from '../../lib/haptics';
import { useDisplay } from '../../lib/display';

export type SpeedSetting = 'slow' | 'normal' | 'fast' | 'instant';

export interface MatchConfig {
  difficulty: AiProfile['difficulty'];
  speed: SpeedSetting;
  humanSeat: number;
  stakeIndex: number;
}

interface GameSetupProps {
  onStart: (config: MatchConfig) => void;
  onOnline: () => void;
}

export function GameSetup({ onStart, onOnline }: GameSetupProps) {
  const { money, coach } = useDisplay();
  const [difficulty, setDifficulty] = useState<AiProfile['difficulty']>('easy');
  const [speed, setSpeed] = useState<SpeedSetting>('normal');
  const [humanSeat, setHumanSeat] = useState(0);
  const [stakeIndex, setStakeIndex] = useState(0);
  const [more, setMore] = useState(false);

  const seatLabels = ['East', 'South', 'West', 'North'];
  const pill = (active: boolean) => `seg min-h-[44px] text-sm ${active ? 'seg-on' : 'seg-off'}`;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-2">
      <div className="pt-2">
        <h1 className="font-display text-[28px] leading-tight text-ink">Play a game</h1>
        <p className="text-mute mt-1">
          You against three AI players, scored in {money ? 'cents' : 'points'}.
          {coach ? ' The coach suggests a throw on each turn; tap Hide to play on your own.' : ' The coach is off; turn it on in Settings.'}
        </p>
      </div>

      <section className="card p-4">
        <h3 className="section-title mb-3">How strong are the AI players?</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PROFILES.map(p => (
            <button key={p.difficulty} type="button"
              onClick={() => { haptics.select(); setDifficulty(p.difficulty); }}
              className={pill(difficulty === p.difficulty)}>
              {p.name}
            </button>
          ))}
        </div>
      </section>

      <button type="button" onClick={() => setMore(m => !m)} className="w-full text-left text-sm text-mute px-1 py-1" aria-expanded={more}>
        {more ? 'Fewer options' : 'More options: speed, seat'}{money ? ', stake' : ''}
      </button>

      {more && (
        <>
          <section className="card p-4">
            <h3 className="section-title mb-3">Game speed</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {(['slow', 'normal', 'fast', 'instant'] as const).map(s => (
                <button key={s} type="button"
                  onClick={() => { haptics.select(); setSpeed(s); }}
                  className={`${pill(speed === s)} text-xs`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <h3 className="section-title mb-3">Your seat</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {seatLabels.map((label, i) => (
                <button key={i} type="button"
                  onClick={() => { haptics.select(); setHumanSeat(i); }}
                  className={`${pill(humanSeat === i)} text-xs`}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {money && (
            <section className="card p-4">
              <h3 className="section-title mb-3">Stake</h3>
              <div className="grid grid-cols-3 gap-2">
                {STAKE_PRESETS.map((s, i) => (
                  <button key={s.label} type="button"
                    onClick={() => { haptics.select(); setStakeIndex(i); }}
                    className={pill(stakeIndex === i)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <button type="button"
        onClick={() => { haptics.success(); onStart({ difficulty, speed, humanSeat, stakeIndex: money ? stakeIndex : -1 }); }}
        className="btn-primary w-full h-14 text-[17px] rounded-xl">
        Start game
      </button>

      <button
        type="button"
        onClick={() => { haptics.select(); onOnline(); }}
        className="card w-full p-4 flex items-center justify-between gap-3 text-left active:scale-[0.99]"
      >
        <span>
          <span className="block text-base font-semibold text-ink">Play with friends</span>
          <span className="block text-sm text-mute mt-0.5">A private room for up to four, scored in points. AI fills empty seats.</span>
        </span>
        <span aria-hidden className="text-accent text-lg">→</span>
      </button>
    </div>
  );
}
