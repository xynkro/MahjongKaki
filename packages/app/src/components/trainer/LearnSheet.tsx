import { type ReactNode } from 'react';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-4 space-y-1">
      <h3 className="section-title mb-1">{title}</h3>
      <div className="text-sm text-slate-300 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Term({ name, cjk, children }: { name: string; cjk?: string; children: ReactNode }) {
  return (
    <div className="py-2 border-b border-slate-800 last:border-0">
      <div className="text-sm font-semibold text-slate-100">
        {name} {cjk && <span className="font-normal text-amber-400/80">{cjk}</span>}
      </div>
      <div className="text-sm text-slate-400 leading-snug mt-0.5">{children}</div>
    </div>
  );
}

export function LearnSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <header
        className="shrink-0 px-4 pb-3 bg-slate-900/95 border-b border-amber-400/15"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.85rem)' }}
      >
        <h2 className="font-display text-xl text-slate-100 max-w-lg mx-auto">Learn the Basics</h2>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <p className="text-sm text-slate-400">
            New to mahjong? Here's everything you need in plain English. Tip: turn on
            <strong className="text-slate-200"> Beginner tile labels</strong> in Settings (⚙) to put
            numbers and letters on every tile.
          </p>

          <Section title="The goal">
            <p>
              Be the first to complete a <strong className="text-slate-100">winning hand</strong>:
              <strong className="text-amber-400"> 4 sets + 1 pair</strong> (14 tiles).
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>A <strong className="text-slate-200">set</strong> = three-of-a-kind (a "pung"), or a run of three in the same suit (a "chow"), or four-of-a-kind (a "kong").</li>
              <li>A <strong className="text-slate-200">pair</strong> = two identical tiles (your "eyes").</li>
            </ul>
          </Section>

          <Section title="How a turn works">
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>You hold 13 tiles. On your turn you <strong className="text-slate-200">draw</strong> one (now 14) and <strong className="text-slate-200">discard</strong> one (back to 13).</li>
              <li>When another player discards, you may <strong className="text-slate-200">claim</strong> it to finish a set (Pung / Chow / Kong) — or to <strong className="text-emerald-400">win</strong>.</li>
              <li>The hand ends when someone declares a complete hand, or the wall runs out (a draw).</li>
              <li>In this app: drag a tile up to throw it, or tap to select then tap again.</li>
            </ul>
          </Section>

          <Section title="Glossary">
            <Term name="Tai" cjk="台">
              The "points" a winning hand is worth — bigger/rarer patterns = more tai. The payout
              <strong className="text-slate-200"> doubles with each tai</strong>. Most tables need a minimum (usually 1 tai) to win.
            </Term>
            <Term name="Shooter" cjk="放铳">
              The player who discards the exact tile someone wins on. Depending on house rules the shooter
              pays extra — often <strong className="text-slate-200">double</strong>, or pays for everyone.
            </Term>
            <Term name="Pung" cjk="碰">Claim a discard to complete three-of-a-kind.</Term>
            <Term name="Chow" cjk="吃">Claim a discard to complete a run of three in sequence (only from the player on your left).</Term>
            <Term name="Kong" cjk="槓">Four-of-a-kind. You draw a replacement tile.</Term>
            <Term name="Zimo / self-draw" cjk="自摸">Winning on a tile you drew yourself (not off a discard). Everyone pays.</Term>
            <Term name="Dealer / Banker" cjk="庄">
              The East player. Wins and payments can be doubled (house rule), and the dealer button
              <strong className="text-slate-200"> rotates</strong> when they don't win.
            </Term>
            <Term name="Seat & Prevailing wind">
              Your seat wind (E/S/W/N) and the round's wind. Collecting the matching wind tiles scores tai.
            </Term>
            <Term name="Flowers / Seasons / Animals" cjk="花">
              Bonus tiles. Draw one and it's set aside (you draw again); some score extra tai.
            </Term>
          </Section>

          <Section title="The tiles">
            <p>There are three number suits (1–9) plus the honour tiles:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Dots</strong> <span className="text-blue-400">筒</span> — circles, 1–9.</li>
              <li><strong className="text-slate-200">Bamboo</strong> <span className="text-emerald-400">索</span> — sticks, 1–9.</li>
              <li><strong className="text-slate-200">Characters</strong> <span className="text-red-400">萬</span> — the "ten-thousands" suit, 1–9 (shows a Chinese numeral).</li>
              <li><strong className="text-slate-200">Winds</strong> — East 東, South 南, West 西, North 北.</li>
              <li><strong className="text-slate-200">Dragons</strong> — Red 中, Green 發, White 白 (blank).</li>
            </ul>
          </Section>
        </div>
      </div>

      <div
        className="shrink-0 border-t border-slate-800 bg-slate-900/95 px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <button
          onClick={onClose}
          className="max-w-lg mx-auto block w-full min-h-[50px] text-base font-semibold bg-emerald-700 text-white rounded-xl active:scale-95 active:bg-emerald-600"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
