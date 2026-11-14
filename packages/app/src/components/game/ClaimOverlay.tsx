import { type Claim } from '@mahjongkaki/game';
import { TileRow } from './TileRow';
import { haptics } from '../../lib/haptics';
import { useDisplay } from '../../lib/display';

interface ClaimOverlayProps {
  claims: Claim[];
  lastDiscardTile: number;
  onClaim: (claim: Claim) => void;
  onSkip: () => void;
  /** Coach advice for this decision (Play vs AI only). pick = index into claims, or null for Skip. */
  tip?: { pick: number | null; text: string } | null;
}

const LABEL: Record<string, string> = { win: 'Hu! (win)', kong: 'Kong', pung: 'Pung', chow: 'Chow' };
// What each call means, in a few words, for the turn guide.
const WHY: Record<string, string> = {
  win: 'This tile finishes your hand.',
  kong: 'You hold three; take it for four. You draw a spare after.',
  pung: 'You hold two; take it for three of a kind.',
  chow: 'It finishes a run of three. Only from the player on your left.',
};

export function ClaimOverlay({ claims, lastDiscardTile, onClaim, onSkip, tip }: ClaimOverlayProps) {
  const { turnGuide } = useDisplay();
  const ring = 'ring-2 ring-offset-2 ring-offset-[color:var(--surface)] ring-accent';
  return (
    <div className="claim-sheet anim-pop bg-surface border-t border-line p-4 pb-safe">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-ink text-[15px] font-semibold">Take this tile?</span>
        <TileRow tiles={[lastDiscardTile]} size="lg" sortTiles={false} animateEntrance={false} />
      </div>
      {tip && (
        <p className="text-[13px] leading-snug text-ink text-center mb-3 max-w-sm mx-auto" role="status">
          <span className="font-semibold text-accent">Coach: </span>{tip.text}
        </p>
      )}
      <div className="flex gap-2 justify-center flex-wrap">
        {claims.map((claim, i) => (
          <button
            key={`${claim.claimType}-${i}`}
            onClick={() => { haptics.select(); onClaim(claim); }}
            className={`min-h-[44px] px-5 rounded-xl font-semibold text-[15px] active:scale-95 btn-primary ${tip?.pick === i ? ring : ''} ${turnGuide ? 'py-1.5 max-w-[11rem] leading-tight' : ''}`}
          >
            {LABEL[claim.claimType] ?? claim.claimType}
            {turnGuide && <span className="block text-[11.5px] font-normal opacity-85">{WHY[claim.claimType]}</span>}
          </button>
        ))}
        <button
          onClick={() => { haptics.tap(); onSkip(); }}
          className={`min-h-[44px] px-5 btn-ghost rounded-xl text-[15px] active:scale-95 ${tip && tip.pick === null ? ring : ''} ${turnGuide ? 'py-1.5 max-w-[11rem] leading-tight' : ''}`}
        >
          Skip
          {turnGuide && <span className="block text-[11.5px] font-normal opacity-80">Let it go. Someone else may still take it.</span>}
        </button>
      </div>
    </div>
  );
}
