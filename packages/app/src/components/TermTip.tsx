import { useState, type ReactNode } from 'react';
import { useDisplay } from '../lib/display';

// Plain-English definitions for the jargon. Tap an underlined term to see one.
const GLOSSARY: Record<string, { title: string; body: string }> = {
  tai: {
    title: 'Tai 台',
    body: 'The points a winning hand is worth — rarer patterns score more. The payout doubles with each tai. Most tables need a minimum (usually 1) to win.',
  },
  shooter: {
    title: 'Shooter 放铳',
    body: 'The player who discards the exact tile someone wins on. By house rule they pay extra — often double, or for everyone.',
  },
  zimo: {
    title: 'Zimo 自摸 (self-draw)',
    body: 'Winning on a tile you drew yourself, not off a discard. Everyone pays.',
  },
  pung: { title: 'Pung 碰', body: 'Three of a kind, claimed from a discard.' },
  chow: { title: 'Chow 吃', body: 'A run of three in sequence, claimed only from the player on your left.' },
  kong: { title: 'Kong 槓', body: 'Four of a kind. You draw a replacement tile.' },
  dealer: {
    title: 'Dealer / Banker 庄',
    body: 'The East player. Wins and payments can be doubled (house rule), and the role rotates when they don’t win.',
  },
  concealed: {
    title: 'Concealed hand 門清',
    body: 'A hand won without claiming any discards (fully self-built). Usually worth a bonus tai.',
  },
};

export function TermTip({ term, children }: { term: string; children: ReactNode }) {
  const { tooltips } = useDisplay();
  const [open, setOpen] = useState(false);
  const def = GLOSSARY[term];
  if (!tooltips || !def) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="underline decoration-dotted decoration-amber-400/70 underline-offset-2"
      >
        {children}
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <span
            className="absolute left-0 top-full z-50 mt-1.5 block w-60 max-w-[80vw] rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-left text-xs font-normal normal-case leading-snug text-slate-300 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mb-1 block font-semibold text-amber-400">{def.title}</span>
            {def.body}
          </span>
        </>
      )}
    </span>
  );
}
