import { useState, type ReactNode } from 'react';
import { type RulesConfig } from '@mahjongkaki/engine';
import { useRules, setRule, resetRules } from '../lib/settings';
import { haptics, sound, setHapticsEnabled, hapticsEnabled } from '../lib/haptics';

function Row({ label, desc, children }: { label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-sm text-slate-200">{label}</div>
        {desc && <div className="text-xs text-slate-500 leading-snug">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => { haptics.select(); onChange(!value); }}
      className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-emerald-600' : 'bg-slate-700'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-slate-100 transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function Segmented<T extends string | number | null>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button
          key={String(o.value)}
          onClick={() => { haptics.select(); onChange(o.value); }}
          className={`min-h-[36px] px-3 rounded-lg text-sm font-medium transition-colors ${
            value === o.value ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-300 active:bg-slate-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const step = (d: number) => { const n = Math.max(min, Math.min(max, value + d)); if (n !== value) { haptics.tap(); onChange(n); } };
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => step(-1)} className="h-9 w-9 rounded-lg bg-slate-700 text-slate-200 text-lg active:bg-slate-600">−</button>
      <span className="w-6 text-center text-base font-semibold text-amber-400">{value}</span>
      <button onClick={() => step(1)} className="h-9 w-9 rounded-lg bg-slate-700 text-slate-200 text-lg active:bg-slate-600">+</button>
    </div>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rules = useRules();
  const [snd, setSnd] = useState(sound.enabled);
  const [hap, setHap] = useState(hapticsEnabled());
  if (!open) return null;

  const set = <K extends keyof RulesConfig>(k: K, v: RulesConfig[K]) => setRule(k, v);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="max-w-lg mx-auto p-4 pb-12 space-y-4">
          <div className="flex items-center justify-between sticky top-0 -mx-4 px-4 py-3 bg-slate-950/80 backdrop-blur z-10">
            <h2 className="font-display text-xl text-slate-100">House Rules</h2>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 grid place-items-center text-slate-400 active:scale-90 text-lg">✕</button>
          </div>
          <p className="text-sm text-slate-400 -mt-1">
            These apply to the calculator, chip tracker, and AI match. Set them to match how your table plays.
          </p>

          <section className="card p-4">
            <h3 className="section-title mb-1">Scoring</h3>
            <Row label="Minimum tai to win" desc="A hand below this can't win (SG: usually 1).">
              <Stepper value={rules.minTai} min={0} max={4} onChange={v => set('minTai', v)} />
            </Row>
            <Row label="Tai cap (limit)" desc="Maximum tai paid out.">
              <Segmented
                value={rules.taiCap}
                options={[{ value: 5, label: '5' }, { value: 7, label: '7' }, { value: 10, label: '10' }, { value: null, label: 'None' }]}
                onChange={v => set('taiCap', v)}
              />
            </Row>
            <Row label="Concealed hand (門清)" desc="Bonus tai for a fully concealed win.">
              <Stepper value={rules.concealedHandTai} min={0} max={2} onChange={v => set('concealedHandTai', v)} />
            </Row>
            <Row label="Zimo counts as a tai" desc="Self-draw adds one tai.">
              <Toggle value={rules.zimoAsTai} onChange={v => set('zimoAsTai', v)} />
            </Row>
          </section>

          <section className="card p-4">
            <h3 className="section-title mb-1">Payout</h3>
            <Row label="Shooter (放铳) pays" desc="Who pays on a discard win.">
              <Segmented
                value={rules.shooterMode}
                options={[{ value: 'standard', label: 'Double' }, { value: 'halfShooter', label: 'Half' }, { value: 'shooterPaysAll', label: 'All' }]}
                onChange={v => set('shooterMode', v as RulesConfig['shooterMode'])}
              />
            </Row>
            <Row label="Dealer pays/wins double" desc="Banker (庄) settles at 2×.">
              <Toggle value={rules.dealerDouble} onChange={v => set('dealerDouble', v)} />
            </Row>
          </section>

          <section className="card p-4">
            <h3 className="section-title mb-1">Bonus tiles</h3>
            <Row label="Animals in play" desc="Use the cat / rat / rooster / centipede tiles.">
              <Toggle value={rules.animalsEnabled} onChange={v => set('animalsEnabled', v)} />
            </Row>
            <Row label="Any flower scores" desc="Off = only your own seat's flower/season scores.">
              <Toggle value={rules.anyFlowerScores} onChange={v => set('anyFlowerScores', v)} />
            </Row>
            <Row label="No-flower bonus" desc="Tai for finishing with zero bonus tiles.">
              <Toggle value={rules.noFlowerBonus} onChange={v => set('noFlowerBonus', v)} />
            </Row>
          </section>

          <section className="card p-4">
            <h3 className="section-title mb-1">Advanced</h3>
            <Row label="Ping wu (平胡) tai" desc="Tai awarded for a no-tai 'flat' hand.">
              <Stepper value={rules.pingWuTai} min={0} max={6} onChange={v => set('pingWuTai', v)} />
            </Row>
            <Row label="Instant kong payment">
              <Toggle value={rules.instantKongPayments} onChange={v => set('instantKongPayments', v)} />
            </Row>
            <Row label="Instant flower payment">
              <Toggle value={rules.instantFlowerPayments} onChange={v => set('instantFlowerPayments', v)} />
            </Row>
          </section>

          <section className="card p-4">
            <h3 className="section-title mb-1">Feedback</h3>
            <Row label="Sound effects" desc="Tile clicks, wins, flowers (works on iPhone).">
              <Toggle value={snd} onChange={v => { sound.setEnabled(v); setSnd(v); if (v) sound.tap(); }} />
            </Row>
            <Row label="Haptics" desc="Vibration on Android devices.">
              <Toggle value={hap} onChange={v => { setHapticsEnabled(v); setHap(v); }} />
            </Row>
          </section>

          <button
            onClick={() => { haptics.error(); resetRules(); }}
            className="w-full min-h-[44px] text-sm font-medium bg-slate-800 text-slate-300 rounded-xl border border-slate-700 active:scale-95"
          >
            Reset to Singapore defaults
          </button>
        </div>
      </div>
    </div>
  );
}
