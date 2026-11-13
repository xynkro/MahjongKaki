// Plays one lesson: a short run of info, tap-the-tiles and multiple-choice steps.
import { useState } from 'react';
import { TileRow } from '../components/game/TileRow';
import { haptics } from '../lib/haptics';
import type { Lesson, Task } from './curriculum';
import { Clip, CLIPS, VideoIntro } from './VideoIntro';

interface Props { lesson: Lesson; onExit: () => void; onComplete: () => void; nextTitle?: string; onNextLesson?: () => void; intro?: string; unitTitle?: string }

export function LessonPlayer({ lesson, onExit, onComplete, nextTitle, onNextLesson, intro, unitTitle }: Props) {
  const [step, setStep] = useState(0);
  const [showIntro, setShowIntro] = useState(Boolean(intro));
  const [finished, setFinished] = useState(false);
  const task = lesson.tasks[step];

  const next = () => {
    if (step + 1 < lesson.tasks.length) setStep(step + 1);
    else { haptics.success(); setFinished(true); onComplete(); }
  };

  return (
    <div className="app-full z-40 bg-bg flex flex-col">
      <header
        className="shrink-0 px-4 pb-3 flex items-center gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button onClick={onExit} aria-label="Close lesson" className="w-9 h-9 grid place-items-center rounded-full text-mute active:scale-90">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={finished ? lesson.tasks.length : step} aria-valuemax={lesson.tasks.length}>
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${((finished ? lesson.tasks.length : step) / lesson.tasks.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-lg mx-auto">
          {showIntro && intro ? (
            <VideoIntro id={intro} onDone={() => setShowIntro(false)} />
          ) : finished ? (
            <Finished title={lesson.title} onDone={onExit} nextTitle={nextTitle} onNextLesson={onNextLesson} unitTitle={unitTitle} />
          ) : (
            <TaskView key={step} task={task} onNext={next} />
          )}
        </div>
      </main>
    </div>
  );
}

/** May claps: "You see that? Nice one!" */
const UNIT_DONE_CLIP = 'C1';

function Finished({ title, onDone, nextTitle, onNextLesson, unitTitle }: { title: string; onDone: () => void; nextTitle?: string; onNextLesson?: () => void; unitTitle?: string }) {
  return (
    <div className="pt-6 text-center anim-pop">
      {unitTitle && CLIPS.has(UNIT_DONE_CLIP) ? (
        <Clip id={UNIT_DONE_CLIP} label="Play May’s cheer" autoPlay className="max-w-[240px]" />
      ) : (
        <img
          src={`${import.meta.env.BASE_URL}art/${unitTitle ? 'may-laugh' : 'may-yay'}.webp`}
          alt={unitTitle ? 'May laughing at the table' : 'May cheering at the table'}
          className="mx-auto w-full max-w-[320px] aspect-[4/5] object-cover object-[50%_30%] rounded-2xl"
        />
      )}
      <h2 className="font-display text-2xl text-ink mt-5">{unitTitle ? 'Unit complete' : 'Lesson done'}</h2>
      <p className="text-mute mt-1">{unitTitle ? `You’ve finished “${unitTitle}”.` : title}</p>
      {onNextLesson && nextTitle ? (
        <>
          <button onClick={onNextLesson} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10">Next: {nextTitle}</button>
          <button onClick={onDone} className="btn-ghost w-full h-12 rounded-xl text-[16px] mt-3">Back to lessons</button>
        </>
      ) : (
        <button onClick={onDone} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10">Back to lessons</button>
      )}
    </div>
  );
}

function TaskView({ task, onNext }: { task: Task; onNext: () => void }) {
  if (task.kind === 'info') {
    return (
      <div className="pt-8 anim-pop">
        <h2 className="font-display text-2xl text-ink">{task.title}</h2>
        {task.tiles && <div className="mt-6"><TileRow tiles={task.tiles} sortTiles={false} size={lessonSize(task.tiles)} /></div>}
        <p className="text-ink text-[17px] leading-relaxed mt-6">{task.body}</p>
        <button onClick={() => { haptics.tap(); onNext(); }} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10">Got it</button>
      </div>
    );
  }
  if (task.kind === 'pick') return <PickTask task={task} onNext={onNext} />;
  return <ChooseTask task={task} onNext={onNext} />;
}

type Verdict = null | 'right' | 'wrong';

/** Large tiles when a step shows only a few (five large tiles fit one row on a 375px phone). */
const lessonSize = (tiles: number[]) => (tiles.length <= 5 ? 'lg' : 'md');

/** Reading quizzes hide the corner numbers; this brings them back, with no penalty. */
function HintToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="mt-3 h-10 px-3 -ml-3 text-[15px] text-accent font-semibold active:scale-95">
      {on ? 'Hide the numbers' : 'Show the numbers'}
    </button>
  );
}

function Feedback({ verdict, explain, onNext, onRetry }: { verdict: Verdict; explain: string; onNext: () => void; onRetry: () => void }) {
  if (!verdict) return null;
  const right = verdict === 'right';
  return (
    <div className={`mt-6 rounded-2xl p-4 anim-pop ${right ? 'bg-accent-soft' : 'bg-surface-2'}`}>
      <div className="flex gap-3 items-start">
        <img
          src={`${import.meta.env.BASE_URL}art/${right ? 'may-yes' : 'may-oops'}.webp`}
          alt=""
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
        <div className="min-w-0">
          <div className={`font-semibold ${right ? 'text-accent' : 'text-ink'}`}>{right ? 'That’s it.' : 'Not quite.'}</div>
          <p className="text-ink mt-1 leading-snug">{explain}</p>
        </div>
      </div>
      {right
        ? <button onClick={onNext} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-4">Next</button>
        : <button onClick={onRetry} className="btn-ghost w-full h-12 rounded-xl text-[16px] mt-4">Try again</button>}
    </div>
  );
}

function PickTask({ task, onNext }: { task: Extract<Task, { kind: 'pick' }>; onNext: () => void }) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [hint, setHint] = useState(false);

  const toggle = (_tile: number, i: number) => {
    if (verdict) return;
    haptics.select();
    const s = new Set(picked);
    if (s.has(i)) s.delete(i); else s.add(i);
    setPicked(s);
  };

  const check = () => {
    const ok = picked.size === task.correct.length && task.correct.every(i => picked.has(i));
    if (ok) haptics.success(); else haptics.error();
    setVerdict(ok ? 'right' : 'wrong');
  };

  return (
    <div className="pt-8 anim-pop">
      <h2 className="font-display text-xl text-ink">{task.prompt}</h2>
      <div className="mt-6"><TileRow tiles={task.tiles} sortTiles={false} size={lessonSize(task.tiles)} selectedTiles={picked} onTileClick={toggle} tag={task.plain ? hint : undefined} /></div>
      {task.plain && <HintToggle on={hint} onToggle={() => setHint(h => !h)} />}
      {!verdict && (
        <button onClick={check} disabled={picked.size === 0} className="btn-primary w-full h-12 rounded-xl text-[16px] mt-10 disabled:opacity-40">Check</button>
      )}
      <Feedback verdict={verdict} explain={task.explain} onNext={onNext} onRetry={() => { setPicked(new Set()); setVerdict(null); }} />
    </div>
  );
}

function ChooseTask({ task, onNext }: { task: Extract<Task, { kind: 'choose' }>; onNext: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const verdict: Verdict = chosen === null ? null : chosen === task.answer ? 'right' : 'wrong';

  const choose = (i: number) => {
    if (chosen !== null) return;
    if (i === task.answer) haptics.success(); else haptics.error();
    setChosen(i);
  };

  return (
    <div className="pt-8 anim-pop">
      <h2 className="font-display text-xl text-ink">{task.prompt}</h2>
      {task.tiles && <div className="mt-6"><TileRow tiles={task.tiles} sortTiles={false} size={lessonSize(task.tiles)} tag={task.plain ? hint : undefined} /></div>}
      {task.tiles && task.plain && <HintToggle on={hint} onToggle={() => setHint(h => !h)} />}
      <div className="mt-6 flex flex-col gap-2">
        {task.options.map((o, i) => {
          const state = chosen === null ? 'border-line bg-surface' : i === chosen ? (i === task.answer ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2') : 'border-line bg-surface opacity-50';
          return (
            <button
              key={o}
              onClick={() => choose(i)}
              className={`min-h-[52px] text-left px-4 rounded-xl border text-ink text-[16px] transition-colors ${state}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <Feedback verdict={verdict} explain={task.explain} onNext={onNext} onRetry={() => setChosen(null)} />
    </div>
  );
}
