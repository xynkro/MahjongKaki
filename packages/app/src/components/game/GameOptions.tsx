// Game options with plain on/off switches: how the table looks, how much help you get, and
// (before a match) the house rules. Shown on the Play setup screen and from Options in a game.
import { type RulesConfig } from '@mahjongkaki/engine';
import { useDisplay, setDisplay } from '../../lib/display';
import { useRules, setRule } from '../../lib/settings';
import { Row, Toggle, Segmented, Stepper } from '../SettingsSheet';

interface Props {
  /** Mid-match the house rules are fixed; they show as a summary instead. */
  inGame?: boolean;
  /** Rules in force for the match being played (inGame only). */
  matchRules?: RulesConfig;
  fast?: boolean;
  onFast?: (v: boolean) => void;
}

export function GameOptions({ inGame, matchRules, fast, onFast }: Props) {
  const d = useDisplay();
  const saved = useRules();
  const rules = inGame && matchRules ? matchRules : saved;
  const set = <K extends keyof RulesConfig>(k: K, v: RulesConfig[K]) => setRule(k, v);
  const shooter = { standard: 'Thrower pays double', halfShooter: 'Thrower pays half', shooterPaysAll: 'Thrower pays for everyone' }[rules.shooterMode];

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h3 className="section-title mb-1">Table and help</h3>
        <Row label="3D table" desc="The table in perspective, with the wall and everyone's tiles. Off: a flat list with bigger tiles.">
          <Toggle value={d.table3d} onChange={v => setDisplay('table3d', v)} />
        </Row>
        <Row label="Turn guide" desc="Says whose turn it is and what you can do: draw, throw, call or skip.">
          <Toggle value={d.turnGuide} onChange={v => setDisplay('turnGuide', v)} />
        </Row>
        <Row label="Coach" desc="Suggests a tile to throw, and whether to call, with a reason.">
          <Toggle value={d.coach} onChange={v => setDisplay('coach', v)} />
        </Row>
        <Row label="Draw tiles yourself" desc="Tap the wall to take your tile, as at a real table.">
          <Toggle value={d.drawYourself} onChange={v => setDisplay('drawYourself', v)} />
        </Row>
        <Row label="Show the deal" desc="The wall being built, the dice, and who takes tiles first.">
          <Toggle value={d.showDeal} onChange={v => setDisplay('showDeal', v)} />
        </Row>
        <Row label="Beginner tile labels" desc="Numbers on suit tiles, English names on winds and dragons.">
          <Toggle value={d.tileMode === 'beginner'} onChange={v => setDisplay('tileMode', v ? 'beginner' : 'classic')} />
        </Row>
        {onFast && (
          <Row label="Faster AI" desc="The other players move quicker. Your own turns are never timed.">
            <Toggle value={Boolean(fast)} onChange={onFast} />
          </Row>
        )}
      </section>

      <section className="card p-4">
        <h3 className="section-title mb-1">House rules</h3>
        {inGame ? (
          <>
            <ul className="text-sm text-slate-300 space-y-1 py-1">
              <li>Win with at least {rules.minTai} tai{rules.taiCap ? `, paid up to ${rules.taiCap}` : ', no limit'}.</li>
              <li>{shooter} when you win off their throw.</li>
              <li>Animals {rules.animalsEnabled ? 'in play' : 'out'}. Instant payments for kongs and flowers {rules.instantKongPayments || rules.instantFlowerPayments ? 'on' : 'off'}.</li>
            </ul>
            <p className="text-xs text-slate-500 leading-snug">These are fixed for this match. Change them before your next one, on the Play screen.</p>
          </>
        ) : (
          <>
            <Row label="Thrower pays (shooter)" desc="When someone wins off a tile you threw.">
              <Segmented
                value={rules.shooterMode}
                options={[{ value: 'standard', label: 'Double' }, { value: 'shooterPaysAll', label: 'All' }, { value: 'halfShooter', label: 'Half' }]}
                onChange={v => set('shooterMode', v as RulesConfig['shooterMode'])}
              />
            </Row>
            <Row label="Minimum tai" desc="A hand below this can't win.">
              <Stepper value={rules.minTai} min={0} max={4} onChange={v => set('minTai', v)} />
            </Row>
            <Row label="Maximum tai" desc="The most a hand is paid.">
              <Segmented
                value={rules.taiCap}
                options={[{ value: 5, label: '5' }, { value: 7, label: '7' }, { value: 10, label: '10' }, { value: null, label: 'None' }]}
                onChange={v => set('taiCap', v)}
              />
            </Row>
            <Row label="Animals" desc="Cat, rat, rooster and centipede tiles.">
              <Toggle value={rules.animalsEnabled} onChange={v => set('animalsEnabled', v)} />
            </Row>
            <Row label="Instant payments" desc="Kongs and flower sets are paid as soon as they're shown.">
              <Toggle
                value={rules.instantKongPayments || rules.instantFlowerPayments}
                onChange={v => { set('instantKongPayments', v); set('instantFlowerPayments', v); }}
              />
            </Row>
            <p className="text-xs text-slate-500 leading-snug pt-1">More rules (dealer double, ping hu, flowers) are in Settings, under the gear.</p>
          </>
        )}
      </section>
    </div>
  );
}
