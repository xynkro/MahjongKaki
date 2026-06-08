import { useState, useEffect, type ReactNode } from 'react';

export const APP_VERSION = '0.0.1';
const DISCLAIMER_KEY = 'mk_disclaimer_ack_v1';

// One-time disclaimer shown on first launch.
export function useFirstRunDisclaimer() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(DISCLAIMER_KEY)) setShow(true);
    } catch {
      /* private mode — just skip */
    }
  }, []);
  const accept = () => {
    try {
      localStorage.setItem(DISCLAIMER_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  return { show, accept };
}

export function FirstRunDisclaimer({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm">
      <div className="card anim-pop w-full max-w-sm p-6 text-center space-y-3">
        <div className="text-3xl" aria-hidden>🀄</div>
        <h2 className="font-display text-xl text-slate-100">Welcome to MahjongKaki</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          MahjongKaki is a <strong className="text-amber-400">scorekeeper and calculator</strong> — not a gambling app.
          It never holds or moves money and it doesn't take bets. Any chip amounts are just a tally; you settle
          directly among yourselves.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Everything you enter stays on this device. No account, no tracking, nothing uploaded.
        </p>
        <button
          onClick={onAccept}
          className="w-full min-h-[44px] mt-2 bg-emerald-700 text-white rounded-xl font-medium active:scale-95 active:bg-emerald-600"
        >
          I understand
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-4 space-y-1.5">
      <h3 className="section-title">{title}</h3>
      <div className="text-sm text-slate-300 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export function LegalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <header
        className="shrink-0 px-4 pb-3 bg-slate-900/95 border-b border-amber-400/15"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.85rem)' }}
      >
        <h2 className="font-display text-xl text-slate-100 max-w-lg mx-auto">About &amp; Legal</h2>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <Section title="What this app is">
            <p>
              MahjongKaki is a companion for Singapore-style mahjong: a tai (fan) calculator, a chip-settlement
              tracker, table utilities, an offline practice game against AI, and a strategy trainer.
            </p>
          </Section>

          <Section title="Not a gambling app">
            <p>
              MahjongKaki does <strong className="text-amber-400">not</strong> accept bets, hold funds, move money, or
              facilitate any wager. Chip amounts you enter are a manual record only — players settle directly with each
              other, outside the app. It is a scorekeeping tool, not a gambling product.
            </p>
          </Section>

          <Section title="Your data &amp; privacy">
            <p>
              All your data — sessions, scores, saved games, and training stats — is stored
              <strong className="text-amber-400"> only on this device</strong>, in your browser's local storage. Nothing
              is uploaded to any server. There is no account, no sign-in, and no analytics or tracking. Player names you
              type stay on your device.
            </p>
            <p className="text-slate-400 text-xs">
              Clearing your browser's site data, or uninstalling, removes everything. There is no cloud backup.
            </p>
          </Section>

          <Section title="Play responsibly">
            <p>
              If you choose to play for stakes, do so responsibly and only where it is legal in your jurisdiction. You
              are solely responsible for any real-world settlement between players.
            </p>
          </Section>

          <Section title="Disclaimer">
            <p>
              Provided “as is”, without warranty. Scoring follows configurable house rules and may differ from your
              table's conventions — confirm the result before you settle. This app does not provide legal or financial
              advice.
            </p>
          </Section>

          <p className="text-center text-xs text-slate-600 pt-2">MahjongKaki · v{APP_VERSION}</p>
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
          Close
        </button>
      </div>
    </div>
  );
}
