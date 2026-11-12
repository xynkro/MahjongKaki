// May's short intro clip at the start of a unit. Tap to play with sound; Skip is always there.
import { useEffect, useRef, useState } from 'react';
import type { Lesson, Unit } from './curriculum';

/** Clips that are in public/video. A clip named in the curriculum but missing here is simply skipped. */
export const CLIPS = new Set(['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'X-east', 'X-wall', 'X-dice', 'X-deal', 'X-drawing', 'X-pung', 'X-chow', 'X-pair',
  'X-draw-throw', 'X-kong', 'X-pung-claim', 'X-chow-claim', 'X-winning',
  'X-suits', 'X-honours', 'X-bonus', 'X-seats', 'X-round', 'X-tai', 'X-doubling', 'X-who-pays', 'X-common-tai']);

/** The clip before a lesson: its own explainer if it has one, else the unit's intro clip on the unit's first lesson. */
export function introFor(unit: Unit, lesson: Lesson): string | undefined {
  const id = lesson.video && CLIPS.has(lesson.video) ? lesson.video : unit.lessons[0] === lesson ? unit.video : undefined;
  return id && CLIPS.has(id) ? id : undefined;
}

/**
 * One of May's clips in a 9:16 frame, with the poster until it plays. Tap to play with sound, tap again to pause.
 * `autoPlay` tries to start with sound straight away (fine right after a tap) and falls back to the play button.
 */
export function Clip({ id, label, autoPlay, onEnded, className = 'max-w-[300px]' }: {
  id: string; label: string; autoPlay?: boolean; onEnded?: () => void; className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const base = `${import.meta.env.BASE_URL}video/${id}`;

  const play = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  useEffect(() => { if (autoPlay) play(); }, [autoPlay]);

  return (
    <div className={`relative mx-auto w-full aspect-[9/16] rounded-2xl overflow-hidden bg-surface-2 ${className}`}>
      <video
        ref={ref}
        src={`${base}.mp4`}
        poster={`${base}.webp`}
        playsInline
        preload="metadata"
        onEnded={() => { setPlaying(false); onEnded?.(); }}
        onPause={() => setPlaying(false)}
        onClick={() => { if (playing) ref.current?.pause(); else play(); }}
        className="w-full h-full object-cover"
      />
      {!playing && (
        <button
          onClick={play}
          aria-label={label}
          className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/45 via-transparent to-transparent"
        >
          <span className="w-16 h-16 rounded-full bg-accent text-accent-ink grid place-items-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 ml-1" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}

export function VideoIntro({ id, onDone, doneLabel }: { id: string; onDone: () => void; doneLabel?: string }) {
  const [started, setStarted] = useState(false);
  return (
    <div className="pt-4 anim-pop" onPointerDown={() => setStarted(true)}>
      <Clip id={id} label="Play May’s introduction" onEnded={onDone} />
      <button onClick={onDone} className="btn-ghost w-full h-12 rounded-xl text-[16px] mt-6">
        {doneLabel ?? (started ? 'Skip to the lesson' : 'Start the lesson')}
      </button>
    </div>
  );
}
