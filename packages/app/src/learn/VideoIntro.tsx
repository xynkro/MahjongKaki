// May's short intro clip at the start of a unit. Tap to play with sound; Skip is always there.
import { useRef, useState } from 'react';

/** Clips that are in public/video. A unit whose clip isn't listed here simply has no intro. */
export const UNIT_VIDEOS = new Set(['U1']);

export function VideoIntro({ id, onDone }: { id: string; onDone: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const base = `${import.meta.env.BASE_URL}video/${id}`;

  const play = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  return (
    <div className="pt-4 anim-pop">
      <div className="relative mx-auto w-full max-w-[300px] aspect-[9/16] rounded-2xl overflow-hidden bg-surface-2">
        <video
          ref={ref}
          src={`${base}.mp4`}
          poster={`${base}.webp`}
          playsInline
          preload="metadata"
          onEnded={onDone}
          onPause={() => setPlaying(false)}
          onClick={() => { if (playing) ref.current?.pause(); else play(); }}
          className="w-full h-full object-cover"
        />
        {!playing && (
          <button
            onClick={play}
            aria-label="Play May's introduction"
            className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/45 via-transparent to-transparent"
          >
            <span className="w-16 h-16 rounded-full bg-accent text-accent-ink grid place-items-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 ml-1" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            </span>
          </button>
        )}
      </div>
      <button onClick={onDone} className="btn-ghost w-full h-12 rounded-xl text-[16px] mt-6">
        {playing ? 'Skip to the lesson' : 'Start the lesson'}
      </button>
    </div>
  );
}
