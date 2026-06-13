import heroMp4 from '../assets/hero.mp4';
import heroPoster from '../assets/hero-poster.jpg';

// A short, muted, looping cinematic of premium mahjong tiles (Higgsfield-
// generated, 40KB). Decorative only. Under prefers-reduced-motion it shows the
// static poster frame instead of autoplaying.
const reduceMotion =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface Props {
  className?: string;
  caption?: string;
  /** Tailwind aspect ratio utility for the frame. */
  aspect?: string;
}

export function CinematicHero({ className = '', caption, aspect = 'aspect-[16/9]' }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-amber-400/15 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.7)] ${aspect} ${className}`}
    >
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={heroMp4}
        poster={heroPoster}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/15 pointer-events-none" />
      {caption && (
        <div className="absolute bottom-0 inset-x-0 px-4 pb-3 pointer-events-none">
          <p className="font-display text-lg font-semibold text-amber-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
