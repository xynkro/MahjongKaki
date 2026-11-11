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
    <div className="app-full z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm">
      <div className="card anim-pop w-full max-w-sm p-6 space-y-3">
        <h2 className="font-display text-2xl text-ink">Welcome to MahjongKaki</h2>
        <p className="text-[15px] text-ink leading-relaxed">
          A place to learn Singapore mahjong and practise it. Games are scored in points, never money, and the app
          doesn’t take bets.
        </p>
        <p className="text-sm text-mute leading-relaxed">
          Your progress stays on this phone, with no account and no tracking. Playing online with friends sends your
          nickname and moves through our server, only for that game.
        </p>
        <button
          onClick={onAccept}
          className="w-full h-12 mt-2 btn-primary rounded-xl text-[16px]"
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
    <div className="app-full z-50 bg-slate-950 flex flex-col">
      <header
        className="shrink-0 px-4 pb-3 bg-slate-900/95 border-b border-amber-400/15"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.85rem)' }}
      >
        <h2 className="font-display text-2xl text-slate-100 max-w-lg mx-auto">About &amp; Legal</h2>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <Section title="What this app is">
            <p>
              MahjongKaki teaches Singapore-style mahjong: short lessons, practice games against AI with a coach, and
              a calculator that explains what a hand is worth.
            </p>
          </Section>

          <Section title="Not a gambling app">
            <p>
              MahjongKaki does <strong className="text-amber-400">not</strong> accept bets, hold funds, move money, or
              facilitate any wager. Games are scored in points. An optional setting shows scores in cents for people who
              keep score that way at home; it is a display only, and nothing is ever paid through the app.
            </p>
          </Section>

          <Section title="Your data &amp; privacy">
            <p>
              Your lesson progress, settings and practice games are stored
              <strong className="text-amber-400"> only on this device</strong>, in your browser's local storage. There
              is no account, no sign-in, and no analytics or tracking. Player names you type stay on your device.
            </p>
            <p>
              <strong className="text-amber-400">Play with friends</strong> is the one exception. The nickname you
              choose, your moves, and an anonymous ID go through Google Firebase servers in Singapore so the game can
              run. The room is deleted automatically within about two days of its last move. Online games use points
              only and are not for playing for money.
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
          className="max-w-lg mx-auto block w-full min-h-[50px] btn-primary text-base font-semibold rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
}
